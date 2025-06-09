const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:3002';
const BACKEND_URL = 'http://localhost:3001';

async function testCompleteWorkflow() {
  console.log('=== TESTING COMPLETE SCAN WORKFLOW ===\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Click "Use test credentials"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const testCredButton = buttons.find(btn => btn.innerText.includes('Use test credentials'));
      if (testCredButton) testCredButton.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Submit login form
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log('✅ Logged in successfully');

    // Step 2: Navigate to New Scan
    console.log('\nStep 2: Navigating to New Scan page...');
    await page.goto(`${FRONTEND_URL}/scans/new`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'scan-1-new-scan-page.png' });
    
    // Step 3: Fill scan form
    console.log('\nStep 3: Filling scan form...');
    
    // Enter URL
    const urlInput = await page.$('input[name="target"], input[placeholder*="example.com"], input[type="url"]');
    if (urlInput) {
      await urlInput.type('https://www.cobytes.com');
      console.log('✅ Entered URL: https://www.cobytes.com');
    } else {
      console.log('❌ Could not find URL input field');
    }
    
    // Select WordPress scan type
    const scanTypeSelect = await page.$('select[name="type"], select[name="scan_type"]');
    if (scanTypeSelect) {
      await page.select('select[name="type"], select[name="scan_type"]', 'wordpress');
      console.log('✅ Selected WordPress scan type');
    } else {
      // Try clicking on WordPress option if it's a different UI
      const wordpressOption = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const wordpress = elements.find(el => 
          el.innerText && el.innerText.toLowerCase().includes('wordpress')
        );
        if (wordpress) {
          wordpress.click();
          return true;
        }
        return false;
      });
      
      if (wordpressOption) {
        console.log('✅ Selected WordPress scan option');
      } else {
        console.log('⚠️  Could not find WordPress scan option');
      }
    }
    
    await page.screenshot({ path: 'scan-2-form-filled.png' });
    
    // Step 4: Start scan
    console.log('\nStep 4: Starting scan...');
    const startButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(btn => 
        btn.innerText.toLowerCase().includes('start') || 
        btn.innerText.toLowerCase().includes('scan') ||
        btn.innerText.toLowerCase().includes('submit')
      );
      if (startBtn) {
        startBtn.click();
        return true;
      }
      return false;
    });
    
    if (startButton) {
      console.log('✅ Clicked start scan button');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.screenshot({ path: 'scan-3-scan-started.png' });
    } else {
      console.log('❌ Could not find start scan button');
    }
    
    // Step 5: Wait for scan to complete
    console.log('\nStep 5: Waiting for scan to complete...');
    let scanCompleted = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (!scanCompleted && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const status = await page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return {
          completed: bodyText.includes('completed') || bodyText.includes('complete'),
          failed: bodyText.includes('failed') || bodyText.includes('error'),
          progress: bodyText.match(/(\d+)%/) ? bodyText.match(/(\d+)%/)[1] : '0'
        };
      });
      
      if (status.completed) {
        scanCompleted = true;
        console.log('✅ Scan completed!');
      } else if (status.failed) {
        console.log('❌ Scan failed');
        break;
      } else {
        console.log(`   Progress: ${status.progress}%`);
      }
      
      attempts++;
    }
    
    await page.screenshot({ path: 'scan-4-scan-complete.png' });
    
    // Step 6: View scan results
    console.log('\nStep 6: Viewing scan results...');
    
    // Try to find and click on the scan result
    const viewResultsButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const viewBtn = buttons.find(btn => 
        btn.innerText.toLowerCase().includes('view') || 
        btn.innerText.toLowerCase().includes('results') ||
        btn.innerText.toLowerCase().includes('details')
      );
      if (viewBtn) {
        viewBtn.click();
        return true;
      }
      return false;
    });
    
    if (viewResultsButton) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Viewing scan results');
    }
    
    // Step 7: Generate PDF report
    console.log('\nStep 7: Generating PDF report...');
    
    // Look for download/export button
    const downloadButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const dlBtn = buttons.find(btn => 
        btn.innerText.toLowerCase().includes('download') || 
        btn.innerText.toLowerCase().includes('export') ||
        btn.innerText.toLowerCase().includes('pdf')
      );
      if (dlBtn) {
        dlBtn.click();
        return true;
      }
      return false;
    });
    
    if (downloadButton) {
      console.log('✅ Clicked download PDF button');
      
      // Wait for download
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if file was downloaded
      const downloadPath = '/Users/jeroenvanrossum/Downloads/';
      const files = fs.readdirSync(downloadPath);
      const pdfFile = files.find(file => 
        file.includes('cobytes') && file.endsWith('.pdf')
      );
      
      if (pdfFile) {
        console.log(`✅ PDF downloaded: ${pdfFile}`);
      } else {
        console.log('⚠️  PDF file not found in Downloads folder');
      }
    } else {
      console.log('❌ Could not find download PDF button');
    }
    
    await page.screenshot({ path: 'scan-5-final-results.png' });
    
    // Step 8: Check scan list
    console.log('\nStep 8: Checking scan list...');
    await page.goto(`${FRONTEND_URL}/scans`, { waitUntil: 'networkidle2' });
    
    const scansList = await page.evaluate(() => {
      const scans = Array.from(document.querySelectorAll('tr, [data-testid*="scan"], div[class*="scan"]'));
      return scans.filter(el => 
        el.innerText && el.innerText.includes('cobytes.com')
      ).length;
    });
    
    console.log(`✅ Found ${scansList} scan(s) for cobytes.com in scan list`);
    
    await page.screenshot({ path: 'scan-6-scan-list.png' });

  } catch (error) {
    console.error('\n❌ Error during workflow:', error.message);
    await page.screenshot({ path: 'scan-error.png' });
  } finally {
    console.log('\n\nWorkflow test completed. Check the screenshots for visual confirmation.');
    console.log('Screenshots saved:');
    console.log('- scan-1-new-scan-page.png');
    console.log('- scan-2-form-filled.png');
    console.log('- scan-3-scan-started.png');
    console.log('- scan-4-scan-complete.png');
    console.log('- scan-5-final-results.png');
    console.log('- scan-6-scan-list.png');
    
    await browser.close();
  }
}

testCompleteWorkflow().catch(console.error);