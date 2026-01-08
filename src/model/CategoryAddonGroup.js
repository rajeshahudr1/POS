const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class CategoryAddonGroup extends Model {
        static associate(models) {
            CategoryAddonGroup.belongsTo(models.Category, {
                foreignKey: 'category_id'
            });

            CategoryAddonGroup.belongsTo(models.AddonGroup, {
                foreignKey: 'addon_group_id'
            });
        }
    }

    CategoryAddonGroup.init(
        {
            category_addon_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            addon_group_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'CategoryAddonGroup',
            tableName: 'category_addon_groups',
            timestamps: false
        }
    );

    return CategoryAddonGroup;
};
