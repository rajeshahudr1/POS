const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000';

exports.listPage = async (req, res) => {
    try {
        const { page = 1, search = '', is_active = '', company_id = '' } = req.query;

        // Get companies for dropdown
        const companiesRes = await axios.get(`${API_BASE}/api/companies/active`);

        res.render('branches/index', {
            companies: companiesRes.data.data || [],
            search,
            is_active,
            company_id,
            title: 'Branch Master'
        });
    } catch (err) {
        console.error('Error loading branches:', err.message);
        res.render('branches/index', {
            companies: [],
            search: '',
            is_active: '',
            company_id: '',
            title: 'Branch Master',
            error: err.response?.data?.message || err.message
        });
    }
};