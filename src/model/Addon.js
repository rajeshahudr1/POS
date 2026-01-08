const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Addon extends Model {
        static associate(models) {
            Addon.belongsTo(models.AddonGroup, {
                foreignKey: 'addon_group_id'
            });
        }
    }

    Addon.init(
        {
            addon_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            addon_group_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            addon_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'Addon',
            tableName: 'addons',
            timestamps: false
        }
    );

    return Addon;
};
