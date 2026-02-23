/**
 * Catalog Service
 * Calls SP and builds complete catalog JSON structure
 */
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

class CatalogService {

    /**
     * Validate token and company code
     */
    async validateToken(token, companyCode) {
        try {
            const cleanToken = (token || '').replace('Bearer ', '').trim();

            // Validate token matches company_code
            const company = await sequelize.query(
                    `SELECT company_id, company_code
                     FROM companies
                     WHERE company_code = ? AND is_active = 1
                       LIMIT 1`,
                {
                    replacements: [companyCode],
                    type: QueryTypes.SELECT,
                    plain: true   // 👈 THIS MAKES IT RETURN OBJECT
                }
            );


            if (company) {
                return { isValid: true, companyId: company.company_id, errorMessage: null };
            }
            return { isValid: false, companyId: 0, errorMessage: 'Invalid company code' };
        } catch (error) {
            console.error('Token validation error:', error);
            return { isValid: false, companyId: 0, errorMessage: 'Authentication failed' };
        }
    }

    /**
     * Get complete catalog using individual queries
     */
    async getCompleteCatalog(companyCode) {
        try {
            // 1. Get Company Info
            const [companyInfo] = await sequelize.query(
                `SELECT company_id, company_name, company_code, logo_url,
                    email, phone, address, currency_code, currency_symbol, tax_percentage
                FROM companies WHERE company_code = ? AND is_active = 1`,
                { replacements: [companyCode], type: QueryTypes.SELECT }
            );

            if (!companyInfo) {
                throw new Error('Company not found');
            }

            const companyId = companyInfo.company_id;

            // 2. Get Branches
            /*const branches = await sequelize.query(
                `SELECT branch_id, company_id, branch_name, branch_code, email, phone,
                    address_line1, address_line2, city, postcode, country, opening_time, closing_time
                FROM branches WHERE company_id = ? AND is_active = 1 ORDER BY branch_name`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );*/

            // 3. Get Sizes
            const sizes = await sequelize.query(
                `SELECT size_id, company_id, size_name, size_code, display_order
                FROM sizes WHERE company_id = ? AND is_active = 1 ORDER BY display_order`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );


            // 3a. Get Business Hours
            const businessHours = await sequelize.query(
                    `SELECT business_hour_id, day, service, time,delivery_time
                     FROM business_hours WHERE company_id = ? ORDER BY business_hour_id`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );

            // 3b. Get Special Comments
            const specialComments = await sequelize.query(
                    `SELECT comment_id, title, description
                     FROM special_comments WHERE company_id = ?  ORDER BY comment_id`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );

            // 3c. Get Delivery Charges
            const deliveryCharges = await sequelize.query(
                    `SELECT delivery_charge_id, postcode, status, minimum_order,
                            CAST(charge AS DOUBLE) AS charge,
                            CAST(driver_fee AS DOUBLE) AS driver_fee,
                            CAST(free_delivery_above AS DOUBLE) AS free_delivery_above,
                            distance_limit
                     FROM delivery_charges
                     WHERE company_id = ?
                     ORDER BY delivery_charge_id`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );

            // 4. Get Categories
            const categories = await sequelize.query(
                `SELECT c.category_id, c.company_id, c.category_name, c.category_code, c.description,
                    c.category_type, c.has_sizes, c.has_toppings, c.has_addons, c.has_flavours,
                    c.has_choices, c.has_half_and_half, c.image_url, c.display_order
                FROM categories c
                WHERE c.company_id = ? AND c.is_active = 1
                ORDER BY c.display_order`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );

            // 5. Get Category Sizes
            const categorySizes = await sequelize.query(
                `SELECT cs.category_size_id, cs.category_id, cs.size_id, s.size_name, s.size_code, cs.display_order
                FROM category_sizes cs
                JOIN sizes s ON cs.size_id = s.size_id
                JOIN categories cat ON cs.category_id = cat.category_id
                WHERE cat.company_id = ? AND cs.is_active = 1 AND s.is_active = 1
                ORDER BY cs.category_id, cs.display_order`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );

            // 6. Get Category Toppings with Prices
            const categoryToppings = await sequelize.query(
                `SELECT ct.category_topping_id, ct.category_id, ct.topping_id, t.topping_name, t.topping_code,
                    ct.is_default, ct.display_order, ctp.size_id, sz.size_name, sz.size_code,
                    IFNULL(ctp.price, t.default_price) AS price
                FROM category_toppings ct
                JOIN toppings t ON ct.topping_id = t.topping_id
                JOIN categories cat ON ct.category_id = cat.category_id
                LEFT JOIN category_topping_prices ctp ON ct.category_topping_id = ctp.category_topping_id AND ctp.is_active = 1
                LEFT JOIN sizes sz ON ctp.size_id = sz.size_id
                WHERE cat.company_id = ? AND ct.is_active = 1 AND t.is_active = 1
                ORDER BY ct.category_id, ct.display_order, sz.display_order`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );



            // 7. Get Category Addon Groups with Addons and Prices
            const categoryAddonGroups = await sequelize.query(
                `SELECT cag.category_addon_group_id, cag.category_id, cag.addon_group_id,
                    ag.group_name, ag.group_code, IFNULL(cag.is_required, ag.is_required) AS is_required,
                    ag.allow_multiple, ag.min_selections, ag.max_selections, cag.display_order,
                    a.addon_id, a.addon_name, a.addon_code, a.is_default AS addon_is_default, a.display_order AS addon_display_order,
                    cap.size_id, sz.size_name, sz.size_code, IFNULL(cap.price, a.default_price) AS price
                FROM category_addon_groups cag
                JOIN addon_groups ag ON cag.addon_group_id = ag.addon_group_id
                JOIN categories cat ON cag.category_id = cat.category_id
                JOIN addons a ON ag.addon_group_id = a.addon_group_id AND a.is_active = 1
                JOIN category_addon_prices cap ON cag.category_addon_group_id = cap.category_addon_group_id 
                    AND cap.addon_id = a.addon_id AND cap.is_active = 1
                LEFT JOIN sizes sz ON cap.size_id = sz.size_id
                WHERE cat.company_id = ? AND cag.is_active = 1 AND ag.is_active = 1
                ORDER BY cag.category_id, cag.display_order, a.display_order, sz.display_order`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );

            // 8. Get Category Choice Groups with Choices and Prices
            const categoryChoiceGroups = await sequelize.query(
                `SELECT ccg.category_choice_group_id, ccg.category_id, ccg.choice_group_id,
                    cg.group_name, cg.group_code, IFNULL(ccg.is_required, cg.is_required) AS is_required,
                    cg.allow_multiple, cg.min_selections, cg.max_selections, ccg.display_order,
                    c.choice_id, c.choice_name, c.choice_code, c.is_default AS choice_is_default, c.display_order AS choice_display_order,
                    ccp.size_id, sz.size_name, sz.size_code, IFNULL(ccp.price, c.default_price) AS price
                FROM category_choice_groups ccg
                JOIN choice_groups cg ON ccg.choice_group_id = cg.choice_group_id
                JOIN categories cat ON ccg.category_id = cat.category_id
                JOIN choices c ON cg.choice_group_id = c.choice_group_id AND c.is_active = 1
                 JOIN category_choice_prices ccp ON ccg.category_choice_group_id = ccp.category_choice_group_id 
                    AND ccp.choice_id = c.choice_id AND ccp.is_active = 1
                LEFT JOIN sizes sz ON ccp.size_id = sz.size_id
                WHERE cat.company_id = ? AND ccg.is_active = 1 AND cg.is_active = 1
                ORDER BY ccg.category_id, ccg.display_order, c.display_order, sz.display_order`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );

            // 9. Get Category Flavours with Prices
            const categoryFlavours = await sequelize.query(
                `SELECT cf.category_flavour_id, cf.category_id, cf.flavour_id, f.flavour_name, f.flavour_code,
                    cf.is_default, cf.display_order, cfp.size_id, sz.size_name, sz.size_code,
                    IFNULL(cfp.price, f.default_price) AS price
                FROM category_flavours cf
                JOIN flavours f ON cf.flavour_id = f.flavour_id
                JOIN categories cat ON cf.category_id = cat.category_id
                LEFT JOIN category_flavour_prices cfp ON cf.category_flavour_id = cfp.category_flavour_id AND cfp.is_active = 1
                LEFT JOIN sizes sz ON cfp.size_id = sz.size_id
                WHERE cat.company_id = ? AND cf.is_active = 1 AND f.is_active = 1
                ORDER BY cf.category_id, cf.display_order, sz.display_order`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );

            // 10. Get Products
            const products = await sequelize.query(
                `SELECT p.product_id, p.category_id, p.product_name, p.product_code, p.description,
                    p.base_price, p.has_custom_toppings, p.has_custom_addons, p.has_custom_flavours,
                    p.has_custom_choices, p.included_toppings_count, p.is_half_and_half, p.image_url, p.display_order
                FROM products p
                JOIN categories cat ON p.category_id = cat.category_id
                WHERE cat.company_id = ? AND p.is_active = 1
                ORDER BY p.category_id, p.display_order`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );

            // 11. Get Product Prices
            const productPrices = await sequelize.query(
                `SELECT pp.product_price_id, pp.product_id, pp.size_id, s.size_name, s.size_code, pp.price
                FROM product_prices pp
                JOIN sizes s ON pp.size_id = s.size_id
                JOIN products p ON pp.product_id = p.product_id
                JOIN categories cat ON p.category_id = cat.category_id
                WHERE cat.company_id = ? AND pp.is_active = 1 AND s.is_active = 1
                ORDER BY pp.product_id, s.display_order`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );

            // 12. Get Product Custom Flavours with Prices
            const productFlavours = await sequelize.query(
                `SELECT pf.product_flavour_id, pf.product_id, pf.flavour_id, f.flavour_name, f.flavour_code,
        pf.is_default, pf.display_order, pfp.size_id, sz.size_name, sz.size_code,
        IFNULL(pfp.price, f.default_price) AS price
    FROM product_flavours pf
    JOIN flavours f ON pf.flavour_id = f.flavour_id
    JOIN products p ON pf.product_id = p.product_id
    JOIN categories cat ON p.category_id = cat.category_id
    LEFT JOIN product_flavour_prices pfp ON pf.product_flavour_id = pfp.product_flavour_id AND pfp.is_active = 1
    LEFT JOIN sizes sz ON pfp.size_id = sz.size_id
    WHERE cat.company_id = ? AND pf.is_active = 1 AND f.is_active = 1 AND p.has_custom_flavours = 1
    ORDER BY pf.product_id, pf.display_order, sz.display_order`,
                { replacements: [companyId], type: QueryTypes.SELECT }
            );

            // Build the hierarchical structure
            return this.buildCatalogStructure(
                companyInfo, sizes, categories, categorySizes,
                categoryToppings, categoryAddonGroups, categoryChoiceGroups,
                categoryFlavours, products, productPrices,productFlavours,businessHours,specialComments,deliveryCharges
            );

        } catch (error) {
            console.error('Get catalog error:', error);
            throw error;
        }
    }

    /**
     * Build hierarchical catalog structure from query results
     */
    buildCatalogStructure(companyInfo, sizes, categories, categorySizes,
                          categoryToppings, categoryAddonGroups, categoryChoiceGroups,
                          categoryFlavours, products, productPrices,productFlavours,businessHours,specialComments ,deliveryCharges ) {

        // Build company info
        const catalog = {
            company_info: {
                company_id: companyInfo.company_id,
                company_name: companyInfo.company_name,
                company_code: companyInfo.company_code,
                logo_url: companyInfo.logo_url,
                email: companyInfo.email,
                phone: companyInfo.phone,
                address: companyInfo.address,
                currency: {
                    code: companyInfo.currency_code,
                    symbol: companyInfo.currency_symbol
                },
                tax_percentage: parseFloat(companyInfo.tax_percentage) || 0,
                business_hours: businessHours,
                special_comments: specialComments,
                delivery_charges: deliveryCharges
            },
            categories: []
        };

        // Group data by category_id for quick lookup
        const catSizesMap = this.groupBy(categorySizes, 'category_id');
        const catToppingsMap = this.groupByWithPrices(categoryToppings, 'category_id', 'category_topping_id');
        const catAddonGroupsMap = this.groupAddonGroups(categoryAddonGroups);
        const catChoiceGroupsMap = this.groupChoiceGroups(categoryChoiceGroups);
        const catFlavoursMap = this.groupByWithPrices(categoryFlavours, 'category_id', 'category_flavour_id');
        const productsMap = this.groupBy(products, 'category_id');
        const productPricesMap = this.groupBy(productPrices, 'product_id');
        const productFlavoursMap = this.groupProductFlavours(productFlavours);

        // Get categories for this branch
        const branchCategories = categories.filter(c => c.company_id === companyInfo.company_id);

        for (const cat of branchCategories) {
            const categoryData = {
                category_id: cat.category_id,
                category_name: cat.category_name,
                category_code: cat.category_code,
                description: cat.description,
                category_type: cat.category_type,
                image_url: cat.image_url,
                display_order: cat.display_order,
                settings: {
                    has_sizes: cat.has_sizes === 1,
                    has_toppings: cat.has_toppings === 1,
                    has_addons: cat.has_addons === 1,
                    has_flavours: cat.has_flavours === 1,
                    has_choices: cat.has_choices === 1,
                    has_half_and_half: cat.has_half_and_half === 1
                }
            };

            // Add sizes
            if (cat.has_sizes && catSizesMap[cat.category_id]) {
                categoryData.sizes = catSizesMap[cat.category_id].map(cs => ({
                    size_id: cs.size_id,
                    size_name: cs.size_name,
                    size_code: cs.size_code,
                    display_order: cs.display_order
                }));
            }

            // Add toppings with prices
            if (cat.has_toppings && catToppingsMap[cat.category_id]) {
                categoryData.toppings = catToppingsMap[cat.category_id];
            }

            // Add addon groups
            if (cat.has_addons && catAddonGroupsMap[cat.category_id]) {
                categoryData.addon_groups = catAddonGroupsMap[cat.category_id];
            }

            // Add choice groups
            if (cat.has_choices && catChoiceGroupsMap[cat.category_id]) {
                categoryData.choice_groups = catChoiceGroupsMap[cat.category_id];
            }

            // Add flavours
            if (cat.has_flavours && catFlavoursMap[cat.category_id]) {
                categoryData.flavours = catFlavoursMap[cat.category_id];
            }

            // Add products with prices
            categoryData.products = (productsMap[cat.category_id] || []).map(p => {
                const productData = {
                    product_id: p.product_id,
                    product_name: p.product_name,
                    product_code: p.product_code,
                    description: p.description,
                    base_price: p.base_price ? parseFloat(p.base_price) : null,
                    image_url: p.image_url,
                    display_order: p.display_order,
                    included_toppings_count: p.included_toppings_count,
                    is_half_and_half: p.is_half_and_half === 1,
                    settings: {
                        has_custom_toppings: p.has_custom_toppings === 1,
                        has_custom_addons: p.has_custom_addons === 1,
                        has_custom_flavours: p.has_custom_flavours === 1,
                        has_custom_choices: p.has_custom_choices === 1
                    },
                    prices: (productPricesMap[p.product_id] || []).map(pp => ({
                        size_id: pp.size_id,
                        size_name: pp.size_name,
                        size_code: pp.size_code,
                        price: parseFloat(pp.price) || 0
                    }))
                };

                // If product has custom flavours, add them
                if (p.has_custom_flavours === 1 && productFlavoursMap[p.product_id]) {
                    productData.flavours = productFlavoursMap[p.product_id];
                }

                return productData;
            });

            catalog.categories.push(categoryData);
        }

        return catalog;
    }

    // Helper: Group array by key
    groupBy(array, key) {
        return (array || []).reduce((acc, item) => {
            const k = item[key];
            if (!acc[k]) acc[k] = [];
            acc[k].push(item);
            return acc;
        }, {});
    }

    // Helper: Group items with prices (toppings, flavours)
    groupByWithPrices(array, categoryKey, itemKey) {
        const result = {};
        const itemsMap = {};

        for (const row of (array || [])) {
            const catId = row[categoryKey];
            const itemId = row[itemKey];

            if (!result[catId]) result[catId] = [];

            if (!itemsMap[itemId]) {
                itemsMap[itemId] = {
                    topping_id: row.topping_id,
                    flavour_id: row.flavour_id,
                    topping_name: row.topping_name,
                    topping_code: row.topping_code,
                    flavour_name: row.flavour_name,
                    flavour_code: row.flavour_code,
                    is_default: row.is_default === 1,
                    display_order: row.display_order,
                    prices: []
                };
                result[catId].push(itemsMap[itemId]);
            }

            if (row.size_id !== null || row.price !== null) {
                itemsMap[itemId].prices.push({
                    size_id: row.size_id,
                    size_name: row.size_name,
                    size_code: row.size_code,
                    price: parseFloat(row.price) || 0
                });
            }
        }

        return result;
    }

    // Helper: Group addon groups with addons and prices
    groupAddonGroups(array) {
        const result = {};
        const groupsMap = {};
        const addonsMap = {};

        for (const row of (array || [])) {
            const catId = row.category_id;
            const groupId = row.category_addon_group_id;
            const addonId = row.addon_id;

            if (!result[catId]) result[catId] = [];

            if (!groupsMap[groupId]) {
                groupsMap[groupId] = {
                    addon_group_id: row.addon_group_id,
                    group_name: row.group_name,
                    group_code: row.group_code,
                    is_required: row.is_required === 1,
                    allow_multiple: row.allow_multiple === 1,
                    min_selections: row.min_selections,
                    max_selections: row.max_selections,
                    display_order: row.display_order,
                    addons: []
                };
                result[catId].push(groupsMap[groupId]);
            }

            if (addonId) {
                const addonKey = `${groupId}_${addonId}`;
                if (!addonsMap[addonKey]) {
                    addonsMap[addonKey] = {
                        addon_id: addonId,
                        addon_name: row.addon_name,
                        addon_code: row.addon_code,
                        is_default: row.addon_is_default === 1,
                        display_order: row.addon_display_order,
                        prices: []
                    };
                    groupsMap[groupId].addons.push(addonsMap[addonKey]);
                }

                if (row.size_id !== null || row.price !== null) {
                    addonsMap[addonKey].prices.push({
                        size_id: row.size_id,
                        size_name: row.size_name,
                        size_code: row.size_code,
                        price: parseFloat(row.price) || 0
                    });
                }
            }
        }

        return result;
    }

    // Helper: Group choice groups with choices and prices
    groupChoiceGroups(array) {
        const result = {};
        const groupsMap = {};
        const choicesMap = {};

        for (const row of (array || [])) {
            const catId = row.category_id;
            const groupId = row.category_choice_group_id;
            const choiceId = row.choice_id;

            if (!result[catId]) result[catId] = [];

            if (!groupsMap[groupId]) {
                groupsMap[groupId] = {
                    choice_group_id: row.choice_group_id,
                    group_name: row.group_name,
                    group_code: row.group_code,
                    is_required: row.is_required === 1,
                    allow_multiple: row.allow_multiple === 1,
                    min_selections: row.min_selections,
                    max_selections: row.max_selections,
                    display_order: row.display_order,
                    choices: []
                };
                result[catId].push(groupsMap[groupId]);
            }

            if (choiceId) {
                const choiceKey = `${groupId}_${choiceId}`;
                if (!choicesMap[choiceKey]) {
                    choicesMap[choiceKey] = {
                        choice_id: choiceId,
                        choice_name: row.choice_name,
                        choice_code: row.choice_code,
                        is_default: row.choice_is_default === 1,
                        display_order: row.choice_display_order,
                        prices: []
                    };
                    groupsMap[groupId].choices.push(choicesMap[choiceKey]);
                }

                if (row.size_id !== null || row.price !== null) {
                    choicesMap[choiceKey].prices.push({
                        size_id: row.size_id,
                        size_name: row.size_name,
                        size_code: row.size_code,
                        price: parseFloat(row.price) || 0
                    });
                }
            }
        }

        return result;
    }

    // Helper: Group product flavours with prices
    groupProductFlavours(array) {
        const result = {};
        const itemsMap = {};

        for (const row of (array || [])) {
            const productId = row.product_id;
            const itemId = row.product_flavour_id;

            if (!result[productId]) result[productId] = [];

            if (!itemsMap[itemId]) {
                itemsMap[itemId] = {
                    flavour_id: row.flavour_id,
                    flavour_name: row.flavour_name,
                    flavour_code: row.flavour_code,
                    is_default: row.is_default === 1,
                    display_order: row.display_order,
                    prices: []
                };
                result[productId].push(itemsMap[itemId]);
            }

            if (row.size_id !== null || row.price !== null) {
                itemsMap[itemId].prices.push({
                    size_id: row.size_id,
                    size_name: row.size_name,
                    size_code: row.size_code,
                    price: parseFloat(row.price) || 0
                });
            }
        }

        return result;
    }


}

module.exports = new CatalogService();
