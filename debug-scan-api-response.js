const axios = require('axios');

async function debugScanApiResponse() {
  console.log('🔍 Debugging Scan API Response');
  console.log('==============================\n');
  
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@cobytes.com',
      password: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Logged in successfully');
    
    // Get all scans
    const scansResponse = await axios.get('http://localhost:3001/api/scans', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const scans = scansResponse.data.data;
    console.log(`\n📊 Total scans: ${scans.length}`);
    
    // Find completed scans
    const completedScans = scans.filter(scan => scan.status === 'completed');
    console.log(`✅ Completed scans: ${completedScans.length}`);
    
    // Check scans with results
    const scansWithResults = completedScans.filter(scan => 
      scan.results && scan.results.length > 0
    );
    console.log(`📋 Completed scans with results: ${scansWithResults.length}`);
    
    if (scansWithResults.length > 0) {
      console.log('\n🔍 Sample scan with results:');
      const sampleScan = scansWithResults[0];
      console.log(`Scan ID: ${sampleScan.id}`);
      console.log(`Target: ${sampleScan.target}`);
      console.log(`Type: ${sampleScan.type}`);
      console.log(`Results count: ${sampleScan.results.length}`);
      console.log('\nFirst result:');
      console.log(JSON.stringify(sampleScan.results[0], null, 2));
    } else {
      console.log('\n⚠️ No completed scans have results attached!');
      
      // Let's check a specific completed scan
      if (completedScans.length > 0) {
        const scanId = completedScans[0].id;
        console.log(`\n🔍 Checking individual scan ${scanId}...`);
        
        const individualScan = await axios.get(`http://localhost:3001/api/scans/${scanId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const scanData = individualScan.data.data;
        console.log(`Individual scan results: ${scanData.results?.length || 0}`);
        
        if (!scanData.results || scanData.results.length === 0) {
          console.log('\n❌ The API is not returning scan results!');
          console.log('This explains why ScanDemo shows "No Completed Scans"');
        }
      }
    }
    
    // Debug: Check what the getAllScans endpoint returns
    console.log('\n📡 Raw API response structure:');
    if (scans.length > 0) {
      const firstScan = scans[0];
      console.log('Sample scan object keys:', Object.keys(firstScan));
      console.log('Has results property:', 'results' in firstScan);
      console.log('Results value:', firstScan.results);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugScanApiResponse();