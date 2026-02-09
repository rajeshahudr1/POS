const {QueryTypes} = require('sequelize');
const XLSX = require('xlsx');
const db = require('../model');
const sequelize = db.sequelize;

/**
 * Main Import Function
 */

// Fixed sheet keywords for additional processing
const FIXED_SHEET_KEYWORDS = {
    businessHours: ['business hours', 'business hour', 'opening hours', 'opening time'],
    specialComments: ['special comment', 'special comments', 'comments', 'notes'],
    deliveryCharges: ['delivery charge', 'delivery charges', 'delivery', 'delivery zone', 'delivery zones']
};

exports.importExcel = async (companyId, branchId, filePath, fileName) => {
    const results = {
        totalRecords: 0,
        successCount: 0,
        failedCount: 0,
        sheets: [],
        categories: [],
        products: [],
        sizes: [],
        toppings: [],
        addons: [],
        flavours: [],
        choices: [],
        businessHours: [],
        specialComments: [],
        deliveryCharges: [],
        success: [],
        errors: []
    };

    try {
        const workbook = XLSX.readFile(filePath);

        console.log('\n============================================');
        console.log('IMPORT STARTED');
        console.log(`Company: ${companyId}, Branch: ${branchId}`);
        console.log(`Sheets: ${workbook.SheetNames.length}`);
        console.log('============================================\n');

        // Delete exist record by company
        await this.recordDestroy(companyId);

        // Process each sheet (each sheet = 1 category)
        for (const sheetName of workbook.SheetNames) {
            // console.log(`\n========== Processing Sheet: "${sheetName}" ==========`);
            const sheetNameLower = sheetName.toLowerCase().trim();
            try {
                const sheetResult = await this.processSheet(workbook, sheetName, companyId, branchId);

                results.categories.push(sheetResult.category);
                results.products.push(...sheetResult.products);
                results.sizes.push(...sheetResult.sizes);
                results.toppings.push(...sheetResult.toppings);
                results.addons.push(...sheetResult.addons);
                results.flavours.push(...sheetResult.flavours);
                results.choices.push(...sheetResult.choices);
                results.errors.push(...sheetResult.errors);
                results.success.push(...sheetResult.success);

                results.totalRecords += sheetResult.totalRecords;
                results.successCount += sheetResult.successCount;
                results.failedCount += sheetResult.failedCount;

                results.sheets.push({
                    name: sheetName,
                    total: sheetResult.totalRecords,
                    success: sheetResult.successCount,
                    failed: sheetResult.failedCount
                });

                // ADDITIONAL: Check if sheet matches fixed sheet keywords
                const sheetNameLower = sheetName.toLowerCase().trim();

                // Check Business Hours
                if (FIXED_SHEET_KEYWORDS.businessHours.some(k => sheetNameLower === k || sheetNameLower.includes(k))) {
                    const bhResult = await this.processBusinessHoursSheet(workbook, sheetName, companyId);
                    results.businessHours.push(...bhResult.records);
                    results.totalRecords += bhResult.total;
                    results.successCount += bhResult.successCount;
                    results.failedCount += bhResult.failed;
                    results.errors.push(...bhResult.errors);
                    results.success.push(...bhResult.success);
                }

                // Check Special Comments
                if (FIXED_SHEET_KEYWORDS.specialComments.some(k => sheetNameLower === k || sheetNameLower.includes(k))) {
                    const scResult = await this.processSpecialCommentsSheet(workbook, sheetName, companyId);
                    results.specialComments.push(...scResult.records);
                    results.totalRecords += scResult.total;
                    results.successCount += scResult.successCount;
                    results.failedCount += scResult.failed;
                    results.errors.push(...scResult.errors);
                    results.success.push(...scResult.success);
                }

                // Check Delivery Charges
                if (FIXED_SHEET_KEYWORDS.deliveryCharges.some(k => sheetNameLower === k || sheetNameLower.includes(k))) {
                    const dcResult = await this.processDeliveryChargesSheet(workbook, sheetName, companyId);
                    results.deliveryCharges.push(...dcResult.records);
                    results.totalRecords += dcResult.total;
                    results.successCount += dcResult.successCount;
                    results.failedCount += dcResult.failed;
                    results.errors.push(...dcResult.errors);
                    results.success.push(...dcResult.success);
                }

            } catch (err) {
                console.error(`Error processing sheet "${sheetName}":`, err.message);
                results.errors.push({sheet: sheetName, error: err.message});
            }
        }

        console.log('\n============================================');
        console.log('IMPORT COMPLETED');
        console.log(`Total Records: ${results.totalRecords}`);
        console.log(`Success: ${results.successCount}`);
        console.log(`Failed: ${results.failedCount}`);
        console.log(`Categories: ${results.categories.length}`);
        console.log(`Products: ${results.products.length}`);
        console.log(`Toppings: ${results.toppings.length}`);
        console.log(`Addons: ${results.addons.length}`);
        console.log(`Flavours: ${results.flavours.length}`);
        console.log(`Choices: ${results.choices.length}`);
        console.log(`Business Hours: ${results.businessHours.length}`);
        console.log(`Special Comments: ${results.specialComments.length}`);
        console.log(`Delivery Charges: ${results.deliveryCharges.length}`);
        console.log('============================================\n');

        return results;

    } catch (error) {
        console.error('Import error:', error);
        throw error;
    }
};

/**
 * Process Single Sheet
 */
exports.processSheet = async (workbook, sheetName, companyId, branchId) => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});

    const result = {
        category: null,
        products: [],
        sizes: [],
        toppings: [],
        addons: [],
        flavours: [],
        choices: [],
        errors: [],
        success: [],
        totalRecords: 0,
        successCount: 0,
        failedCount: 0
    };

    if (data.length < 2) {
        console.log(`  Sheet "${sheetName}" is empty`);
        return result;
    }

    // Step 1: Analyze sheet to detect sections and flags
    const sheetAnalysis = this.analyzeSheet(data);

    console.log(`  Sections found:`, Object.keys(sheetAnalysis.sections).filter(k => sheetAnalysis.sections[k].startRow >= 0));
    console.log(`  Flags: hasSizes=${sheetAnalysis.hasSizes}, hasToppings=${sheetAnalysis.hasToppings}, hasAddons=${sheetAnalysis.hasAddons}, hasFlavours=${sheetAnalysis.hasFlavours}, hasChoices=${sheetAnalysis.hasChoices}`);

    // Step 2: Insert Category with flags
    const categoryId = await this.insertCategory(companyId, 0, sheetName, sheetAnalysis);
    result.category = {id: categoryId, name: sheetName};
    console.log(`  ✅ Category "${sheetName}" -> ID: ${categoryId}`);

    // Step 3: Process Products
    if (sheetAnalysis.sections.product.startRow >= 0) {
        const productResult = await this.processProducts(data, sheetAnalysis, companyId, branchId, categoryId, sheetName);
        result.products = productResult.products;
        result.sizes.push(...productResult.sizes);
        result.totalRecords += productResult.total;
        result.successCount += productResult.successCount;
        result.failedCount += productResult.failed;
        result.errors.push(...productResult.errors);
        result.success.push(...productResult.success);
    }

    // Step 4: Process Toppings
    if (sheetAnalysis.sections.topping.startRow >= 0) {
        const toppingResult = await this.processToppings(data, sheetAnalysis, companyId, categoryId, sheetName);
        result.toppings = toppingResult.toppings;
        result.totalRecords += toppingResult.total;
        result.successCount += toppingResult.successCount;
        result.failedCount += toppingResult.failed;
        result.errors.push(...toppingResult.errors);
        result.success.push(...toppingResult.success);
    }

    // Step 5: Process Addons
    if (sheetAnalysis.sections.addon.startRow >= 0) {
        const addonResult = await this.processAddons(data, sheetAnalysis, companyId, categoryId, sheetName);
        result.addons = addonResult.addons;
        result.totalRecords += addonResult.total;
        result.successCount += addonResult.successCount;
        result.failedCount += addonResult.failed;
        result.errors.push(...addonResult.errors);
        result.success.push(...addonResult.success);
    }

    // Step 6: Process Flavours
    if (sheetAnalysis.sections.flavour.startRow >= 0) {
        const flavourResult = await this.processFlavours(data, sheetAnalysis, companyId, categoryId, sheetName);
        result.flavours = flavourResult.flavours;
        result.totalRecords += flavourResult.total;
        result.successCount += flavourResult.successCount;
        result.failedCount += flavourResult.failed;
        result.errors.push(...flavourResult.errors);
        result.success.push(...flavourResult.success);
    }

    // Step 7: Process Choices
    if (sheetAnalysis.sections.choice.startRow >= 0) {
        const choiceResult = await this.processChoices(data, sheetAnalysis, companyId, categoryId, sheetName);
        result.choices = choiceResult.choices;
        result.totalRecords += choiceResult.total;
        result.successCount += choiceResult.successCount;
        result.failedCount += choiceResult.failed;
        result.errors.push(...choiceResult.errors);
        result.success.push(...choiceResult.success);
    }

    return result;
};

/**
 * Analyze sheet to find sections and detect flags
 */
exports.analyzeSheet = (data) => {
    const analysis = {
        hasSizes: false,
        hasToppings: false,
        hasAddons: false,
        hasFlavours: false,
        hasChoices: false,
        hasHalfAndHalf: false,
        sections: {
            product: {startRow: -1, endRow: -1, headerRow: -1, sizeColumns: {}},
            topping: {startRow: -1, endRow: -1, headerRow: -1, sizeColumns: {}},
            addon: {startRow: -1, endRow: -1, headerRow: -1},
            flavour: {startRow: -1, endRow: -1, headerRow: -1},
            choice: {startRow: -1, endRow: -1, headerRow: -1}
        }
    };

    const sectionKeywords = {
        product: ['product', 'products'],
        topping: ['topping', 'toppings', 'extra toppings', 'extra topping'],
        addon: ['add ons', 'add-ons', 'addons', 'addon', 'add on'],
        flavour: ['flavour', 'flavours', 'flavor', 'flavors', 'flavour choice', 'flavor choice', 'product flavours'],
        choice: ['choice', 'choices']
    };

    let currentSection = null;
    let sectionOrder = [];

    // Find all section start rows
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const firstCell = String(row[0] || '').trim().toLowerCase();

        // Check for section headers
        for (const [section, keywords] of Object.entries(sectionKeywords)) {
            if (keywords.includes(firstCell)) {
                analysis.sections[section].startRow = i;
                analysis.sections[section].headerRow = i + 1; // Next row is column header
                sectionOrder.push({section, startRow: i});

                // Set flags
                if (section === 'topping') analysis.hasToppings = true;
                if (section === 'addon') analysis.hasAddons = true;
                if (section === 'flavour') analysis.hasFlavours = true;
                if (section === 'choice') analysis.hasChoices = true;

                break;
            }
        }

        // Check for half and half
        if (firstCell.includes('half') && firstCell.includes('half')) {
            analysis.hasHalfAndHalf = true;
        }
    }

    // If no "Product" section header found, assume products start at row 0
    if (analysis.sections.product.startRow === -1) {
        analysis.sections.product.startRow = 0;
        analysis.sections.product.headerRow = 1;
    }

    // Calculate end rows for each section
    sectionOrder.sort((a, b) => a.startRow - b.startRow);

    for (let i = 0; i < sectionOrder.length; i++) {
        const current = sectionOrder[i];
        const next = sectionOrder[i + 1];

        if (next) {
            analysis.sections[current.section].endRow = next.startRow - 1;
        } else {
            analysis.sections[current.section].endRow = data.length - 1;
        }
    }

    // If product section exists but no explicit end, end at first other section
    if (analysis.sections.product.startRow >= 0 && analysis.sections.product.endRow === -1) {
        const firstOtherSection = Math.min(
            ...[analysis.sections.topping.startRow, analysis.sections.addon.startRow,
                analysis.sections.flavour.startRow, analysis.sections.choice.startRow]
                .filter(r => r >= 0)
        );

        if (firstOtherSection < Infinity) {
            analysis.sections.product.endRow = firstOtherSection - 1;
        } else {
            analysis.sections.product.endRow = data.length - 1;
        }
    }

    // Detect sizes from product header row
    if (analysis.sections.product.headerRow >= 0 && analysis.sections.product.headerRow < data.length) {
        const headerRow = data[analysis.sections.product.headerRow];
        analysis.sections.product.sizeColumns = this.detectSizeColumns(headerRow);
        if (Object.keys(analysis.sections.product.sizeColumns).length > 0) {
            analysis.hasSizes = true;
        }
    }

    // Detect sizes from topping header row
    if (analysis.sections.topping.headerRow >= 0 && analysis.sections.topping.headerRow < data.length) {
        const headerRow = data[analysis.sections.topping.headerRow];
        analysis.sections.topping.sizeColumns = this.detectSizeColumns(headerRow);
    }

    return analysis;
};

/**
 * Detect size columns from header row
 */
exports.detectSizeColumns = (headerRow) => {
    const sizeColumns = {};
    const sizePatterns = {
        '10': ['10', '10"', "10''", '10 inch', '10"', '10\'\''],
        '12': ['12', '12"', "12''", '12 inch', '12"', '12\'\''],
        '16': ['16', '16"', "16''", '16 inch', '16"', '16\'\''],
        'SM': ['small', 'sm', 's'],
        'REG': ['regular', 'reg', 'r'],
        'LG': ['large', 'lg', 'l'],
        'KG': ['king', 'king size', 'kg'],
        'QP': ['quarter', 'quarter pounder', 'qp', '1/4'],
        'HP': ['half', 'half pounder', 'hp', '1/2']
    };

    for (let i = 0; i < headerRow.length; i++) {
        const cell = String(headerRow[i] || '').trim().toLowerCase().replace(/['"]/g, '');

        if (!cell || cell === 'items' || cell === 'description' || cell === 'charges') continue;

        for (const [sizeCode, patterns] of Object.entries(sizePatterns)) {
            if (patterns.some(p => cell === p || cell.includes(p))) {
                sizeColumns[i] = sizeCode;
                break;
            }
        }

        // Check if it's "Charges" column (single price)
        if (cell === 'charges' || cell === 'price') {
            sizeColumns[i] = 'SINGLE';
        }
    }

    return sizeColumns;
};

/**
 * Delete record by company
 */
exports.recordDestroy = async (companyId) => {
    try {
        const tables = [
            "choices",
            "category_choice_groups",
            "choice_groups",
            "category_flavour_prices",
            "category_flavours",
            "flavours",
            "addons",
            "category_addon_groups",
            "addon_groups",
            "category_topping_prices",
            "category_toppings",
            "toppings",
            "product_prices",
            "products",
            "category_sizes",
            "sizes",
            "categories",
            "business_hours",
            "special_comments",
            "delivery_charges",
        ];

        for (const table of tables) {
            await sequelize.query(
                `DELETE
                 FROM ${table}
                 WHERE company_id = :company_id`,
                {
                    replacements: {company_id: companyId},
                    type: QueryTypes.DELETE
                }
            );
        }

        return true;

    } catch (error) {
        console.error(`Record delete : "${companyId}":`, error.message);
        throw error;
    }
};

/**
 * Insert Category with flags
 */
exports.insertCategory = async (companyId, branchId, categoryName, analysis) => {
    try {
        await sequelize.query(
            `INSERT INTO categories (company_id, category_name, has_sizes, has_toppings, has_addons,
                                     has_flavours, has_choices, has_half_and_half, display_order, is_active, created_at,
                                     updated_at)
             VALUES (:company_id, :name, :has_sizes, :has_toppings, :has_addons,
                     :has_flavours, :has_choices, :has_half_and_half, 0, 1, NOW(), NOW())`,
            {
                replacements: {
                    company_id: companyId,
                    name: categoryName,
                    has_sizes: analysis.hasSizes ? 1 : 0,
                    has_toppings: analysis.hasToppings ? 1 : 0,
                    has_addons: analysis.hasAddons ? 1 : 0,
                    has_flavours: analysis.hasFlavours ? 1 : 0,
                    has_choices: analysis.hasChoices ? 1 : 0,
                    has_half_and_half: analysis.hasHalfAndHalf ? 1 : 0
                },
                type: QueryTypes.INSERT
            }
        );

        const result = await sequelize.query(
            `SELECT category_id
             FROM categories
             WHERE company_id = :company_id
               AND category_name = :name`,
            {replacements: {company_id: companyId, name: categoryName}, type: QueryTypes.SELECT}
        );

        return result[0].category_id;

    } catch (error) {
        console.error(`Error inserting category "${categoryName}":`, error.message);
        throw error;
    }
};

/**
 * Ensure size exists in database
 */
exports.ensureSize = async (companyId, sizeCode) => {
    const sizeNames = {
        '10': '10 Inch', '12': '12 Inch', '16': '16 Inch',
        'SM': 'Small', 'REG': 'Regular', 'LG': 'Large',
        'KG': 'King Size', 'QP': 'Quarter Pounder', 'HP': 'Half Pounder',
        'SINGLE': 'Single'
    };

    try {
        // Check if exists
        let result = await sequelize.query(
            `SELECT size_id
             FROM sizes
             WHERE company_id = :company_id
               AND size_code = :code
               AND deleted_at IS NULL`,
            {replacements: {company_id: companyId, code: sizeCode}, type: QueryTypes.SELECT}
        );

        if (result && result.length > 0) {
            return result[0].size_id;
        }

        // Insert new size
        await sequelize.query(
            `INSERT INTO sizes (company_id, size_name, size_code, display_order, is_active, created_at)
             VALUES (:company_id, :name, :code, 0, 1, NOW()) ON DUPLICATE KEY
            UPDATE updated_at = NOW(), deleted_at = NULL`,
            {
                replacements: {
                    company_id: companyId,
                    name: sizeNames[sizeCode] || sizeCode,
                    code: sizeCode
                },
                type: QueryTypes.INSERT
            }
        );

        result = await sequelize.query(
            `SELECT size_id
             FROM sizes
             WHERE company_id = :company_id
               AND size_code = :code`,
            {replacements: {company_id: companyId, code: sizeCode}, type: QueryTypes.SELECT}
        );

        return result[0].size_id;

    } catch (error) {
        console.error(`Error ensuring size "${sizeCode}":`, error.message);
        return null;
    }
};

/**
 * Map size to category
 */
exports.mapSizeToCategory = async (companyId, categoryId, sizeId) => {
    try {
        await sequelize.query(
            `INSERT
            IGNORE INTO category_sizes (company_id, category_id, size_id, display_order, is_active, created_at)
             VALUES (:company_id, :category_id, :size_id, 0, 1, NOW())`,
            {
                replacements: {company_id: companyId, category_id: categoryId, size_id: sizeId},
                type: QueryTypes.INSERT
            }
        );
    } catch (error) {
        console.error(`Error mapping size to category:`, error.message);
    }
};

/**
 * Process Products Section
 */
exports.processProducts = async (data, analysis, companyId, branchId, categoryId, sheetName) => {
    const result = {products: [], sizes: [], total: 0, successCount: 0, failed: 0, errors: [], success: []};
    const section = analysis.sections.product;

    if (section.startRow < 0) return result;

    console.log(`  Processing Products (rows ${section.headerRow + 1} to ${section.endRow})`);

    // Ensure sizes exist and map to category
    const sizeIdMap = {};
    for (const [colIndex, sizeCode] of Object.entries(section.sizeColumns)) {
        if (sizeCode !== 'SINGLE') {
            const sizeId = await this.ensureSize(companyId, sizeCode);
            if (sizeId) {
                sizeIdMap[colIndex] = sizeId;
                await this.mapSizeToCategory(companyId, categoryId, sizeId);
                result.sizes.push({code: sizeCode, id: sizeId});
            }
        }
    }

    // Process product rows (start after header row)
    const dataStartRow = section.headerRow + 1;

    for (let i = dataStartRow; i <= section.endRow; i++) {
        const row = data[i];
        const itemName = String(row[0] || '').trim();

        // Skip empty rows or header-like rows
        if (!itemName || itemName.toLowerCase() === 'items') {
            continue;
        }

        result.total++;

        try {
            const productId = await this.insertProduct(companyId, categoryId, row, section.sizeColumns, sizeIdMap);
            result.successCount++;
            result.products.push({id: productId, name: itemName});
            result.success.push({sheet: sheetName, row: i, type: 'Product', name: itemName});
            console.log(`    ✅ Product: "${itemName}" -> ID: ${productId}`);

        } catch (err) {
            result.failed++;
            result.errors.push({sheet: sheetName, row: i, type: 'Product', name: itemName, error: err.message});
            console.log(`    ❌ Product: "${itemName}" -> Error: ${err.message}`);
        }
    }

    console.log(`  Products: ${result.successCount} success, ${result.failed} failed`);
    return result;
};

/**
 * Insert Product with prices
 */
exports.insertProduct = async (companyId, categoryId, row, sizeColumns, sizeIdMap) => {
    const productName = String(row[0] || '').trim();
    const description = row[1] ? String(row[1]).trim() : null;

    // Insert or get product
    await sequelize.query(
        `INSERT INTO products (company_id, category_id, product_name, description, display_order, is_active, created_at)
         VALUES (:company_id, :category_id, :name, :description, 0, 1, NOW()) ON DUPLICATE KEY
        UPDATE description = :description, updated_at = NOW(), deleted_at = NULL`,
        {
            replacements: {company_id: companyId, category_id: categoryId, name: productName, description: description},
            type: QueryTypes.INSERT
        }
    );

    const productResult = await sequelize.query(
        `SELECT product_id
         FROM products
         WHERE company_id = :company_id
           AND category_id = :category_id
           AND product_name = :name`,
        {replacements: {company_id: companyId, category_id: categoryId, name: productName}, type: QueryTypes.SELECT}
    );

    const productId = productResult[0].product_id;

    // Insert prices
    for (const [colIndex, sizeCode] of Object.entries(sizeColumns)) {
        const priceVal = row[colIndex];
        if (priceVal === undefined || priceVal === '' || priceVal === null) continue;

        const price = parseFloat(priceVal);
        if (isNaN(price)) continue;

        if (sizeCode === 'SINGLE') {
            // Update base_price in products table
            await sequelize.query(
                `UPDATE products
                 SET base_price = :price
                 WHERE product_id = :product_id`,
                {replacements: {price: price, product_id: productId}, type: QueryTypes.UPDATE}
            );
        } else {
            // Insert size-wise price
            const sizeId = sizeIdMap[colIndex];
            if (sizeId) {
                await sequelize.query(
                    `INSERT INTO product_prices (company_id, product_id, size_id, price, is_active, created_at)
                     VALUES (:company_id, :product_id, :size_id, :price, 1, NOW()) ON DUPLICATE KEY
                    UPDATE price = :price, updated_at = NOW()`,
                    {
                        replacements: {company_id: companyId, product_id: productId, size_id: sizeId, price: price},
                        type: QueryTypes.INSERT
                    }
                );
            }
        }
    }

    return productId;
};

/**
 * Process Toppings Section
 */
exports.processToppings = async (data, analysis, companyId, categoryId, sheetName) => {
    const result = {toppings: [], total: 0, successCount: 0, failed: 0, errors: [], success: []};
    const section = analysis.sections.topping;

    if (section.startRow < 0) return result;

    console.log(`  Processing Toppings (rows ${section.headerRow + 1} to ${section.endRow})`);

    // Get size columns from topping header
    const sizeIdMap = {};
    for (const [colIndex, sizeCode] of Object.entries(section.sizeColumns)) {
        if (sizeCode !== 'SINGLE') {
            const sizeId = await this.ensureSize(companyId, sizeCode);
            if (sizeId) {
                sizeIdMap[colIndex] = sizeId;
            }
        }
    }

    // Process topping rows
    const dataStartRow = section.headerRow + 1;

    for (let i = dataStartRow; i <= section.endRow; i++) {
        const row = data[i];
        const itemName = String(row[0] || '').trim();

        if (!itemName || itemName.toLowerCase() === 'items') {
            continue;
        }

        result.total++;

        try {
            const toppingId = await this.insertTopping(companyId, categoryId, row, section.sizeColumns, sizeIdMap);
            result.successCount++;
            result.toppings.push({id: toppingId, name: itemName});
            result.success.push({sheet: sheetName, row: i, type: 'Topping', name: itemName});
            console.log(`    ✅ Topping: "${itemName}" -> ID: ${toppingId}`);

        } catch (err) {
            result.failed++;
            result.errors.push({sheet: sheetName, row: i, type: 'Topping', name: itemName, error: err.message});
            console.log(`    ❌ Topping: "${itemName}" -> Error: ${err.message}`);
        }
    }

    console.log(`  Toppings: ${result.successCount} success, ${result.failed} failed`);
    return result;
};

/**
 * Insert Topping with category mapping and prices
 */
exports.insertTopping = async (companyId, categoryId, row, sizeColumns, sizeIdMap) => {
    const toppingName = String(row[0] || '').trim();

    // Insert or get topping (company level)
    await sequelize.query(
        `INSERT INTO toppings (company_id, topping_name, display_order, is_active, created_at)
         VALUES (:company_id, :name, 0, 1, NOW()) ON DUPLICATE KEY
        UPDATE updated_at = NOW(), deleted_at = NULL`,
        {
            replacements: {company_id: companyId, name: toppingName},
            type: QueryTypes.INSERT
        }
    );

    const toppingResult = await sequelize.query(
        `SELECT topping_id
         FROM toppings
         WHERE company_id = :company_id
           AND topping_name = :name`,
        {replacements: {company_id: companyId, name: toppingName}, type: QueryTypes.SELECT}
    );

    const toppingId = toppingResult[0].topping_id;

    // Map topping to category
    await sequelize.query(
        `INSERT INTO category_toppings (company_id, category_id, topping_id, display_order, is_active, created_at)
         VALUES (:company_id, :category_id, :topping_id, 0, 1, NOW()) ON DUPLICATE KEY
        UPDATE updated_at = NOW(), deleted_at = NULL`,
        {
            replacements: {company_id: companyId, category_id: categoryId, topping_id: toppingId},
            type: QueryTypes.INSERT
        }
    );

    // Get category_topping_id
    const catToppingResult = await sequelize.query(
        `SELECT category_topping_id
         FROM category_toppings
         WHERE company_id = :company_id
           AND category_id = :category_id
           AND topping_id = :topping_id`,
        {replacements: {company_id: companyId, category_id: categoryId, topping_id: toppingId}, type: QueryTypes.SELECT}
    );

    const categoryToppingId = catToppingResult[0].category_topping_id;

    // Insert prices
    for (const [colIndex, sizeCode] of Object.entries(sizeColumns)) {
        const priceVal = row[colIndex];
        if (priceVal === undefined || priceVal === '' || priceVal === null) continue;

        const price = parseFloat(priceVal);
        if (isNaN(price)) continue;

        if (sizeCode === 'SINGLE') {
            // Single price - insert with size_id = NULL
            await sequelize.query(
                `INSERT INTO category_topping_prices (company_id, category_topping_id, size_id, price, is_active,
                                                      created_at)
                 VALUES (:company_id, :cat_topping_id, NULL, :price, 1, NOW()) ON DUPLICATE KEY
                UPDATE price = :price, updated_at = NOW()`,
                {
                    replacements: {company_id: companyId, cat_topping_id: categoryToppingId, price: price},
                    type: QueryTypes.INSERT
                }
            );
        } else {
            const sizeId = sizeIdMap[colIndex];
            if (sizeId) {
                await sequelize.query(
                    `INSERT INTO category_topping_prices (company_id, category_topping_id, size_id, price, is_active,
                                                          created_at)
                     VALUES (:company_id, :cat_topping_id, :size_id, :price, 1, NOW()) ON DUPLICATE KEY
                    UPDATE price = :price, updated_at = NOW()`,
                    {
                        replacements: {
                            company_id: companyId,
                            cat_topping_id: categoryToppingId,
                            size_id: sizeId,
                            price: price
                        },
                        type: QueryTypes.INSERT
                    }
                );
            }
        }
    }

    return toppingId;
};

/**
 * Process Addons Section (Even-Odd Column Logic)
 */
exports.processAddons = async (data, analysis, companyId, categoryId, sheetName) => {
    const result = {addons: [], total: 0, successCount: 0, failed: 0, errors: [], success: []};
    const section = analysis.sections.addon;

    if (section.startRow < 0) return result;

    console.log(`  Processing Addons (rows ${section.startRow + 1} to ${section.endRow})`);

    // First row after "Add ons" header contains group names at even columns (0, 2, 4, 6...)
    const groupHeaderRow = section.startRow + 1;
    if (groupHeaderRow > section.endRow) return result;

    const groupRow = data[groupHeaderRow];
    const addonGroups = {};

    // Parse groups from even columns (0, 2, 4, 6...)
    for (let col = 0; col < groupRow.length; col += 2) {
        const groupName = String(groupRow[col] || '').trim();
        if (groupName && groupName.toLowerCase() !== 'items') {
            const groupId = await this.ensureAddonGroup(companyId, categoryId, groupName, sheetName);
            addonGroups[col] = {name: groupName, id: groupId};
            console.log(`    Addon Group: "${groupName}" -> ID: ${groupId}`);
        }
    }

    // Process addon rows (start after group header)
    const dataStartRow = groupHeaderRow + 1;

    for (let i = dataStartRow; i <= section.endRow; i++) {
        const row = data[i];

        // Process even-odd pairs: col 0 = name, col 1 = price, col 2 = name, col 3 = price...
        for (let col = 0; col < row.length; col += 2) {
            const addonName = String(row[col] || '').trim();
            const addonPrice = parseFloat(row[col + 1]) || 0;

            if (!addonName) continue;

            // Find which group this column belongs to
            const groupCol = col; // Group is at same column index as addon name
            const group = addonGroups[groupCol];

            if (!group) continue;

            result.total++;

            try {
                const addonId = await this.insertAddon(companyId, group.id, addonName, addonPrice);
                result.successCount++;
                result.addons.push({id: addonId, name: addonName, group: group.name, price: addonPrice});
                result.success.push({sheet: sheetName, row: i, type: 'Add on', name: addonName});
                console.log(`      ✅ Addon: "${addonName}" (${group.name}) -> ID: ${addonId}, Price: ${addonPrice}`);

            } catch (err) {
                result.failed++;
                result.errors.push({sheet: sheetName, row: i, type: 'Add on', name: addonName, error: err.message});
                console.log(`      ❌ Addon: "${addonName}" -> Error: ${err.message}`);
            }
        }
    }

    console.log(`  Addons: ${result.successCount} success, ${result.failed} failed`);
    return result;
};

/**
 * Ensure addon group exists and map to category
 */
exports.ensureAddonGroup = async (companyId, categoryId, groupName, sheetName) => {
    const groupCode = (sheetName + '_' + groupName).toUpperCase().replace(/\s+/g, '_');

    // Insert or get addon group
    await sequelize.query(
        `INSERT INTO addon_groups (company_id, group_name, group_code, is_active, created_at)
         VALUES (:company_id, :name, :code, 1, NOW()) ON DUPLICATE KEY
        UPDATE updated_at = NOW(), deleted_at = NULL`,
        {
            replacements: {company_id: companyId, name: groupName, code: groupCode},
            type: QueryTypes.INSERT
        }
    );

    const groupResult = await sequelize.query(
        `SELECT addon_group_id
         FROM addon_groups
         WHERE company_id = :company_id
           AND group_code = :code`,
        {replacements: {company_id: companyId, code: groupCode}, type: QueryTypes.SELECT}
    );

    const groupId = groupResult[0].addon_group_id;

    // Map to category
    await sequelize.query(
        `INSERT INTO category_addon_groups (company_id, category_id, addon_group_id, display_order, is_active,
                                            created_at)
         VALUES (:company_id, :category_id, :addon_group_id, 0, 1, NOW()) ON DUPLICATE KEY
        UPDATE updated_at = NOW(), deleted_at = NULL`,
        {
            replacements: {company_id: companyId, category_id: categoryId, addon_group_id: groupId},
            type: QueryTypes.INSERT
        }
    );

    return groupId;
};

/**
 * Insert Addon
 */
exports.insertAddon = async (companyId, addonGroupId, addonName, price) => {
    await sequelize.query(
        `INSERT INTO addons (company_id, addon_group_id, addon_name, default_price, display_order, is_active,
                             created_at)
         VALUES (:company_id, :addon_group_id, :name, :price, 0, 1, NOW()) ON DUPLICATE KEY
        UPDATE default_price = :price, updated_at = NOW(), deleted_at = NULL`,
        {
            replacements: {company_id: companyId, addon_group_id: addonGroupId, name: addonName, price: price},
            type: QueryTypes.INSERT
        }
    );

    const result = await sequelize.query(
        `SELECT addon_id
         FROM addons
         WHERE company_id = :company_id
           AND addon_group_id = :addon_group_id
           AND addon_name = :name`,
        {replacements: {company_id: companyId, addon_group_id: addonGroupId, name: addonName}, type: QueryTypes.SELECT}
    );

    return result[0].addon_id;
};

/**
 * Process Flavours Section
 */
exports.processFlavours = async (data, analysis, companyId, categoryId, sheetName) => {
    const result = {flavours: [], total: 0, successCount: 0, failed: 0, errors: [], success: []};
    const section = analysis.sections.flavour;

    if (section.startRow < 0) return result;

    console.log(`  Processing Flavours (rows ${section.headerRow + 1} to ${section.endRow})`);

    const dataStartRow = section.headerRow + 1;

    for (let i = dataStartRow; i <= section.endRow; i++) {
        const row = data[i];
        const flavourName = String(row[0] || '').trim();

        if (!flavourName || flavourName.toLowerCase() === 'items') {
            continue;
        }

        const price = parseFloat(row[1]) || 0;
        result.total++;

        try {
            const flavourId = await this.insertFlavour(companyId, categoryId, flavourName, price);
            result.successCount++;
            result.flavours.push({id: flavourId, name: flavourName, price: price});
            result.success.push({sheet: sheetName, row: i, type: 'Flavour', name: flavourName});
            console.log(`    ✅ Flavour: "${flavourName}" -> ID: ${flavourId}, Price: ${price}`);

        } catch (err) {
            result.failed++;
            result.errors.push({sheet: sheetName, row: i, type: 'Flavour', name: flavourName, error: err.message});
            console.log(`    ❌ Flavour: "${flavourName}" -> Error: ${err.message}`);
        }
    }

    console.log(`  Flavours: ${result.successCount} success, ${result.failed} failed`);
    return result;
};

/**
 * Insert Flavour with category mapping
 */
exports.insertFlavour = async (companyId, categoryId, flavourName, price) => {
    // Insert or get flavour (company level)
    await sequelize.query(
        `INSERT INTO flavours (company_id, flavour_name, default_price, display_order, is_active, created_at)
         VALUES (:company_id, :name, :price, 0, 1, NOW()) ON DUPLICATE KEY
        UPDATE default_price = :price, updated_at = NOW(), deleted_at = NULL`,
        {
            replacements: {company_id: companyId, name: flavourName, price: price},
            type: QueryTypes.INSERT
        }
    );

    const flavourResult = await sequelize.query(
        `SELECT flavour_id
         FROM flavours
         WHERE company_id = :company_id
           AND flavour_name = :name`,
        {replacements: {company_id: companyId, name: flavourName}, type: QueryTypes.SELECT}
    );

    const flavourId = flavourResult[0].flavour_id;

    // Map to category
    await sequelize.query(
        `INSERT INTO category_flavours (company_id, category_id, flavour_id, display_order, is_active, created_at)
         VALUES (:company_id, :category_id, :flavour_id, 0, 1, NOW()) ON DUPLICATE KEY
        UPDATE updated_at = NOW(), deleted_at = NULL`,
        {
            replacements: {company_id: companyId, category_id: categoryId, flavour_id: flavourId},
            type: QueryTypes.INSERT
        }
    );

    // Get category_flavour_id and insert price
    const catFlavourResult = await sequelize.query(
        `SELECT category_flavour_id
         FROM category_flavours
         WHERE company_id = :company_id
           AND category_id = :category_id
           AND flavour_id = :flavour_id`,
        {replacements: {company_id: companyId, category_id: categoryId, flavour_id: flavourId}, type: QueryTypes.SELECT}
    );

    const categoryFlavourId = catFlavourResult[0].category_flavour_id;

    await sequelize.query(
        `INSERT INTO category_flavour_prices (company_id, category_flavour_id, size_id, price, is_active, created_at)
         VALUES (:company_id, :cat_flavour_id, NULL, :price, 1, NOW()) ON DUPLICATE KEY
        UPDATE price = :price, updated_at = NOW()`,
        {
            replacements: {company_id: companyId, cat_flavour_id: categoryFlavourId, price: price},
            type: QueryTypes.INSERT
        }
    );

    return flavourId;
};

/**
 * Process Choices Section (Even-Odd Column Logic - Same as Addons)
 */
exports.processChoices = async (data, analysis, companyId, categoryId, sheetName) => {
    const result = {choices: [], total: 0, successCount: 0, failed: 0, errors: [], success: []};
    const section = analysis.sections.choice;

    if (section.startRow < 0) return result;

    console.log(`  Processing Choices (rows ${section.startRow + 1} to ${section.endRow})`);

    // First row after "Choice" header contains group names at even columns
    const groupHeaderRow = section.startRow + 1;
    if (groupHeaderRow > section.endRow) return result;

    const groupRow = data[groupHeaderRow];
    const choiceGroups = {};

    // Parse groups from even columns (0, 2, 4, 6...)
    for (let col = 0; col < groupRow.length; col += 2) {
        const groupName = String(groupRow[col] || '').trim();
        if (groupName && groupName.toLowerCase() !== 'items' && groupName.toLowerCase() !== 'charges') {
            const groupId = await this.ensureChoiceGroup(companyId, categoryId, groupName, sheetName);
            choiceGroups[col] = {name: groupName, id: groupId};
            console.log(`    Choice Group: "${groupName}" -> ID: ${groupId}`);
        }
    }

    // Process choice rows
    const dataStartRow = groupHeaderRow + 1;

    for (let i = dataStartRow; i <= section.endRow; i++) {
        const row = data[i];

        // Process even-odd pairs
        for (let col = 0; col < row.length; col += 2) {
            const choiceName = String(row[col] || '').trim();
            const choicePrice = parseFloat(row[col + 1]) || 0;

            if (!choiceName) continue;

            const group = choiceGroups[col];
            if (!group) continue;

            result.total++;

            try {
                const choiceId = await this.insertChoice(companyId, group.id, choiceName, choicePrice);
                result.successCount++;
                result.choices.push({id: choiceId, name: choiceName, group: group.name, price: choicePrice});
                result.success.push({sheet: sheetName, row: i, type: 'Choice', name: choiceName});
                console.log(`      ✅ Choice: "${choiceName}" (${group.name}) -> ID: ${choiceId}, Price: ${choicePrice}`);

            } catch (err) {
                result.failed++;
                result.errors.push({sheet: sheetName, row: i, type: 'Choice', name: choiceName, error: err.message});
                console.log(`      ❌ Choice: "${choiceName}" -> Error: ${err.message}`);
            }
        }
    }

    console.log(`  Choices: ${result.successCount} success, ${result.failed} failed`);
    return result;
};

/**
 * Ensure choice group exists and map to category
 */
exports.ensureChoiceGroup = async (companyId, categoryId, groupName, sheetName) => {
    const groupCode = (sheetName + '_' + groupName).toUpperCase().replace(/\s+/g, '_');

    await sequelize.query(
        `INSERT INTO choice_groups (company_id, group_name, group_code, is_active, created_at)
         VALUES (:company_id, :name, :code, 1, NOW()) ON DUPLICATE KEY
        UPDATE updated_at = NOW(), deleted_at = NULL`,
        {
            replacements: {company_id: companyId, name: groupName, code: groupCode},
            type: QueryTypes.INSERT
        }
    );

    const groupResult = await sequelize.query(
        `SELECT choice_group_id
         FROM choice_groups
         WHERE company_id = :company_id
           AND group_code = :code`,
        {replacements: {company_id: companyId, code: groupCode}, type: QueryTypes.SELECT}
    );

    const groupId = groupResult[0].choice_group_id;

    // Map to category
    await sequelize.query(
        `INSERT INTO category_choice_groups (company_id, category_id, choice_group_id, display_order, is_active,
                                             created_at)
         VALUES (:company_id, :category_id, :choice_group_id, 0, 1, NOW()) ON DUPLICATE KEY
        UPDATE updated_at = NOW(), deleted_at = NULL`,
        {
            replacements: {company_id: companyId, category_id: categoryId, choice_group_id: groupId},
            type: QueryTypes.INSERT
        }
    );

    return groupId;
};

/**
 * Insert Choice
 */
exports.insertChoice = async (companyId, choiceGroupId, choiceName, price) => {
    await sequelize.query(
        `INSERT INTO choices (company_id, choice_group_id, choice_name, default_price, display_order, is_active,
                              created_at)
         VALUES (:company_id, :choice_group_id, :name, :price, 0, 1, NOW()) ON DUPLICATE KEY
        UPDATE default_price = :price, updated_at = NOW(), deleted_at = NULL`,
        {
            replacements: {company_id: companyId, choice_group_id: choiceGroupId, name: choiceName, price: price},
            type: QueryTypes.INSERT
        }
    );

    const result = await sequelize.query(
        `SELECT choice_id
         FROM choices
         WHERE company_id = :company_id
           AND choice_group_id = :choice_group_id
           AND choice_name = :name`,
        {
            replacements: {company_id: companyId, choice_group_id: choiceGroupId, name: choiceName},
            type: QueryTypes.SELECT
        }
    );

    return result[0].choice_id;
};

/**
 * Get import logs
 */
exports.getImportLogs = async ({company_id, branch_id, page = 1, limit = 10}) => {
    // Keep existing implementation
    return {data: [], pagination: {total: 0, page: 1, limit: 10, totalPages: 0}};
};

/**
 * Get import details
 */
exports.getImportDetails = async (importId, status = null) => {
    return [];
};

/**
 * Process Business Hours Sheet
 * Columns: Day | Service | Time
 */
exports.processBusinessHoursSheet = async (workbook, sheetName, companyId) => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});
    const result = {records: [], total: 0, successCount: 0, failed: 0, errors: [], success: []};

    console.log(`  Processing Business Hours Sheet: "${sheetName}"`);

    if (data.length < 2) return result;

    // Row 0 = header (Day, Service, Time), data starts from row 1
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const day = String(row[0] || '').trim();
        const service = String(row[1] || '').trim();
        const time = String(row[2] || '').trim();
        const delivery_time = String(row[3] || '').trim();

        if (!day) continue;

        result.total++;

        try {
            await sequelize.query(
                `INSERT INTO business_hours (company_id, day, service, time, delivery_time,created_at)
                 VALUES (:company_id, :day, :service, :time,:delivery_time, NOW())
                 ON DUPLICATE KEY UPDATE time = :time, service = :service, updated_at = NOW(), deleted_at = NULL`,
                {
                    replacements: {company_id: companyId, day, service, time,delivery_time},
                    type: QueryTypes.INSERT
                }
            );

            result.successCount++;
            result.records.push({day, service, time});
            result.success.push({sheet: sheetName, row: i, type: 'Business Hour', name: `${day} - ${service}`});
            console.log(`    ✅ Business Hour: "${day} - ${service}" -> ${time}`);

        } catch (err) {
            result.failed++;
            result.errors.push({sheet: sheetName, row: i, type: 'Business Hour', name: `${day} - ${service}`, error: err.message});
            console.log(`    ❌ Business Hour: "${day} - ${service}" -> Error: ${err.message}`);
        }
    }

    console.log(`  Business Hours: ${result.successCount} success, ${result.failed} failed`);
    return result;
};

/**
 * Process Special Comments Sheet
 * Columns: Title | Description
 */
exports.processSpecialCommentsSheet = async (workbook, sheetName, companyId) => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});
    const result = {records: [], total: 0, successCount: 0, failed: 0, errors: [], success: []};

    console.log(`  Processing Special Comments Sheet: "${sheetName}"`);

    if (data.length < 2) return result;

    // Row 0 = header (Title, Description), data starts from row 1
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const title = String(row[0] || '').trim();
        const description = String(row[1] || '').trim();

        if (!title) continue;

        result.total++;

        try {
            await sequelize.query(
                `INSERT INTO special_comments (company_id, title, description, created_at)
                 VALUES (:company_id, :title, :description, NOW())
                 ON DUPLICATE KEY UPDATE description = :description, updated_at = NOW(), deleted_at = NULL`,
                {
                    replacements: {company_id: companyId, title, description},
                    type: QueryTypes.INSERT
                }
            );

            result.successCount++;
            result.records.push({title, description});
            result.success.push({sheet: sheetName, row: i, type: 'Special Comment', name: title});
            console.log(`    ✅ Special Comment: "${title}"`);

        } catch (err) {
            result.failed++;
            result.errors.push({sheet: sheetName, row: i, type: 'Special Comment', name: title, error: err.message});
            console.log(`    ❌ Special Comment: "${title}" -> Error: ${err.message}`);
        }
    }

    console.log(`  Special Comments: ${result.successCount} success, ${result.failed} failed`);
    return result;
};

/**
 * Process Delivery Charges Sheet
 * Columns: PostCode | Status | Minimum Order | Charge | Driver Fee | Free Delivery Above | Distance Limit
 */
exports.processDeliveryChargesSheet = async (workbook, sheetName, companyId) => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ''});
    const result = {records: [], total: 0, successCount: 0, failed: 0, errors: [], success: []};

    console.log(`  Processing Delivery Charges Sheet: "${sheetName}"`);

    if (data.length < 2) return result;

    // Row 0 = header, data starts from row 1
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const postcode = String(row[0] || '').trim();
        const statusRaw = String(row[1] || '').trim().toLowerCase();

        if (!postcode) continue;

        result.total++;

        try {
            const status = statusRaw === 'exclude' ? 'exclude' : 'include';
            let minimum_order = null;
            let charge = null;
            let driver_fee = null;
            let free_delivery_above = null;
            let distance_limit = 0;

            // If include, parse additional columns
            if (status === 'include') {
                minimum_order = row[2] ? String(row[2]).trim() : null;
                charge = row[3] ? String(row[3]).trim() : null;
                driver_fee = row[4] ? String(row[4]).trim() : null;
                free_delivery_above = row[5] ? String(row[5]).trim() : null;

                const distanceLimitRaw = String(row[6] || '').trim().toLowerCase();
                distance_limit = (distanceLimitRaw === 'yes' || distanceLimitRaw === '1' || distanceLimitRaw === 'true') ? 1 : 0;
            }

            await sequelize.query(
                `INSERT INTO delivery_charges (company_id, postcode, status, minimum_order, charge, driver_fee, free_delivery_above, distance_limit, created_at)
                 VALUES (:company_id, :postcode, :status, :minimum_order, :charge, :driver_fee, :free_delivery_above, :distance_limit,  NOW())
                 ON DUPLICATE KEY UPDATE status = :status, minimum_order = :minimum_order, charge = :charge, 
                 driver_fee = :driver_fee, free_delivery_above = :free_delivery_above, distance_limit = :distance_limit,
                 updated_at = NOW(), deleted_at = NULL`,
                {
                    replacements: {company_id: companyId, postcode, status, minimum_order, charge, driver_fee, free_delivery_above, distance_limit},
                    type: QueryTypes.INSERT
                }
            );

            result.successCount++;
            result.records.push({postcode, status, minimum_order, charge, driver_fee, free_delivery_above, distance_limit});
            result.success.push({sheet: sheetName, row: i, type: 'Delivery Charge', name: postcode});
            console.log(`    ✅ Delivery Charge: "${postcode}" (${status})`);

        } catch (err) {
            result.failed++;
            result.errors.push({sheet: sheetName, row: i, type: 'Delivery Charge', name: postcode, error: err.message});
            console.log(`    ❌ Delivery Charge: "${postcode}" -> Error: ${err.message}`);
        }
    }

    console.log(`  Delivery Charges: ${result.successCount} success, ${result.failed} failed`);
    return result;
};