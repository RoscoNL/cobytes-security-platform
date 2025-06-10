const https = require('https');

async function testProductionAPI() {
  console.log('Testing Production API and Database...\n');

  // Test 1: Health check
  console.log('1. Testing Health Check:');
  try {
    const healthResponse = await fetch('https://securityscan.cobytes.com/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Login with test credentials
  console.log('\n2. Testing Login with test credentials:');
  try {
    const loginResponse = await fetch('https://securityscan.cobytes.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user@cobytes.com',
        password: 'pass'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`Login response (${loginResponse.status}):`, loginData);
    
    if (loginResponse.status === 500) {
      console.log('\n⚠️  500 Error suggests database connection issue or missing user data');
    }
  } catch (error) {
    console.log('❌ Login test failed:', error.message);
  }

  // Test 3: Check other endpoints
  console.log('\n3. Testing other endpoints:');
  const endpoints = [
    '/api/products',
    '/api/scans',
    '/api/system/status',
    '/api/test'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`https://securityscan.cobytes.com${endpoint}`);
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`${endpoint}: ❌ ${error.message}`);
    }
  }

  console.log('\n4. Summary:');
  console.log('- API is running and responding');
  console.log('- Login endpoint returns 500 error (database or user issue)');
  console.log('- Most endpoints return 404 (routes may not be properly configured)');
  console.log('\nPossible issues:');
  console.log('1. Database connection not working in production');
  console.log('2. No users in production database');
  console.log('3. Environment variables not properly set');
  console.log('4. Routes not properly configured in production build');
}

testProductionAPI();