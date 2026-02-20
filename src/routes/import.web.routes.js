const router = require('express').Router();
const axios = require('axios');
const config = require('../config/app.config');
const authMiddleware = require('../middlewares/auth.middleware');
router.use(authMiddleware);
router.get('/import', async (req, res) => {
    try {

        const companiesRes = await axios.get(`${config.BASE_URL}/api/companies/active`);

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