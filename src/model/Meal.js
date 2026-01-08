const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Meal extends Model {
        static associate(models) {
            /* meal belongs to category (Set Meals / Pizza Deals) */
            Meal.belongsTo(models.Category, {
                foreignKey: 'category_id'
            });

            /* meal includes fixed items */
            Meal.hasMany(models.MealInclude, {
                foreignKey: 'meal_id'
            });

            /* meal has choice group mapping */
            Meal.hasMany(models.MealChoiceGroupMapping, {
                foreignKey: 'meal_id'
            });

            /* order side */
            Meal.hasMany(models.OrderMeal, {
                foreignKey: 'meal_id'
            });
        }
    }

    Meal.init(
        {
            meal_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            meal_name: {
                type: DataTypes.STRING(150),
                allowNull: false
            },

            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            },

            display_order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },

            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            }
        },
        {
            sequelize,
            modelName: 'Meal',
            tableName: 'meals',
            timestamps: false
        }
    );

    return Meal;
};
