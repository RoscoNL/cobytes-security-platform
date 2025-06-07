const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function testConnection() {
  try {
    console.log('Testing backend connection...');
    
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    try {
      const healthResponse = await axios.get(`${BACKEND_URL}/health`);
      console.log('✅ Health check passed:', healthResponse.data);
    } catch (error) {
      console.error('❌ Health check failed:', error.message || error);
      console.error('Error code:', error.code);
      if (error.code === 'ECONNREFUSED') {
        console.error('Backend server is not running on', BACKEND_URL);
      }
    }
    
    // Test 2: Scan types
    console.log('\n2. Testing scan types endpoint...');
    try {
      const typesResponse = await axios.get(`${BACKEND_URL}/api/scans/scan-types`);
      console.log('✅ Scan types retrieved:', typesResponse.data.data.length, 'types');
      
      // Find WordPress scanner
      const wordpressScanner = typesResponse.data.data.find(t => t.id === 'wordpress');
      if (wordpressScanner) {
        console.log('✅ WordPress scanner available:', wordpressScanner.name);
      } else {
        console.log('❌ WordPress scanner not found');
      }
    } catch (error) {
      console.error('❌ Scan types failed:', error.message);
      if (error.response) {
        console.error('Response:', error.response.status, error.response.data);
      }
    }
    
    // Test 3: Try to create a simple scan
    console.log('\n3. Testing scan creation...');
    try {
      const scanResponse = await axios.post(`${BACKEND_URL}/api/scans`, {
        target: 'example.com',
        type: 'subdomain',
        parameters: {
          scan_type: 'light'
        }
      });
      console.log('✅ Scan created successfully:', scanResponse.data.data.id);
    } catch (error) {
      console.error('❌ Scan creation failed:', error.message);
      if (error.response) {
        console.error('Response:', error.response.status, error.response.data);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testConnection();