const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Cobytes Security Platform API is running',
        timestamp: new Date().toISOString()
    });
});

// Pentest Tools API proxy endpoint
app.post('/api/scan', async (req, res) => {
    try {
        const { scanType, target, options } = req.body;
        
        if (!target) {
            return res.status(400).json({ error: 'Target is required' });
        }

        // Pentest Tools API call
        const response = await axios.post(`https://pentest-tools.com/api/v1/${scanType}`, {
            target: target,
            ...options
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.PENTEST_TOOLS_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Scan error:', error.message);
        res.status(500).json({ 
            error: 'Scan failed', 
            details: error.response?.data || error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Cobytes Security Platform API running on port ${PORT}`);
    console.log(`📡 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
    console.log(`🔑 API Key configured: ${process.env.PENTEST_TOOLS_API_KEY ? 'Yes' : 'No'}`);
});
