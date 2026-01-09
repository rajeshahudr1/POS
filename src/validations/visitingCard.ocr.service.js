// services/visitingCard.ocr.service.js

const AWS = require('aws-sdk');
const FieldMapping = require('../model/fieldMapping.model');

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    region: process.env.AWS_REGION || 'eu-west-1'
});

const textract = new AWS.Textract();

// Extract text from image using AWS Textract
exports.extractTextFromImage = async (imagePath) => {
    try {
        const fs = require('fs').promises;
        const imageBytes = await fs.readFile(imagePath);

        const params = {
            Document: { Bytes: imageBytes }
        };

        const textractResponse = await textract.detectDocumentText(params).promise();

        // Extract all text blocks
        const textBlocks = textractResponse.Blocks
            .filter(block => block.BlockType === 'LINE')
            .map(block => ({
                text: block.Text,
                confidence: block.Confidence,
                boundingBox: block.Geometry.BoundingBox
            }));

        // Combine all text
        const fullText = textBlocks.map(block => block.text).join('\n');

        return {
            fullText: fullText,
            blocks: textBlocks,
            confidence: textBlocks.length > 0
                ? textBlocks.reduce((sum, block) => sum + block.confidence, 0) / textBlocks.length
                : 0
        };
    } catch (error) {
        console.error('AWS Textract Error:', error);
        throw new Error('Failed to extract text from image: ' + error.message);
    }
};

// Auto-detect and map fields based on OCR text
exports.autoMapFields = async (ocrText) => {
    const fields = await FieldMapping.findAll({
        order: [['display_order', 'ASC']]
    });

    const mappedData = {};
    const unmappedText = [];
    const lines = ocrText.split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
        let mapped = false;
        const cleanLine = line.trim();

        for (const field of fields) {
            // Check regex pattern first
            if (field.regex_pattern) {
                const regex = new RegExp(field.regex_pattern, 'i');
                if (regex.test(cleanLine)) {
                    if (!mappedData[field.field_name]) {
                        mappedData[field.field_name] = cleanLine;
                        mapped = true;
                        break;
                    }
                }
            }

            // Check keywords
            if (field.detection_keywords && field.detection_keywords.length > 0 && !mapped) {
                const keywords = field.detection_keywords;
                const lowerLine = cleanLine.toLowerCase();

                for (const keyword of keywords) {
                    if (lowerLine.includes(keyword.toLowerCase())) {
                        if (!mappedData[field.field_name]) {
                            // Extract value after keyword
                            const value = cleanLine
                                .replace(new RegExp(keyword, 'i'), '')
                                .replace(/[:|\-]/g, '')
                                .trim();
                            if (value) {
                                mappedData[field.field_name] = value;
                                mapped = true;
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (!mapped && cleanLine) {
            unmappedText.push(cleanLine);
        }
    }

    return { mappedData, unmappedText };
};

// Extract text from buffer (for direct upload)
exports.extractTextFromBuffer = async (imageBuffer) => {
    try {
        const params = {
            Document: { Bytes: imageBuffer }
        };

        const textractResponse = await textract.detectDocumentText(params).promise();

        // Extract all text blocks
        const textBlocks = textractResponse.Blocks
            .filter(block => block.BlockType === 'LINE')
            .map(block => ({
                text: block.Text,
                confidence: block.Confidence,
                boundingBox: block.Geometry.BoundingBox
            }));

        // Combine all text
        const fullText = textBlocks.map(block => block.text).join('\n');

        return {
            fullText: fullText,
            blocks: textBlocks,
            confidence: textBlocks.length > 0
                ? textBlocks.reduce((sum, block) => sum + block.confidence, 0) / textBlocks.length
                : 0
        };
    } catch (error) {
        console.error('AWS Textract Error:', error);
        throw new Error('Failed to extract text from buffer: ' + error.message);
    }
};