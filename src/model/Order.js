const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Order extends Model {
        static associate(models) {
            Order.hasMany(models.OrderItem, {
                foreignKey: 'order_id'
            });
        }
    }

    Order.init(
        {
            order_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            order_number: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true
            },

            order_type: {
                type: DataTypes.ENUM('dine_in', 'takeaway', 'delivery'),
                allowNull: false
            },

            total_amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },

            status: {
                type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
                defaultValue: 'pending'
            },

            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        },
        {
            sequelize,
            modelName: 'Order',
            tableName: 'orders',
            timestamps: false
        }
    );

    return Order;
};
