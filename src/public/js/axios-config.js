axios.interceptors.request.use(
    (config) => {
        showLoader();
        return config;
    },
    (error) => {
        hideLoader();
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    (response) => {
        hideLoader();
        return response;
    },
    (error) => {
        hideLoader();
        return Promise.reject(error);
    }
);
