#!/usr/bin/env node

const axios = require('axios');

const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';
const SCAN_IDS = [36497808, 36497809]; // Our real Pentest-tools scan IDs

async function checkScans() {
  console.log('🔍 Checking Pentest-tools scan status...\n');
  
  for (const scanId of SCAN_IDS) {
    try {
      const response = await axios.get(
        `https://app.pentest-tools.com/api/v2/scanners/status/${scanId}`,
        {
          headers: {
            'X-API-KEY': API_KEY,
            'Accept': 'application/json'
          }
        }
      );
      
      const scan = response.data;
      console.log(`Scan ${scanId}:`);
      console.log(`  Status: ${scan.status}`);
      console.log(`  Progress: ${scan.progress}%`);
      console.log(`  Target: ${scan.target}`);
      console.log(`  Tool: ${scan.tool_name}`);
      
      if (scan.status === 'finished') {
        console.log('  ✅ Scan completed!');
        console.log(`  Results URL: https://app.pentest-tools.com/scans/${scanId}`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`❌ Error checking scan ${scanId}:`, error.message);
    }
  }
}

checkScans().catch(console.error);