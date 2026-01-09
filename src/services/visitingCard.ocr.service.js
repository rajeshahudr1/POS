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

        try {
            await fs.access(imagePath);
        } catch (err) {
            throw new Error('Image file not found: ' + imagePath);
        }

        const imageBytes = await fs.readFile(imagePath);

        const params = {
            Document: { Bytes: imageBytes }
        };

        console.log('Calling AWS Textract...');
        const textractResponse = await textract.detectDocumentText(params).promise();
        console.log('AWS Textract response received');

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

        console.log(`Extracted ${textBlocks.length} text lines with ${confidence.toFixed(2)}% confidence`);

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

        throw new Error('Failed to extract text from image: ' + error.message);
    }
};

// Enhanced field detection helpers
const detectEmail = (text) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex);
};

const detectPhone = (text) => {
    // Matches Indian phone numbers and international formats
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
    // Remove common prefixes and clean
    return phone.replace(/^(\+91|91|0)[\s-]?/, '+91 ')
        .replace(/[^\d+\s-()]/g, '')
        .trim();
};

// Auto-detect and map fields with improved logic
exports.autoMapFields = async (ocrText) => {
    try {
        const fields = await FieldMapping.findAll({
            order: [['display_order', 'ASC']]
        });

        const mappedData = {};
        const unmappedText = [];
        const lines = ocrText.split('\n').filter(line => line.trim() !== '');

        // Track what's been mapped
        const mappedLines = new Set();

        // PHASE 1: Extract using regex patterns first (most reliable)
        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            // Detect emails
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

            // Detect phone numbers
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

            // Detect websites
            const urls = detectWebsite(cleanLine);
            if (urls && urls.length > 0) {
                const url = urls[0].startsWith('http') ? urls[0] : 'https://' + urls[0];

                // Check if it's a social media link
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

            // Detect pincode
            const pincodes = detectPincode(cleanLine);
            if (pincodes && pincodes.length > 0 && !mappedData['pincode']) {
                mappedData['pincode'] = pincodes[0];
                // Don't add to mappedLines as pincode is usually part of address
            }
        }

        // PHASE 2: Keyword-based detection for remaining lines
        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine || mappedLines.has(cleanLine)) continue;

            let mapped = false;

            for (const field of fields) {
                // Skip fields already mapped by regex
                if (mappedData[field.field_name]) continue;

                // Check keywords
                if (field.detection_keywords && field.detection_keywords.length > 0) {
                    const lowerLine = cleanLine.toLowerCase();

                    for (const keyword of field.detection_keywords) {
                        if (lowerLine.includes(keyword.toLowerCase())) {
                            // Extract value after keyword
                            let value = cleanLine;

                            // Try to extract value after colon or dash
                            if (cleanLine.includes(':')) {
                                value = cleanLine.split(':').slice(1).join(':').trim();
                            } else if (cleanLine.includes('-')) {
                                const parts = cleanLine.split('-');
                                if (parts.length === 2) {
                                    value = parts[1].trim();
                                }
                            }

                            // Remove keyword from value
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

        // PHASE 3: Smart guessing for name and company (first few non-mapped lines)
        if (!mappedData['full_name'] && unmappedText.length > 0) {
            // Usually the name is one of the first lines
            const potentialName = unmappedText[0];
            // Check if it looks like a name (2-4 words, capital letters)
            if (/^[A-Z][a-zA-Z\s\.]{2,50}$/.test(potentialName)) {
                mappedData['full_name'] = potentialName;
                unmappedText.shift();
            }
        }

        if (!mappedData['company_name'] && unmappedText.length > 0) {
            // Company is usually in first few lines, often all caps or mixed case
            for (let i = 0; i < Math.min(3, unmappedText.length); i++) {
                const potential = unmappedText[i];
                if (potential.length > 3 && potential.length < 50) {
                    mappedData['company_name'] = potential;
                    unmappedText.splice(i, 1);
                    break;
                }
            }
        }

        // Combine address lines if multiple address-related lines exist
        if (mappedData['company_address']) {
            const addressLines = unmappedText.filter(line =>
                line.toLowerCase().includes('road') ||
                line.toLowerCase().includes('street') ||
                line.toLowerCase().includes('floor') ||
                line.toLowerCase().includes('building') ||
                line.toLowerCase().includes('complex') ||
                /\d{6}/.test(line) // Contains pincode
            );

            if (addressLines.length > 0) {
                mappedData['company_address'] = [mappedData['company_address'], ...addressLines].join(', ');
                // Remove address lines from unmapped
                addressLines.forEach(line => {
                    const index = unmappedText.indexOf(line);
                    if (index > -1) unmappedText.splice(index, 1);
                });
            }
        }

        return { mappedData, unmappedText };
    } catch (error) {
        console.error('Auto-mapping error:', error);
        throw new Error('Failed to map fields: ' + error.message);
    }
};

// Extract text from buffer (for direct upload)
exports.extractTextFromBuffer = async (imageBuffer) => {
    try {
        if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error('Image buffer is empty');
        }

        const params = {
            Document: { Bytes: imageBuffer }
        };

        console.log('Calling AWS Textract with buffer...');
        const textractResponse = await textract.detectDocumentText(params).promise();
        console.log('AWS Textract response received');

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

        console.log(`Extracted ${textBlocks.length} text lines with ${confidence.toFixed(2)}% confidence`);

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

        throw new Error('Failed to extract text from buffer: ' + error.message);
    }
};