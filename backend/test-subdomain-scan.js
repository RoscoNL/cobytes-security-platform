const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';
const TARGET = 'cobytes.com';

async function testSubdomainScan() {
  try {
    console.log('🔍 Subdomain Scan Test');
    console.log('=====================\n');
    
    // Step 1: Create subdomain scan
    console.log('📡 Starting subdomain scan on', TARGET);
    const scanResponse = await axios.post(`${BACKEND_URL}/api/scans`, {
      target: TARGET,
      type: 'subdomain',
      parameters: {
        scan_type: 'light',
        web_details: true,
        whois: false,
        unresolved_results: false
      }
    });
    
    const scan = scanResponse.data.data;
    console.log('✅ Scan created successfully!');
    console.log('Scan ID:', scan.id);
    console.log('Status:', scan.status);
    console.log('Pentest-Tools Scan ID:', scan.pentest_tools_scan_id || 'Pending...');
    
    // Step 2: Monitor progress
    console.log('\n⏳ Monitoring scan progress...\n');
    
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // 90 seconds max
    
    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      const statusResponse = await axios.get(`${BACKEND_URL}/api/scans/${scan.id}`);
      const currentScan = statusResponse.data.data;
      
      console.log(`📈 Progress: ${currentScan.progress}% - Status: ${currentScan.status}`);
      if (currentScan.pentest_tools_scan_id) {
        console.log(`   Pentest-Tools Scan ID: ${currentScan.pentest_tools_scan_id}`);
      }
      
      if (currentScan.status === 'completed' || currentScan.status === 'failed') {
        completed = true;
        
        if (currentScan.status === 'completed') {
          console.log('\n✅ Scan completed successfully!\n');
          
          // Display results
          if (currentScan.results && currentScan.results.length > 0) {
            console.log(`📋 Found ${currentScan.results.length} subdomains:\n`);
            
            currentScan.results.forEach((result, index) => {
              console.log(`${index + 1}. ${result.title}`);
              if (result.description) {
                console.log(`   ${result.description}`);
              }
              console.log('');
            });
          } else {
            console.log('ℹ️  No subdomains found.');
          }
        } else {
          console.log('\n❌ Scan failed');
          console.log('Error:', currentScan.error_message);
        }
      }
      
      attempts++;
    }
    
    if (!completed) {
      console.log('\n⚠️  Scan is taking longer than expected.');
      console.log(`You can check the status at: ${BACKEND_URL}/api/scans/${scan.id}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Full response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testSubdomainScan();