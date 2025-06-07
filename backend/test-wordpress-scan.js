const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';
const TARGET = 'https://www.cobytes.com';

async function testWordPressScan() {
  try {
    console.log('🔍 WordPress Scan Test for Cobytes.com');
    console.log('=====================================\n');
    
    // Step 1: Create WordPress scan
    console.log('📡 Starting WordPress scan on', TARGET);
    const scanResponse = await axios.post(`${BACKEND_URL}/api/scans`, {
      target: TARGET,
      type: 'wordpress',
      parameters: {
        scan_type: 'deep',
        enumerate_users: true,
        enumerate_plugins: true,
        enumerate_themes: true,
        check_vulnerabilities: true
      }
    });
    
    const scan = scanResponse.data.data;
    console.log('✅ Scan created successfully!');
    console.log('Scan ID:', scan.id);
    console.log('Status:', scan.status);
    console.log('Pentest-Tools Scan ID:', scan.pentest_tools_scan_id || 'Pending...\n');
    
    // Step 2: Monitor scan progress
    console.log('⏳ Monitoring scan progress...\n');
    
    let completed = false;
    let lastProgress = -1;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await axios.get(`${BACKEND_URL}/api/scans/${scan.id}`);
      const currentScan = statusResponse.data.data;
      
      if (currentScan.progress !== lastProgress) {
        console.log(`📈 Progress: ${currentScan.progress}% - Status: ${currentScan.status}`);
        if (currentScan.pentest_tools_scan_id) {
          console.log(`   Pentest-Tools Scan ID: ${currentScan.pentest_tools_scan_id}`);
        }
        lastProgress = currentScan.progress;
      }
      
      if (currentScan.status === 'completed' || currentScan.status === 'failed') {
        completed = true;
        
        if (currentScan.status === 'completed') {
          console.log('\n✅ WordPress scan completed successfully!\n');
          
          // Display results
          if (currentScan.results && currentScan.results.length > 0) {
            console.log(`📋 Found ${currentScan.results.length} findings:\n`);
            
            // Group results by type
            const grouped = {};
            currentScan.results.forEach(result => {
              if (!grouped[result.type]) grouped[result.type] = [];
              grouped[result.type].push(result);
            });
            
            Object.entries(grouped).forEach(([type, results]) => {
              console.log(`\n${type.toUpperCase()} (${results.length}):`);
              console.log('─'.repeat(50));
              
              results.forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.title}`);
                console.log(`   Severity: ${result.severity}`);
                console.log(`   ${result.description}`);
                if (result.affected_component) {
                  console.log(`   Component: ${result.affected_component}`);
                }
                if (result.recommendation) {
                  console.log(`   Recommendation: ${result.recommendation}`);
                }
              });
            });
          } else {
            console.log('ℹ️  No specific WordPress vulnerabilities found.');
          }
          
          // Show raw metadata if available
          if (currentScan.metadata?.raw_output) {
            console.log('\n\n📊 Scan Metadata:');
            console.log('─'.repeat(50));
            console.log('WordPress Version:', currentScan.metadata.raw_output.data?.wordpress_version || 'Unknown');
            console.log('Detected Plugins:', currentScan.metadata.raw_output.data?.plugins?.length || 0);
            console.log('Detected Themes:', currentScan.metadata.raw_output.data?.themes?.length || 0);
          }
        } else {
          console.log('\n❌ Scan failed');
          if (currentScan.error_message) {
            console.log(`Error: ${currentScan.error_message}`);
          }
        }
      }
      
      attempts++;
    }
    
    if (!completed) {
      console.log('\n⚠️  Scan is taking longer than expected. Check back later.');
      console.log(`You can check the status at: ${BACKEND_URL}/api/scans/${scan.id}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error('\nThe backend encountered an error. Check the logs for details.');
    }
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Full response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testWordPressScan();