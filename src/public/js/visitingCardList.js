// public/js/visitingCardList.js

// View card details
async function viewCard(id) {
    try {
        const response = await fetch(`/api/visiting-cards/${id}`);
        const result = await response.json();

        if (!result.success) {
            alert('Failed to load card details');
            return;
        }

        const card = result.data;
        const modalBody = document.getElementById('cardDetailBody');

        let html = '';

        // Images
        if (card.front_image_path || card.rear_image_path) {
            html += '<div class="card-images">';
            if (card.front_image_path) {
                html += `<img src="${card.front_image_path}" alt="Front">`;
            }
            if (card.rear_image_path) {
                html += `<img src="${card.rear_image_path}" alt="Rear">`;
            }
            html += '</div>';
        }

        // Personal Info
        if (card.full_name || card.designation) {
            html += '<div class="detail-section"><h3>Personal Information</h3>';
            if (card.full_name) html += `<div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${card.full_name}</span></div>`;
            if (card.designation) html += `<div class="detail-row"><span class="detail-label">Designation</span><span class="detail-value">${card.designation}</span></div>`;
            html += '</div>';
        }

        // Contact Info
        html += '<div class="detail-section"><h3>Contact Information</h3>';
        if (card.primary_phone) html += `<div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value"><a href="tel:${card.primary_phone}">${card.primary_phone}</a></span></div>`;
        if (card.primary_email) html += `<div class="detail-row"><span class="detail-label">Email</span><span class="detail-value"><a href="mailto:${card.primary_email}">${card.primary_email}</a></span></div>`;
        if (card.website) html += `<div class="detail-row"><span class="detail-label">Website</span><span class="detail-value"><a href="${card.website}" target="_blank">${card.website}</a></span></div>`;
        html += '</div>';

        // Company Info
        if (card.company_name || card.company_address) {
            html += '<div class="detail-section"><h3>Company Information</h3>';
            if (card.company_name) html += `<div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${card.company_name}</span></div>`;
            if (card.company_address) html += `<div class="detail-row"><span class="detail-label">Address</span><span class="detail-value">${card.company_address}</span></div>`;
            if (card.city) html += `<div class="detail-row"><span class="detail-label">City</span><span class="detail-value">${card.city}</span></div>`;
            html += '</div>';
        }

        // Action buttons
        html += `
            <div class="action-buttons" style="margin-top: 20px;">
                <button class="btn btn-secondary" onclick="closeCardDetail()">Close</button>
            </div>
        `;

        modalBody.innerHTML = html;
        document.getElementById('cardDetailModal').classList.add('show');
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load card details');
    }
}

// Close card detail modal
function closeCardDetail() {
    document.getElementById('cardDetailModal').classList.remove('show');
}

// Edit card
function editCard(id) {
    // For now, just redirect to scanner with edit mode
    alert('Edit functionality coming soon!');
    // window.location.href = `/admin/visiting-cards?edit=${id}`;
}

// Delete card
async function deleteCard(id) {
    if (!confirm('Are you sure you want to delete this card?')) {
        return;
    }

    try {
        const response = await fetch(`/api/visiting-cards/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            // Reload page
            window.location.reload();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete card');
    }
}