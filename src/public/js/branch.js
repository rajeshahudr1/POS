const API_URL = '/api/branches';

let branchModal, deleteModal;
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    branchModal = new bootstrap.Modal(document.getElementById('branchModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    let searchTimeout;
    document.getElementById('search')?.addEventListener('keyup', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadBranches(), 300);
    });

    document.getElementById('companyFilter')?.addEventListener('change', () => loadBranches());
    document.getElementById('statusFilter')?.addEventListener('change', () => loadBranches());

    document.getElementById('branch_code')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    loadBranches();
});

async function loadBranches(page = 1) {
    currentPage = page;
    const search = document.getElementById('search')?.value || '';
    const company_id = document.getElementById('companyFilter')?.value || '';
    const is_active = document.getElementById('statusFilter')?.value || '';

    try {
        showLoader();
        const res = await axios.get(API_URL, {
            params: { page, limit: 10, search, company_id, is_active }
        });

        renderTable(res.data.data.data);
        renderPagination(res.data.data.pagination);
    } catch (err) {
        apiError(err);
    } finally {
        hideLoader();
    }
}

function renderTable(data) {
    const tbody = document.getElementById('branchTable');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No branches found.</td></tr>`;
        return;
    }

    data.forEach(row => {
        const statusBadge = row.is_active == 1
            ? '<span class="badge bg-success">Active</span>'
            : '<span class="badge bg-secondary">Inactive</span>';

        tbody.innerHTML += `
            <tr>
                <td>${row.branch_id}</td>
                <td><small class="text-muted">${escapeHtml(row.company_name || '')}</small></td>
                <td><strong>${escapeHtml(row.branch_name)}</strong></td>
                <td><code>${escapeHtml(row.branch_code)}</code></td>
                <td>${row.city || '-'}</td>
                <td>${row.phone || '-'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick='editBranch(${JSON.stringify(row).replace(/'/g, "\\'")})'>✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBranch(${row.branch_id}, '${escapeHtml(row.branch_name)}')">🗑️</button>
                </td>
            </tr>`;
    });
}

function renderPagination(p) {
    const ul = document.getElementById('pagination');
    ul.innerHTML = '';
    if (p.totalPages <= 1) return;

    for (let i = 1; i <= p.totalPages; i++) {
        ul.innerHTML += `<li class="page-item ${i === p.page ? 'active' : ''}"><a class="page-link" onclick="loadBranches(${i})">${i}</a></li>`;
    }
}

function openAddModal() {
    document.getElementById('modalTitle').innerText = 'Add Branch';
    document.getElementById('branchForm').reset();
    document.getElementById('branch_id').value = '';
    document.getElementById('statusField').style.display = 'none';
    branchModal.show();
}

function editBranch(row) {
    document.getElementById('modalTitle').innerText = 'Edit Branch';
    document.getElementById('branch_id').value = row.branch_id;
    document.getElementById('company_id').value = row.company_id;
    document.getElementById('branch_name').value = row.branch_name || '';
    document.getElementById('branch_code').value = row.branch_code || '';
    document.getElementById('email').value = row.email || '';
    document.getElementById('phone').value = row.phone || '';
    document.getElementById('address_line1').value = row.address_line1 || '';
    document.getElementById('address_line2').value = row.address_line2 || '';
    document.getElementById('city').value = row.city || '';
    document.getElementById('postcode').value = row.postcode || '';
    document.getElementById('opening_time').value = row.opening_time || '';
    document.getElementById('closing_time').value = row.closing_time || '';
    document.getElementById('is_active').value = row.is_active;
    document.getElementById('statusField').style.display = 'block';
    branchModal.show();
}

async function saveBranch(btn) {
    const id = document.getElementById('branch_id').value;
    const company_id = document.getElementById('company_id').value;
    const branch_name = document.getElementById('branch_name').value.trim();
    const branch_code = document.getElementById('branch_code').value.trim().toUpperCase();

    if (!company_id) {
        warningAlert('Please select a company');
        return;
    }
    if (!branch_name || branch_name.length < 2) {
        warningAlert('Branch name must be at least 2 characters');
        return;
    }
    if (!branch_code || branch_code.length < 2) {
        warningAlert('Branch code must be at least 2 characters');
        return;
    }

    const data = {
        company_id: parseInt(company_id),
        branch_name,
        branch_code,
        email: document.getElementById('email').value.trim() || null,
        phone: document.getElementById('phone').value.trim() || null,
        address_line1: document.getElementById('address_line1').value.trim() || null,
        address_line2: document.getElementById('address_line2').value.trim() || null,
        city: document.getElementById('city').value.trim() || null,
        postcode: document.getElementById('postcode').value.trim() || null,
        opening_time: document.getElementById('opening_time').value || null,
        closing_time: document.getElementById('closing_time').value || null
    };

    if (id) {
        data.is_active = parseInt(document.getElementById('is_active').value);
    }

    try {
        buttonLoading(btn, true);
        if (id) {
            await axios.put(`${API_URL}/${id}`, data);
            successAlert('Branch updated successfully');
        } else {
            await axios.post(API_URL, data);
            successAlert('Branch created successfully');
        }
        branchModal.hide();
        loadBranches(currentPage);
    } catch (err) {
        apiError(err);
    } finally {
        buttonLoading(btn, false);
    }
}

function deleteBranch(id, name) {
    document.getElementById('deleteBranchId').value = id;
    document.getElementById('deleteBranchName').innerText = name;
    deleteModal.show();
}

async function confirmDelete() {
    const id = document.getElementById('deleteBranchId').value;
    try {
        await axios.delete(`${API_URL}/${id}`);
        successAlert('Branch deleted successfully');
        deleteModal.hide();
        loadBranches(currentPage);
    } catch (err) {
        apiError(err);
    }
}

async function deleteCompanyConfirm() {
    const id = document.getElementById('deleteBranchId').value;

    try {
        await axios.delete(`${API_URL}/${id}`);
        successAlert('Branch deleted successfully');
        deleteModal.hide();
        loadBranches(currentPage);
    } catch (err) {
        apiError(err);
    }
}


function resetFilters() {
    document.getElementById('search').value = '';
    document.getElementById('companyFilter').value = '';
    document.getElementById('statusFilter').value = '';
    loadBranches(1);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}