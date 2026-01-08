const router = require('express').Router();
const multer = require('multer');
const controller = require('../controllers/size.import.controller');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/sizes/export', controller.exportSizes);
router.post('/sizes/import', upload.single('file'), controller.importSizes);

module.exports = router;