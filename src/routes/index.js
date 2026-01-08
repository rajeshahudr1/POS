const router = require('express').Router();


// api route
router.use('/sizes', require('../routes/size.routes'));


// // ui route
// router.use('/admin', require('../routes/size.web.routes'));
// router.use('/admin', require('../routes/admin.routes'));



module.exports = router;
