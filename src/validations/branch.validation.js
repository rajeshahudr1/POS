const Joi = require('joi');

exports.createBranch = Joi.object({
    company_id: Joi.number().integer().required()
        .messages({
            'any.required': 'Company is required',
            'number.base': 'Company ID must be a number'
        }),
    branch_name: Joi.string().min(2).max(200).required()
        .messages({
            'string.min': 'Branch name must be at least 2 characters',
            'any.required': 'Branch name is required'
        }),
    branch_code: Joi.string().min(2).max(50).required()
        .uppercase()
        .messages({
            'string.min': 'Branch code must be at least 2 characters',
            'any.required': 'Branch code is required'
        }),
    email: Joi.string().email().max(100).allow('', null),
    phone: Joi.string().max(20).allow('', null),
    address_line1: Joi.string().max(200).allow('', null),
    address_line2: Joi.string().max(200).allow('', null),
    city: Joi.string().max(100).allow('', null),
    postcode: Joi.string().max(20).allow('', null),
    country: Joi.string().max(100).default('United Kingdom'),
    opening_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow('', null)
        .messages({ 'string.pattern.base': 'Invalid time format (HH:MM)' }),
    closing_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow('', null)
        .messages({ 'string.pattern.base': 'Invalid time format (HH:MM)' })
});

exports.updateBranch = Joi.object({
    company_id: Joi.number().integer().required(),
    branch_name: Joi.string().min(2).max(200).required(),
    branch_code: Joi.string().min(2).max(50).required().uppercase(),
    email: Joi.string().email().max(100).allow('', null),
    phone: Joi.string().max(20).allow('', null),
    address_line1: Joi.string().max(200).allow('', null),
    address_line2: Joi.string().max(200).allow('', null),
    city: Joi.string().max(100).allow('', null),
    postcode: Joi.string().max(20).allow('', null),
    country: Joi.string().max(100).allow('', null),
    opening_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow('', null),
    closing_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow('', null),
    is_active: Joi.number().valid(0, 1).allow(null)
});

exports.listBranch = Joi.object({
    company_id: Joi.number().integer().allow('', null),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
    is_active: Joi.number().valid(0, 1).allow('', null)
});

exports.idParam = Joi.object({
    id: Joi.number().integer().required()
});