const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class FlavorChoice extends Model {
        static associate(models) {
            // flavor is mapped to categories via category_flavors table
            FlavorChoice.belongsToMany(models.Category, {
                through: models.CategoryFlavor,
                foreignKey: 'flavor_id',
                otherKey: 'category_id'
            });
        }
    }

    FlavorChoice.init(
        {
            flavor_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            flavor_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            extra_charge: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },

            display_order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            }
        },
        {
            sequelize,
            modelName: 'FlavorChoice',
            tableName: 'flavor_choices',
            timestamps: false
        }
    );

    return FlavorChoice;
};
