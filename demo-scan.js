#!/usr/bin/env node

const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const TARGET = process.argv[2] || 'example.com';
const SCAN_TYPE = process.argv[3] || 'subdomain';

console.log(`
🔍 Cobytes Security Platform - Live Scan Demo
===========================================
Target: ${TARGET}
Scan Type: ${SCAN_TYPE}
`);

async function runScan() {
  try {
    // Step 1: Create scan
    console.log('📡 Starting scan...');
    const createResponse = await axios.post(`${BACKEND_URL}/api/v1/scans`, {
      target: TARGET,
      type: SCAN_TYPE,
      parameters: {
        scan_type: 'light' // Use light scan for demo
      }
    });
    
    const scan = createResponse.data.data;
    console.log(`✅ Scan created with ID: ${scan.id}`);
    console.log(`📊 Initial status: ${scan.status}`);
    
    // Step 2: Monitor progress
    console.log('\n⏳ Monitoring scan progress...\n');
    
    let completed = false;
    let lastProgress = -1;
    
    while (!completed) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      const statusResponse = await axios.get(`${BACKEND_URL}/api/v1/scans/${scan.id}`);
      const currentScan = statusResponse.data.data;
      
      if (currentScan.progress !== lastProgress) {
        console.log(`📈 Progress: ${currentScan.progress}% - Status: ${currentScan.status}`);
        lastProgress = currentScan.progress;
      }
      
      if (currentScan.status === 'completed' || currentScan.status === 'failed') {
        completed = true;
        
        if (currentScan.status === 'completed') {
          console.log('\n✅ Scan completed successfully!\n');
          
          // Display results
          if (currentScan.results && currentScan.results.length > 0) {
            console.log(`📋 Found ${currentScan.results.length} results:\n`);
            
            currentScan.results.forEach((result, index) => {
              console.log(`${index + 1}. ${result.title}`);
              console.log(`   Type: ${result.type}`);
              console.log(`   Severity: ${result.severity}`);
              console.log(`   ${result.description}`);
              console.log('');
            });
          } else {
            console.log('ℹ️  No specific findings for this target.');
          }
        } else {
          console.log('\n❌ Scan failed');
          if (currentScan.error_message) {
            console.log(`Error: ${currentScan.error_message}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.error || error.message);
    console.error('\nMake sure the backend is running:');
    console.error('cd backend && npm run dev');
  }
}

// Run the scan
runScan();