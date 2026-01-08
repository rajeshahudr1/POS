const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class OrderItemProtein extends Model {
        static associate(models) {
            /* parent order item */
            OrderItemProtein.belongsTo(models.OrderItem, {
                foreignKey: 'order_item_id'
            });

            /* optional reference to protein master */
            OrderItemProtein.belongsTo(models.ProteinChoice, {
                foreignKey: 'protein_id'
            });
        }
    }

    OrderItemProtein.init(
        {
            order_item_protein_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            order_item_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            protein_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            protein_name: {
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
            modelName: 'OrderItemProtein',
            tableName: 'order_item_proteins',
            timestamps: false
        }
    );

    return OrderItemProtein;
};
