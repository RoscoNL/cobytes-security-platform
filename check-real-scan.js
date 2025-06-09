const axios = require('axios');

async function checkRealScan() {
  try {
    // First login to get token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@cobytes.com',
      password: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Logged in successfully');
    
    // Get scan 45 details
    const scanResponse = await axios.get('http://localhost:3001/api/scans/45', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n📊 Scan 45 Details:');
    console.log(JSON.stringify(scanResponse.data.data, null, 2));
    
    // Check if it has a real PentestTools scan ID
    if (scanResponse.data.data.securityScanId) {
      console.log('\n🔍 Checking real PentestTools scan status...');
      
      // Check via backend proxy
      const ptResponse = await axios.get(`http://localhost:3001/api/proxy/pentest-tools/scans/${scanResponse.data.data.securityScanId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('\n🌐 Real PentestTools API Response:');
      console.log(JSON.stringify(ptResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkRealScan();