const router = require('express').Router();
const controller = require('../controllers/company.controller');

// GET /api/companies/active - Get all active companies (for dropdowns) - Must be before /:id
router.get('/active', controller.getActiveCompanies);

// GET /api/companies/check-code - Check if company code exists
router.get('/check-code', controller.checkCodeExists);

// GET /api/companies - List companies with pagination
router.get('/', controller.listCompanies);

// GET /api/companies/:id - Get company by ID
router.get('/:id', controller.getCompany);

// POST /api/companies - Create new company
router.post('/', controller.createCompany);

// PUT /api/companies/:id - Update company
router.put('/:id', controller.updateCompany);

// DELETE /api/companies/:id - Delete company (soft delete)
// Use ?hard=true for permanent delete
router.delete('/:id', controller.deleteCompany);

// PATCH /api/companies/:id/toggle-status - Toggle active status
router.patch('/:id/toggle-status', controller.toggleStatus);

module.exports = router;
