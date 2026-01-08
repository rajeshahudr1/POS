const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class CategoryFlavor extends Model {
        static associate(models) {
            // ⚠️ models.Category & models.FlavorChoice MUST exist
            CategoryFlavor.belongsTo(models.Category, {
                foreignKey: 'category_id'
            });

            CategoryFlavor.belongsTo(models.FlavorChoice, {
                foreignKey: 'flavor_id'
            });
        }
    }

    CategoryFlavor.init(
        {
            category_flavor_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            flavor_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'CategoryFlavor',
            tableName: 'category_flavors',
            timestamps: false
        }
    );

    return CategoryFlavor;
};
