const router = require('express').Router();


// api route
router.use('/sizes', require('./size.routes'));


// Add visiting card routes
router.use('/visiting-cards', require('./visitingCard.routes'));



// // ui route
// router.use('/admin', require('../routes/size.web.routes'));
// router.use('/admin', require('../routes/admin.routes'));



module.exports = router;
