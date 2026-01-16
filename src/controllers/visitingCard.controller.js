// controllers/visitingCard.controller.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const visitingCardService = require('../services/visitingCard.service');
const ocrService = require('../services/visitingCard.ocr.service');
const validation = require('../validations/visitingCard.validation');
const response = require('../utils/apiResponse');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            const uploadDir = path.join(__dirname, '../public/uploads/visiting_cards');
            console.log('===== FILE UPLOAD DEBUG =====');
            console.log('Attempting to save file:', file.originalname);
            console.log('Upload directory path:', uploadDir);
            console.log('Current __dirname:', __dirname);

            // Check if directory exists
            const dirExists = fs.existsSync(uploadDir);
            console.log('Directory exists before creation:', dirExists);

            if (!dirExists) {
                console.log('Directory does not exist. Creating...');

                // Create parent directories first
                const publicDir = path.join(__dirname, '../../public');
                const uploadsDir = path.join(__dirname, '../../public/uploads');

                console.log('Checking public dir:', publicDir, 'Exists:', fs.existsSync(publicDir));
                console.log('Checking uploads dir:', uploadsDir, 'Exists:', fs.existsSync(uploadsDir));

                // Create directory recursively
                fs.mkdirSync(uploadDir, { recursive: true });

                console.log('✅ Directory created successfully:', uploadDir);
                console.log('Directory exists after creation:', fs.existsSync(uploadDir));
            } else {
                console.log('✅ Directory already exists');
            }

            // Verify directory is writable
            try {
                fs.accessSync(uploadDir, fs.constants.W_OK);
                console.log('✅ Directory is writable');
            } catch (accessErr) {
                console.error('❌ Directory is NOT writable:', accessErr.message);
                return cb(new Error('Upload directory is not writable: ' + accessErr.message));
            }

            console.log('===== END DEBUG =====\n');
            cb(null, uploadDir);

        } catch (error) {
            console.error('❌ ERROR in multer destination:', error);
            console.error('Error stack:', error.stack);
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        try {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const filename = file.fieldname + '-' + uniqueSuffix + ext;

            console.log('===== FILENAME GENERATION =====');
            console.log('Original filename:', file.originalname);
            console.log('Generated filename:', filename);
            console.log('Extension:', ext);
            console.log('Field name:', file.fieldname);
            console.log('===== END FILENAME =====\n');

            cb(null, filename);

        } catch (error) {
            console.error('❌ ERROR in filename generation:', error);
            console.error('Error stack:', error.stack);
            cb(error);
        }
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|bmp|tiff/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files (JPEG, PNG, GIF, BMP, TIFF) are allowed!'));
    }
}).fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'rearImage', maxCount: 1 }
]);

// Upload and Process Card
exports.uploadCard = (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('\n❌ MULTER ERROR:', err);
            console.error('Error message:', err.message);
            return response.error(res, err.message, 400);
        }

        try {
            console.log('\n===== UPLOAD SUCCESS =====');

            const frontImage = req.files['frontImage'] ? req.files['frontImage'][0] : null;
            const rearImage = req.files['rearImage'] ? req.files['rearImage'][0] : null;

            // Get OCR provider from request body (sent from frontend)
            const ocrProvider = req.body.ocrProvider || process.env.OCR_PROVIDER || 'local';
            console.log('📌 Selected OCR Provider:', ocrProvider.toUpperCase());

            if (!frontImage) {
                console.error('❌ No front image in request');
                return response.error(res, 'Front image is required', 400);
            }

            console.log('\n----- Front Image Details -----');
            console.log('Path:', frontImage.path);
            console.log('Size:', frontImage.size, 'bytes');

            const frontExists = fs.existsSync(frontImage.path);
            console.log('Front image exists on disk:', frontExists);

            if (!frontExists) {
                console.error('❌ CRITICAL: Front image file not found');
                return response.error(res, 'Failed to save front image', 500);
            }

            console.log('\n===== STARTING OCR PROCESSING =====');
            console.log(`Processing with ${ocrProvider.toUpperCase()}...`);

            // Extract text from front image with selected provider
            const frontResult = await ocrService.extractTextFromImage(frontImage.path, ocrProvider);
            const frontOcrText = frontResult.fullText || '';
            const frontConfidence = frontResult.confidence || 0;

            console.log(`\n✅ Front image processed`);
            console.log('Provider used:', frontResult.provider || ocrProvider);
            console.log('Confidence:', frontConfidence.toFixed(2) + '%');
            console.log('Extracted text length:', frontOcrText.length, 'characters');

            // Extract text from rear image if exists
            let rearOcrText = '';
            let rearConfidence = 0;

            if (rearImage && fs.existsSync(rearImage.path)) {
                console.log('\nProcessing rear image...');
                const rearResult = await ocrService.extractTextFromImage(rearImage.path, ocrProvider);
                rearOcrText = rearResult.fullText || '';
                rearConfidence = rearResult.confidence || 0;

                console.log(`✅ Rear image processed`);
                console.log('Confidence:', rearConfidence.toFixed(2) + '%');
            }

            // Combine OCR text
            const combinedText = frontOcrText + '\n' + rearOcrText;

            // Auto-map fields
            console.log('\n===== AUTO-MAPPING FIELDS =====');
            const { mappedData, unmappedText } = await ocrService.autoMapFields(combinedText);

            console.log('Mapped fields count:', Object.keys(mappedData).length);
            console.log('Unmapped lines count:', unmappedText.length);

            // Create proper URL paths for frontend
            const frontImageUrl = '/uploads/visiting_cards/' + path.basename(frontImage.path);
            const rearImageUrl = rearImage ? '/uploads/visiting_cards/' + path.basename(rearImage.path) : null;

            console.log('\n===== SENDING RESPONSE =====');
            console.log('OCR Provider used:', ocrProvider);
            console.log('========================================\n');

            response.success(res, {
                frontImagePath: frontImageUrl,
                rearImagePath: rearImageUrl,
                frontImageFullPath: frontImage.path,
                rearImageFullPath: rearImage ? rearImage.path : null,
                frontOcrText: frontOcrText,
                rearOcrText: rearOcrText,
                frontConfidence: frontConfidence,
                rearConfidence: rearConfidence,
                mappedData: mappedData,
                unmappedText: unmappedText,
                ocrProvider: ocrProvider, // Include which provider was used
                tempId: Date.now()
            }, 'Card processed successfully');

        } catch (error) {
            console.error('\n❌ PROCESSING ERROR:', error);
            console.error('Error message:', error.message);
            return response.error(res, error.message || 'Failed to process card', 500);
        }
    });
};

// Read text from uploaded image (Direct API endpoint)
exports.readText = async (req, res, next) => {
    const uploadSingle = multer({ storage: multer.memoryStorage() }).single('file');

    uploadSingle(req, res, async function (err) {
        try {
            if (err) {
                return response.error(res, 'Upload error: ' + err.message, 400);
            }

            if (!req.file) {
                return response.error(res, 'No file uploaded', 400);
            }

            console.log('Extracting text with AWS Textract...');

            // Extract text from buffer
            const result = await ocrService.extractTextFromBuffer(req.file.buffer);

            response.success(res, {
                text: result.fullText || '',
                blocks: result.blocks || [],
                confidence: result.confidence || 0
            }, 'Text extracted successfully');

        } catch (error) {
            console.error('Read Text Error:', error);
            return response.error(res, error.message || 'Failed to extract text', 500);
        }
    });
};

// Get field mapping configuration
exports.getFieldMappings = async (req, res, next) => {
    try {
        const fields = await visitingCardService.getFieldMappings();
        response.success(res, fields);
    } catch (err) {
        next(err);
    }
};

// Save mapped data
exports.saveCard = async (req, res, next) => {
    try {
        const { error, value } = validation.createCard.validate(req.body);
        if (error) return response.error(res, error.details[0].message, 400);

        console.log('Saving card data:', value);

        const card = await visitingCardService.create(value);
        response.success(res, card, 'Visiting card saved successfully');
    } catch (err) {
        console.error('Save card error:', err);
        next(err);
    }
};

// Get all cards
exports.listCards = async (req, res, next) => {
    try {
        const { error, value } = validation.listCard.validate(req.query);
        if (error) return response.error(res, error.details[0].message, 400);

        const result = await visitingCardService.list(value);
        response.success(res, result);
    } catch (err) {
        next(err);
    }
};

// Get single card
exports.getCardById = async (req, res, next) => {
    try {
        const card = await visitingCardService.getById(req.params.id);
        response.success(res, card);
    } catch (err) {
        next(err);
    }
};

// Update card
exports.updateCard = async (req, res, next) => {
    try {
        const { error, value } = validation.updateCard.validate(req.body);
        if (error) return response.error(res, error.details[0].message, 400);

        const card = await visitingCardService.update(req.params.id, value);
        response.success(res, card, 'Visiting card updated successfully');
    } catch (err) {
        next(err);
    }
};

// Delete card
exports.deleteCard = async (req, res, next) => {
    try {
        const card = await visitingCardService.getById(req.params.id);

        // Delete image files if they exist
        if (card.front_image_path) {
            const frontPath = path.join(__dirname, '../../public', card.front_image_path);
            if (fs.existsSync(frontPath)) {
                await fsPromises.unlink(frontPath);
                console.log('Deleted front image:', frontPath);
            }
        }

        if (card.rear_image_path) {
            const rearPath = path.join(__dirname, '../../public', card.rear_image_path);
            if (fs.existsSync(rearPath)) {
                await fsPromises.unlink(rearPath);
                console.log('Deleted rear image:', rearPath);
            }
        }

        await visitingCardService.remove(req.params.id);
        response.success(res, null, 'Visiting card deleted successfully');
    } catch (err) {
        console.error('Delete card error:', err);
        next(err);
    }
};

// Initialize field mappings
exports.initializeFieldMappings = async (req, res, next) => {
    try {
        await visitingCardService.initializeFieldMappings();
        response.success(res, null, 'Field mappings initialized successfully');
    } catch (err) {
        next(err);
    }
};


// Add new endpoint to get OCR provider info
exports.getOcrProviderInfo = async (req, res) => {
    try {
        const info = ocrService.getOcrProviderInfo();
        response.success(res, info, 'OCR provider information');
    } catch (err) {
        response.error(res, 'Failed to get OCR info', 500);
    }
};

module.exports = exports;