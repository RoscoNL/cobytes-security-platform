const axios = require('axios');

async function testAPIDetailed() {
  console.log('Testing API endpoints with detailed logging...\n');
  
  // Test 1: Health endpoint
  try {
    console.log('1. Testing /health endpoint:');
    const response = await axios({
      method: 'GET',
      url: 'http://localhost:3001/health',
      validateStatus: () => true
    });
    console.log('   Status:', response.status);
    console.log('   Headers:', response.headers);
    console.log('   Data:', response.data);
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  // Test 2: Products endpoint with exact same config as test suite
  try {
    console.log('\n2. Testing /api/products with test suite config:');
    const response = await axios({
      method: 'GET',
      url: 'http://localhost:3001/api/products',
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true
    });
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    console.log('   Data type:', typeof response.data);
    console.log('   Data:', response.data);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('   ✅ Would be marked as PASSED');
    } else {
      console.log('   ❌ Would be marked as FAILED');
      console.log('   Error info:', `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.log('   Axios error:', error);
  }
}

testAPIDetailed();