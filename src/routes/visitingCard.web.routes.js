// routes/visitingCard.web.routes.js

const router = require('express').Router();
const controller = require('../web/visitingCard.web');

router.get('/visiting-cards', controller.scannerPage);
router.get('/visiting-cards/list', controller.listPage);

module.exports = router;