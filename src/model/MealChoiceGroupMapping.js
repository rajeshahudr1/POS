const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class MealChoiceGroupMapping extends Model {
        static associate(models) {
            /* mapping belongs to meal */
            MealChoiceGroupMapping.belongsTo(models.Meal, {
                foreignKey: 'meal_id'
            });

            /* mapping belongs to choice group */
            MealChoiceGroupMapping.belongsTo(models.MealChoiceGroup, {
                foreignKey: 'choice_group_id'
            });
        }
    }

    MealChoiceGroupMapping.init(
        {
            mapping_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            meal_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            choice_group_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            num_selections: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            }
        },
        {
            sequelize,
            modelName: 'MealChoiceGroupMapping',
            tableName: 'meal_choice_group_mapping',
            timestamps: false,
            indexes: [
                {
                    unique: true,
                    fields: ['meal_id', 'choice_group_id']
                }
            ]
        }
    );

    return MealChoiceGroupMapping;
};
