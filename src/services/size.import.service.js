const XLSX = require('xlsx');
const Size = require('../model/Size');

exports.importSizes = async (fileBuffer) => {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const errors = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        if (!row.size_name || row.size_name.length < 2) {
            errors.push({ row: rowNum, error: 'Invalid size_name' });
            continue;
        }

        if (!row.size_code) {
            errors.push({ row: rowNum, error: 'size_code required' });
            continue;
        }

        try {
            await Size.upsert({
                size_id: row.size_id || undefined,
                size_name: row.size_name.trim(),
                size_code: row.size_code.trim()
            });
            successCount++;
        } catch (err) {
            errors.push({ row: rowNum, error: err.message });
        }
    }

    return { successCount, errors };
};
