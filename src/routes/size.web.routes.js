const router = require('express').Router();
const controller = require('../web/size.web');

router.get('/sizes', controller.listPage);
router.post('/sizes/create', controller.create);
router.get('/sizes/delete/:id', controller.remove);

module.exports = router;
