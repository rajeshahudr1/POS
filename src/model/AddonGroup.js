const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class AddonGroup extends Model {
        static associate(models) {
            AddonGroup.hasMany(models.CategoryAddonGroup, {
                foreignKey: 'addon_group_id'
            });

            AddonGroup.hasMany(models.Addon, {
                foreignKey: 'addon_group_id'
            });
        }
    }

    AddonGroup.init(
        {
            addon_group_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            group_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            allow_multiple: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            is_required: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        },
        {
            sequelize,
            modelName: 'AddonGroup',
            tableName: 'addon_groups',
            timestamps: false
        }
    );

    return AddonGroup;
};
