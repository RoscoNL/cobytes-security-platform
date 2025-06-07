#!/usr/bin/env node

const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';
const PROXY_URL = 'https://thingproxy.freeboard.io/fetch/';
const API_URL = `${PROXY_URL}https://app.pentest-tools.com/api/v2`;

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Get scan ID from command line or use a default
const scanId = process.argv[2] || '36452784'; // Your WordPress scan ID

async function checkScanStatus(id) {
  console.log(`\n📊 Checking status for scan ${id}...\n`);
  
  try {
    // Get scan status
    const statusResponse = await fetch(`${API_URL}/scans/${id}`, {
      method: 'GET',
      headers
    });
    
    if (!statusResponse.ok) {
      const error = await statusResponse.text();
      console.error('❌ Failed to get scan status:', statusResponse.status, error);
      return;
    }
    
    const statusData = await statusResponse.json();
    const scan = statusData.data;
    
    console.log('✅ Scan Status:');
    console.log('   ID:', scan.id);
    console.log('   Tool ID:', scan.tool_id);
    console.log('   Target ID:', scan.target_id);
    console.log('   Status:', scan.status);
    console.log('   Progress:', scan.progress || 0, '%');
    console.log('   Created:', new Date(scan.created_at).toLocaleString());
    
    if (scan.finished_at) {
      console.log('   Finished:', new Date(scan.finished_at).toLocaleString());
    }
    
    // If scan is finished, try to get output
    if (scan.status === 'finished') {
      console.log('\n📄 Getting scan output...');
      
      const outputResponse = await fetch(`${API_URL}/scans/${id}/output`, {
        method: 'GET',
        headers
      });
      
      if (outputResponse.ok) {
        const outputData = await outputResponse.json();
        console.log('\n🔍 Scan Output Preview:');
        console.log(JSON.stringify(outputData.data, null, 2).substring(0, 1000) + '...');
        
        // Save full output to file
        const fs = require('fs');
        const filename = `scan-output-${id}.json`;
        fs.writeFileSync(filename, JSON.stringify(outputData.data, null, 2));
        console.log(`\n💾 Full output saved to: ${filename}`);
      } else {
        console.log('⚠️  Could not retrieve scan output');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
checkScanStatus(scanId);