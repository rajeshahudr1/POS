const { QueryTypes } = require('sequelize');
const db = require('../model');
const sequelize = db.sequelize;

/**
 * Create a new company using stored procedure
 */
exports.create = async (data) => {
    try {
        await sequelize.query(
            `CALL SP_COMPANY_CREATE(
                :company_name, :company_code, :logo_url, :email, :phone,
                :address, :currency_code, :currency_symbol, :tax_percentage,
                @p_company_id, @p_status, @p_message
            )`,
            {
                replacements: {
                    company_name: data.company_name,
                    company_code: data.company_code,
                    logo_url: data.logo_url || null,
                    email: data.email || null,
                    phone: data.phone || null,
                    address: data.address || null,
                    currency_code: data.currency_code || 'GBP',
                    currency_symbol: data.currency_symbol || '£',
                    tax_percentage: data.tax_percentage || 0.00
                }
            }
        );

        const [output] = await sequelize.query(
            'SELECT @p_company_id AS company_id, @p_status AS status, @p_message AS message',
            { type: QueryTypes.SELECT }
        );

        if (Number(output.status) !== 1) {
            return {
                success: false,
                status: Number(output.status),
                message: output.message
            };
        }

        const company = await this.getById(output.company_id);

        return {
            success: true,
            data: company
        };

    } catch (error) {
        return {
            success: false,
            status: 500,
            message: error.message || 'Failed to create company'
        };
    }
};

/**
 * Update existing company using stored procedure
 */
exports.update = async (id, data) => {
    try {
        await sequelize.query(
            `CALL SP_COMPANY_UPDATE(
                :company_id, :company_name, :company_code, :logo_url, :email, :phone,
                :address, :currency_code, :currency_symbol, :tax_percentage, :is_active,
                @p_status, @p_message
            )`,
            {
                replacements: {
                    company_id: id,
                    company_name: data.company_name,
                    company_code: data.company_code,
                    logo_url: data.logo_url || null,
                    email: data.email || null,
                    phone: data.phone || null,
                    address: data.address || null,
                    currency_code: data.currency_code || null,
                    currency_symbol: data.currency_symbol || null,
                    tax_percentage: data.tax_percentage !== undefined ? data.tax_percentage : null,
                    is_active: data.is_active !== undefined ? data.is_active : null
                },
                type: QueryTypes.RAW
            }
        );

        // Get output parameters
        const [output] = await sequelize.query(
            'SELECT @p_status AS status, @p_message AS message',
            { type: QueryTypes.SELECT }
        );

        if (output.status !== 1) {
            throw new Error(output.message);
        }

        // Return updated company
        return await this.getById(id);

    } catch (error) {
        throw new Error(error.message || 'Failed to update company');
    }
};

/**
 * Delete company (soft or hard delete)
 */
exports.remove = async (id, hardDelete = false) => {
    try {
        await sequelize.query(
            `CALL SP_COMPANY_DELETE(:company_id, :hard_delete, @p_status, @p_message)`,
            {
                replacements: {
                    company_id: id,
                    hard_delete: hardDelete ? 1 : 0
                },
                type: QueryTypes.RAW
            }
        );

        // Get output parameters
        const [output] = await sequelize.query(
            'SELECT @p_status AS status, @p_message AS message',
            { type: QueryTypes.SELECT }
        );

        if (output.status !== 1) {
            throw new Error(output.message);
        }

        await this.recordDestroy(id);

        return { success: true, message: output.message };

    } catch (error) {
        throw new Error(error.message || 'Failed to delete company');
    }
};

/**
 * Get company by ID
 */
exports.getById = async (id) => {
    try {
        const [results] = await sequelize.query(
            `CALL SP_COMPANY_GET_BY_ID(:company_id)`,
            {
                replacements: { company_id: id },
                type: QueryTypes.RAW
            }
        );

        if (!results || results.length === 0) {
            throw new Error('Company not found');
        }
        return results;


    } catch (error) {
        throw new Error(error.message || 'Failed to get company');
    }
};

/**
 * List companies with search and pagination
 */
exports.list = async ({ page = 1, limit = 10, search = '', is_active = null }) => {
    try {
        // Call stored procedure
        const results = await sequelize.query(
            `CALL SP_COMPANY_LIST(:page, :limit, :search, :is_active, @p_total_count)`,
            {
                replacements: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    search: search || '',
                    is_active: is_active !== null && is_active !== '' ? parseInt(is_active) : null
                },
                raw: true
            }
        );

        // Get total count
        const [countResult] = await sequelize.query(
            'SELECT @p_total_count AS total',
            { type: QueryTypes.SELECT }
        );

        const total = countResult.total || 0;

        return {
            data: results || [],
            pagination: {
                total: total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        };

    } catch (error) {
        throw new Error(error.message || 'Failed to list companies');
    }
};

exports.recordDestroy = async (companyId) => {
    try {
        const tables = [
            "choices",
            "category_choice_groups",
            "choice_groups",
            "category_flavour_prices",
            "category_flavours",
            "flavours",
            "addons",
            "category_addon_groups",
            "addon_groups",
            "category_topping_prices",
            "category_toppings",
            "toppings",
            "product_prices",
            "products",
            "category_sizes",
            "sizes",
            "categories"
        ];

        for (const table of tables) {
            await sequelize.query(
                `DELETE
                 FROM ${table}
                 WHERE company_id = :company_id`,
                {
                    replacements: {company_id: companyId},
                    type: QueryTypes.DELETE
                }
            );
        }

        return true;

    } catch (error) {
        console.error(`Record delete : "${companyId}":`, error.message);
        throw error;
    }
};

/**
 * Get all active companies (for dropdowns)
 */
exports.getAllActive = async () => {
    try {
        const results = await sequelize.query(
            `CALL SP_COMPANY_GET_ALL_ACTIVE()`,
            { type: QueryTypes.RAW }
        );
        return results || [];

    } catch (error) {
        throw new Error(error.message || 'Failed to get active companies');
    }
};

/**
 * Check if company code exists
 */
exports.checkCodeExists = async (code, excludeId = null) => {
    try {
        await sequelize.query(
            `CALL SP_COMPANY_CHECK_CODE_EXISTS(:company_code, :exclude_id, @p_exists)`,
            {
                replacements: {
                    company_code: code,
                    exclude_id: excludeId
                },
                type: QueryTypes.RAW
            }
        );

        const results = await sequelize.query(
            'SELECT @p_exists AS exists_count',
            { type: QueryTypes.SELECT }
        );

        return result.exists_count > 0;

    } catch (error) {
        throw new Error(error.message || 'Failed to check company code');
    }
};

/**
 * Get companies with branch count (using view)
 */
exports.listWithBranchCount = async ({ page = 1, limit = 10, search = '' }) => {
    try {
        const offset = (page - 1) * limit;

        // Build where clause
        let whereClause = '';
        if (search) {
            whereClause = `WHERE company_name LIKE :search 
                          OR company_code LIKE :search 
                          OR email LIKE :search`;
        }

        // Get total count
        const [countResult] = await sequelize.query(
            `SELECT COUNT(*) as total FROM VW_COMPANY_WITH_BRANCH_COUNT ${whereClause}`,
            {
                replacements: { search: `%${search}%` },
                type: QueryTypes.SELECT
            }
        );

        // Get data
        const results = await sequelize.query(
            `SELECT * FROM VW_COMPANY_WITH_BRANCH_COUNT ${whereClause} 
             ORDER BY company_id DESC 
             LIMIT :limit OFFSET :offset`,
            {
                replacements: {
                    search: `%${search}%`,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                },
                type: QueryTypes.SELECT
            }
        );

        return {
            data: results,
            pagination: {
                total: countResult.total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.total / limit)
            }
        };

    } catch (error) {
        throw new Error(error.message || 'Failed to list companies');
    }
};