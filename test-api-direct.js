const axios = require('axios');

async function testAPIs() {
  console.log('Testing API endpoints...\n');
  
  // Test 1: Direct health endpoint
  try {
    console.log('1. Testing direct health endpoint:');
    const response = await axios.get('http://localhost:3001/health');
    console.log('   ✅ Status:', response.status);
    console.log('   Data:', response.data);
  } catch (error) {
    console.log('   ❌ Error:', error.response?.status, error.response?.data || error.message);
  }
  
  // Test 2: Products with /api prefix
  try {
    console.log('\n2. Testing /api/products:');
    const response = await axios.get('http://localhost:3001/api/products');
    console.log('   ✅ Status:', response.status);
    console.log('   Products count:', response.data.data?.length || response.data.length);
  } catch (error) {
    console.log('   ❌ Error:', error.response?.status, error.response?.data || error.message);
  }
  
  // Test 3: Scan types
  try {
    console.log('\n3. Testing /api/scans/scan-types:');
    const response = await axios.get('http://localhost:3001/api/scans/scan-types');
    console.log('   ✅ Status:', response.status);
    console.log('   Scan types:', response.data);
  } catch (error) {
    console.log('   ❌ Error:', error.response?.status, error.response?.data || error.message);
  }
  
  // Test 4: Free scan
  try {
    console.log('\n4. Testing POST /api/scans/free:');
    const response = await axios.post('http://localhost:3001/api/scans/free', {
      target: 'https://www.example.com',
      type: 'ssl'
    });
    console.log('   ✅ Status:', response.status);
    console.log('   Scan ID:', response.data.data?.id || response.data.id);
  } catch (error) {
    console.log('   ❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testAPIs().then(() => console.log('\n✅ Tests completed')).catch(console.error);