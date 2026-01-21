const router = require('express').Router();
const controller = require('../controllers/import.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads/imports');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for Excel uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `import-${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.xlsx' || ext === '.xls') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'), false);
        }
    }
});

// POST /api/import/excel - Import Excel file
router.post('/excel', upload.single('file'), controller.importExcel);

// GET /api/import/logs - Get import logs
router.get('/logs', controller.getImportLogs);

// GET /api/import/details/:id - Get import details
router.get('/details/:id', controller.getImportDetails);

module.exports = router;