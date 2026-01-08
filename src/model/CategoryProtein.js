const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class CategoryProtein extends Model {
        static associate(models) {

            // 🔗 category
            CategoryProtein.belongsTo(models.Category, {
                foreignKey: 'category_id'
            });

            // 🔗 protein
            CategoryProtein.belongsTo(models.ProteinChoice, {
                foreignKey: 'protein_id'
            });
        }
    }

    CategoryProtein.init(
        {
            category_protein_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            protein_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        },
        {
            sequelize,
            modelName: 'CategoryProtein',
            tableName: 'category_proteins',
            timestamps: false
        }
    );

    return CategoryProtein;
};
