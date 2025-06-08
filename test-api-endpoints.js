const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3002';
const API_URL = 'http://localhost:3000';

async function testApiEndpoints() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Capture all network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('api')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('api')) {
      console.log(`Response: ${response.status()} ${response.url()}`);
    }
  });
  
  console.log('🚀 Testing API endpoints...\n');

  try {
    // Test direct API calls
    console.log('1️⃣ Direct API test:');
    const directResponse = await fetch(`${API_URL}/api/products`);
    console.log(`Direct API call to ${API_URL}/api/products: ${directResponse.status}`);
    
    // Load products page
    console.log('\n2️⃣ Loading products page...');
    await page.goto(`${FRONTEND_URL}/products`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Show all API requests
    console.log('\n3️⃣ API requests from frontend:');
    requests.forEach(req => {
      console.log(`${req.method} ${req.url}`);
      if (req.url.includes('products')) {
        console.log('  Origin:', req.headers.origin || 'none');
        console.log('  Referer:', req.headers.referer || 'none');
      }
    });
    
    // Check what base URL the frontend is using
    console.log('\n4️⃣ Frontend API configuration:');
    const apiConfig = await page.evaluate(() => {
      // Try to access the API service
      if (window.apiService) {
        return window.apiService.getBaseURL();
      }
      // Check localStorage or other storage
      return {
        localStorage: window.localStorage.getItem('API_URL'),
        env: process.env.REACT_APP_API_URL || 'not set'
      };
    });
    console.log('Frontend API config:', apiConfig);
    
    // Test CORS
    console.log('\n5️⃣ Testing CORS...');
    const corsTest = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3000/api/products', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return {
          status: response.status,
          ok: response.ok,
          headers: {
            'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
            'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
          }
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('CORS test result:', corsTest);
    
    console.log('\n⏸️  Browser will close in 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('\n❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testApiEndpoints().catch(console.error);