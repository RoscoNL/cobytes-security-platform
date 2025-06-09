const axios = require('axios');

const PRODUCTION_URL = 'https://securityscan.cobytes.com';
const PRODUCTION_API_URL = 'https://securityscan.cobytes.com/api';

async function testProduction() {
  console.log('🚀 Testing Production Deployment');
  console.log('================================\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  // Test 1: Frontend is accessible
  console.log('📄 Testing Frontend...');
  try {
    const response = await axios.get(PRODUCTION_URL);
    if (response.status === 200) {
      console.log('  ✅ Frontend is accessible');
      results.passed++;
    } else {
      console.log('  ❌ Frontend returned unexpected status:', response.status);
      results.failed++;
    }
  } catch (error) {
    console.log('  ❌ Frontend is not accessible:', error.message);
    results.failed++;
    results.errors.push(`Frontend: ${error.message}`);
  }
  
  // Test 2: API Health Check
  console.log('\n📡 Testing API Health Check...');
  try {
    const response = await axios.get(`${PRODUCTION_API_URL.replace('/api', '')}/health`);
    if (response.status === 200 && response.data.status === 'ok') {
      console.log('  ✅ API health check passed');
      results.passed++;
    } else {
      console.log('  ❌ API health check failed:', response.data);
      results.failed++;
    }
  } catch (error) {
    console.log('  ❌ API health check failed:', error.message);
    results.failed++;
    results.errors.push(`API Health: ${error.message}`);
  }
  
  // Test 3: Products Endpoint
  console.log('\n🛍️ Testing Products Endpoint...');
  try {
    const response = await axios.get(`${PRODUCTION_API_URL}/products`);
    if (response.status === 200 && response.data.data) {
      console.log(`  ✅ Products endpoint working (${response.data.data.length} products found)`);
      results.passed++;
    } else {
      console.log('  ❌ Products endpoint returned unexpected data');
      results.failed++;
    }
  } catch (error) {
    console.log('  ❌ Products endpoint failed:', error.message);
    results.failed++;
    results.errors.push(`Products: ${error.message}`);
  }
  
  // Test 4: Scan Types Endpoint
  console.log('\n🔍 Testing Scan Types Endpoint...');
  try {
    const response = await axios.get(`${PRODUCTION_API_URL}/scans/scan-types`);
    if (response.status === 200 && response.data.data) {
      console.log(`  ✅ Scan types endpoint working (${response.data.data.length} types found)`);
      results.passed++;
    } else {
      console.log('  ❌ Scan types endpoint returned unexpected data');
      results.failed++;
    }
  } catch (error) {
    console.log('  ❌ Scan types endpoint failed:', error.message);
    results.failed++;
    results.errors.push(`Scan Types: ${error.message}`);
  }
  
  // Test 5: Free SSL Scan
  console.log('\n🔒 Testing Free SSL Scan...');
  try {
    const response = await axios.post(`${PRODUCTION_API_URL}/scans/free`, {
      target: 'https://www.cobytes.com',
      type: 'ssl'
    });
    if (response.status === 201 && response.data.data && response.data.data.id) {
      console.log(`  ✅ Free SSL scan created (ID: ${response.data.data.id})`);
      results.passed++;
      
      // Check scan status
      console.log('  ⏳ Checking scan status...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      try {
        const statusResponse = await axios.get(`${PRODUCTION_API_URL}/scans/free/${response.data.data.id}`);
        if (statusResponse.data.data) {
          console.log(`  ✅ Scan status: ${statusResponse.data.data.status} (${statusResponse.data.data.progress}% complete)`);
        }
      } catch (error) {
        console.log('  ⚠️  Could not check scan status:', error.message);
      }
    } else {
      console.log('  ❌ Free SSL scan creation failed');
      results.failed++;
    }
  } catch (error) {
    console.log('  ❌ Free SSL scan failed:', error.message);
    results.failed++;
    results.errors.push(`Free SSL Scan: ${error.message}`);
  }
  
  // Summary
  console.log('\n📊 Production Test Summary');
  console.log('==========================');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('\n🌐 Production URL: https://securityscan.cobytes.com');
  console.log('📡 Production API: https://securityscan.cobytes.com/api');
  
  return results;
}

// Run the test
testProduction()
  .then(results => {
    console.log('\n✅ Production verification complete');
    process.exit(results.failed === 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });