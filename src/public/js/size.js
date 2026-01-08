function showAlert(type, message) {
    const alertBox = document.getElementById('alertBox');
    alertBox.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
}

/* Validation */
function validateSizeForm(name, code) {
    if (!name || name.trim().length < 2) {
        showAlert('danger', '❌ Size name must be at least 2 characters');
        return false;
    }

    if (!code || code.trim().length < 1) {
        showAlert('danger', '❌ Size code is required');
        return false;
    }

    return true;
}


let sizeModal;
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    // Init modal
    const modalEl = document.getElementById('sizeModal');
    sizeModal = new bootstrap.Modal(modalEl);

    // Search event (SAFE)
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => loadSizes());
    }

    // Initial load
    loadSizes();
});

/* LOAD LIST */
async function loadSizes(page = 1) {
    currentPage = page;
    const search = document.getElementById('search')?.value || '';

    const res = await axios.get('/api/sizes', {
        params: { page, limit: 5, search }
    });

    renderTable(res.data.data.data);
    renderPagination(res.data.data.pagination);
}

/* TABLE */
function renderTable(data) {
    const tbody = document.getElementById('sizeTable');
    tbody.innerHTML = '';

    data.forEach(row => {
        tbody.innerHTML += `
      <tr>
        <td>${row.size_id}</td>
        <td>${row.size_name}</td>
        <td>${row.size_code}</td>
        <td>
          <button class="btn btn-sm btn-warning"
            onclick='editSize(${JSON.stringify(row)})'>Edit</button>
          <button class="btn btn-sm btn-danger"
            onclick="deleteSize(${row.size_id})">Delete</button>
        </td>
      </tr>`;
    });
}

/* PAGINATION */
function renderPagination(p) {
    const ul = document.getElementById('pagination');
    ul.innerHTML = '';

    for (let i = 1; i <= p.totalPages; i++) {
        ul.innerHTML += `
      <li class="page-item ${i === p.page ? 'active' : ''}">
        <a class="page-link" onclick="loadSizes(${i})">${i}</a>
      </li>`;
    }
}

/* ADD */
function openAddModal() {
    document.getElementById('modalTitle').innerText = 'Add Size';
    document.getElementById('size_id').value = '';
    document.getElementById('size_name').value = '';
    document.getElementById('size_code').value = '';
    sizeModal.show();
}

/* EDIT */
function editSize(row) {
    document.getElementById('modalTitle').innerText = 'Edit Size';
    document.getElementById('size_id').value = row.size_id;
    document.getElementById('size_name').value = row.size_name;
    document.getElementById('size_code').value = row.size_code;
    sizeModal.show();
}

/* SAVE */
async function saveSize(btn) {
    buttonLoading(btn, true);
    const id = document.getElementById('size_id').value;
    const name = document.getElementById('size_name').value;
    const code = document.getElementById('size_code').value;

    if (!name || name.length < 2) {
        warningAlert('Size name must be at least 2 characters');
        return;
    }

    if (!code) {
        warningAlert('Size code is required');
        return;
    }

    try {
        if (id) {
            await axios.put(`/api/sizes/${id}`, {
                size_name: name,
                size_code: code
            });

            successAlert('Size updated successfully');
        } else {
            await axios.post('/api/sizes', {
                size_id: Date.now(),
                size_name: name,
                size_code: code
            });

            successAlert('Size added successfully');
        }

        sizeModal.hide();
        loadSizes(currentPage);

    } catch (err) {
        apiError(err);
    }
    finally {
        buttonLoading(btn, false);
    }
}


/* DELETE */
function deleteSize(id) {
    confirmDelete(async () => {
        try {
            await axios.delete(`/api/sizes/${id}`);
            successAlert('Size deleted successfully');
            loadSizes(currentPage);
        } catch (err) {
            apiError(err);
        }
    });
}
