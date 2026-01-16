// routes/visitingCard.routes.js

const router = require('express').Router();
const controller = require('../controllers/visitingCard.controller');

// OCR endpoints
router.post('/upload', controller.uploadCard);
router.post('/read-text', controller.readText); // New direct text reading endpoint

// Field mappings
router.get('/fields', controller.getFieldMappings);
router.post('/init-mappings', controller.initializeFieldMappings);

// CRUD operations
router.post('/', controller.saveCard);
router.get('/', controller.listCards);
router.get('/:id', controller.getCardById);
router.put('/:id', controller.updateCard);
router.delete('/:id', controller.deleteCard);


module.exports = router;