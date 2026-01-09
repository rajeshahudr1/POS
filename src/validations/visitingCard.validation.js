// validations/visitingCard.validation.js

const Joi = require('joi');

exports.createCard = Joi.object({
    full_name: Joi.string().max(255).allow('', null),
    first_name: Joi.string().max(100).allow('', null),
    last_name: Joi.string().max(100).allow('', null),
    designation: Joi.string().max(200).allow('', null),
    primary_phone: Joi.string().max(20).allow('', null),
    secondary_phone: Joi.string().max(20).allow('', null),
    primary_email: Joi.string().email().max(255).allow('', null),
    secondary_email: Joi.string().email().max(255).allow('', null),
    website: Joi.string().max(255).allow('', null),
    company_name: Joi.string().max(255).allow('', null),
    company_address: Joi.string().allow('', null),
    city: Joi.string().max(100).allow('', null),
    state: Joi.string().max(100).allow('', null),
    country: Joi.string().max(100).allow('', null),
    pincode: Joi.string().max(20).allow('', null),
    linkedin_url: Joi.string().max(255).allow('', null),
    facebook_url: Joi.string().max(255).allow('', null),
    twitter_url: Joi.string().max(255).allow('', null),
    instagram_url: Joi.string().max(255).allow('', null),
    fax: Joi.string().max(20).allow('', null),
    department: Joi.string().max(150).allow('', null),
    notes: Joi.string().allow('', null),
    front_image_path: Joi.string().max(500).allow('', null),
    rear_image_path: Joi.string().max(500).allow('', null),
    front_ocr_text: Joi.string().allow('', null),
    rear_ocr_text: Joi.string().allow('', null)
});

exports.updateCard = Joi.object({
    full_name: Joi.string().max(255).allow('', null),
    first_name: Joi.string().max(100).allow('', null),
    last_name: Joi.string().max(100).allow('', null),
    designation: Joi.string().max(200).allow('', null),
    primary_phone: Joi.string().max(20).allow('', null),
    secondary_phone: Joi.string().max(20).allow('', null),
    primary_email: Joi.string().email().max(255).allow('', null),
    secondary_email: Joi.string().email().max(255).allow('', null),
    website: Joi.string().max(255).allow('', null),
    company_name: Joi.string().max(255).allow('', null),
    company_address: Joi.string().allow('', null),
    city: Joi.string().max(100).allow('', null),
    state: Joi.string().max(100).allow('', null),
    country: Joi.string().max(100).allow('', null),
    pincode: Joi.string().max(20).allow('', null),
    linkedin_url: Joi.string().max(255).allow('', null),
    facebook_url: Joi.string().max(255).allow('', null),
    twitter_url: Joi.string().max(255).allow('', null),
    instagram_url: Joi.string().max(255).allow('', null),
    fax: Joi.string().max(20).allow('', null),
    department: Joi.string().max(150).allow('', null),
    notes: Joi.string().allow('', null)
});

exports.listCard = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('', null)
});