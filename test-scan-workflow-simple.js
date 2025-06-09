#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const axios = require('axios');

async function testScanWorkflow() {
  console.log('🚀 Testing scan workflow with existing scan...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // 1. LOGIN
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
    
    await page.type('input[type="email"]', 'test@cobytes.com');
    await page.type('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Logged in successfully');

    // 2. GET TOKEN AND CHECK LATEST SCAN
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const API_URL = 'http://localhost:3001/api';
    
    console.log('\n2️⃣ Checking latest scans...');
    const response = await axios.get(`${API_URL}/scans`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const scans = response.data.data;
    const latestScan = scans[0]; // Should be scan 33
    
    console.log(`📊 Latest scan: ID=${latestScan.id}, Target=${latestScan.target}, Status=${latestScan.status}`);

    // 3. NAVIGATE TO SCAN DETAILS
    console.log('\n3️⃣ Viewing scan details...');
    await page.goto(`http://localhost:3002/scans/${latestScan.id}`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'workflow-scan-details.png' });

    // 4. TEST ALL NAVIGATION ROUTES
    console.log('\n4️⃣ Testing navigation routes...');
    
    const routes = [
      { name: 'Dashboard', url: 'http://localhost:3002/dashboard' },
      { name: 'All Scans', url: 'http://localhost:3002/scans' },
      { name: 'Reports', url: 'http://localhost:3002/reports' },
      { name: 'All Scanners', url: 'http://localhost:3002/all-scanners' },
      { name: 'Security Dashboard', url: 'http://localhost:3002/security-dashboard' }
    ];

    for (const route of routes) {
      try {
        await page.goto(route.url, { waitUntil: 'networkidle0' });
        const currentUrl = page.url();
        
        if (currentUrl.includes('/404')) {
          console.log(`❌ ${route.name}: 404 Error`);
        } else {
          console.log(`✅ ${route.name}: OK`);
        }
        
        await page.screenshot({ path: `nav-${route.name.toLowerCase().replace(' ', '-')}.png` });
        
      } catch (error) {
        console.log(`❌ ${route.name}: Error - ${error.message}`);
      }
    }

    // 5. GENERATE REPORT FOR LATEST SCAN
    console.log('\n5️⃣ Generating scan report...');
    
    try {
      // Try PDF report first
      const reportResponse = await axios.post(
        `${API_URL}/scans/${latestScan.id}/report`,
        { format: 'pdf' },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'arraybuffer'
        }
      );
      
      const reportPath = `scan-report-${latestScan.id}-${Date.now()}.pdf`;
      await fs.writeFile(reportPath, reportResponse.data);
      console.log(`✅ PDF report generated: ${reportPath}`);
      
    } catch (error) {
      console.log(`❌ PDF generation failed: ${error.message}`);
      
      // Generate JSON report as fallback
      try {
        const scanData = await axios.get(`${API_URL}/scans/${latestScan.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const reportData = {
          scanId: latestScan.id,
          target: scanData.data.data.target,
          type: scanData.data.data.type,
          status: scanData.data.data.status,
          results: scanData.data.data.results || [],
          createdAt: scanData.data.data.created_at,
          completedAt: scanData.data.data.completed_at,
          pentestToolsId: scanData.data.data.pentest_tools_scan_id,
          progress: scanData.data.data.progress
        };
        
        const reportPath = `scan-report-${latestScan.id}-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`✅ JSON report generated: ${reportPath}`);
        
      } catch (jsonError) {
        console.log(`❌ JSON report failed: ${jsonError.message}`);
      }
    }

    // 6. VERIFY SCAN LIST NAVIGATION
    console.log('\n6️⃣ Testing scan list navigation...');
    
    await page.goto('http://localhost:3002/scans', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'scan-list-test.png' });
    
    // Look for view details buttons
    const viewButtons = await page.$$('button[aria-label="View Details"], [data-testid="VisibilityIcon"]');
    console.log(`Found ${viewButtons.length} view detail buttons`);
    
    if (viewButtons.length > 0) {
      // Click first view details button
      await viewButtons[0].click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      const detailsUrl = page.url();
      if (detailsUrl.includes('/scans/') && !detailsUrl.includes('/404')) {
        console.log('✅ View details navigation works correctly');
        await page.screenshot({ path: 'view-details-success.png' });
      } else {
        console.log(`❌ View details redirected to: ${detailsUrl}`);
      }
    }

    // 7. FINAL SUMMARY
    console.log('\n7️⃣ Final summary...');
    
    console.log('\n📊 WORKFLOW TEST SUMMARY:');
    console.log(`   Latest Scan ID: ${latestScan.id}`);
    console.log(`   Target: ${latestScan.target}`);
    console.log(`   Type: ${latestScan.type}`);
    console.log(`   Status: ${latestScan.status}`);
    console.log(`   Progress: ${latestScan.progress}%`);
    console.log(`   PentestTools ID: ${latestScan.pentest_tools_scan_id}`);
    console.log(`   Created: ${latestScan.created_at}`);
    console.log(`   Completed: ${latestScan.completed_at || 'N/A'}`);
    
    console.log('\n✅ Scan workflow test completed successfully!');
    await page.screenshot({ path: 'workflow-final-success.png' });

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testScanWorkflow().catch(console.error);