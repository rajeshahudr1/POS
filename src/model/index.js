const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const CompanyModel = require('./Company');
const BranchModel = require('./Branch');
const SizeModel = require('./Size');
const CategoryModel = require('./Category');
const CategorySizeModel = require('./CategorySize');
const ProductModel = require('./Product');
const ProductPriceModel = require('./ProductPrice');
const ToppingModel = require('./Topping');
const ToppingPriceModel = require('./ToppingPrice');
const CategoryToppingModel = require('./CategoryTopping');
const AddonGroupModel = require('./AddonGroup');
const AddonModel = require('./Addon');
const CategoryAddonGroupModel = require('./CategoryAddonGroup');
const ProteinChoiceModel = require('./ProteinChoice');
const CategoryProteinModel = require('./CategoryProtein');
const FlavorChoiceModel = require('./FlavorChoice');
const CategoryFlavorModel = require('./CategoryFlavor');
const OrderModel = require('./Order');

const OrderItemModel = require('./OrderItem');

const OrderItemAddonModel = require('./OrderItemAddon');
const OrderItemToppingModel = require('./OrderItemTopping');

const OrderItemProteinModel = require('./OrderItemProtein');
const OrderItemFlavorModel = require('./OrderItemFlavor');
const OrderMealModel = require('./OrderMeal');

const MealModel = require('./Meal');

const OrderMealChoiceModel = require('./OrderMealChoice');
const MealChoiceGroupModel = require('./MealChoiceGroup');


const MealChoiceOptionModel = require('./MealChoiceOption');

const MealChoiceGroupMappingModel = require('./MealChoiceGroupMapping');

const MealIncludeModel = require('./MealInclude');
// const ProductToppingModel = require('./ProductTopping');


const db = {};
db.sequelize = sequelize;

db.Company = CompanyModel(sequelize);
db.Branch = BranchModel(sequelize);
db.Size = SizeModel(sequelize);
db.Category = CategoryModel(sequelize);
db.CategorySize = CategorySizeModel(sequelize);
db.Product = ProductModel(sequelize);
db.ProductPrice = ProductPriceModel(sequelize);
db.Topping = ToppingModel(sequelize);
db.ToppingPrice = ToppingPriceModel(sequelize);
// db.ProductTopping = ProductToppingModel(sequelize);
db.CategoryTopping = CategoryToppingModel(sequelize);
db.AddonGroup = AddonGroupModel(sequelize);
db.Addon = AddonModel(sequelize);
db.CategoryAddonGroup = CategoryAddonGroupModel(sequelize);
db.ProteinChoice = ProteinChoiceModel(sequelize);
db.CategoryProtein = CategoryProteinModel(sequelize);
db.FlavorChoice = FlavorChoiceModel(sequelize);
db.CategoryFlavor = CategoryFlavorModel(sequelize);



db.Meal = MealModel(sequelize);
db.MealChoiceGroup = MealChoiceGroupModel(sequelize);
db.MealChoiceGroupMapping = MealChoiceGroupMappingModel(sequelize);
db.MealChoiceOption = MealChoiceOptionModel(sequelize);
db.MealInclude = MealIncludeModel(sequelize);
db.Order = OrderModel(sequelize);
db.OrderItem = OrderItemModel(sequelize);

db.OrderItemAddon = OrderItemAddonModel(sequelize);
db.OrderItemTopping = OrderItemToppingModel(sequelize);
db.OrderItemProtein = OrderItemProteinModel(sequelize);
db.OrderItemFlavor = OrderItemFlavorModel(sequelize);
db.OrderMeal = OrderMealModel(sequelize);
db.OrderMealChoice = OrderMealChoiceModel(sequelize);



/* RUN associate() FOR EACH MODEL */
Object.keys(db).forEach((key) => {
    const model = db[key];
    if (model && model.associate) {
        model.associate(db);
    }
});


/* Category ↔ ProteinChoice */
db.Category.belongsToMany(db.ProteinChoice, {
    through: db.CategoryProtein,
    foreignKey: 'category_id',
    otherKey: 'protein_id'
});

db.ProteinChoice.belongsToMany(db.Category, {
    through: db.CategoryProtein,
    foreignKey: 'protein_id',
    otherKey: 'category_id'
});



/* Category ↔ AddonGroup mapping */
db.Category.belongsToMany(db.AddonGroup, {
    through: db.CategoryAddonGroup,
    foreignKey: 'category_id',
    otherKey: 'addon_group_id'
});

db.AddonGroup.belongsToMany(db.Category, {
    through: db.CategoryAddonGroup,
    foreignKey: 'addon_group_id',
    otherKey: 'category_id'
});



/* Addon associations */
db.AddonGroup.hasMany(db.Addon, {
    foreignKey: 'addon_group_id'
});
db.Addon.belongsTo(db.AddonGroup, {
    foreignKey: 'addon_group_id'
});

/* Note: Company ↔ Branch associations are defined in Company.js and Branch.js models */

/* other associations stay same */


module.exports = db;
