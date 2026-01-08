const router = require('express').Router();


const controller = require('../controllers/size.controller');

router.post('/', controller.createSize);
router.put('/:id', controller.updateSize);
router.delete('/:id', controller.deleteSize);
router.get('/', controller.listSizes);

module.exports = router;
