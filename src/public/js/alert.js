/* SUCCESS ALERT */
function successAlert(message = 'Success') {
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message,
        timer: 2000,
        showConfirmButton: false
    });
}

/* ERROR ALERT */
function errorAlert(message = 'Something went wrong') {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message
    });
}

/* WARNING ALERT */
function warningAlert(message) {
    Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: message
    });
}

/* CONFIRM DELETE */
function confirmDelete(callback) {
    Swal.fire({
        title: 'Are you sure?',
        text: 'This action cannot be undone',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) callback();
    });
}

/* API ERROR HANDLER */
function apiError(err, fallback = 'Something went wrong') {
    const msg =
        err?.response?.data?.message ||
        err?.message ||
        fallback;

    errorAlert(msg);
}
