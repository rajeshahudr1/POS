const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ToppingPrice extends Model {
        static associate(models) {
            ToppingPrice.belongsTo(models.Topping, {
                foreignKey: 'topping_id'
            });

            ToppingPrice.belongsTo(models.Size, {
                foreignKey: 'size_id'
            });
        }
    }

    ToppingPrice.init(
        {
            topping_price_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            topping_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            size_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'ToppingPrice',
            tableName: 'topping_prices',
            timestamps: false
        }
    );

    return ToppingPrice;
};
