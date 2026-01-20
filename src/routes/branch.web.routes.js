const router = require('express').Router();
const controller = require('../web/branch.web');

// GET /admin/branches - branch list page
router.get('/branches', controller.listPage);

// // GET /admin/branches/add - Add company page (optional separate page)
// router.get('/branches/add', controller.addPage);
//
// // GET /admin/branches/edit/:id - Edit company page (optional separate page)
// router.get('/branches/edit/:id', controller.editPage);
//
// // GET /admin/branches/view/:id - View company details page
// router.get('/branches/view/:id', controller.viewPage);

module.exports = router;