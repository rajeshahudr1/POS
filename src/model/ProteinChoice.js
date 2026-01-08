const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProteinChoice extends Model {
        static associate(models) {

            // reverse mapping (optional but correct)
            ProteinChoice.hasMany(models.CategoryProtein, {
                foreignKey: 'protein_id'
            });
        }
    }

    ProteinChoice.init(
        {
            protein_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            protein_name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            extra_charge: {
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0
            }
        },
        {
            sequelize,
            modelName: 'ProteinChoice',
            tableName: 'protein_choices',
            timestamps: false
        }
    );

    return ProteinChoice;
};
