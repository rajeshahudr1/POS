const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class OrderMealChoice extends Model {
        static associate(models) {
            /* parent ordered meal */
            OrderMealChoice.belongsTo(models.OrderMeal, {
                foreignKey: 'order_meal_id'
            });

            /* reference to choice group (CURRY / MEAT / PIZZA etc.) */
            OrderMealChoice.belongsTo(models.MealChoiceGroup, {
                foreignKey: 'choice_group_id'
            });

            /* reference to selected option */
            OrderMealChoice.belongsTo(models.MealChoiceOption, {
                foreignKey: 'choice_option_id'
            });
        }
    }

    OrderMealChoice.init(
        {
            order_meal_choice_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            order_meal_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            choice_group_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            choice_group_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            choice_option_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },

            choice_option_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'OrderMealChoice',
            tableName: 'order_meal_choices',
            timestamps: false
        }
    );

    return OrderMealChoice;
};
