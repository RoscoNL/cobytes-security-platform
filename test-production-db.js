const axios = require('axios');

async function testProductionDatabase() {
  console.log('🔍 Testing production database connection...\n');

  try {
    // Test health endpoint which should show if DB is connected
    const healthResponse = await axios.get('https://securityscan.cobytes.com/api/health');
    console.log('✅ API Health:', healthResponse.data);

    // Test auth endpoint with correct credentials
    console.log('\n📧 Testing login with test@cobytes.com...');
    try {
      const loginResponse = await axios.post('https://securityscan.cobytes.com/api/auth/login', {
        email: 'test@cobytes.com',
        password: 'Test123!'
      });
      console.log('✅ Login successful:', loginResponse.data);
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
      
      // Try to get more details
      if (error.response?.status === 500 || error.response?.data?.error?.message === 'Something went wrong') {
        console.log('\n⚠️  This indicates a server error, likely database connection issue');
      }
    }

    // Test products endpoint
    console.log('\n📦 Testing products endpoint...');
    try {
      const productsResponse = await axios.get('https://securityscan.cobytes.com/api/products');
      console.log('✅ Products:', productsResponse.data);
    } catch (error) {
      console.log('❌ Products failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testProductionDatabase();