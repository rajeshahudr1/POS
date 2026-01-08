const router = require('express').Router();
const controller = require('../controllers/catalog.names.controller');

router.get('/catalog/names', controller.getCatalogByNames);

module.exports = router;