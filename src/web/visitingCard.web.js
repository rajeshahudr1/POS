// web/visitingCard.web.js

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/visiting-cards';

exports.scannerPage = async (req, res) => {
    try {
        res.render('visitingCards/scanner', {
            title: 'Visiting Card Scanner',
            page: 'visiting-card-scanner'
        });
    } catch (err) {
        res.send(err.message);
    }
};

exports.listPage = async (req, res) => {
    try {
        const { page = 1, search = '' } = req.query;

        const response = await axios.get(API_BASE, {
            params: { page, limit: 10, search }
        });

        res.render('visitingCards/list', {
            title: 'Visiting Cards List',
            page: 'visiting-card-list',
            cards: response.data.data.data,
            pagination: response.data.data.pagination,
            search
        });
    } catch (err) {
        res.send(err.message);
    }
};