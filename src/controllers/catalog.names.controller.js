const db = require('../model');

exports.getCatalogByNames = async (req, res) => {
    try {
        /* ================== CATEGORIES ================== */
        const categories = await db.Category.findAll({
            attributes: [
                'category_id',
                'category_name',
                'category_type',
                'has_sizes',
                'has_extra_toppings',
                'has_half_and_half',
                'has_addons',
                'has_protein_choice',
                'has_flavor_choice',
                'display_order'
            ],
            where: { is_active: true },
            order: [['display_order', 'ASC']],
            include: [
                {
                    model: db.Size,
                    attributes: ['size_name', 'size_code'],
                    through: { attributes: [] }
                }
            ]
        });

        const result = [];

        /* ================== LOOP CATEGORY ================== */
        for (const category of categories) {

            /* ---------- SIZES ---------- */
            const sizes = category.dataValues.has_sizes
                ? category.Sizes.map(s => ({
                    size_name: s.size_name,
                    size_code: s.size_code
                }))
                : [];

            /* ---------- TOPPINGS ---------- */
            let toppings = [];
            if (category.dataValues.has_extra_toppings) {
                const toppingRows = await db.CategoryTopping.findAll({
                    where: { category_id: category.category_id },
                    include: [{
                        model: db.Topping,
                        attributes: ['topping_name'],
                        include: [{
                            model: db.ToppingPrice,
                            attributes: ['price'],
                            include: [{
                                model: db.Size,
                                attributes: ['size_code']
                            }]
                        }]
                    }]
                });

                toppings = toppingRows.map(row => {
                    const priceMap = {};
                    row.Topping.ToppingPrices.forEach(tp => {
                        if (tp.Size) {
                            priceMap[tp.Size.size_code] = tp.price;
                        }
                    });

                    return {
                        topping_name: row.Topping.topping_name,
                        prices: priceMap
                    };
                });
            }

            /* ---------- ADDONS ---------- */
            let addonGroups = [];
            if (category.dataValues.has_addons) {
                const groups = await db.CategoryAddonGroup.findAll({
                    where: { category_id: category.category_id },
                    include: [{
                        model: db.AddonGroup,
                        attributes: ['group_name', 'allow_multiple'],
                        include: [{
                            model: db.Addon,
                            attributes: ['addon_name', 'price']
                        }]
                    }]
                });

                addonGroups = groups.map(g => ({
                    group_name: g.AddonGroup.group_name,
                    allow_multiple: g.AddonGroup.allow_multiple,
                    addons: g.AddonGroup.Addons.map(a => ({
                        addon_name: a.addon_name,
                        price: a.price
                    }))
                }));
            }

            /* ---------- PROTEINS ---------- */
            let proteins = [];
            if (category.dataValues.has_protein_choice) {
                const proteinRows = await db.CategoryProtein.findAll({
                    where: { category_id: category.category_id },
                    include: [{
                        model: db.ProteinChoice,
                        attributes: ['protein_name', 'extra_charge']
                    }]
                });

                proteins = proteinRows.map(p => ({
                    protein_name: p.ProteinChoice.protein_name,
                    extra_charge: p.ProteinChoice.extra_charge
                }));
            }

            /* ---------- FLAVORS ---------- */
            let flavors = [];
            if (category.dataValues.has_flavor_choice) {
                const flavorRows = await db.CategoryFlavor.findAll({
                    where: { category_id: category.category_id },
                    include: [{
                        model: db.FlavorChoice,
                        attributes: ['flavor_name', 'extra_charge']
                    }]
                });

                flavors = flavorRows.map(f => ({
                    flavor_name: f.FlavorChoice.flavor_name,
                    extra_charge: f.FlavorChoice.extra_charge
                }));
            }

            /* ---------- PRODUCTS ---------- */
            const productsRaw = await db.Product.findAll({
                where: {
                    category_id: category.category_id,
                    is_active: true
                },
                attributes: [
                    'product_name',
                    'description',
                    'is_half_and_half',
                    'included_toppings',
                    'display_order'
                ],
                include: [{
                    model: db.ProductPrice,
                    attributes: ['price'],
                    include: [{
                        model: db.Size,
                        attributes: ['size_code']
                    }]
                }],
                order: [['display_order', 'ASC']]
            });

            const products = productsRaw.map(p => {
                const priceMap = {};
                p.ProductPrices.forEach(pp => {
                    if (pp.Size) {
                        priceMap[pp.Size.size_code] = pp.price;
                    }
                });


                return {
                    product_name: p.product_name,
                    description: p.description,
                    is_half_and_half: p.is_half_and_half,
                    included_toppings: p.included_toppings,
                    // available_toppings: finalToppings,
                    prices: priceMap
                };
            });

            /* ---------- MEALS ---------- */
            const mealsRaw = await db.Meal.findAll({
                where: {
                    category_id: category.category_id,
                    is_active: true
                },
                attributes: ['meal_name', 'description', 'price', 'display_order'],
                include: [
                    {
                        model: db.MealInclude,
                        attributes: ['item_name', 'quantity']
                    },
                    {
                        model: db.MealChoiceGroupMapping,
                        attributes: ['num_selections'],
                        include: [{
                            model: db.MealChoiceGroup,
                            attributes: ['group_name'],
                            include: [{
                                model: db.MealChoiceOption,
                                attributes: ['option_name']
                            }]
                        }]
                    }
                ],
                order: [['display_order', 'ASC']]
            });

            const meals = mealsRaw.map(m => ({
                meal_name: m.meal_name,
                description: m.description,
                price: m.price,
                includes: m.MealIncludes.map(i => ({
                    item_name: i.item_name,
                    quantity: i.quantity
                })),
                choices: m.MealChoiceGroupMappings.map(cg => ({
                    group_name: cg.MealChoiceGroup.group_name,
                    num_selections: cg.num_selections,
                    options: cg.MealChoiceGroup.MealChoiceOptions.map(o => o.option_name)
                }))
            }));

            /* ---------- FINAL PUSH ---------- */
            result.push({
                category_name: category.category_name,
                category_type: category.category_type,
                flags: {
                    has_sizes: category.dataValues.has_sizes,
                    has_extra_toppings: category.dataValues.has_extra_toppings,
                    has_half_and_half: category.dataValues.has_half_and_half,
                    has_addons: category.dataValues.has_addons,
                    has_protein_choice: category.dataValues.has_protein_choice,
                    has_flavor_choice: category.dataValues.has_flavor_choice
                },
                sizes,
                toppings,
                addon_groups: addonGroups,
                proteins,
                flavors,
                products,
                meals
            });
        }

        return res.json({ success: true, data: result });

    } catch (err) {
        console.error('Catalog API Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Catalog fetch failed'
        });
    }
};
