const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Category extends Model {
        static associate(models) {
            Category.belongsToMany(models.Size, {
                through: models.CategorySize,
                foreignKey: 'category_id',
                otherKey: 'size_id'
            });

            // Products
            Category.hasMany(models.Product, {
                foreignKey: 'category_id'
            });

            // Toppings
            Category.hasMany(models.CategoryTopping, {
                foreignKey: 'category_id'
            });

            // Addon Groups
            Category.hasMany(models.CategoryAddonGroup, {
                foreignKey: 'category_id'
            });

            // Proteins
            Category.hasMany(models.CategoryProtein, {
                foreignKey: 'category_id'
            });

            // Flavors
            Category.hasMany(models.CategoryFlavor, {
                foreignKey: 'category_id'
            });

            


        }
    }

    Category.init(
        {
            category_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            category_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'Category',
            tableName: 'categories',
            timestamps: false
        }
    );

    return Category;
};
