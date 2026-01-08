const Joi = require('joi');

exports.createSize = Joi.object({
    size_id: Joi.number().integer().required(),
    size_name: Joi.string().min(2).max(50).required(),
    size_code: Joi.string().min(1).max(10).required()
});

exports.updateSize = Joi.object({
    size_name: Joi.string().min(2).max(50).required(),
    size_code: Joi.string().min(1).max(10).required()
});

exports.listSize = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null)
});
