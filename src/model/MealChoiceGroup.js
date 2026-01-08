const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class MealChoiceGroup extends Model {
        static associate(models) {
            /* group has many options */
            MealChoiceGroup.hasMany(models.MealChoiceOption, {
                foreignKey: 'choice_group_id'
            });

            /* mapping with meals */
            MealChoiceGroup.hasMany(models.MealChoiceGroupMapping, {
                foreignKey: 'choice_group_id'
            });
        }
    }

    MealChoiceGroup.init(
        {
            choice_group_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            group_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            group_code: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true
            }
        },
        {
            sequelize,
            modelName: 'MealChoiceGroup',
            tableName: 'meal_choice_groups',
            timestamps: false
        }
    );

    return MealChoiceGroup;
};
