const axios = require('axios');

async function checkScanFailure() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@cobytes.com',
      password: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    
    // Get recent scans
    const scansResponse = await axios.get('http://localhost:3001/api/scans', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Recent Scans:');
    const recentScans = scansResponse.data.data.slice(-5);
    
    for (const scan of recentScans) {
      console.log(`\nScan ID: ${scan.id}`);
      console.log(`Target: ${scan.target}`);
      console.log(`Type: ${scan.type}`);
      console.log(`Status: ${scan.status}`);
      console.log(`PentestTools Scan ID: ${scan.pentest_tools_scan_id || 'None'}`);
      console.log(`Error: ${scan.error_message || 'None'}`);
      console.log(`Results Count: ${scan.results?.length || 0}`);
      
      if (scan.pentest_tools_scan_id && scan.status === 'failed') {
        console.log('\n🔍 Checking PentestTools status...');
        try {
          const ptResponse = await axios.get(`http://localhost:3001/api/proxy/pentest-tools/scans/${scan.pentest_tools_scan_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('PentestTools Response:', JSON.stringify(ptResponse.data, null, 2));
        } catch (err) {
          console.log('Could not fetch PentestTools status:', err.response?.data || err.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkScanFailure();