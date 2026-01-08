const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/sizes';

exports.listPage = async (req, res) => {
    try {
        const { page = 1, search = '' } = req.query;

        const response = await axios.get(API_BASE, {
            params: { page, limit: 5, search }
        });

        res.render('sizes/index', {
            sizes: response.data.data.data,
            pagination: response.data.data.pagination,
            search
        });
    } catch (err) {
        res.send(err.message);
    }
};

exports.create = async (req, res) => {
    try {
        await axios.post(API_BASE, req.body);
        res.redirect('/admin/sizes');
    } catch (err) {
        res.send(err.response?.data?.message || err.message);
    }
};

exports.remove = async (req, res) => {
    try {
        await axios.delete(`${API_BASE}/${req.params.id}`);
        res.redirect('/admin/sizes');
    } catch (err) {
        res.send(err.response?.data?.message || err.message);
    }
};
