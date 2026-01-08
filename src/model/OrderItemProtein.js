const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class OrderItemTopping extends Model {
        static associate(models) {
            /* parent order item */
            OrderItemTopping.belongsTo(models.OrderItem, {
                foreignKey: 'order_item_id'
            });

            /* optional reference to topping master */
            OrderItemTopping.belongsTo(models.Topping, {
                foreignKey: 'topping_id'
            });

            /* optional reference to size */
            OrderItemTopping.belongsTo(models.Size, {
                foreignKey: 'size_id'
            });
        }
    }

    OrderItemTopping.init(
        {
            order_item_topping_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            order_item_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            topping_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            topping_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            size_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            size_code: {
                type: DataTypes.STRING(10),
                allowNull: true
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
            modelName: 'OrderItemTopping',
            tableName: 'order_item_toppings',
            timestamps: false
        }
    );

    return OrderItemTopping;
};
