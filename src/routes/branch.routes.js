const router = require('express').Router();
const controller = require('../controllers/branch.controller');

// GET /api/branches/by-company/:companyId - Get branches by company (for dropdowns)
router.get('/by-company/:companyId', controller.getBranchesByCompany);

// GET /api/branches - List branches with pagination
router.get('/', controller.listBranches);

// GET /api/branches/:id - Get branch by ID
router.get('/:id', controller.getBranch);

// POST /api/branches - Create new branch
router.post('/', controller.createBranch);

// PUT /api/branches/:id - Update branch
router.put('/:id', controller.updateBranch);

// DELETE /api/branches/:id - Delete branch
router.delete('/:id', controller.deleteBranch);

module.exports = router;