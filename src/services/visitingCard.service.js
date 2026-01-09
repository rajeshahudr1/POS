// services/visitingCard.service.js

const { Op } = require('sequelize');
const VisitingCard = require('../model/visitingCard.model');
const FieldMapping = require('../model/fieldMapping.model');

exports.create = async (data) => {
    return await VisitingCard.create(data);
};

exports.update = async (id, data) => {
    const card = await VisitingCard.findByPk(id);
    if (!card) throw new Error('Visiting card not found');

    await card.update(data);
    return card;
};

exports.remove = async (id) => {
    const card = await VisitingCard.findByPk(id);
    if (!card) throw new Error('Visiting card not found');

    await card.destroy();
    return true;
};

exports.list = async ({ page, limit, search }) => {
    const offset = (page - 1) * limit;

    const where = search ? {
        [Op.or]: [
            { full_name: { [Op.like]: `%${search}%` } },
            { company_name: { [Op.like]: `%${search}%` } },
            { primary_email: { [Op.like]: `%${search}%` } },
            { primary_phone: { [Op.like]: `%${search}%` } }
        ]
    } : {};

    const { rows, count } = await VisitingCard.findAndCountAll({
        where,
        limit,
        offset,
        order: [['created_at', 'DESC']]
    });

    return {
        data: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        }
    };
};

exports.getById = async (id) => {
    const card = await VisitingCard.findByPk(id);
    if (!card) throw new Error('Visiting card not found');
    return card;
};

exports.getFieldMappings = async () => {
    return await FieldMapping.findAll({
        order: [['display_order', 'ASC']]
    });
};

exports.initializeFieldMappings = async () => {
    const defaultMappings = [
        {
            field_name: 'full_name',
            field_label: 'Full Name',
            field_type: 'text',
            detection_keywords: ['name', 'mr', 'mrs', 'ms', 'dr', 'prof'],
            regex_pattern: null,
            display_order: 1
        },
        {
            field_name: 'designation',
            field_label: 'Designation/Title',
            field_type: 'text',
            detection_keywords: ['ceo', 'coo', 'cfo', 'manager', 'director', 'engineer', 'developer', 'founder', 'co-founder', 'president', 'vice', 'head', 'partner', 'consultant', 'entrepreneur', 'educator', 'officer', 'executive'],
            regex_pattern: null,
            display_order: 2
        },
        {
            field_name: 'company_name',
            field_label: 'Company Name',
            field_type: 'text',
            detection_keywords: ['company', 'corporation', 'ltd', 'pvt', 'inc', 'llc', 'llp', 'technologies', 'solutions', 'services', 'systems', 'group', 'enterprises'],
            regex_pattern: null,
            display_order: 3
        },
        {
            field_name: 'primary_phone',
            field_label: 'Primary Phone',
            field_type: 'phone',
            detection_keywords: ['phone', 'mobile', 'tel', 'call', 'contact', 'm:', 'mob'],
            regex_pattern: '^[+]?[0-9\\s\\-()]{10,}$',
            display_order: 4
        },
        {
            field_name: 'secondary_phone',
            field_label: 'Secondary Phone',
            field_type: 'phone',
            detection_keywords: ['phone', 'mobile', 'tel', 'alternate', 'office', 'landline'],
            regex_pattern: '^[+]?[0-9\\s\\-()]{10,}$',
            display_order: 5
        },
        {
            field_name: 'primary_email',
            field_label: 'Primary Email',
            field_type: 'email',
            detection_keywords: ['email', 'e-mail', 'mail'],
            regex_pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
            display_order: 6
        },
        {
            field_name: 'secondary_email',
            field_label: 'Secondary Email',
            field_type: 'email',
            detection_keywords: ['email', 'e-mail', 'alternate'],
            regex_pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
            display_order: 7
        },
        {
            field_name: 'website',
            field_label: 'Website',
            field_type: 'url',
            detection_keywords: ['website', 'www', 'web', 'http', 'site', 'visit'],
            regex_pattern: '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?',
            display_order: 8
        },
        {
            field_name: 'company_address',
            field_label: 'Address',
            field_type: 'textarea',
            detection_keywords: ['address', 'office', 'street', 'road', 'avenue', 'building', 'floor', 'complex', 'nr', 'near', 'opp', 'opposite'],
            regex_pattern: null,
            display_order: 9
        },
        {
            field_name: 'city',
            field_label: 'City',
            field_type: 'text',
            detection_keywords: ['ahmedabad', 'mumbai', 'delhi', 'bangalore', 'chennai', 'hyderabad', 'pune', 'kolkata', 'surat', 'jaipur'],
            regex_pattern: null,
            display_order: 10
        },
        {
            field_name: 'state',
            field_label: 'State',
            field_type: 'text',
            detection_keywords: ['gujarat', 'maharashtra', 'karnataka', 'tamil nadu', 'delhi', 'rajasthan', 'west bengal'],
            regex_pattern: null,
            display_order: 11
        },
        {
            field_name: 'country',
            field_label: 'Country',
            field_type: 'text',
            detection_keywords: ['india', 'usa', 'uk', 'canada', 'australia'],
            regex_pattern: null,
            display_order: 12
        },
        {
            field_name: 'pincode',
            field_label: 'Pincode/Zipcode',
            field_type: 'text',
            detection_keywords: ['pincode', 'zipcode', 'zip', 'postal'],
            regex_pattern: '\\b[0-9]{6}\\b',
            display_order: 13
        },
        {
            field_name: 'linkedin_url',
            field_label: 'LinkedIn',
            field_type: 'url',
            detection_keywords: ['linkedin', 'linked.in'],
            regex_pattern: null,
            display_order: 14
        },
        {
            field_name: 'facebook_url',
            field_label: 'Facebook',
            field_type: 'url',
            detection_keywords: ['facebook', 'fb.com', 'fb'],
            regex_pattern: null,
            display_order: 15
        },
        {
            field_name: 'twitter_url',
            field_label: 'Twitter/X',
            field_type: 'url',
            detection_keywords: ['twitter', 'x.com'],
            regex_pattern: null,
            display_order: 16
        },
        {
            field_name: 'instagram_url',
            field_label: 'Instagram',
            field_type: 'url',
            detection_keywords: ['instagram', 'insta'],
            regex_pattern: null,
            display_order: 17
        },
        {
            field_name: 'fax',
            field_label: 'Fax',
            field_type: 'phone',
            detection_keywords: ['fax'],
            regex_pattern: null,
            display_order: 18
        },
        {
            field_name: 'department',
            field_label: 'Department',
            field_type: 'text',
            detection_keywords: ['department', 'dept'],
            regex_pattern: null,
            display_order: 19
        },
        {
            field_name: 'notes',
            field_label: 'Services/Description',
            field_type: 'textarea',
            detection_keywords: ['services', 'we offer', 'specialization', 'expertise', 'description'],
            regex_pattern: null,
            display_order: 20
        }
    ];

    for (const mapping of defaultMappings) {
        await FieldMapping.findOrCreate({
            where: { field_name: mapping.field_name },
            defaults: mapping
        });
    }

    return true;
};