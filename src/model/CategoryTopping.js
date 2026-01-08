const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class CategoryTopping extends Model {
        static associate(models) {
            CategoryTopping.belongsTo(models.Category, {
                foreignKey: 'category_id'
            });

            CategoryTopping.belongsTo(models.Topping, {
                foreignKey: 'topping_id'
            });
        }
    }

    CategoryTopping.init(
        {
            category_topping_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            topping_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'CategoryTopping',
            tableName: 'category_toppings',
            timestamps: false
        }
    );

    return CategoryTopping;
};
