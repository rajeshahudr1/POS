const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class OrderItemFlavor extends Model {
        static associate(models) {
            /* parent order item */
            OrderItemFlavor.belongsTo(models.OrderItem, {
                foreignKey: 'order_item_id'
            });

            /* optional reference to flavor master */
            OrderItemFlavor.belongsTo(models.FlavorChoice, {
                foreignKey: 'flavor_id'
            });
        }
    }

    OrderItemFlavor.init(
        {
            order_item_flavor_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            order_item_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            flavor_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            flavor_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            extra_charge: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            }
        },
        {
            sequelize,
            modelName: 'OrderItemFlavor',
            tableName: 'order_item_flavors',
            timestamps: false
        }
    );

    return OrderItemFlavor;
};
