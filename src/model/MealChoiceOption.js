const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class MealChoiceOption extends Model {
        static associate(models) {
            /* option belongs to a choice group */
            MealChoiceOption.belongsTo(models.MealChoiceGroup, {
                foreignKey: 'choice_group_id'
            });
        }
    }

    MealChoiceOption.init(
        {
            choice_option_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            choice_group_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            option_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            display_order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            }
        },
        {
            sequelize,
            modelName: 'MealChoiceOption',
            tableName: 'meal_choice_options',
            timestamps: false
        }
    );

    return MealChoiceOption;
};
