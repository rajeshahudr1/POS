const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Branch extends Model {
        static associate(models) {
            Branch.belongsTo(models.Company, {
                foreignKey: 'company_id',
                as: 'company'
            });
        }
    }

    Branch.init(
        {
            branch_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            company_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'companies',
                    key: 'company_id'
                }
            },
            branch_name: {
                type: DataTypes.STRING(200),
                allowNull: false
            },
            branch_code: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            email: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            phone: {
                type: DataTypes.STRING(20),
                allowNull: true
            },
            address_line1: {
                type: DataTypes.STRING(200),
                allowNull: true
            },
            address_line2: {
                type: DataTypes.STRING(200),
                allowNull: true
            },
            city: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            postcode: {
                type: DataTypes.STRING(20),
                allowNull: true
            },
            country: {
                type: DataTypes.STRING(100),
                allowNull: true,
                defaultValue: 'United Kingdom'
            },
            opening_time: {
                type: DataTypes.TIME,
                allowNull: true
            },
            closing_time: {
                type: DataTypes.TIME,
                allowNull: true
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
            modelName: 'Branch',
            tableName: 'branches',
            timestamps: false
        }
    );

    return Branch;
};
