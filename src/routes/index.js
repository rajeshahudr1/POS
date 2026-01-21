const router = require('express').Router();


// api route
router.use('/companies', require('./company.routes'));
router.use('/branches', require('./branch.routes'));
router.use('/import', require('./import.routes'));
// router.use('/sizes', require('./size.routes'));


// Add visiting card routes
// router.use('/visiting-cards', require('./visitingCard.routes'));



// // ui route
// router.use('/admin', require('../routes/size.web.routes'));
// router.use('/admin', require('../routes/admin.routes'));



module.exports = router;
