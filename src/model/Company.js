const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Company extends Model {
        static associate(models) {
            Company.hasMany(models.Branch, {
                foreignKey: 'company_id',
                as: 'branches'
            });
        }
    }

    Company.init(
        {
            company_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            company_name: {
                type: DataTypes.STRING(200),
                allowNull: false
            },
            company_code: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true
            },
            logo_url: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
            email: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            phone: {
                type: DataTypes.STRING(20),
                allowNull: true
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            currency_code: {
                type: DataTypes.STRING(10),
                allowNull: true,
                defaultValue: 'GBP'
            },
            currency_symbol: {
                type: DataTypes.STRING(5),
                allowNull: true,
                defaultValue: '£'
            },
            tax_percentage: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: true,
                defaultValue: 0.00
            },
            is_active: {
                type: DataTypes.TINYINT,
                allowNull: true,
                defaultValue: 1
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: DataTypes.NOW
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: DataTypes.NOW
            }
        },
        {
            sequelize,
            modelName: 'Company',
            tableName: 'companies',
            timestamps: false
        }
    );

    return Company;
};
