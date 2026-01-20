const Joi = require('joi');

exports.createCompany = Joi.object({
    company_name: Joi.string().min(2).max(200).required()
        .messages({
            'string.min': 'Company name must be at least 2 characters',
            'string.max': 'Company name cannot exceed 200 characters',
            'any.required': 'Company name is required'
        }),
    company_code: Joi.string().min(2).max(50).required()
        .uppercase()
        .messages({
            'string.min': 'Company code must be at least 2 characters',
            'string.max': 'Company code cannot exceed 50 characters',
            'any.required': 'Company code is required'
        }),
    logo_url: Joi.string().max(500).allow('', null),
    email: Joi.string().email().max(100).allow('', null)
        .messages({
            'string.email': 'Please enter a valid email address'
        }),
    phone: Joi.string().max(20).allow('', null),
    address: Joi.string().allow('', null),
    currency_code: Joi.string().max(10).default('GBP'),
    currency_symbol: Joi.string().max(5).default('£'),
    tax_percentage: Joi.number().min(0).max(100).default(0)
        .messages({
            'number.min': 'Tax percentage cannot be negative',
            'number.max': 'Tax percentage cannot exceed 100'
        })
});

exports.updateCompany = Joi.object({
    company_name: Joi.string().min(2).max(200).required()
        .messages({
            'string.min': 'Company name must be at least 2 characters',
            'string.max': 'Company name cannot exceed 200 characters',
            'any.required': 'Company name is required'
        }),
    company_code: Joi.string().min(2).max(50).required()
        .uppercase()
        .messages({
            'string.min': 'Company code must be at least 2 characters',
            'string.max': 'Company code cannot exceed 50 characters',
            'any.required': 'Company code is required'
        }),
    logo_url: Joi.string().max(500).allow('', null),
    email: Joi.string().email().max(100).allow('', null)
        .messages({
            'string.email': 'Please enter a valid email address'
        }),
    phone: Joi.string().max(20).allow('', null),
    address: Joi.string().allow('', null),
    currency_code: Joi.string().max(10).allow('', null),
    currency_symbol: Joi.string().max(5).allow('', null),
    tax_percentage: Joi.number().min(0).max(100).allow(null)
        .messages({
            'number.min': 'Tax percentage cannot be negative',
            'number.max': 'Tax percentage cannot exceed 100'
        }),
    is_active: Joi.number().valid(0, 1).allow(null)
});

exports.listCompany = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null),
    is_active: Joi.number().valid(0, 1).allow('', null)
});

exports.idParam = Joi.object({
    id: Joi.number().integer().required()
        .messages({
            'any.required': 'Company ID is required',
            'number.base': 'Company ID must be a number'
        })
});

exports.checkCode = Joi.object({
    code: Joi.string().required(),
    exclude_id: Joi.number().integer().allow(null)
});
