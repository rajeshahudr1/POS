const loader = document.getElementById('globalLoader');

function showLoader() {
    if (loader) loader.classList.remove('d-none');
}

function hideLoader() {
    if (loader) loader.classList.add('d-none');
}

/* GLOBAL BUTTON LOADER */
function buttonLoading(btn, state = true) {
    if (!btn) return;

    if (state) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}
