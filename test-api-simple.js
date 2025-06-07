const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testAPI() {
  console.log('Testing Cobytes API...\n');
  
  // Test 1: Check API status
  try {
    const status = await axios.get(API_URL);
    console.log('✅ API is running');
    console.log('   Version:', status.data.version);
  } catch (error) {
    console.log('❌ API not responding');
    return;
  }
  
  // Test 2: Login
  console.log('\nTesting login...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'user@cobytes.com',
      password: 'pass'
    });
    
    console.log('✅ Login successful');
    console.log('   Response keys:', Object.keys(response.data));
    console.log('   Full response:', JSON.stringify(response.data, null, 2));
    
    const token = response.data.token || response.data.access_token || response.data.accessToken;
    
    if (token) {
      console.log('   Token found:', token.substring(0, 30) + '...');
      
      // Test 3: Get scan types with auth
      console.log('\nTesting authenticated request...');
      const scanTypesResponse = await axios.get(`${API_URL}/scans/scan-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Scan types retrieved');
      console.log('   Count:', scanTypesResponse.data.data?.length || scanTypesResponse.data.length);
    } else {
      console.log('⚠️  No token in response');
    }
    
  } catch (error) {
    console.log('❌ Login failed');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data || error.message);
  }
}

testAPI();