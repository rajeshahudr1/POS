// services/visitingCard.ocr.service.js
const config = require('../config/app.config');

const AWS = require('aws-sdk');
const Tesseract = require('tesseract.js');
const FieldMapping = require('../model/fieldMapping.model');

// Get OCR provider from environment
const OCR_PROVIDER = process.env.OCR_PROVIDER || 'local';

console.log(`🔧 OCR Provider: ${OCR_PROVIDER}`);

// Configure AWS only if using AWS provider
if (OCR_PROVIDER === 'aws') {
    AWS.config.update({
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
        region: process.env.AWS_REGION || 'eu-west-1'
    });
    console.log('✅ AWS Textract configured');
}

const textract = new AWS.Textract();

// ==================== LOCAL OCR (Tesseract) ====================

async function extractTextLocalFromImage(imagePath) {
    try {
        console.log('📄 Using Tesseract.js for local OCR...');
        console.log('Image path:', imagePath);

        const result = await Tesseract.recognize(
            imagePath,
            'eng',
            {
                logger: info => {
                    if (info.status === 'recognizing text') {
                        console.log(`Progress: ${Math.round(info.progress * 100)}%`);
                    }
                }
            }
        );

        console.log('Tesseract result received:', typeof result);

        // Check if result has data
        if (!result || !result.data) {
            console.error('Tesseract returned invalid result:', result);
            throw new Error('Invalid OCR result structure');
        }

        const { data } = result;

        console.log('Data structure:', {
            hasText: !!data.text,
            hasLines: !!data.lines,
            hasWords: !!data.words,
            confidence: data.confidence
        });

        // Extract text blocks
        let textBlocks = [];

        if (data.lines && Array.isArray(data.lines)) {
            textBlocks = data.lines.map(line => ({
                text: line.text || '',
                confidence: line.confidence || 0,
                boundingBox: line.bbox ? {
                    Left: line.bbox.x0 / (data.width || 1),
                    Top: line.bbox.y0 / (data.height || 1),
                    Width: (line.bbox.x1 - line.bbox.x0) / (data.width || 1),
                    Height: (line.bbox.y1 - line.bbox.y0) / (data.height || 1)
                } : null
            }));
        } else if (data.words && Array.isArray(data.words)) {
            // Fallback to words if lines not available
            console.log('Lines not available, using words');
            textBlocks = data.words.map(word => ({
                text: word.text || '',
                confidence: word.confidence || 0,
                boundingBox: word.bbox ? {
                    Left: word.bbox.x0 / (data.width || 1),
                    Top: word.bbox.y0 / (data.height || 1),
                    Width: (word.bbox.x1 - word.bbox.x0) / (data.width || 1),
                    Height: (word.bbox.y1 - word.bbox.y0) / (data.height || 1)
                } : null
            }));
        } else {
            console.warn('No lines or words found, using raw text');
        }

        const fullText = data.text || '';
        const confidence = data.confidence || 0;

        console.log(`✅ Tesseract extracted ${textBlocks.length} blocks with ${confidence.toFixed(2)}% confidence`);
        console.log('First 100 chars:', fullText.substring(0, 100));

        return {
            fullText: fullText,
            blocks: textBlocks,
            confidence: confidence
        };
    } catch (error) {
        console.error('Tesseract Error Details:', error);
        console.error('Error stack:', error.stack);
        throw new Error('Local OCR failed: ' + error.message);
    }
}

async function extractTextLocalFromBuffer(imageBuffer) {
    try {
        console.log('📄 Using Tesseract.js for local OCR (buffer)...');
        console.log('Buffer size:', imageBuffer.length, 'bytes');

        const result = await Tesseract.recognize(
            imageBuffer,
            'eng',
            {
                logger: info => {
                    if (info.status === 'recognizing text') {
                        console.log(`Progress: ${Math.round(info.progress * 100)}%`);
                    }
                }
            }
        );

        if (!result || !result.data) {
            throw new Error('Invalid OCR result structure');
        }

        const { data } = result;

        // Extract text blocks
        let textBlocks = [];

        if (data.lines && Array.isArray(data.lines)) {
            textBlocks = data.lines.map(line => ({
                text: line.text || '',
                confidence: line.confidence || 0,
                boundingBox: line.bbox ? {
                    Left: line.bbox.x0 / (data.width || 1),
                    Top: line.bbox.y0 / (data.height || 1),
                    Width: (line.bbox.x1 - line.bbox.x0) / (data.width || 1),
                    Height: (line.bbox.y1 - line.bbox.y0) / (data.height || 1)
                } : null
            }));
        } else if (data.words && Array.isArray(data.words)) {
            textBlocks = data.words.map(word => ({
                text: word.text || '',
                confidence: word.confidence || 0,
                boundingBox: word.bbox ? {
                    Left: word.bbox.x0 / (data.width || 1),
                    Top: word.bbox.y0 / (data.height || 1),
                    Width: (word.bbox.x1 - word.bbox.x0) / (data.width || 1),
                    Height: (word.bbox.y1 - word.bbox.y0) / (data.height || 1)
                } : null
            }));
        }

        const fullText = data.text || '';
        const confidence = data.confidence || 0;

        console.log(`✅ Tesseract extracted ${textBlocks.length} blocks with ${confidence.toFixed(2)}% confidence`);

        return {
            fullText: fullText,
            blocks: textBlocks,
            confidence: confidence
        };
    } catch (error) {
        console.error('Tesseract Buffer Error:', error);
        throw new Error('Local OCR failed: ' + error.message);
    }
}

// ==================== AWS OCR (Textract) ====================

async function extractTextAwsFromImage(imagePath) {
    try {
        const fs = require('fs').promises;

        try {
            await fs.access(imagePath);
        } catch (err) {
            throw new Error('Image file not found: ' + imagePath);
        }

        const imageBytes = await fs.readFile(imagePath);

        const params = {
            Document: { Bytes: imageBytes }
        };

        console.log('☁️ Calling AWS Textract...');
        const textractResponse = await textract.detectDocumentText(params).promise();
        console.log('✅ AWS Textract response received');

        const textBlocks = textractResponse.Blocks
            ? textractResponse.Blocks
                .filter(block => block.BlockType === 'LINE')
                .map(block => ({
                    text: block.Text || '',
                    confidence: block.Confidence || 0,
                    boundingBox: block.Geometry ? block.Geometry.BoundingBox : null
                }))
            : [];

        const fullText = textBlocks.map(block => block.text).join('\n');

        let confidence = 0;
        if (textBlocks.length > 0) {
            const totalConfidence = textBlocks.reduce((sum, block) => sum + block.confidence, 0);
            confidence = totalConfidence / textBlocks.length;
        }

        console.log(`✅ AWS Textract extracted ${textBlocks.length} text lines with ${confidence.toFixed(2)}% confidence`);

        return {
            fullText: fullText,
            blocks: textBlocks,
            confidence: confidence
        };
    } catch (error) {
        console.error('AWS Textract Error Details:', error);

        if (error.code === 'InvalidParameterException') {
            throw new Error('Invalid image format. Please upload a valid image file.');
        } else if (error.code === 'InvalidS3ObjectException') {
            throw new Error('Unable to access image file.');
        } else if (error.code === 'UnrecognizedClientException') {
            throw new Error('AWS credentials are invalid. Please check your configuration.');
        } else if (error.code === 'ProvisionedThroughputExceededException') {
            throw new Error('AWS Textract rate limit exceeded. Please try again later.');
        }

        throw new Error('AWS OCR failed: ' + error.message);
    }
}

async function extractTextAwsFromBuffer(imageBuffer) {
    try {
        if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error('Image buffer is empty');
        }

        const params = {
            Document: { Bytes: imageBuffer }
        };

        console.log('☁️ Calling AWS Textract with buffer...');
        const textractResponse = await textract.detectDocumentText(params).promise();
        console.log('✅ AWS Textract response received');

        const textBlocks = textractResponse.Blocks
            ? textractResponse.Blocks
                .filter(block => block.BlockType === 'LINE')
                .map(block => ({
                    text: block.Text || '',
                    confidence: block.Confidence || 0,
                    boundingBox: block.Geometry ? block.Geometry.BoundingBox : null
                }))
            : [];

        const fullText = textBlocks.map(block => block.text).join('\n');

        let confidence = 0;
        if (textBlocks.length > 0) {
            const totalConfidence = textBlocks.reduce((sum, block) => sum + block.confidence, 0);
            confidence = totalConfidence / textBlocks.length;
        }

        console.log(`✅ AWS Textract extracted ${textBlocks.length} text lines with ${confidence.toFixed(2)}% confidence`);

        return {
            fullText: fullText,
            blocks: textBlocks,
            confidence: confidence
        };
    } catch (error) {
        console.error('AWS Textract Buffer Error:', error);

        if (error.code === 'InvalidParameterException') {
            throw new Error('Invalid image format. Please upload a valid image file.');
        } else if (error.code === 'UnrecognizedClientException') {
            throw new Error('AWS credentials are invalid. Please check your configuration.');
        }

        throw new Error('AWS OCR failed: ' + error.message);
    }
}

// ==================== PUBLIC API (Auto-select based on provider) ====================

/**
 * Extract text from image file path
 * Automatically uses configured OCR provider (AWS or Local)
 */
exports.extractTextFromImage = async (imagePath, provider = null) => {
    const startTime = Date.now();
    const selectedProvider = provider || config.OCR_PROVIDER || 'local';

    try {
        let result;

        console.log(`🔍 Using OCR Provider: ${selectedProvider.toUpperCase()}`);

        if (selectedProvider === 'aws') {
            result = await extractTextAwsFromImage(imagePath);
        } else {
            result = await extractTextLocalFromImage(imagePath);
        }

        const duration = Date.now() - startTime;
        console.log(`⏱️ OCR completed in ${duration}ms using ${selectedProvider.toUpperCase()}`);

        // Add provider info to result
        result.provider = selectedProvider;

        return result;
    } catch (error) {
        console.error(`❌ OCR Error (${selectedProvider}):`, error.message);
        throw error;
    }
};

/**
 * Extract text from image buffer
 * Automatically uses configured OCR provider (AWS or Local)
 */
exports.extractTextFromBuffer = async (imageBuffer, provider = null) => {
    const startTime = Date.now();
    const selectedProvider = provider || config.OCR_PROVIDER || 'local';

    try {
        let result;

        console.log(`🔍 Using OCR Provider: ${selectedProvider.toUpperCase()}`);

        if (selectedProvider === 'aws') {
            result = await extractTextAwsFromBuffer(imageBuffer);
        } else {
            result = await extractTextLocalFromBuffer(imageBuffer);
        }

        const duration = Date.now() - startTime;
        console.log(`⏱️ OCR completed in ${duration}ms using ${selectedProvider.toUpperCase()}`);

        // Add provider info to result
        result.provider = selectedProvider;

        return result;
    } catch (error) {
        console.error(`❌ OCR Error (${selectedProvider}):`, error.message);
        throw error;
    }
};

/**
 * Get current OCR provider info
 */
exports.getOcrProviderInfo = () => {
    return {
        provider: OCR_PROVIDER,
        isAws: OCR_PROVIDER === 'aws',
        isLocal: OCR_PROVIDER === 'local',
        description: OCR_PROVIDER === 'aws'
            ? 'AWS Textract (Cloud-based, high accuracy)'
            : 'Tesseract.js (Local, free, good accuracy)'
    };
};

// ==================== FIELD DETECTION HELPERS ====================

const detectEmail = (text) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex);
};

const detectPhone = (text) => {
    const phoneRegex = /(?:\+91|91)?[\s-]?[6-9]\d{9}|\+?\d{1,4}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/g;
    return text.match(phoneRegex);
};

const detectWebsite = (text) => {
    const urlRegex = /(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?/g;
    return text.match(urlRegex);
};

const detectPincode = (text) => {
    const pincodeRegex = /\b\d{6}\b/g;
    return text.match(pincodeRegex);
};

const cleanPhoneNumber = (phone) => {
    return phone.replace(/^(\+91|91|0)[\s-]?/, '+91 ')
        .replace(/[^\d+\s-()]/g, '')
        .trim();
};

const detectServices = (lines) => {
    const services = [];
    const serviceKeywords = ['services', 'we offer', 'our services', 'product services'];

    let collectingServices = false;
    let serviceStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();

        if (serviceKeywords.some(keyword => line.includes(keyword))) {
            collectingServices = true;
            serviceStartIndex = i;
            continue;
        }

        if (collectingServices) {
            const cleanLine = lines[i].trim();

            if (
                cleanLine.match(/^[•●○◆▪▫■□✓✔➤➢➣►▸]/) ||
                cleanLine.match(/^[\d]+[.)]/) ||
                (cleanLine.length > 5 && cleanLine.length < 100 && !cleanLine.includes('@') && !cleanLine.match(/\d{6}/))
            ) {
                let service = cleanLine
                    .replace(/^[•●○◆▪▫■□✓✔➤➢➣►▸\d.)\s]+/, '')
                    .trim();

                if (service.length > 2) {
                    services.push(service);
                }
            } else if (i - serviceStartIndex > 15) {
                break;
            }
        }
    }

    return services;
};

// ==================== AUTO-MAPPING ====================

exports.autoMapFields = async (ocrText) => {
    try {
        const fields = await FieldMapping.findAll({
            order: [['display_order', 'ASC']]
        });

        const mappedData = {};
        const unmappedText = [];
        const lines = ocrText.split('\n').filter(line => line.trim() !== '');

        const mappedLines = new Set();

        // Detect services first
        const detectedServices = detectServices(lines);
        if (detectedServices.length > 0) {
            mappedData['services'] = JSON.stringify(detectedServices);
            console.log('✅ Detected services:', detectedServices.length);
        }

        // PHASE 1: Extract using regex patterns
        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            const emails = detectEmail(cleanLine);
            if (emails && emails.length > 0) {
                if (!mappedData['primary_email']) {
                    mappedData['primary_email'] = emails[0];
                    mappedLines.add(cleanLine);
                } else if (!mappedData['secondary_email'] && emails[0] !== mappedData['primary_email']) {
                    mappedData['secondary_email'] = emails[0];
                    mappedLines.add(cleanLine);
                }
            }

            const phones = detectPhone(cleanLine);
            if (phones && phones.length > 0) {
                for (const phone of phones) {
                    const cleaned = cleanPhoneNumber(phone);
                    if (!mappedData['primary_phone']) {
                        mappedData['primary_phone'] = cleaned;
                        mappedLines.add(cleanLine);
                    } else if (!mappedData['secondary_phone'] && cleaned !== mappedData['primary_phone']) {
                        mappedData['secondary_phone'] = cleaned;
                        mappedLines.add(cleanLine);
                    }
                }
            }

            const urls = detectWebsite(cleanLine);
            if (urls && urls.length > 0) {
                const url = urls[0].startsWith('http') ? urls[0] : 'https://' + urls[0];

                if (cleanLine.toLowerCase().includes('linkedin')) {
                    mappedData['linkedin_url'] = url;
                    mappedLines.add(cleanLine);
                } else if (cleanLine.toLowerCase().includes('facebook') || cleanLine.toLowerCase().includes('fb')) {
                    mappedData['facebook_url'] = url;
                    mappedLines.add(cleanLine);
                } else if (cleanLine.toLowerCase().includes('twitter') || cleanLine.toLowerCase().includes('x.com')) {
                    mappedData['twitter_url'] = url;
                    mappedLines.add(cleanLine);
                } else if (cleanLine.toLowerCase().includes('instagram') || cleanLine.toLowerCase().includes('insta')) {
                    mappedData['instagram_url'] = url;
                    mappedLines.add(cleanLine);
                } else if (!mappedData['website']) {
                    mappedData['website'] = url;
                    mappedLines.add(cleanLine);
                }
            }

            const pincodes = detectPincode(cleanLine);
            if (pincodes && pincodes.length > 0 && !mappedData['pincode']) {
                mappedData['pincode'] = pincodes[0];
            }

            if (!mappedData['tagline']) {
                if (
                    cleanLine.toLowerCase().includes('solution') ||
                    cleanLine.toLowerCase().includes('make things') ||
                    (cleanLine.length > 15 && cleanLine.length < 80 && !cleanLine.includes('@'))
                ) {
                    const lowerLine = cleanLine.toLowerCase();
                    if (
                        !lowerLine.includes('services') &&
                        !lowerLine.includes('address') &&
                        !lowerLine.includes('road')
                    ) {
                        mappedData['tagline'] = cleanLine;
                        mappedLines.add(cleanLine);
                    }
                }
            }
        }

        // PHASE 2: Keyword-based detection
        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine || mappedLines.has(cleanLine)) continue;

            let mapped = false;

            for (const field of fields) {
                if (mappedData[field.field_name]) continue;

                if (field.detection_keywords && field.detection_keywords.length > 0) {
                    const lowerLine = cleanLine.toLowerCase();

                    for (const keyword of field.detection_keywords) {
                        if (lowerLine.includes(keyword.toLowerCase())) {
                            let value = cleanLine;

                            if (cleanLine.includes(':')) {
                                value = cleanLine.split(':').slice(1).join(':').trim();
                            } else if (cleanLine.includes('-')) {
                                const parts = cleanLine.split('-');
                                if (parts.length === 2) {
                                    value = parts[1].trim();
                                }
                            }

                            value = value.replace(new RegExp(keyword, 'i'), '').replace(/[:|\-]/g, '').trim();

                            if (value && value.length > 1) {
                                mappedData[field.field_name] = value;
                                mappedLines.add(cleanLine);
                                mapped = true;
                                break;
                            }
                        }
                    }
                }

                if (mapped) break;
            }

            if (!mapped) {
                unmappedText.push(cleanLine);
            }
        }

        // PHASE 3: Smart guessing
        if (!mappedData['full_name'] && unmappedText.length > 0) {
            const potentialName = unmappedText[0];
            if (/^[A-Z][a-zA-Z\s\.]{2,50}$/.test(potentialName)) {
                mappedData['full_name'] = potentialName;
                unmappedText.shift();
            }
        }

        if (!mappedData['company_name'] && unmappedText.length > 0) {
            for (let i = 0; i < Math.min(3, unmappedText.length); i++) {
                const potential = unmappedText[i];
                if (potential.length > 3 && potential.length < 50) {
                    mappedData['company_name'] = potential;
                    unmappedText.splice(i, 1);
                    break;
                }
            }
        }

        if (mappedData['company_address']) {
            const addressLines = unmappedText.filter(line =>
                line.toLowerCase().includes('road') ||
                line.toLowerCase().includes('street') ||
                line.toLowerCase().includes('floor') ||
                line.toLowerCase().includes('building') ||
                line.toLowerCase().includes('complex') ||
                /\d{6}/.test(line)
            );

            if (addressLines.length > 0) {
                mappedData['company_address'] = [mappedData['company_address'], ...addressLines].join(', ');
                addressLines.forEach(line => {
                    const index = unmappedText.indexOf(line);
                    if (index > -1) unmappedText.splice(index, 1);
                });
            }
        }

        console.log(`✅ Auto-mapped ${Object.keys(mappedData).length} fields, ${unmappedText.length} lines unmapped`);

        return { mappedData, unmappedText };
    } catch (error) {
        console.error('Auto-mapping error:', error);
        throw new Error('Failed to map fields: ' + error.message);
    }
};