const axios = require('axios');

async function testScanCreation() {
  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@cobytes.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // Step 2: Create scan
    console.log('\n2. Creating WordPress scan...');
    const scanData = {
      target: 'https://www.cobytes.com',
      type: 'wordpress'
    };
    
    console.log('Scan data:', scanData);
    
    const scanResponse = await axios.post(
      'http://localhost:3001/api/scans',
      scanData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Scan created:', {
      id: scanResponse.data.data.id,
      status: scanResponse.data.data.status,
      type: scanResponse.data.data.type
    });
    
    return scanResponse.data.data;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Monitor scan progress
async function monitorScan(scanId, token) {
  console.log(`\n3. Monitoring scan ${scanId}...`);
  
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    try {
      const response = await axios.get(
        `http://localhost:3001/api/scans/${scanId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const scan = response.data.data;
      console.log(`[${new Date().toLocaleTimeString()}] Status: ${scan.status}, Progress: ${scan.progress}%`);
      
      if (scan.status === 'completed' || scan.status === 'failed') {
        console.log(`\n✅ Scan ${scan.status}!`);
        if (scan.results) {
          console.log('Results:', scan.results);
        }
        break;
      }
    } catch (error) {
      console.error('Error checking status:', error.message);
    }
  }
}

// Run the test
async function runTest() {
  const scan = await testScanCreation();
  if (scan && scan.id) {
    // Get token again for monitoring
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@cobytes.com',
      password: 'admin123'
    });
    await monitorScan(scan.id, loginResponse.data.data.token);
  }
}

runTest();