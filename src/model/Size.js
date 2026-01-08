const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Size extends Model {
        static associate(models) {
            Size.belongsToMany(models.Category, {
                through: models.CategorySize,
                foreignKey: 'size_id',
                otherKey: 'category_id'
            });
            Size.hasMany(models.ProductPrice, {
                foreignKey: 'size_id'
            });
        }
    }

    Size.init(
        {
            size_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            size_name: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            size_code: {
                type: DataTypes.STRING(10),
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'Size',
            tableName: 'sizes',
            timestamps: false
        }
    );

    return Size;
};
