const axios = require('axios');

async function checkRunningScan() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@cobytes.com',
      password: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    
    // Check scan 34 which is running
    const scanId = 34;
    const pentestScanId = 36499230;
    
    console.log(`🔍 Checking scan ${scanId} (PentestTools ID: ${pentestScanId})`);
    
    // Get scan details
    const scanResponse = await axios.get(`http://localhost:3001/api/scans/${scanId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const scan = scanResponse.data.data;
    console.log('\n📊 Local Scan Status:');
    console.log(`Status: ${scan.status}`);
    console.log(`Progress: ${scan.progress}%`);
    console.log(`Started: ${scan.started_at}`);
    console.log(`Results: ${scan.results?.length || 0}`);
    
    // Check PentestTools status via proxy
    console.log('\n🌐 Checking PentestTools status...');
    try {
      const ptResponse = await axios.get(`http://localhost:3001/api/proxy/pentest-tools/scans/${pentestScanId}`);
      
      console.log('\nPentestTools API Response:');
      console.log(JSON.stringify(ptResponse.data, null, 2));
      
      // Try to get output if scan is finished
      if (ptResponse.data.data?.status === 'finished' || ptResponse.data.data?.status_name === 'finished') {
        console.log('\n📄 Getting scan output...');
        const outputResponse = await axios.get(`http://localhost:3001/api/proxy/pentest-tools/scans/${pentestScanId}/output`);
        console.log('\nScan Output:');
        console.log(JSON.stringify(outputResponse.data, null, 2));
      }
      
    } catch (err) {
      console.log('PentestTools Error:', err.response?.data || err.message);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkRunningScan();