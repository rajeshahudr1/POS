const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class OrderItem extends Model {
        static associate(models) {
            /* parent order */
            OrderItem.belongsTo(models.Order, {
                foreignKey: 'order_id'
            });

            /* product reference (name-based snapshot) */
            OrderItem.belongsTo(models.Product, {
                foreignKey: 'product_id'
            });

            /* size reference */
            OrderItem.belongsTo(models.Size, {
                foreignKey: 'size_id'
            });

            /* children mappings */
            OrderItem.hasMany(models.OrderItemAddon, {
                foreignKey: 'order_item_id'
            });

            OrderItem.hasMany(models.OrderItemTopping, {
                foreignKey: 'order_item_id'
            });

            OrderItem.hasMany(models.OrderItemProtein, {
                foreignKey: 'order_item_id'
            });

            OrderItem.hasMany(models.OrderItemFlavor, {
                foreignKey: 'order_item_id'
            });
        }
    }

    OrderItem.init(
        {
            order_item_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            order_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            size_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            product_name: {
                type: DataTypes.STRING(150),
                allowNull: false
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
            modelName: 'OrderItem',
            tableName: 'order_items',
            timestamps: false
        }
    );

    return OrderItem;
};
