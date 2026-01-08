const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Topping extends Model {
        static associate(models) {
            Topping.hasMany(models.CategoryTopping, {
                foreignKey: 'topping_id'
            });

            Topping.hasMany(models.ToppingPrice, {
                foreignKey: 'topping_id'
            });
        }
    }

    Topping.init(
        {
            topping_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            topping_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            display_order: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },

            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        },
        {
            sequelize,
            modelName: 'Topping',
            tableName: 'toppings',
            timestamps: false
        }
    );

    return Topping;
};
