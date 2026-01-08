document.addEventListener('DOMContentLoaded', () => {
    const importInput = document.getElementById('importFile');

    if (!importInput) {
        console.warn('importFile input not found');
        return;
    }

    importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('/api/sizes/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            successAlert(
                `Imported: ${res.data.successCount}, Errors: ${res.data.errors.length}`
            );

            if (res.data.errors.length) {
                console.table(res.data.errors);
            }

            loadSizes();
            importInput.value = '';

        } catch (err) {
            apiError(err);
        }
    });
});

/* Trigger file picker */
function triggerImport() {
    const input = document.getElementById('importFile');
    if (!input) {
        errorAlert('Import input not available');
        return;
    }
    input.click();
}
