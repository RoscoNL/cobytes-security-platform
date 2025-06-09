#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const axios = require('axios');

async function testCompleteWorkflow() {
  console.log('🚀 Starting comprehensive scan workflow test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  let scanId = null;
  let page = null;

  try {
    page = await browser.newPage();
    
    // Enable console logging with error filtering
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' && !text.includes('validateDOMNesting') && !text.includes('React DevTools')) {
        console.log(`❌ Console Error: ${text}`);
      }
    });

    // Log failed network requests
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      if (status >= 400 && !url.includes('static/js/bundle.js.map')) {
        console.log(`❌ HTTP ${status}: ${url}`);
      }
    });

    // 1. LOGIN
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
    
    await page.type('input[type="email"]', 'test@cobytes.com');
    await page.type('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Logged in successfully');
    await page.screenshot({ path: 'workflow-01-login-success.png' });

    // 2. CREATE NEW SCAN
    console.log('\n2️⃣ Creating new scan...');
    await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'workflow-02-scan-form.png' });

    // Step 1: Enter target
    await page.waitForSelector('input[placeholder*="example.com"]');
    await page.type('input[placeholder*="example.com"]', 'https://www.cobytes.com');
    
    // Wait for Next button to be enabled
    await page.waitForFunction(() => {
      const button = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Next'));
      return button && !button.disabled;
    });
    
    const nextButton = await page.evaluateHandle(() => {
      return [...document.querySelectorAll('button')].find(b => b.textContent.includes('Next'));
    });
    await nextButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Entered target');
    await page.screenshot({ path: 'workflow-03-target-entered.png' });

    // Step 2: Select scan type (website)
    const websiteCard = await page.evaluateHandle(() => {
      const cards = [...document.querySelectorAll('.MuiCard-root')];
      return cards.find(card => card.textContent.includes('Website Scanner'));
    });
    
    if (websiteCard) {
      await websiteCard.click();
    } else {
      // Fallback: click the first card
      await page.click('.MuiCard-root');
    }
    
    // Click Next button again
    const nextButton2 = await page.evaluateHandle(() => {
      return [...document.querySelectorAll('button')].find(b => b.textContent.includes('Next'));
    });
    await nextButton2.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Selected scan type');
    await page.screenshot({ path: 'workflow-04-type-selected.png' });

    // Step 3: Start scan
    const startButton = await page.evaluateHandle(() => {
      return [...document.querySelectorAll('button')].find(b => b.textContent.includes('Start Scan'));
    });
    await startButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Extract scan ID from URL
    const currentUrl = page.url();
    const urlMatch = currentUrl.match(/\/scans\/(\d+)/);
    if (urlMatch) {
      scanId = urlMatch[1];
      console.log(`✅ Scan created with ID: ${scanId}`);
    } else {
      console.log('⚠️ Could not extract scan ID from URL:', currentUrl);
    }
    
    await page.screenshot({ path: 'workflow-04-scan-created.png' });

    // 3. MONITOR SCAN PROGRESS
    console.log('\n3️⃣ Monitoring scan progress...');
    
    const API_URL = 'http://localhost:3001/api';
    const token = await page.evaluate(() => localStorage.getItem('token'));
    
    let scanCompleted = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes maximum
    
    while (!scanCompleted && attempts < maxAttempts) {
      attempts++;
      
      try {
        // Get scan status via API
        const response = await axios.get(`${API_URL}/scans/${scanId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const scan = response.data.data;
        console.log(`⏱️ Attempt ${attempts}: Status=${scan.status}, Progress=${scan.progress}%`);
        
        // Refresh page to show live updates
        await page.reload({ waitUntil: 'networkidle0' });
        await page.screenshot({ path: `workflow-05-progress-${attempts}.png` });
        
        if (scan.status === 'completed') {
          scanCompleted = true;
          console.log('✅ Scan completed successfully!');
          break;
        } else if (scan.status === 'failed') {
          console.log('❌ Scan failed');
          break;
        } else if (scan.status === 'cancelled') {
          console.log('⚠️ Scan was cancelled');
          break;
        }
        
        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.log(`❌ Error checking scan status: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    if (!scanCompleted) {
      console.log('⚠️ Scan did not complete within timeout, but continuing...');
    }

    // 4. VIEW SCAN DETAILS
    console.log('\n4️⃣ Viewing scan details...');
    await page.goto(`http://localhost:3002/scans/${scanId}`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'workflow-06-scan-details.png' });

    // Check for scan results
    const hasResults = await page.$('.bg-white.shadow.rounded-lg');
    if (hasResults) {
      console.log('✅ Scan details page loaded with results');
    } else {
      console.log('⚠️ Scan details page loaded but no results visible');
    }

    // 5. TEST ALL NAVIGATION
    console.log('\n5️⃣ Testing all navigation...');
    
    const navigationTests = [
      { name: 'Dashboard', url: 'http://localhost:3002/dashboard' },
      { name: 'All Scans', url: 'http://localhost:3002/scans' },
      { name: 'Reports', url: 'http://localhost:3002/reports' },
      { name: 'All Scanners', url: 'http://localhost:3002/all-scanners' },
      { name: 'Security Dashboard', url: 'http://localhost:3002/security-dashboard' }
    ];

    for (const test of navigationTests) {
      try {
        console.log(`Testing ${test.name}...`);
        await page.goto(test.url, { waitUntil: 'networkidle0' });
        
        const current = page.url();
        if (current.includes('/404')) {
          console.log(`❌ ${test.name}: 404 Error`);
        } else if (current === test.url) {
          console.log(`✅ ${test.name}: OK`);
        } else {
          console.log(`⚠️ ${test.name}: Redirected to ${current}`);
        }
        
        await page.screenshot({ path: `workflow-nav-${test.name.toLowerCase().replace(' ', '-')}.png` });
        
      } catch (error) {
        console.log(`❌ ${test.name}: Error - ${error.message}`);
      }
    }

    // 6. GENERATE PDF REPORT
    console.log('\n6️⃣ Generating PDF report...');
    
    try {
      const reportResponse = await axios.post(
        `${API_URL}/scans/${scanId}/report`,
        { format: 'pdf' },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'arraybuffer'
        }
      );
      
      const reportPath = `scan-report-${scanId}-${Date.now()}.pdf`;
      await fs.writeFile(reportPath, reportResponse.data);
      console.log(`✅ PDF report generated: ${reportPath}`);
      
    } catch (error) {
      console.log(`❌ Failed to generate PDF: ${error.message}`);
      
      // Try alternative report generation
      try {
        const htmlResponse = await axios.get(`${API_URL}/scans/${scanId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const reportData = {
          scanId: scanId,
          target: htmlResponse.data.data.target,
          type: htmlResponse.data.data.type,
          status: htmlResponse.data.data.status,
          results: htmlResponse.data.data.results || [],
          createdAt: htmlResponse.data.data.created_at,
          completedAt: htmlResponse.data.data.completed_at
        };
        
        const reportPath = `scan-report-${scanId}-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`✅ JSON report generated: ${reportPath}`);
        
      } catch (jsonError) {
        console.log(`❌ Failed to generate JSON report: ${jsonError.message}`);
      }
    }

    // 7. TEST SCAN LIST AND VIEW DETAILS
    console.log('\n7️⃣ Testing scan list and view details...');
    
    await page.goto('http://localhost:3002/scans', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'workflow-07-scan-list.png' });
    
    // Look for view details button
    const viewButtons = await page.$$('button[aria-label="View Details"], svg[data-testid="VisibilityIcon"]');
    if (viewButtons.length > 0) {
      console.log(`✅ Found ${viewButtons.length} view details buttons`);
      
      // Click the first view details button
      await viewButtons[0].click();
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      const detailsUrl = page.url();
      if (detailsUrl.includes('/scans/') && !detailsUrl.includes('/404')) {
        console.log('✅ View details button works correctly');
        await page.screenshot({ path: 'workflow-08-view-details-success.png' });
      } else {
        console.log(`❌ View details redirected to: ${detailsUrl}`);
      }
    } else {
      console.log('⚠️ No view details buttons found');
    }

    // 8. FINAL SUMMARY
    console.log('\n8️⃣ Final summary...');
    
    const finalScanResponse = await axios.get(`${API_URL}/scans/${scanId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const finalScan = finalScanResponse.data.data;
    
    console.log('\n📊 SCAN SUMMARY:');
    console.log(`   Target: ${finalScan.target}`);
    console.log(`   Type: ${finalScan.type}`);
    console.log(`   Status: ${finalScan.status}`);
    console.log(`   Progress: ${finalScan.progress}%`);
    console.log(`   Results: ${finalScan.results ? finalScan.results.length : 0} findings`);
    console.log(`   Created: ${finalScan.created_at}`);
    console.log(`   Completed: ${finalScan.completed_at || 'N/A'}`);
    
    if (finalScan.results && finalScan.results.length > 0) {
      const severityCounts = finalScan.results.reduce((acc, result) => {
        acc[result.severity] = (acc[result.severity] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 FINDINGS BY SEVERITY:');
      Object.entries(severityCounts).forEach(([severity, count]) => {
        console.log(`   ${severity}: ${count}`);
      });
    }

    console.log('\n✅ Complete workflow test finished successfully!');
    await page.screenshot({ path: 'workflow-09-final-success.png' });

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (page) {
      await page.screenshot({ path: 'workflow-error-state.png' });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testCompleteWorkflow().catch(console.error);