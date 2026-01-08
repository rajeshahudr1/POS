const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class OrderItemAddon extends Model {
        static associate(models) {
            /* parent order item */
            OrderItemAddon.belongsTo(models.OrderItem, {
                foreignKey: 'order_item_id'
            });

            /* optional reference */
            OrderItemAddon.belongsTo(models.Addon, {
                foreignKey: 'addon_id'
            });
        }
    }

    OrderItemAddon.init(
        {
            order_item_addon_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            order_item_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            addon_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            addon_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            unit_price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },

            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            },

            total_price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'OrderItemAddon',
            tableName: 'order_item_addons',
            timestamps: false
        }
    );

    return OrderItemAddon;
};
