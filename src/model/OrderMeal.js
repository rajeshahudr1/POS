const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class OrderMeal extends Model {
        static associate(models) {
            /* parent order */
            OrderMeal.belongsTo(models.Order, {
                foreignKey: 'order_id'
            });

            /* optional reference to meal master */
            OrderMeal.belongsTo(models.Meal, {
                foreignKey: 'meal_id'
            });

            /* meal choices */
            OrderMeal.hasMany(models.OrderMealChoice, {
                foreignKey: 'order_meal_id'
            });
        }
    }

    OrderMeal.init(
        {
            order_meal_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            order_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            meal_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            meal_name: {
                type: DataTypes.STRING(150),
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

            line_total: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'OrderMeal',
            tableName: 'order_meals',
            timestamps: false
        }
    );

    return OrderMeal;
};
