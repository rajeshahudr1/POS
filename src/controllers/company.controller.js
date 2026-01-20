const companyService = require('../services/company.service');
const validation = require('../validations/company.validation');
const response = require('../utils/apiResponse');

/**
 * Create a new company
 * POST /api/companies
 */
exports.createCompany = async (req, res, next) => {
    try {
        const { error, value } = validation.createCompany.validate(req.body);
        if (error) {
            return response.error(res, error.details[0].message, 400);
        }

        const result = await companyService.create(value);

        if (!result.success) {
            return next({
                statusCode: result.status || 500,
                message: result.message
            });
        }

        response.success(res, result.data, 'Company created successfully');

    } catch (err) {
        next(err);
    }
};

/**
 * Update existing company
 * PUT /api/companies/:id
 */
exports.updateCompany = async (req, res, next) => {
    try {
        // Validate ID
        const { error: idError } = validation.idParam.validate({ id: req.params.id });
        if (idError) {
            return response.error(res, idError.details[0].message, 400);
        }

        // Validate body
        const { error, value } = validation.updateCompany.validate(req.body);
        if (error) {
            return response.error(res, error.details[0].message, 400);
        }

        const company = await companyService.update(req.params.id, value);
        response.success(res, company, 'Company updated successfully');
    } catch (err) {
        next(err);
    }
};

/**
 * Delete company (soft delete by default)
 * DELETE /api/companies/:id
 */
exports.deleteCompany = async (req, res, next) => {
    try {
        const { error: idError } = validation.idParam.validate({ id: req.params.id });
        if (idError) {
            return response.error(res, idError.details[0].message, 400);
        }

        // Check for hard_delete query param
        const hardDelete = req.query.hard === 'true';

        const result = await companyService.remove(req.params.id, hardDelete);
        response.success(res, result, result.message);
    } catch (err) {
        next(err);
    }
};

/**
 * Get company by ID
 * GET /api/companies/:id
 */
exports.getCompany = async (req, res, next) => {
    try {
        const { error: idError } = validation.idParam.validate({ id: req.params.id });
        if (idError) {
            return response.error(res, idError.details[0].message, 400);
        }

        const company = await companyService.getById(req.params.id);
        response.success(res, company);
    } catch (err) {
        next(err);
    }
};

/**
 * List companies with pagination and search
 * GET /api/companies
 */
exports.listCompanies = async (req, res, next) => {
    try {
        const { error, value } = validation.listCompany.validate(req.query);
        if (error) {
            return response.error(res, error.details[0].message, 400);
        }

        const result = await companyService.list(value);
        response.success(res, result);
    } catch (err) {
        next(err);
    }
};

/**
 * Get all active companies (for dropdowns)
 * GET /api/companies/active
 */
exports.getActiveCompanies = async (req, res, next) => {
    try {
        const companies = await companyService.getAllActive();
        response.success(res, companies);
    } catch (err) {
        next(err);
    }
};

/**
 * Check if company code exists
 * GET /api/companies/check-code?code=XXX&exclude_id=1
 */
exports.checkCodeExists = async (req, res, next) => {
    try {
        const { error, value } = validation.checkCode.validate(req.query);
        if (error) {
            return response.error(res, error.details[0].message, 400);
        }

        const exists = await companyService.checkCodeExists(value.code, value.exclude_id);
        response.success(res, { exists });
    } catch (err) {
        next(err);
    }
};

/**
 * Toggle company active status
 * PATCH /api/companies/:id/toggle-status
 */
exports.toggleStatus = async (req, res, next) => {
    try {
        const { error: idError } = validation.idParam.validate({ id: req.params.id });
        if (idError) {
            return response.error(res, idError.details[0].message, 400);
        }

        // Get current company
        const company = await companyService.getById(req.params.id);
        
        // Toggle status
        const newStatus = company.is_active === 1 ? 0 : 1;
        const updatedCompany = await companyService.update(req.params.id, {
            ...company,
            is_active: newStatus
        });

        const statusText = newStatus === 1 ? 'activated' : 'deactivated';
        response.success(res, updatedCompany, `Company ${statusText} successfully`);
    } catch (err) {
        next(err);
    }
};
