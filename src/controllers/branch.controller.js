const branchService = require('../services/branch.service');
const validation = require('../validations/branch.validation');
const response = require('../utils/apiResponse');

exports.createBranch = async (req, res, next) => {
    try {
        const { error, value } = validation.createBranch.validate(req.body);
        if (error) {
            return response.error(res, error.details[0].message, 400);
        }

        const branch = await branchService.create(value);
        response.success(res, branch, 'Branch created successfully');
    } catch (err) {
        next(err);
    }
};

exports.updateBranch = async (req, res, next) => {
    try {
        const { error: idError } = validation.idParam.validate({ id: req.params.id });
        if (idError) {
            return response.error(res, idError.details[0].message, 400);
        }

        const { error, value } = validation.updateBranch.validate(req.body);
        if (error) {
            return response.error(res, error.details[0].message, 400);
        }

        const branch = await branchService.update(req.params.id, value);
        response.success(res, branch, 'Branch updated successfully');
    } catch (err) {
        next(err);
    }
};

exports.deleteBranch = async (req, res, next) => {
    try {
        const { error: idError } = validation.idParam.validate({ id: req.params.id });
        if (idError) {
            return response.error(res, idError.details[0].message, 400);
        }

        const hardDelete = req.query.hard === 'true';
        const result = await branchService.remove(req.params.id, hardDelete);
        response.success(res, result, result.message);
    } catch (err) {
        next(err);
    }
};

exports.getBranch = async (req, res, next) => {
    try {
        const { error: idError } = validation.idParam.validate({ id: req.params.id });
        if (idError) {
            return response.error(res, idError.details[0].message, 400);
        }

        const branch = await branchService.getById(req.params.id);
        response.success(res, branch);
    } catch (err) {
        next(err);
    }
};

exports.listBranches = async (req, res, next) => {
    try {
        const { error, value } = validation.listBranch.validate(req.query);
        if (error) {
            return response.error(res, error.details[0].message, 400);
        }

        const result = await branchService.list(value);
        response.success(res, result);
    } catch (err) {
        next(err);
    }
};

exports.getBranchesByCompany = async (req, res, next) => {
    try {
        const companyId = req.params.companyId;
        if (!companyId) {
            return response.error(res, 'Company ID is required', 400);
        }

        const branches = await branchService.getByCompany(companyId);
        response.success(res, branches);
    } catch (err) {
        next(err);
    }
};