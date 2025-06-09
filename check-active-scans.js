#!/usr/bin/env node

const axios = require('axios');

const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';
const SCAN_IDS = [36498504, 36498505]; // Our active scan IDs

async function checkScans() {
  console.log('🔍 Checking Pentest-tools scan status...\n');
  
  for (const scanId of SCAN_IDS) {
    try {
      const response = await axios.get(
        `https://pentest-tools.com/api/v2/scanners/status/${scanId}`,
        {
          headers: {
            'X-API-Key': API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
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
        
        // Try to get results
        try {
          const resultsResponse = await axios.get(
            `https://pentest-tools.com/api/v2/scanners/results/${scanId}`,
            {
              headers: {
                'X-API-Key': API_KEY,
                'Accept': 'application/json'
              }
            }
          );
          
          const results = resultsResponse.data;
          console.log(`  Found ${results.data?.length || 0} vulnerabilities`);
          
          if (results.data && results.data.length > 0) {
            console.log('  Top findings:');
            results.data.slice(0, 3).forEach(vuln => {
              console.log(`    - ${vuln.name} (${vuln.risk_level})`);
            });
          }
        } catch (error) {
          console.log('  Could not fetch results:', error.message);
        }
      }
      
      console.log('');
    } catch (error) {
      console.error(`❌ Error checking scan ${scanId}:`, error.message);
    }
  }
}

checkScans().catch(console.error);