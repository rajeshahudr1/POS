const router = require('express').Router();
const controller = require('../web/company.web');

const authMiddleware = require('../middlewares/auth.middleware');
router.use(authMiddleware);

// GET /admin/companies - Company list page
router.get('/companies', controller.listPage);

// GET /admin/companies/add - Add company page (optional separate page)
router.get('/companies/add', controller.addPage);

// GET /admin/companies/edit/:id - Edit company page (optional separate page)
router.get('/companies/edit/:id', controller.editPage);

// GET /admin/companies/view/:id - View company details page
router.get('/companies/view/:id', controller.viewPage);

module.exports = router;
