const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000';
const API_COMPANIES = `${API_BASE}/api/companies`;

/**
 * Company List Page
 */
exports.listPage = async (req, res) => {
    try {
        const { page = 1, search = '', is_active = '' } = req.query;

        const response = await axios.get(API_COMPANIES, {
            params: { page, limit: 10, search, is_active }
        });

        res.render('companies/index', {
            companies: response.data.data.data,
            pagination: response.data.data.pagination,
            search,
            is_active,
            title: 'Company Master'
        });
    } catch (err) {
        console.error('Error loading companies:', err.message);
        res.render('companies/index', {
            companies: [],
            pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
            search: '',
            is_active: '',
            title: 'Company Master',
            error: err.response?.data?.message || err.message
        });
    }
};

/**
 * Add Company Page (if separate page needed)
 */
exports.addPage = async (req, res) => {
    try {
        res.render('companies/form', {
            company: null,
            title: 'Add Company',
            mode: 'add'
        });
    } catch (err) {
        res.redirect('/admin/companies?error=' + encodeURIComponent(err.message));
    }
};

/**
 * Edit Company Page
 */
exports.editPage = async (req, res) => {
    try {
        const response = await axios.get(`${API_COMPANIES}/${req.params.id}`);

        res.render('companies/form', {
            company: response.data.data,
            title: 'Edit Company',
            mode: 'edit'
        });
    } catch (err) {
        res.redirect('/admin/companies?error=' + encodeURIComponent(err.response?.data?.message || err.message));
    }
};

/**
 * View Company Details Page
 */
exports.viewPage = async (req, res) => {
    try {
        const response = await axios.get(`${API_COMPANIES}/${req.params.id}`);

        res.render('companies/view', {
            company: response.data.data,
            title: 'Company Details'
        });
    } catch (err) {
        res.redirect('/admin/companies?error=' + encodeURIComponent(err.response?.data?.message || err.message));
    }
};
