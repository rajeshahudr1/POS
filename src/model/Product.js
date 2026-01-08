const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Product extends Model {
        static associate(models) {
            Product.belongsTo(models.Category, {
                foreignKey: 'category_id'
            });

            Product.hasMany(models.ProductPrice, {
                foreignKey: 'product_id'
            });



        }
    }

    Product.init(
        {
            product_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            product_name: {
                type: DataTypes.STRING(150),
                allowNull: false
            },

            description: {
                type: DataTypes.STRING(255)
            },

            base_price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },

            is_half_and_half: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            included_toppings: {
                type: DataTypes.INTEGER,
                defaultValue: 0
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
            modelName: 'Product',
            tableName: 'products',
            timestamps: false
        }
    );

    return Product;
};
