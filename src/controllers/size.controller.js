const sizeService = require('../services/size.service');
const validation = require('../validations/size.validation');
const response = require('../utils/apiResponse');

exports.createSize = async (req, res, next) => {
    try {
        const { error, value } = validation.createSize.validate(req.body);
        if (error) return response.error(res, error.details[0].message, 400);

        const size = await sizeService.create(value);
        response.success(res, size, 'Size created successfully');
    } catch (err) {
        next(err);
    }
};

exports.updateSize = async (req, res, next) => {
    try {
        const { error, value } = validation.updateSize.validate(req.body);
        if (error) return response.error(res, error.details[0].message, 400);

        const size = await sizeService.update(req.params.id, value);
        response.success(res, size, 'Size updated successfully');
    } catch (err) {
        next(err);
    }
};

exports.deleteSize = async (req, res, next) => {
    try {
        await sizeService.remove(req.params.id);
        response.success(res, null, 'Size deleted successfully');
    } catch (err) {
        next(err);
    }
};

exports.listSizes = async (req, res, next) => {
    try {
        const { error, value } = validation.listSize.validate(req.query);
        if (error) return response.error(res, error.details[0].message, 400);

        const result = await sizeService.list(value);
        response.success(res, result);
    } catch (err) {
        next(err);
    }
};
