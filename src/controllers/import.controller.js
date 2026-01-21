const importService = require('../services/import.service');
const response = require('../utils/apiResponse');
const path = require('path');
const fs = require('fs');

/**
 * Import Excel file
 */
/**
 * Import Excel file
 */
exports.importExcel = async (req, res, next) => {
    try {
        const { company_id, branch_id } = req.body;

        if (!company_id || !branch_id) {
            return response.error(res, 'Company and Branch are required', 400);
        }

        if (!req.file) {
            return response.error(res, 'Excel file is required', 400);
        }

        console.log('\n====================================');
        console.log('IMPORT STARTED');
        console.log(`Company ID: ${company_id}`);
        console.log(`Branch ID: ${branch_id}`);
        console.log(`File: ${req.file.originalname}`);
        console.log('====================================\n');

        const result = await importService.importExcel(
            parseInt(company_id),
            parseInt(branch_id),
            req.file.path,
            req.file.originalname
        );

        response.success(res, result, 'Import completed');

    } catch (err) {
        console.error('Import controller error:', err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(err);
    }
};

/**
 * Get import logs
 */
exports.getImportLogs = async (req, res, next) => {
    try {
        const { company_id, branch_id, page = 1, limit = 10 } = req.query;
        const result = await importService.getImportLogs({ company_id, branch_id, page, limit });
        response.success(res, result);
    } catch (err) {
        next(err);
    }
};

/**
 * Get import details
 */
exports.getImportDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        if (!id) {
            return response.error(res, 'Import ID is required', 400);
        }

        const details = await importService.getImportDetails(parseInt(id), status);
        response.success(res, details);
    } catch (err) {
        next(err);
    }
};