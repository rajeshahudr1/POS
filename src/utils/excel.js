const XLSX = require('xlsx');

exports.exportExcel = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sizes');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};