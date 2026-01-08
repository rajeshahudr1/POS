const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class MealInclude extends Model {
        static associate(models) {
            /* included item belongs to meal */
            MealInclude.belongsTo(models.Meal, {
                foreignKey: 'meal_id'
            });
        }
    }

    MealInclude.init(
        {
            include_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            meal_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            item_name: {
                type: DataTypes.STRING(150),
                allowNull: false
            },

            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            }
        },
        {
            sequelize,
            modelName: 'MealInclude',
            tableName: 'meal_includes',
            timestamps: false
        }
    );

    return MealInclude;
};
