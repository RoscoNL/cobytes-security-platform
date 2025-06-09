import { Router, Request, Response } from 'express';
import axios from 'axios';
import { asyncHandler } from '@middleware/asyncHandler';
import { logger } from '@utils/logger';

const router = Router();

// Simple CORS proxy for PentestTools API
router.all('/pentest-tools/*', asyncHandler(async (req: Request, res: Response) => {
  // Add CORS headers immediately
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }

  const apiPath = req.path.replace('/api/proxy/pentest-tools', '');
  const apiUrl = `https://app.pentest-tools.com/api/v2${apiPath}`;
  
  console.log('Simple CORS Proxy:', {
    method: req.method,
    apiPath,
    apiUrl,
    hasBody: !!req.body,
    queryParams: req.query
  });

  try {
    // Use API key from environment variables (production) or fallback to new key
    const apiKey = process.env.PENTEST_TOOLS_API_KEY || 'E0Eq4lmxoJeMSd6DIGLiqCW4yGRnJKywjhnXl78r471e4e69';
    
    const config: any = {
      method: req.method,
      url: apiUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000,
      validateStatus: () => true
    };

    // Add body for POST requests
    if (req.method === 'POST' && req.body) {
      config.data = req.body;
    }

    // Add query parameters
    if (Object.keys(req.query).length > 0) {
      config.params = req.query;
    }

    console.log('Making request to PentestTools:', config);
    
    const response = await axios(config);

    console.log('PentestTools API Response:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      contentType: response.headers['content-type']
    });

    // Return the response
    res.status(response.status).json(response.data);

  } catch (error: any) {
    console.error('CORS Proxy Error:', {
      message: error.message,
      apiUrl,
      code: error.code,
      status: error.response?.status
    });

    res.status(error.response?.status || 500).json({
      error: 'Proxy request failed',
      message: error.message,
      apiUrl
    });
  }
}));

// Handle preflight requests
router.options('/pentest-tools/*', (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).send();
});

export default router;