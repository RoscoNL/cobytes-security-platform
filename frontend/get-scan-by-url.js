#!/usr/bin/env node

const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';
const PROXY_URL = 'https://thingproxy.freeboard.io/fetch/';
const API_URL = `${PROXY_URL}https://app.pentest-tools.com/api/v2`;

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// The scan ID from the URL you provided
const urlScanId = 'kplwW72rdd1AL6qJ';

async function findScan() {
  console.log(`\n🔍 Looking for scan with URL ID: ${urlScanId}\n`);
  
  try {
    // First, let's get recent scans
    const scansResponse = await fetch(`${API_URL}/scans?limit=50`, {
      method: 'GET',
      headers
    });
    
    if (!scansResponse.ok) {
      console.error('❌ Failed to get scans list');
      return;
    }
    
    const scansData = await scansResponse.json();
    const scans = scansData.data || [];
    
    console.log(`Found ${scans.length} recent scans\n`);
    
    // Show WordPress scans
    const wordPressScans = scans.filter(scan => scan.tool_id === 270);
    console.log(`WordPress Scans (Tool ID 270): ${wordPressScans.length}\n`);
    
    wordPressScans.forEach(scan => {
      console.log(`Scan ID: ${scan.id}`);
      console.log(`  Target ID: ${scan.target_id}`);
      console.log(`  Status: ${scan.status || 'running'}`);
      console.log(`  Progress: ${scan.progress || 0}%`);
      console.log(`  Created: ${scan.created_at}`);
      console.log('---');
    });
    
    // Check the most recent WordPress scan
    if (wordPressScans.length > 0) {
      const latestScan = wordPressScans[0];
      console.log(`\n📊 Checking latest WordPress scan (ID: ${latestScan.id})...\n`);
      
      // Get detailed status
      const statusResponse = await fetch(`${API_URL}/scans/${latestScan.id}`, {
        method: 'GET',
        headers
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('Detailed status:', JSON.stringify(statusData.data, null, 2));
        
        // Try to get output if finished
        if (statusData.data.status === 'finished') {
          const outputResponse = await fetch(`${API_URL}/scans/${latestScan.id}/output`, {
            method: 'GET',
            headers
          });
          
          if (outputResponse.ok) {
            const outputData = await outputResponse.json();
            console.log('\n📄 Scan Output:');
            console.log(JSON.stringify(outputData.data, null, 2).substring(0, 2000));
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the search
findScan();