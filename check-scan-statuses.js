const axios = require('axios');

async function checkScanStatuses() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@cobytes.com',
      password: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Logged in');
    
    // Get all scans
    const scansResponse = await axios.get('http://localhost:3001/api/scans', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const scans = scansResponse.data.data;
    
    // Count by status
    const statusCounts = {};
    scans.forEach(scan => {
      statusCounts[scan.status] = (statusCounts[scan.status] || 0) + 1;
    });
    
    console.log('\n📊 Scan Status Distribution:');
    console.log('===========================');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count} scans`);
    });
    
    // Show scans with results
    const scansWithResults = scans.filter(scan => scan.results && scan.results.length > 0);
    console.log(`\n📋 Scans with results: ${scansWithResults.length}`);
    
    if (scansWithResults.length > 0) {
      console.log('\nScans that have results:');
      scansWithResults.forEach(scan => {
        console.log(`- Scan ${scan.id}: ${scan.target} (${scan.status}) - ${scan.results.length} results`);
      });
    }
    
    // Find a good scan to update
    const failedScans = scans.filter(scan => scan.status === 'failed');
    if (failedScans.length > 0) {
      console.log(`\n🔧 Found ${failedScans.length} failed scans that could be updated to completed`);
      console.log('First failed scan:', {
        id: failedScans[0].id,
        target: failedScans[0].target,
        type: failedScans[0].type
      });
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkScanStatuses();