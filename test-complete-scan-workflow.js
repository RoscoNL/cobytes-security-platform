#!/usr/bin/env node

/**
 * Complete scan workflow test:
 * 1. Create 3 different scans on https://www.cobytes.com
 * 2. Monitor progress with live updates
 * 3. Generate PDF reports when completed
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');

// Configuration
const API_URL = 'http://localhost:3001/api';
const TARGET_URL = 'https://www.cobytes.com';

// Test user credentials
const TEST_USER = {
  email: 'test@cobytes.com',
  password: 'test123'
};

let authToken = null;

// Step 1: Login
async function login() {
  console.log('🔑 Logging in...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    authToken = response.data.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.error || error.message);
    console.log('⚠️  Note: Authentication system requires real database integration');
    // Continue without auth for testing
    return false;
  }
}

// Step 2: Create 3 different scans
async function createScans() {
  console.log('\n📊 Creating 3 different scans on', TARGET_URL);
  
  const scanTypes = [
    {
      name: 'WordPress Security Scan',
      type: 'wordpress',
      description: 'Comprehensive WordPress vulnerability assessment'
    },
    {
      name: 'SSL/TLS Security Scan', 
      type: 'ssl',
      description: 'SSL certificate and configuration analysis'
    },
    {
      name: 'Website Security Scan',
      type: 'website',
      description: 'Full website vulnerability scan'
    }
  ];
  
  const createdScans = [];
  
  for (const scanConfig of scanTypes) {
    try {
      console.log(`\n🔄 Creating ${scanConfig.name}...`);
      
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      
      const response = await axios.post(
        `${API_URL}/scans`,
        {
          target: TARGET_URL,
          type: scanConfig.type,
          parameters: {}
        },
        { headers }
      );
      
      const scan = response.data.data;
      console.log(`✅ Created scan ID: ${scan.id}`);
      console.log(`   Pentest-tools ID: ${scan.pentest_tools_scan_id || 'Pending...'}`);
      
      createdScans.push({
        ...scan,
        config: scanConfig
      });
      
    } catch (error) {
      console.error(`❌ Failed to create ${scanConfig.name}:`, error.response?.data || error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
  
  return createdScans;
}

// Step 3: Monitor scan progress with live updates
async function monitorScans(scans) {
  console.log('\n📊 Monitoring scan progress...');
  
  const maxChecks = 120; // Check for up to 10 minutes
  let checkCount = 0;
  const completedScans = new Map();
  
  while (checkCount < maxChecks && completedScans.size < scans.length) {
    checkCount++;
    console.log(`\n[Check ${checkCount}/${maxChecks}] - ${new Date().toLocaleTimeString()}`);
    
    for (const scan of scans) {
      if (completedScans.has(scan.id)) continue;
      
      try {
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
        const response = await axios.get(`${API_URL}/scans/${scan.id}`, { headers });
        const updatedScan = response.data.data;
        
        console.log(`Scan ${scan.id} (${scan.config.type}): ${TARGET_URL}`);
        console.log(`   Status: ${updatedScan.status}`);
        console.log(`   Progress: ${updatedScan.progress || 0}%`);
        
        if (updatedScan.pentest_tools_scan_id) {
          console.log(`   Pentest Tools ID: ${updatedScan.pentest_tools_scan_id}`);
        }
        
        if (updatedScan.status === 'completed') {
          console.log(`   ✅ Scan completed!`);
          console.log(`   Results: ${updatedScan.results?.length || 0} findings`);
          completedScans.set(scan.id, updatedScan);
        } else if (updatedScan.status === 'failed') {
          console.log(`   ❌ Scan failed: ${updatedScan.error_message}`);
          completedScans.set(scan.id, updatedScan);
        }
        
      } catch (error) {
        console.error(`   ❌ Error checking scan ${scan.id}:`, error.message);
      }
    }
    
    if (completedScans.size < scans.length) {
      // Wait 5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log(`\n✅ Monitoring complete. ${completedScans.size}/${scans.length} scans finished.`);
  return Array.from(completedScans.values());
}

// Step 4: Generate PDF reports
async function generatePDFReports(completedScans) {
  console.log('\n📄 Generating PDF reports...');
  
  const reportsDir = path.join(__dirname, 'scan-reports');
  await fs.mkdir(reportsDir, { recursive: true });
  
  for (const scan of completedScans) {
    if (scan.status !== 'completed') {
      console.log(`⏭️  Skipping failed scan ${scan.id}`);
      continue;
    }
    
    const filename = `scan-${scan.id}-${scan.type}-report.pdf`;
    const filepath = path.join(reportsDir, filename);
    
    console.log(`\n📝 Generating PDF for scan ${scan.id} (${scan.type})...`);
    
    // Create PDF document
    const doc = new PDFDocument();
    const stream = doc.pipe(fs.createWriteStream(filepath));
    
    // PDF Header
    doc.fontSize(24).text('Security Scan Report', { align: 'center' });
    doc.moveDown();
    
    // Scan Information
    doc.fontSize(16).text('Scan Details', { underline: true });
    doc.fontSize(12);
    doc.text(`Scan ID: ${scan.id}`);
    doc.text(`Type: ${scan.type}`);
    doc.text(`Target: ${scan.target}`);
    doc.text(`Status: ${scan.status}`);
    doc.text(`Started: ${new Date(scan.started_at).toLocaleString()}`);
    doc.text(`Completed: ${new Date(scan.completed_at).toLocaleString()}`);
    
    if (scan.pentest_tools_scan_id) {
      doc.text(`Pentest-tools ID: ${scan.pentest_tools_scan_id}`);
    }
    
    doc.moveDown();
    
    // Results Summary
    doc.fontSize(16).text('Results Summary', { underline: true });
    doc.fontSize(12);
    
    if (scan.results && scan.results.length > 0) {
      const severityCounts = scan.results.reduce((acc, result) => {
        acc[result.severity] = (acc[result.severity] || 0) + 1;
        return acc;
      }, {});
      
      doc.text(`Total Findings: ${scan.results.length}`);
      Object.entries(severityCounts).forEach(([severity, count]) => {
        doc.text(`${severity}: ${count}`);
      });
      
      // Detailed Findings
      doc.moveDown();
      doc.fontSize(16).text('Detailed Findings', { underline: true });
      
      scan.results.forEach((result, index) => {
        doc.moveDown();
        doc.fontSize(14).text(`${index + 1}. ${result.title}`, { underline: true });
        doc.fontSize(12);
        doc.text(`Severity: ${result.severity}`);
        doc.text(`Type: ${result.type}`);
        doc.text(`Description: ${result.description}`);
        
        if (result.affected_component) {
          doc.text(`Affected Component: ${result.affected_component}`);
        }
        
        if (result.recommendation) {
          doc.text(`Recommendation: ${result.recommendation}`);
        }
      });
    } else {
      doc.text('No vulnerabilities found or scan data not available.');
    }
    
    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text('Cobytes Security Platform', { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
    await new Promise((resolve) => stream.on('finish', resolve));
    console.log(`✅ PDF saved: ${filepath}`);
  }
}

// Main test execution
async function runCompleteTest() {
  console.log('🚀 Starting complete scan workflow test\n');
  console.log('Target: ' + TARGET_URL);
  console.log('================================\n');
  
  try {
    // Step 1: Login (optional, will continue if fails)
    await login();
    
    // Step 2: Create 3 different scans
    const scans = await createScans();
    
    if (scans.length === 0) {
      console.log('\n❌ No scans were created. Test cannot continue.');
      return;
    }
    
    // Step 3: Monitor progress with live updates
    const completedScans = await monitorScans(scans);
    
    // Step 4: Generate PDF reports
    await generatePDFReports(completedScans);
    
    console.log('\n✅ Complete scan workflow test finished!');
    console.log(`📁 Reports saved in: ${path.join(__dirname, 'scan-reports')}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
runCompleteTest();