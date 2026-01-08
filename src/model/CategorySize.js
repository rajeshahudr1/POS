const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class CategorySize extends Model {
        static associate(models) {
            CategorySize.belongsTo(models.Category, {
                foreignKey: 'category_id'
            });

            CategorySize.belongsTo(models.Size, {
                foreignKey: 'size_id'
            });
        }
    }

    CategorySize.init(
        {
            category_size_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            size_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'CategorySize',
            tableName: 'category_sizes',
            timestamps: false
        }
    );

    return CategorySize;
};
