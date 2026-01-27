const router = require('express').Router();
const controller = require('../controllers/catalog.names.controller');
const apiTokenAuth = require('../middlewares/apiToken.middleware');

// router.get('/catalog', controller.getCatalogByNames);

module.exports = router;