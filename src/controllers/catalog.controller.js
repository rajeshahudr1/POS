/**
 * Catalog Controller
 * Handles catalog API requests
 */
const catalogService = require('../services/catalog.service');
const apiResponse = require('../utils/apiResponse');
const config = require('../config/app.config');
/**
 * Get complete catalog
 * GET /api/catalog/:uuid
 */
exports.getCatalog = async (req, res) => {
    try {
        const {uuid} = req.params;
        const authHeader = req.headers.authorization || req.headers['x-auth-token'] || '';

        // Validate required parameters
        if (!uuid) {
            return apiResponse.error(res, 'Company UUID is required', 400);
        }

        if (!authHeader) {
            return apiResponse.error(res, 'Authorization token is required', 401);
        }

        if (authHeader != config.Auth) {
            return apiResponse.error(res, 'Invalid authorization token', 401);
        }

        // Validate token and UUID
        const validation = await catalogService.validateToken(authHeader, uuid);


        if (!validation.isValid) {
            return apiResponse.error(res, validation.errorMessage || 'Authentication failed', 401);
        }

        // Get complete catalog
        const catalog = await catalogService.getCompleteCatalog(uuid);

        // Return successful response
        return apiResponse.success(res, catalog, 'Catalog retrieved successfully');

    } catch (error) {
        console.error('Catalog API Error:', error);
        return apiResponse.error(res, error.message || 'Failed to retrieve catalog data', 500);
    }
};

/**
 * Get catalog for specific branch
 * GET /api/catalog/:uuid/branch/:branchCode
 */
exports.getCatalogByBranch = async (req, res) => {
    try {
        const {uuid, branchCode} = req.params;
        const authHeader = req.headers.authorization || req.headers['x-auth-token'] || '';

        // Validate token
        const validation = await catalogService.validateToken(authHeader, uuid);

        if (!validation.isValid) {
            return apiResponse.error(res, validation.errorMessage || 'Authentication failed', 401);
        }

        // Get complete catalog and filter by branch
        const catalog = await catalogService.getCompleteCatalog(uuid);

        // Find specific branch
        const branch = catalog.branches.find(b => b.branch_code === branchCode);

        if (!branch) {
            return apiResponse.error(res, 'Branch not found', 404);
        }

        return apiResponse.success(res, {
            company_info: catalog.company_info,
            sizes: catalog.sizes,
            branch: branch
        }, 'Branch catalog retrieved successfully');

    } catch (error) {
        console.error('Catalog Branch API Error:', error);
        return apiResponse.error(res, error.message || 'Failed to retrieve branch catalog data', 500);
    }
};

/**
 * Get catalog for specific category
 * GET /api/catalog/:uuid/category/:categoryId
 */
exports.getCatalogByCategory = async (req, res) => {
    try {
        const {uuid, categoryId} = req.params;
        const authHeader = req.headers.authorization || req.headers['x-auth-token'] || '';

        // Validate token
        const validation = await catalogService.validateToken(authHeader, uuid);

        if (!validation.isValid) {
            return apiResponse.error(res, validation.errorMessage || 'Authentication failed', 401);
        }

        // Get complete catalog and find category
        const catalog = await catalogService.getCompleteCatalog(uuid);

        let foundCategory = null;
        const category = catalog.categories.find(c => c.category_id == categoryId);
        if (category) {
            foundCategory = category;
        }
        /*for (const branch of catalog.branches) {
            const category = branch.categories.find(c => c.category_id == categoryId);
            if (category) {
                foundCategory = {
                    branch_info: {
                        branch_id: branch.branch_id,
                        branch_name: branch.branch_name,
                        branch_code: branch.branch_code
                    },
                    category: category
                };
                break;
            }
        }*/

        if (!foundCategory) {
            return apiResponse.error(res, 'Category not found', 404);
        }

        return apiResponse.success(res, {
            company_info: catalog.company_info,
            sizes: catalog.sizes,
            ...foundCategory
        }, 'Category catalog retrieved successfully');

    } catch (error) {
        console.error('Catalog Category API Error:', error);
        return apiResponse.error(res, error.message || 'Failed to retrieve category data', 500);
    }
};
