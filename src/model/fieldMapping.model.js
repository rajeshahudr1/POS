// model/fieldMapping.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FieldMapping = sequelize.define('FieldMapping', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    field_name: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
    },
    field_label: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    field_type: {
        type: DataTypes.ENUM('text', 'email', 'phone', 'url', 'textarea'),
        defaultValue: 'text'
    },
    detection_keywords: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('detection_keywords');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('detection_keywords', JSON.stringify(value));
        }
    },
    regex_pattern: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    is_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    display_order: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'field_mapping_config',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = FieldMapping;