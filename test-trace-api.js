const axios = require('axios');

// Exactly replicate what the test suite is doing
const API_URL = 'http://localhost:3001';

async function testAPI(endpoint, method = 'GET', options = {}) {
  const { data = null, headers = {}, requiresAuth = false, name = endpoint, usePrefix = true } = options;
  console.log(`\n🔍 Testing API: ${method} ${endpoint}`);
  
  const result = {
    endpoint,
    method,
    status: 'pending',
    responseTime: 0,
    httpStatus: null,
    errors: []
  };
  
  try {
    const startTime = Date.now();
    const url = `${API_URL}${endpoint}`;
    console.log('   Full URL:', url);
    
    const requestHeaders = { ...headers };
    if (method !== 'GET' && method !== 'DELETE') {
      requestHeaders['Content-Type'] = 'application/json';
    }
    
    const response = await axios({
      method,
      url,
      data,
      headers: requestHeaders,
      validateStatus: () => true // Don't throw on error status codes
    });
    
    result.responseTime = Date.now() - startTime;
    result.httpStatus = response.status;
    
    console.log('   Response status:', response.status);
    console.log('   Response statusText:', response.statusText);
    console.log('   Response data:', JSON.stringify(response.data, null, 2));
    
    // Check for successful response
    if (response.status >= 200 && response.status < 300) {
      result.status = 'passed';
    } else if (response.status === 401 && !requiresAuth) {
      // 401 is expected for protected endpoints without auth
      result.status = 'passed';
    } else {
      result.status = 'failed';
      result.errors.push(`HTTP ${response.status}: ${response.statusText}`);
      if (response.data?.error) {
        result.errors.push(JSON.stringify(response.data.error));
      }
    }
    
  } catch (error) {
    result.status = 'failed';
    result.errors.push(error.message);
  }
  
  console.log('   Test result:', result);
  
  return result;
}

async function runTests() {
  // Test the exact endpoints the test suite is testing
  await testAPI('/health', 'GET', { name: 'Health Check', usePrefix: false });
  await testAPI('/api/products', 'GET', { name: 'Get Products' });
  await testAPI('/api/scans/scan-types', 'GET', { name: 'Get Scan Types' });
}

runTests();