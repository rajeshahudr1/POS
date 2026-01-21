
document.addEventListener('DOMContentLoaded', () => {
    detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));

    // Company change - load branches
    document.getElementById('company_id').addEventListener('change', async (e) => {
        const companyId = e.target.value;
        const branchSelect = document.getElementById('branch_id');
        branchSelect.innerHTML = '<option value="">Select Branch</option>';
        branchSelect.disabled = true;

        if (companyId) {
            try {
                const res = await axios.get(`/api/branches/by-company/${companyId}`);
                res.data.data.forEach(b => {
                    branchSelect.innerHTML += `<option value="${b.branch_id}">${b.branch_name}</option>`;
                });
                branchSelect.disabled = false;
            } catch (err) {
                apiError(err);
            }
        }
    });

    // Import form submit
    document.getElementById('importForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await importExcel();
    });

    loadHistory();
});

async function importExcel() {
    const companyId = document.getElementById('company_id').value;
    const branchId = document.getElementById('branch_id').value;
    const fileInput = document.getElementById('file');

    if (!companyId || !branchId) {
        warningAlert('Please select Company and Branch');
        return;
    }

    if (!fileInput.files[0]) {
        warningAlert('Please select an Excel file');
        return;
    }

    const formData = new FormData();
    formData.append('company_id', companyId);
    formData.append('branch_id', branchId);
    formData.append('file', fileInput.files[0]);

    const btn = document.getElementById('importBtn');
    const spinner = document.getElementById('importSpinner');

    try {
        btn.disabled = true;
        spinner.classList.remove('d-none');

        const res = await axios.post(`${API_URL}/excel`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        showResults(res.data.data);
        successAlert('Import completed successfully');
        loadHistory();
        fileInput.value = '';

    } catch (err) {
        apiError(err);
    } finally {
        btn.disabled = false;
        spinner.classList.add('d-none');
    }
}

function showResults(data) {
    document.getElementById('resultsCard').classList.remove('d-none');

    document.getElementById('totalCount').textContent = data.totalRecords;
    document.getElementById('successCount').textContent = data.successCount;
    document.getElementById('failedCount').textContent = data.failedCount;
    document.getElementById('sheetsCount').textContent = data.sheets.length;

    const statusClass = data.failedCount === 0 ? 'bg-success' : (data.successCount === 0 ? 'bg-danger' : 'bg-warning');
    document.getElementById('resultsBadge').innerHTML = `<span class="badge ${statusClass}">${data.failedCount === 0 ? 'All Success' : `${data.failedCount} Failed`}</span>`;

    // Sheets table
    const sheetsTable = document.getElementById('sheetsTable');
    sheetsTable.innerHTML = '';
    data.sheets.forEach(s => {
        sheetsTable.innerHTML += `
            <tr>
                <td>${s.name}</td>
                <td>${s.total}</td>
                <td class="text-success">${s.success}</td>
                <td class="text-danger">${s.failed}</td>
            </tr>`;
    });

    // Load details from API
    currentImportId = data.importId;
    loadResultDetails(data.importId);
}

async function loadResultDetails(importId) {
    try {
        const res = await axios.get(`${API_URL}/details/${importId}`);
        const details = res.data.data;

        const successTable = document.getElementById('successTable');
        const failedTable = document.getElementById('failedTable');
        successTable.innerHTML = '';
        failedTable.innerHTML = '';

        details.forEach(d => {
            const row = `
                <tr>
                    <td>${d.sheet_name || '-'}</td>
                    <td>${d.row_number || '-'}</td>
                    <td><span class="badge bg-secondary">${d.record_type}</span></td>
                    <td>${d.record_name || '-'}</td>
                    ${d.status === 'failed' ? `<td class="text-danger small">${d.error_message || '-'}</td>` : ''}
                </tr>`;

            if (d.status === 'success') {
                successTable.innerHTML += row;
            } else {
                failedTable.innerHTML += row;
            }
        });

    } catch (err) {
        console.error('Error loading details:', err);
    }
}

async function loadHistory(page = 1) {
    currentPage = page;
    const companyId = document.getElementById('company_id').value || '';

    try {
        const res = await axios.get(`${API_URL}/logs`, {
            params: { company_id: companyId, page, limit: 10 }
        });

        renderHistory(res.data.data.data);
        renderPagination(res.data.data.pagination);

    } catch (err) {
        console.error('Error loading history:', err);
    }
}

function renderHistory(data) {
    const tbody = document.getElementById('historyTable');
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-3">No import history found</td></tr>';
        return;
    }

    data.forEach(row => {
        const statusBadge = {
            'completed': '<span class="badge bg-success">Completed</span>',
            'failed': '<span class="badge bg-danger">Failed</span>',
            'processing': '<span class="badge bg-warning">Processing</span>',
            'pending': '<span class="badge bg-secondary">Pending</span>'
        }[row.status] || row.status;

        tbody.innerHTML += `
            <tr>
                <td>${row.import_id}</td>
                <td>${row.company_name || '-'}</td>
                <td>${row.branch_name || '-'}</td>
                <td><small>${row.file_name}</small></td>
                <td>${row.total_records}</td>
                <td class="text-success">${row.success_count}</td>
                <td class="text-danger">${row.failed_count}</td>
                <td>${statusBadge}</td>
                <td><small>${formatDate(row.created_at)}</small></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewDetails(${row.import_id})">👁️</button>
                </td>
            </tr>`;
    });
}

function renderPagination(p) {
    const ul = document.getElementById('pagination');
    ul.innerHTML = '';
    if (!p || p.totalPages <= 1) return;

    for (let i = 1; i <= p.totalPages; i++) {
        ul.innerHTML += `<li class="page-item ${i === p.page ? 'active' : ''}"><a class="page-link" onclick="loadHistory(${i})">${i}</a></li>`;
    }
}

async function viewDetails(importId) {
    currentImportId = importId;
    await loadDetails(null);
    detailsModal.show();
}

async function loadDetails(status) {
    if (!currentImportId) return;

    try {
        const res = await axios.get(`${API_URL}/details/${currentImportId}`, {
            params: { status: status || '' }
        });

        const tbody = document.getElementById('detailsTable');
        tbody.innerHTML = '';

        res.data.data.forEach(d => {
            const statusBadge = d.status === 'success'
                ? '<span class="badge bg-success">Success</span>'
                : '<span class="badge bg-danger">Failed</span>';

            tbody.innerHTML += `
                <tr>
                    <td>${d.sheet_name || '-'}</td>
                    <td>${d.row_number || '-'}</td>
                    <td>${d.record_type || '-'}</td>
                    <td>${d.record_name || '-'}</td>
                    <td>${statusBadge}</td>
                    <td class="small text-danger">${d.error_message || '-'}</td>
                </tr>`;
        });

    } catch (err) {
        apiError(err);
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}