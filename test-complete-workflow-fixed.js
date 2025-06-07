const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';
const API_URL = 'http://localhost:3001/api';

// Test credentials
const TEST_USER = {
  email: 'test@cobytes.com',
  password: 'Test123!@#'
};

// Target URL for WordPress scan
const TARGET_URL = 'https://www.cobytes.com';

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Helper function to take screenshot
const takeScreenshot = async (page, name) => {
  const filename = path.join(screenshotsDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
};

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main test function
async function runCompleteWorkflowTest() {
  console.log('🚀 Starting complete workflow test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser console error:', msg.text());
    }
  });

  // Set up request interception to log API calls
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('🔄 API Call:', request.method(), request.url());
    }
    request.continue();
  });

  page.on('response', response => {
    if (response.url().includes('/api/') && response.status() !== 200 && response.status() !== 201) {
      console.log('⚠️  API Response:', response.status(), response.url());
    }
  });

  try {
    // Test 1: Navigation Test
    console.log('📍 TEST 1: Navigation Test');
    console.log('=======================');
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, '01-landing-page');
    
    // Check if we're on the landing page
    const isLanding = await page.$('.hero-section, [class*="landing"], [class*="home"]');
    console.log('Landing page loaded:', !!isLanding);
    
    await wait(2000);

    // Test 2: Authentication Test
    console.log('\n📍 TEST 2: Authentication Test');
    console.log('============================');
    
    // Try to navigate to login
    const loginLink = await page.$('a[href*="login"], button:contains("Login"), button:contains("Sign In")');
    if (loginLink) {
      await loginLink.click();
      await wait(2000);
    } else {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    }
    
    await takeScreenshot(page, '02-login-page');
    
    // Try to login
    try {
      await page.type('input[type="email"], input[name="email"]', TEST_USER.email);
      await page.type('input[type="password"], input[name="password"]', TEST_USER.password);
      await takeScreenshot(page, '03-login-filled');
      
      // Submit form
      const submitButton = await page.$('button[type="submit"], button:contains("Login"), button:contains("Sign In")');
      if (submitButton) {
        await Promise.all([
          submitButton.click(),
          page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
      }
      
      console.log('✅ Login attempted');
      await wait(2000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);
      
      if (currentUrl.includes('dashboard') || currentUrl.includes('scans')) {
        console.log('✅ Successfully logged in');
      }
      
    } catch (error) {
      console.log('⚠️  Login error:', error.message);
    }
    
    await takeScreenshot(page, '04-after-auth');

    // Test 3: Navigate to Scans
    console.log('\n📍 TEST 3: Navigate to Scans');
    console.log('===========================');
    
    // Try to go to scans page
    const scansLink = await page.$('a[href*="scans"], a:contains("Scans")');
    if (scansLink) {
      await scansLink.click();
      await wait(2000);
    } else {
      await page.goto(`${BASE_URL}/scans`, { waitUntil: 'networkidle2' });
    }
    
    await takeScreenshot(page, '05-scans-page');
    
    // Look for new scan button
    const newScanButton = await page.$('button:contains("New Scan"), a[href*="new"], button:contains("Start Scan")');
    if (newScanButton) {
      await newScanButton.click();
      await wait(2000);
    } else {
      await page.goto(`${BASE_URL}/scans/new`, { waitUntil: 'networkidle2' });
    }
    
    await takeScreenshot(page, '06-new-scan-page');

    // Test 4: Create WordPress Scan
    console.log('\n📍 TEST 4: Create WordPress Scan');
    console.log('===============================');
    
    try {
      // Find WordPress scan option
      const scanTypes = await page.$$eval('button, div[role="button"], .scan-type, [class*="scan-type"]', elements => 
        elements.map(el => ({ 
          text: el.textContent, 
          class: el.className,
          id: el.id 
        }))
      );
      
      console.log('Found scan type elements:', scanTypes.length);
      
      // Click WordPress scan if found
      const wordpressOption = await page.evaluateHandle(() => {
        const elements = Array.from(document.querySelectorAll('button, div[role="button"], .scan-type, [class*="scan-type"]'));
        return elements.find(el => el.textContent.toLowerCase().includes('wordpress'));
      });
      
      if (wordpressOption) {
        await wordpressOption.click();
        console.log('✅ Selected WordPress scan');
        await wait(1000);
      }
      
      // Fill in target URL
      const urlInput = await page.$('input[name="target"], input[name="url"], input[placeholder*="URL"], input[placeholder*="url"], input[type="url"]');
      if (urlInput) {
        await urlInput.type(TARGET_URL);
        console.log(`✅ Entered target URL: ${TARGET_URL}`);
      }
      
      await takeScreenshot(page, '07-scan-form-filled');
      
      // Start scan
      const startButton = await page.$('button[type="submit"], button:contains("Start"), button:contains("Scan"), button:contains("Begin")');
      if (startButton) {
        await startButton.click();
        console.log('✅ Scan started');
        await wait(3000);
      }
      
      await takeScreenshot(page, '08-scan-started');
      
    } catch (error) {
      console.log('❌ Scan creation error:', error.message);
    }

    // Test 5: Monitor Progress
    console.log('\n📍 TEST 5: Monitor Scan Progress');
    console.log('================================');
    
    try {
      let progressChecks = 0;
      const maxChecks = 10;
      
      while (progressChecks < maxChecks) {
        const progressData = await page.evaluate(() => {
          const progressBar = document.querySelector('[role="progressbar"], .progress-bar, [class*="progress"]');
          const statusElement = document.querySelector('.scan-status, [class*="status"], .status');
          const percentElement = document.querySelector('[class*="percent"], .percentage');
          
          return {
            progress: progressBar ? progressBar.getAttribute('aria-valuenow') || progressBar.style.width : null,
            status: statusElement ? statusElement.textContent : null,
            percent: percentElement ? percentElement.textContent : null
          };
        });
        
        if (progressData.progress || progressData.status || progressData.percent) {
          console.log(`Progress update ${progressChecks + 1}:`, progressData);
        }
        
        if (progressChecks === 5) {
          await takeScreenshot(page, '09-scan-progress');
        }
        
        await wait(2000);
        progressChecks++;
      }
      
    } catch (error) {
      console.log('⚠️  Progress monitoring error:', error.message);
    }

    // Test 6: Check Results
    console.log('\n📍 TEST 6: Check Scan Results');
    console.log('============================');
    
    try {
      // Wait a bit for results
      await wait(5000);
      
      const results = await page.evaluate(() => {
        const resultElements = document.querySelectorAll('.result, .vulnerability, [class*="finding"], [class*="issue"]');
        return Array.from(resultElements).slice(0, 5).map(el => el.textContent);
      });
      
      if (results.length > 0) {
        console.log('✅ Found scan results:', results.length);
        results.forEach((result, i) => console.log(`  ${i + 1}. ${result.substring(0, 50)}...`));
      }
      
      await takeScreenshot(page, '10-scan-results');
      
    } catch (error) {
      console.log('⚠️  Results check error:', error.message);
    }

    // Test 7: Generate Report
    console.log('\n📍 TEST 7: Generate Report');
    console.log('=========================');
    
    try {
      const reportButton = await page.$('button:contains("Report"), button:contains("Generate"), a:contains("Report")');
      if (reportButton) {
        await reportButton.click();
        console.log('✅ Report generation initiated');
        await wait(3000);
        await takeScreenshot(page, '11-report-generation');
      }
      
      // Look for download button
      const downloadButton = await page.$('button:contains("Download"), a:contains("Download"), a[href*="pdf"]');
      if (downloadButton) {
        console.log('✅ Download button found');
        await takeScreenshot(page, '12-report-download');
      }
      
    } catch (error) {
      console.log('⚠️  Report generation error:', error.message);
    }

    // Final summary
    console.log('\n🎉 TEST SUMMARY');
    console.log('================');
    console.log('All tests completed. Check screenshots folder for visual verification.');
    console.log(`Screenshots saved in: ${screenshotsDir}`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    await wait(5000); // Keep browser open for 5 seconds
    await browser.close();
  }
}

// Run the test
runCompleteWorkflowTest().catch(console.error);