const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProductPrice extends Model {
        static associate(models) {
            ProductPrice.belongsTo(models.Product, {
                foreignKey: 'product_id'
            });

            ProductPrice.belongsTo(models.Size, {
                foreignKey: 'size_id'
            });
        }
    }

    ProductPrice.init(
        {
            product_price_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            product_id: {
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
            modelName: 'ProductPrice',
            tableName: 'product_prices',
            timestamps: false,
            indexes: [
                {
                    unique: true,
                    fields: ['product_id', 'size_id']
                }
            ]
        }
    );

    return ProductPrice;
};
