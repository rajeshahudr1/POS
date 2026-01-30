/**
 * Catalog Routes
 * API endpoints for retrieving complete catalog data
 */
const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalog.controller');

/**
 * @route   GET /api/catalog/:uuid
 * @desc    Get complete catalog for a company
 * @access  Protected (requires auth token in header)
 */
router.get('/:uuid', catalogController.getCatalog);

/**
 * @route   GET /api/catalog/:uuid/branch/:branchCode
 * @desc    Get catalog for a specific branch
 * @access  Protected
 */
// router.get('/:uuid/branch/:branchCode', catalogController.getCatalogByBranch);

/**
 * @route   GET /api/catalog/:uuid/category/:categoryId
 * @desc    Get data for a specific category
 * @access  Protected
 */
router.get('/:uuid/category/:categoryId', catalogController.getCatalogByCategory);

module.exports = router;
