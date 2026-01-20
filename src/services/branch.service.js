const { QueryTypes } = require('sequelize');
const db = require('../model');
const sequelize = db.sequelize;

/**
 * Create a new branch
 */
exports.create = async (data) => {
    try {
        await sequelize.query(
            `CALL SP_BRANCH_CREATE(
                :company_id, :branch_name, :branch_code, :email, :phone,
                :address_line1, :address_line2, :city, :postcode, :country,
                :opening_time, :closing_time,
                @p_branch_id, @p_status, @p_message
            )`,
            {
                replacements: {
                    company_id: data.company_id,
                    branch_name: data.branch_name,
                    branch_code: data.branch_code,
                    email: data.email || null,
                    phone: data.phone || null,
                    address_line1: data.address_line1 || null,
                    address_line2: data.address_line2 || null,
                    city: data.city || null,
                    postcode: data.postcode || null,
                    country: data.country || 'United Kingdom',
                    opening_time: data.opening_time || null,
                    closing_time: data.closing_time || null
                },
                type: QueryTypes.RAW
            }
        );

        const [output] = await sequelize.query(
            'SELECT @p_branch_id AS branch_id, @p_status AS status, @p_message AS message',
            { type: QueryTypes.SELECT }
        );

        if (output.status !== 1) {
            throw new Error(output.message);
        }

        return await this.getById(output.branch_id);

    } catch (error) {
        throw new Error(error.message || 'Failed to create branch');
    }
};

/**
 * Update existing branch
 */
exports.update = async (id, data) => {
    try {
        await sequelize.query(
            `CALL SP_BRANCH_UPDATE(
                :branch_id, :company_id, :branch_name, :branch_code, :email, :phone,
                :address_line1, :address_line2, :city, :postcode, :country,
                :opening_time, :closing_time, :is_active,
                @p_status, @p_message
            )`,
            {
                replacements: {
                    branch_id: id,
                    company_id: data.company_id,
                    branch_name: data.branch_name,
                    branch_code: data.branch_code,
                    email: data.email || null,
                    phone: data.phone || null,
                    address_line1: data.address_line1 || null,
                    address_line2: data.address_line2 || null,
                    city: data.city || null,
                    postcode: data.postcode || null,
                    country: data.country || null,
                    opening_time: data.opening_time || null,
                    closing_time: data.closing_time || null,
                    is_active: data.is_active !== undefined ? data.is_active : null
                },
                type: QueryTypes.RAW
            }
        );

        const [output] = await sequelize.query(
            'SELECT @p_status AS status, @p_message AS message',
            { type: QueryTypes.SELECT }
        );

        if (output.status !== 1) {
            throw new Error(output.message);
        }

        return await this.getById(id);

    } catch (error) {
        throw new Error(error.message || 'Failed to update branch');
    }
};

/**
 * Delete branch
 */
exports.remove = async (id, hardDelete = false) => {
    try {
        await sequelize.query(
            `CALL SP_BRANCH_DELETE(:branch_id, :hard_delete, @p_status, @p_message)`,
            {
                replacements: {
                    branch_id: id,
                    hard_delete: hardDelete ? 1 : 0
                },
                type: QueryTypes.RAW
            }
        );

        const [output] = await sequelize.query(
            'SELECT @p_status AS status, @p_message AS message',
            { type: QueryTypes.SELECT }
        );

        if (output.status !== 1) {
            throw new Error(output.message);
        }

        return { success: true, message: output.message };

    } catch (error) {
        throw new Error(error.message || 'Failed to delete branch');
    }
};

/**
 * Get branch by ID
 */
exports.getById = async (id) => {
    try {
        const results = await sequelize.query(
            `CALL SP_BRANCH_GET_BY_ID(:branch_id)`,
            {
                replacements: { branch_id: id },
                type: QueryTypes.RAW
            }
        );

        if (!results || results.length === 0) {
            throw new Error('Branch not found');
        }

        return results[0];

    } catch (error) {
        throw new Error(error.message || 'Failed to get branch');
    }
};

/**
 * List branches with search and pagination
 */
exports.list = async ({ company_id = null, page = 1, limit = 10, search = '', is_active = null }) => {
    try {
        const results = await sequelize.query(
            `CALL SP_BRANCH_LIST(:company_id, :page, :limit, :search, :is_active, @p_total_count)`,
            {
                replacements: {
                    company_id: company_id ? parseInt(company_id) : null,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    search: search || '',
                    is_active: is_active !== null && is_active !== '' ? parseInt(is_active) : null
                },
                type: QueryTypes.RAW
            }
        );

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
        throw new Error(error.message || 'Failed to list branches');
    }
};

/**
 * Get branches by company (for dropdowns)
 */
exports.getByCompany = async (companyId) => {
    try {
        const [results] = await sequelize.query(
            `CALL SP_BRANCH_GET_BY_COMPANY(:company_id)`,
            {
                replacements: { company_id: companyId },
                type: QueryTypes.RAW
            }
        );

        return results || [];

    } catch (error) {
        throw new Error(error.message || 'Failed to get branches');
    }
};