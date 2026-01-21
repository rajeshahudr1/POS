const router = require('express').Router();
const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000';

router.get('/import', async (req, res) => {
    try {
        const companiesRes = await axios.get(`${API_BASE}/api/companies/active`);

        res.render('import/index', {
            companies: companiesRes.data.data || [],
            title: 'Import Menu Data'
        });
    } catch (err) {
        res.render('import/index', {
            companies: [],
            title: 'Import Menu Data',
            error: err.message
        });
    }
});

module.exports = router;