// public/js/visitingCard.js

let frontImageFile = null;
let rearImageFile = null;
let cameraStream = null;
let currentCameraMode = null;
let processedData = null;
let fieldMappings = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Front image upload
    const frontBox = document.getElementById('frontUploadBox');
    const frontInput = document.getElementById('frontImageInput');

    frontBox.addEventListener('click', () => frontInput.click());
    frontInput.addEventListener('change', (e) => handleImageSelect(e, 'front'));

    // Rear image upload
    const rearBox = document.getElementById('rearUploadBox');
    const rearInput = document.getElementById('rearImageInput');

    rearBox.addEventListener('click', () => rearInput.click());
    rearInput.addEventListener('change', (e) => handleImageSelect(e, 'rear'));

    // Drag and drop for front
    frontBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        frontBox.style.borderColor = '#764ba2';
        frontBox.style.background = '#f0f2ff';
    });

    frontBox.addEventListener('dragleave', () => {
        frontBox.style.borderColor = '#667eea';
        frontBox.style.background = 'white';
    });

    frontBox.addEventListener('drop', (e) => {
        e.preventDefault();
        frontBox.style.borderColor = '#667eea';
        frontBox.style.background = 'white';

        if (e.dataTransfer.files.length > 0) {
            handleImageDrop(e.dataTransfer.files[0], 'front');
        }
    });

    // Drag and drop for rear
    rearBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        rearBox.style.borderColor = '#764ba2';
        rearBox.style.background = '#f0f2ff';
    });

    rearBox.addEventListener('dragleave', () => {
        rearBox.style.borderColor = '#667eea';
        rearBox.style.background = 'white';
    });

    rearBox.addEventListener('drop', (e) => {
        e.preventDefault();
        rearBox.style.borderColor = '#667eea';
        rearBox.style.background = 'white';

        if (e.dataTransfer.files.length > 0) {
            handleImageDrop(e.dataTransfer.files[0], 'rear');
        }
    });
});

// Handle image selection
function handleImageSelect(event, side) {
    const file = event.target.files[0];
    if (!file) return;

    handleImageDrop(file, side);
}

// Handle image drop
function handleImageDrop(file, side) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        if (side === 'front') {
            frontImageFile = file;
            document.getElementById('frontPreviewImg').src = e.target.result;
            document.getElementById('frontPreview').style.display = 'block';
            document.getElementById('frontUploadBox').style.display = 'none';
        } else {
            rearImageFile = file;
            document.getElementById('rearPreviewImg').src = e.target.result;
            document.getElementById('rearPreview').style.display = 'block';
            document.getElementById('rearUploadBox').style.display = 'none';
        }

        updateActionButtons();
    };
    reader.readAsDataURL(file);
}

// Remove front image
function removeFrontImage() {
    frontImageFile = null;
    document.getElementById('frontPreview').style.display = 'none';
    document.getElementById('frontUploadBox').style.display = 'block';
    document.getElementById('frontImageInput').value = '';
    updateActionButtons();
}

// Remove rear image
function removeRearImage() {
    rearImageFile = null;
    document.getElementById('rearPreview').style.display = 'none';
    document.getElementById('rearUploadBox').style.display = 'block';
    document.getElementById('rearImageInput').value = '';
    updateActionButtons();
}

// Update action buttons visibility
function updateActionButtons() {
    const actionButtons = document.getElementById('actionButtons');
    if (frontImageFile) {
        actionButtons.style.display = 'grid';
    } else {
        actionButtons.style.display = 'none';
    }
}

// Open camera
async function openCamera() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        video.srcObject = cameraStream;
        modal.classList.add('show');
    } catch (err) {
        console.error('Camera error:', err);
        alert('Unable to access camera. Please check permissions.');
    }
}

// Close camera
function closeCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    const modal = document.getElementById('cameraModal');
    modal.classList.remove('show');
}

// Capture photo
function capturePhoto(side) {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
        const file = new File([blob], `${side}-${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleImageDrop(file, side);
        closeCamera();
    }, 'image/jpeg', 0.9);
}

// Process card
async function processCard() {
    if (!frontImageFile) {
        alert('Please upload or capture the front image');
        return;
    }

    const loader = document.getElementById('loader');
    const actionButtons = document.getElementById('actionButtons');

    loader.classList.add('show');
    actionButtons.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('frontImage', frontImageFile);
        if (rearImageFile) {
            formData.append('rearImage', rearImageFile);
        }

        const response = await fetch('/api/visiting-cards/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            processedData = result.data;
            showViewModal();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to process card. Please try again.');
    } finally {
        loader.classList.remove('show');
        actionButtons.style.display = 'grid';
    }
}

// Show view modal
function showViewModal() {
    const modal = document.getElementById('viewModal');
    const frontTextBox = document.getElementById('frontTextBox');
    const rearTextBox = document.getElementById('rearTextBox');
    const mappedFieldsBox = document.getElementById('mappedFieldsBox');

    frontTextBox.textContent = processedData.frontOcrText || 'No text extracted';
    rearTextBox.textContent = processedData.rearOcrText || 'No text extracted';

    // Show confidence if available
    if (processedData.frontConfidence) {
        const confidence = processedData.frontConfidence.toFixed(1);
        const color = confidence > 90 ? '#10b981' : confidence > 70 ? '#f59e0b' : '#ef4444';
        frontTextBox.parentElement.querySelector('h3').innerHTML =
            `Front Side Text: <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 5px; font-size: 12px; margin-left: 5px;">${confidence}%</span>`;
    }

    // Show mapped fields
    let mappedHTML = '';
    if (Object.keys(processedData.mappedData).length > 0) {
        for (const [key, value] of Object.entries(processedData.mappedData)) {
            mappedHTML += `
                <div class="mapped-field-item">
                    <span class="field-label">${formatFieldName(key)}:</span>
                    <span class="field-value">${value}</span>
                </div>
            `;
        }
    } else {
        mappedHTML = '<p style="color: #666;">No fields auto-mapped</p>';
    }

    mappedFieldsBox.innerHTML = mappedHTML;
    modal.classList.add('show');
}

// Close view modal
function closeViewModal() {
    const modal = document.getElementById('viewModal');
    modal.classList.remove('show');
}

// Open mapping modal
async function openMappingModal() {
    const modal = document.getElementById('mappingModal');
    const modalBody = document.getElementById('mappingModalBody');

    try {
        // Fetch field mappings
        const response = await fetch('/api/visiting-cards/fields');
        const result = await response.json();

        if (!result.success) {
            alert('Failed to load field mappings');
            return;
        }

        fieldMappings = result.data;

        // Build form
        renderMappingForm();

        modal.classList.add('show');
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load mapping form');
    }
}

// Render mapping form
function renderMappingForm() {
    const modalBody = document.getElementById('mappingModalBody');

    let formHTML = '<form class="mapping-form" id="mappingForm">';

    // Add mapped fields first
    for (const field of fieldMappings) {
        const value = processedData.mappedData[field.field_name] || '';
        const inputType = field.field_type === 'textarea' ? 'textarea' : 'input';
        const inputTag = field.field_type === 'textarea'
            ? `<textarea id="field_${field.field_name}" name="${field.field_name}" placeholder="Enter ${field.field_label}">${value}</textarea>`
            : `<input type="text" id="field_${field.field_name}" name="${field.field_name}" value="${value}" placeholder="Enter ${field.field_label}">`;

        formHTML += `
            <div class="form-group">
                <label for="field_${field.field_name}">${field.field_label}</label>
                ${inputTag}
            </div>
        `;
    }

    // Add unmapped text section
    if (processedData.unmappedText && processedData.unmappedText.length > 0) {
        formHTML += `
            <div class="unmapped-section">
                <h3>Unmapped Text (${processedData.unmappedText.length})</h3>
                <p style="font-size: 13px; color: #666; margin-bottom: 10px;">
                    Assign these values to fields above:
                </p>
                <div id="unmappedList">
        `;

        for (let i = 0; i < processedData.unmappedText.length; i++) {
            const text = processedData.unmappedText[i];
            formHTML += `
                <div class="unmapped-item" id="unmapped_${i}">
                    <span class="unmapped-text">${escapeHtml(text)}</span>
                    <select id="select_${i}" onchange="assignUnmappedText(${i}, this.value, '${escapeHtml(text)}')">
                        <option value="">Select field...</option>
                        ${fieldMappings.map(f => `<option value="${f.field_name}">${f.field_label}</option>`).join('')}
                    </select>
                </div>
            `;
        }

        formHTML += `
                </div>
            </div>
        `;
    }

    // Add hidden fields for images
    formHTML += `
        <input type="hidden" name="front_image_path" value="${processedData.frontImagePath || ''}">
        <input type="hidden" name="rear_image_path" value="${processedData.rearImagePath || ''}">
        <input type="hidden" name="front_ocr_text" value="${escapeHtml(processedData.frontOcrText || '')}">
        <input type="hidden" name="rear_ocr_text" value="${escapeHtml(processedData.rearOcrText || '')}">
    `;

    formHTML += `
        <button type="button" class="btn btn-primary" onclick="saveCard()">
            💾 Save Card
        </button>
    </form>`;

    modalBody.innerHTML = formHTML;
}

// Close mapping modal
function closeMappingModal() {
    const modal = document.getElementById('mappingModal');
    modal.classList.remove('show');
}

// Assign unmapped text to field - FIXED VERSION
function assignUnmappedText(index, fieldName, text) {
    if (!fieldName) return;

    // Unescape the text
    const unescapedText = unescapeHtml(text);

    // Get the target input field
    const inputField = document.getElementById(`field_${fieldName}`);

    if (inputField) {
        // Append or set the value
        if (inputField.value && inputField.value.trim()) {
            // If field already has value, append with space
            inputField.value = inputField.value.trim() + ' ' + unescapedText;
        } else {
            // Set the value
            inputField.value = unescapedText;
        }

        // Highlight the field briefly
        inputField.style.background = '#fff3cd';
        setTimeout(() => {
            inputField.style.background = '';
        }, 1000);

        // Scroll to the field
        inputField.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Remove from unmapped list
        const unmappedItem = document.getElementById(`unmapped_${index}`);
        if (unmappedItem) {
            unmappedItem.style.transition = 'all 0.3s ease';
            unmappedItem.style.opacity = '0';
            unmappedItem.style.transform = 'translateX(-20px)';

            setTimeout(() => {
                unmappedItem.remove();

                // Update the unmapped data array
                processedData.unmappedText.splice(index, 1);

                // Update counter
                const unmappedList = document.getElementById('unmappedList');
                if (unmappedList && processedData.unmappedText.length === 0) {
                    unmappedList.parentElement.innerHTML = `
                        <div style="padding: 20px; text-align: center; color: #10b981;">
                            ✓ All text has been mapped!
                        </div>
                    `;
                } else if (unmappedList) {
                    // Update the heading with new count
                    const heading = document.querySelector('.unmapped-section h3');
                    if (heading) {
                        heading.textContent = `Unmapped Text (${processedData.unmappedText.length})`;
                    }

                    // Re-index remaining items
                    const remainingItems = unmappedList.querySelectorAll('.unmapped-item');
                    remainingItems.forEach((item, newIndex) => {
                        item.id = `unmapped_${newIndex}`;
                        const select = item.querySelector('select');
                        if (select) {
                            select.id = `select_${newIndex}`;
                            const text = item.querySelector('.unmapped-text').textContent;
                            select.setAttribute('onchange', `assignUnmappedText(${newIndex}, this.value, '${escapeHtml(text)}')`);
                        }
                    });
                }
            }, 300);
        }
    } else {
        console.error('Field not found:', fieldName);
        alert('Unable to find field: ' + fieldName);
    }
}

// Save card
async function saveCard() {
    const form = document.getElementById('mappingForm');
    const formData = new FormData(form);

    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    try {
        const response = await fetch('/api/visiting-cards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            // Show success message
            const successMsg = document.getElementById('successMessage');
            successMsg.classList.add('show');

            setTimeout(() => {
                successMsg.classList.remove('show');
            }, 3000);

            // Close modal and reset
            closeMappingModal();
            resetForm();

            // Optional: redirect to list page
            setTimeout(() => {
                window.location.href = '/admin/visiting-cards/list';
            }, 2000);
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to save card. Please try again.');
    }
}

// Reset form
function resetForm() {
    frontImageFile = null;
    rearImageFile = null;
    processedData = null;
    fieldMappings = null;

    document.getElementById('frontPreview').style.display = 'none';
    document.getElementById('rearPreview').style.display = 'none';
    document.getElementById('frontUploadBox').style.display = 'block';
    document.getElementById('rearUploadBox').style.display = 'block';
    document.getElementById('frontImageInput').value = '';
    document.getElementById('rearImageInput').value = '';
    document.getElementById('actionButtons').style.display = 'none';
}

// Utility functions
function formatFieldName(name) {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

function unescapeHtml(html) {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}