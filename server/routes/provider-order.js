const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const axios = require('axios');
require('dotenv').config();

const DATABASE_SERVICE_URL = process.env.DATABASE_SERVICE_URL;
const DATABASE_SERVICE_API_KEY = process.env.DATABASE_SERVICE_API_KEY;

const BASE_URL = `${DATABASE_SERVICE_URL}/api/provider-order`;

router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        const response = await axios.get(`${BASE_URL}/${userId}`, {
            headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Proxy error';
        res.status(status).json({ error: 'Proxy Error', message });
    }
});

router.put('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        const { providerOrder } = req.body;
        console.log("🔍 providerOrder:", providerOrder);
        const response = await axios.put(`${BASE_URL}/${userId}`, { providerOrder }, {
            headers: { 'x-api-key': DATABASE_SERVICE_API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        console.log("🔍 error:", error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Proxy error';
        res.status(status).json({ error: 'Proxy Error', message });
    }
});

module.exports = router;
