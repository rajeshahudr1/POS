// model/visitingCard.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VisitingCard = sequelize.define('VisitingCard', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Personal Information
    full_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    first_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    last_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    designation: {
        type: DataTypes.STRING(200),
        allowNull: true
    },

    // Contact Information
    primary_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    secondary_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    primary_email: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    secondary_email: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    website: {
        type: DataTypes.STRING(255),
        allowNull: true
    },

    // Company Information
    company_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    company_address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    country: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    pincode: {
        type: DataTypes.STRING(20),
        allowNull: true
    },

    // Social Media
    linkedin_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    facebook_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    twitter_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    instagram_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },

    // Additional Information
    fax: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    department: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // Image Storage
    front_image_path: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    rear_image_path: {
        type: DataTypes.STRING(500),
        allowNull: true
    },

    // Raw OCR Data
    front_ocr_text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rear_ocr_text: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'visiting_cards',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['full_name'] },
        { fields: ['primary_email'] },
        { fields: ['primary_phone'] },
        { fields: ['company_name'] }
    ]
});

module.exports = VisitingCard;