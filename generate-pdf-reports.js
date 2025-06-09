#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

async function generatePDFReports() {
  console.log('📄 Generating PDF reports for completed scans...\n');
  
  const API_URL = 'http://localhost:3001/api';
  
  try {
    // Login first
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
    const completedScans = scans.filter(scan => scan.status === 'completed');
    
    console.log(`Found ${completedScans.length} completed scans\n`);
    
    if (completedScans.length === 0) {
      console.log('No completed scans found. Showing all scans:');
      scans.forEach(scan => {
        console.log(`  - Scan ${scan.id} (${scan.type}): ${scan.status}`);
      });
      return;
    }
    
    // Create reports directory
    const reportsDir = path.join(__dirname, 'scan-reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    // Generate PDF for each completed scan
    for (const scan of completedScans) {
      console.log(`📝 Generating PDF for scan ${scan.id} (${scan.type})...`);
      
      try {
        const response = await axios.post(
          `${API_URL}/scans/${scan.id}/report`,
          { format: 'pdf' },
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            responseType: 'arraybuffer'
          }
        );
        
        const filename = `scan-${scan.id}-${scan.type}-report.pdf`;
        const filepath = path.join(reportsDir, filename);
        
        await fs.writeFile(filepath, response.data);
        console.log(`✅ PDF saved: ${filepath}`);
        
      } catch (error) {
        console.error(`❌ Failed to generate PDF for scan ${scan.id}:`, error.message);
      }
    }
    
    console.log(`\n✅ PDF generation complete!`);
    console.log(`📁 Reports saved in: ${reportsDir}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

generatePDFReports().catch(console.error);