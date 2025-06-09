const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Simple CORS proxy endpoint
app.all('/proxy/*', async (req, res) => {
  try {
    const targetPath = req.path.replace('/proxy', '');
    const targetUrl = `https://app.pentest-tools.com/api/v2${targetPath}`;
    
    console.log(`Proxying ${req.method} request to: ${targetUrl}`);
    
    // Forward the request
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Authorization': req.headers.authorization || `Bearer E0Eq4lmxoJeMSd6DIGLiqCW4yGRnJKywjhnXl78r471e4e69`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: req.body,
      params: req.query,
      validateStatus: () => true
    });
    
    // Return the response
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 CORS Proxy Server running on http://localhost:${PORT}`);
  console.log('📡 Proxy endpoint: http://localhost:8080/proxy/*');
  console.log('🔑 Using PentestTools API key');
});