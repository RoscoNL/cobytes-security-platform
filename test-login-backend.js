const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@cobytes.com',
      password: 'admin123'
    });
    
    console.log('Login response:', {
      status: response.status,
      data: response.data
    });
    
    if (response.data.token) {
      console.log('✅ Login successful, token received');
      
      // Test accessing a protected endpoint
      const dashboardResponse = await axios.get('http://localhost:3001/api/scans', {
        headers: {
          Authorization: `Bearer ${response.data.token}`
        }
      });
      
      console.log('Protected endpoint response:', {
        status: dashboardResponse.status,
        dataReceived: !!dashboardResponse.data
      });
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testLogin();