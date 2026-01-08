const Size = require('../model/Size');
const { exportExcel } = require('../utils/excel');
const XLSX = require('xlsx');
const importService = require('../services/size.import.service');

exports.exportSizes = async (req, res) => {
    const sizes = await Size.findAll({
        attributes: ['size_id', 'size_name', 'size_code'],
        order: [['size_id', 'ASC']]
    });

    const buffer = exportExcel(sizes.map(s => s.toJSON()));

    res.setHeader(
        'Content-Disposition',
        'attachment; filename="sizes.xlsx"'
    );
    res.type(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buffer);
};




exports.importSizes = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'File required' });
    }

    const result = await importService.importSizes(req.file.buffer);

    res.json({
        message: 'Import completed',
        ...result
    });
};