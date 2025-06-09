const axios = require('axios');

async function testAPIs() {
  console.log('Testing API endpoints...\n');
  
  // Test health endpoint
  try {
    console.log('1. Testing /health endpoint:');
    const response = await axios.get('http://localhost:3001/health');
    console.log('   Status:', response.status);
    console.log('   Data:', response.data);
    console.log('   ✅ Success\n');
  } catch (error) {
    console.log('   ❌ Error:', error.response?.status, error.response?.data || error.message);
  }
  
  // Test products endpoint
  try {
    console.log('2. Testing /api/products endpoint:');
    const response = await axios.get('http://localhost:3001/api/products');
    console.log('   Status:', response.status);
    console.log('   Data keys:', Object.keys(response.data));
    console.log('   Products count:', response.data.data?.length || response.data.length);
    console.log('   ✅ Success\n');
  } catch (error) {
    console.log('   ❌ Error:', error.response?.status, error.response?.data || error.message);
  }
  
  // Test scan types endpoint
  try {
    console.log('3. Testing /api/scans/scan-types endpoint:');
    const response = await axios.get('http://localhost:3001/api/scans/scan-types');
    console.log('   Status:', response.status);
    console.log('   Data keys:', Object.keys(response.data));
    console.log('   Scan types count:', response.data.data?.length || response.data.length);
    console.log('   ✅ Success\n');
  } catch (error) {
    console.log('   ❌ Error:', error.response?.status, error.response?.data || error.message);
  }
  
  // Test free scan creation
  try {
    console.log('4. Testing /api/scans/free endpoint:');
    const response = await axios.post('http://localhost:3001/api/scans/free', {
      target: 'https://www.example.com',
      type: 'ssl'
    });
    console.log('   Status:', response.status);
    console.log('   Data:', response.data);
    console.log('   ✅ Success\n');
  } catch (error) {
    console.log('   ❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testAPIs()
  .then(() => console.log('✅ All tests completed'))
  .catch(error => console.error('❌ Test suite failed:', error));