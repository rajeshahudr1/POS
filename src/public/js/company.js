/**
 * Company Master - Frontend JavaScript
 */




/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modals
    companyModal = new bootstrap.Modal(document.getElementById('companyModal'));
    viewModal = new bootstrap.Modal(document.getElementById('viewModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    // Search event with debounce
    const searchInput = document.getElementById('search');
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadCompanies(), 300);
        });
    }

    // Status filter change
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => loadCompanies());
    }

    // Company code uppercase
    const codeInput = document.getElementById('company_code');
    if (codeInput) {
        codeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Initial load
    loadCompanies();
});

/**
 * Load companies list
 */
async function loadCompanies(page = 1) {
    currentPage = page;
    const search = document.getElementById('search')?.value || '';
    const is_active = document.getElementById('statusFilter')?.value || '';

    try {
        showLoader();
        const res = await axios.get(API_URL, {
            params: { page, limit: 10, search, is_active }
        });

        renderTable(res.data.data.data);
        renderPagination(res.data.data.pagination);
    } catch (err) {
        apiError(err);
    } finally {
        hideLoader();
    }
}

/**
 * Render table rows
 */
function renderTable(data) {
    const tbody = document.getElementById('companyTable');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    No companies found. Click "Add New Company" to create one.
                </td>
            </tr>`;
        return;
    }

    data.forEach(row => {
        const statusBadge = row.is_active == 1 
            ? '<span class="badge bg-success">Active</span>'
            : '<span class="badge bg-secondary">Inactive</span>';

        tbody.innerHTML += `
            <tr>
                <td>${row.company_id}</td>
                <td>
                    <strong>${escapeHtml(row.company_name)}</strong>
                </td>
                <td><code>${escapeHtml(row.company_code)}</code></td>
                <td>${row.email ? escapeHtml(row.email) : '<span class="text-muted">-</span>'}</td>
                <td>${row.phone ? escapeHtml(row.phone) : '<span class="text-muted">-</span>'}</td>
                <td>${row.currency_symbol || '£'} (${row.currency_code || 'GBP'})</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick='viewCompany(${row.company_id})' title="View">
                        👁️
                    </button>
                    <button class="btn btn-sm btn-warning" onclick='editCompany(${JSON.stringify(row).replace(/'/g, "\\'")})' title="Edit">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCompany(${row.company_id}, '${escapeHtml(row.company_name)}')" title="Delete">
                        🗑️
                    </button>
                </td>
            </tr>`;
    });
}

/**
 * Render pagination
 */
function renderPagination(p) {
    const ul = document.getElementById('pagination');
    ul.innerHTML = '';

    if (p.totalPages <= 1) return;

    // Previous button
    ul.innerHTML += `
        <li class="page-item ${p.page === 1 ? 'disabled' : ''}">
            <a class="page-link" onclick="loadCompanies(${p.page - 1})">Previous</a>
        </li>`;

    // Page numbers
    for (let i = 1; i <= p.totalPages; i++) {
        if (i === 1 || i === p.totalPages || (i >= p.page - 2 && i <= p.page + 2)) {
            ul.innerHTML += `
                <li class="page-item ${i === p.page ? 'active' : ''}">
                    <a class="page-link" onclick="loadCompanies(${i})">${i}</a>
                </li>`;
        } else if (i === p.page - 3 || i === p.page + 3) {
            ul.innerHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Next button
    ul.innerHTML += `
        <li class="page-item ${p.page === p.totalPages ? 'disabled' : ''}">
            <a class="page-link" onclick="loadCompanies(${p.page + 1})">Next</a>
        </li>`;
}

/**
 * Open Add Modal
 */
function openAddModal() {
    document.getElementById('modalTitle').innerText = 'Add Company';
    document.getElementById('companyForm').reset();
    document.getElementById('company_id').value = '';
    document.getElementById('statusField').style.display = 'none';
    
    // Set defaults
    document.getElementById('currency_code').value = 'GBP';
    document.getElementById('currency_symbol').value = '£';
    document.getElementById('tax_percentage').value = '0';
    
    companyModal.show();
}

/**
 * Edit Company
 */
function editCompany(row) {
    currentCompanyData = row;
    
    document.getElementById('modalTitle').innerText = 'Edit Company';
    document.getElementById('company_id').value = row.company_id;
    document.getElementById('company_name').value = row.company_name || '';
    document.getElementById('company_code').value = row.company_code || '';
    document.getElementById('email').value = row.email || '';
    document.getElementById('phone').value = row.phone || '';
    document.getElementById('address').value = row.address || '';
    document.getElementById('currency_code').value = row.currency_code || 'GBP';
    document.getElementById('currency_symbol').value = row.currency_symbol || '£';
    document.getElementById('tax_percentage').value = row.tax_percentage || 0;
    document.getElementById('logo_url').value = row.logo_url || '';
    document.getElementById('is_active').value = row.is_active;
    document.getElementById('statusField').style.display = 'block';
    
    companyModal.show();
}

/**
 * View Company Details
 */
async function viewCompany(id) {
    try {
        showLoader();
        const res = await axios.get(`${API_URL}/${id}`);
        const company = res.data.data;
        currentCompanyData = company;

        const statusBadge = company.is_active == 1 
            ? '<span class="badge bg-success">Active</span>'
            : '<span class="badge bg-secondary">Inactive</span>';

        document.getElementById('viewContent').innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-borderless">
                        <tr>
                            <th width="140">Company ID:</th>
                            <td>${company.company_id}</td>
                        </tr>
                        <tr>
                            <th>Company Name:</th>
                            <td><strong>${escapeHtml(company.company_name)}</strong></td>
                        </tr>
                        <tr>
                            <th>Company Code:</th>
                            <td><code>${escapeHtml(company.company_code)}</code></td>
                        </tr>
                        <tr>
                            <th>Email:</th>
                            <td>${company.email ? escapeHtml(company.email) : '-'}</td>
                        </tr>
                        <tr>
                            <th>Phone:</th>
                            <td>${company.phone ? escapeHtml(company.phone) : '-'}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-borderless">
                        <tr>
                            <th width="140">Currency:</th>
                            <td>${company.currency_symbol || '£'} (${company.currency_code || 'GBP'})</td>
                        </tr>
                        <tr>
                            <th>Tax %:</th>
                            <td>${company.tax_percentage || 0}%</td>
                        </tr>
                        <tr>
                            <th>Status:</th>
                            <td>${statusBadge}</td>
                        </tr>
                        <tr>
                            <th>Created:</th>
                            <td>${formatDate(company.created_at)}</td>
                        </tr>
                        <tr>
                            <th>Updated:</th>
                            <td>${formatDate(company.updated_at)}</td>
                        </tr>
                    </table>
                </div>
            </div>
            ${company.address ? `
            <div class="mt-3">
                <strong>Address:</strong>
                <p class="mb-0">${escapeHtml(company.address)}</p>
            </div>` : ''}
        `;

        // Set up edit button
        document.getElementById('editFromViewBtn').onclick = () => {
            viewModal.hide();
            editCompany(currentCompanyData);
        };

        viewModal.show();
    } catch (err) {
        apiError(err);
    } finally {
        hideLoader();
    }
}

/**
 * Save Company (Create/Update)
 */
async function saveCompany(btn) {
    const id = document.getElementById('company_id').value;
    const name = document.getElementById('company_name').value.trim();
    const code = document.getElementById('company_code').value.trim().toUpperCase();

    // Validation
    if (!name || name.length < 2) {
        warningAlert('Company name must be at least 2 characters');
        return;
    }

    if (!code || code.length < 2) {
        warningAlert('Company code must be at least 2 characters');
        return;
    }

    const data = {
        company_name: name,
        company_code: code,
        email: document.getElementById('email').value.trim() || null,
        phone: document.getElementById('phone').value.trim() || null,
        address: document.getElementById('address').value.trim() || null,
        currency_code: document.getElementById('currency_code').value.trim() || 'GBP',
        currency_symbol: document.getElementById('currency_symbol').value.trim() || '£',
        tax_percentage: parseFloat(document.getElementById('tax_percentage').value) || 0,
        logo_url: document.getElementById('logo_url').value.trim() || null
    };

    if (id) {
        data.is_active = parseInt(document.getElementById('is_active').value);
    }

    try {
        buttonLoading(btn, true);
        let res;

        try {
            if (id) {
                const res = await axios.put(`${API_URL}/${id}`, data);
                if (res.status === 200) {
                    successAlert('Company updated successfully');
                }
            } else {
                const res = await axios.post(API_URL, data);
                if (res.status === 201 || res.status === 200) {
                    successAlert('Company created successfully');
                }
            }
        } catch (err) {
            console.log("err.response",err.response)
            errorAlert(err.response?.data?.message || 'Server error');
        }
        // if (id) {
        //     await axios.put(`${API_URL}/${id}`, data);
        //     successAlert('Company updated successfully');
        // } else {
        //     await axios.post(API_URL, data);
        //     successAlert('Company created successfully');
        // }

        companyModal.hide();
        loadCompanies(currentPage);
    } catch (err) {
        apiError(err);
    } finally {
        buttonLoading(btn, false);
    }
}

/**
 * Delete Company - Show confirmation
 */
function deleteCompany(id, name) {
    document.getElementById('deleteCompanyId').value = id;
    document.getElementById('deleteCompanyName').innerText = name;
    deleteModal.show();
}

/**
 * Confirm Delete
 */
async function deleteCompanyConfirm() {
    const id = document.getElementById('deleteCompanyId').value;

    try {
        await axios.delete(`${API_URL}/${id}`);
        successAlert('Company deleted successfully');
        deleteModal.hide();
        loadCompanies(currentPage);
    } catch (err) {
        apiError(err);
    }
}



/**
 * Reset Filters
 */
function resetFilters() {
    document.getElementById('search').value = '';
    document.getElementById('statusFilter').value = '';
    loadCompanies(1);
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Helper: Format Date
 */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
