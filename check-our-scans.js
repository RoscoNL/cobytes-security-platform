#!/usr/bin/env node

const axios = require('axios');

async function checkOurScans() {
  console.log('🔍 Checking our scan status...\n');
  
  const API_URL = 'http://localhost:3001/api';
  
  // Login first
  try {
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@cobytes.com',
      password: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Logged in successfully\n');
    
    // Get all scans
    const scansResponse = await axios.get(`${API_URL}/scans`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const scans = scansResponse.data.data;
    console.log(`Found ${scans.length} scans:\n`);
    
    // Show recent scans
    scans.slice(0, 5).forEach(scan => {
      console.log(`Scan ID: ${scan.id}`);
      console.log(`  Type: ${scan.type}`);
      console.log(`  Target: ${scan.target}`);
      console.log(`  Status: ${scan.status}`);
      console.log(`  Progress: ${scan.progress}%`);
      console.log(`  Pentest-tools ID: ${scan.pentest_tools_scan_id || 'N/A'}`);
      console.log(`  Created: ${new Date(scan.created_at).toLocaleString()}`);
      
      if (scan.results && scan.results.length > 0) {
        console.log(`  Results: ${scan.results.length} findings`);
      }
      
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkOurScans().catch(console.error);