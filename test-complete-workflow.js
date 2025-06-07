const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3002';
const API_URL = 'http://localhost:3001/api';

// Test credentials
const TEST_USER = {
  email: 'test@cobytes.com',
  password: 'Test123!@#'
};

// Target URL for WordPress scan
const TARGET_URL = 'https://www.cobytes.com';

// Helper function to wait and log
const waitAndLog = async (page, selector, message) => {
  console.log(`⏳ Waiting for: ${message}`);
  await page.waitForSelector(selector, { timeout: 30000 });
  console.log(`✅ Found: ${message}`);
};

// Helper function to take screenshot
const takeScreenshot = async (page, name) => {
  const filename = `screenshots/${name}-${Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
};

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

  try {
    // Test 1: Navigation Test
    console.log('📍 TEST 1: Navigation Test');
    console.log('=======================');
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'landing-page');
    
    // Check if main navigation elements exist
    const navItems = await page.$$eval('nav a', links => links.map(link => ({
      text: link.textContent,
      href: link.href
    })));
    console.log('Navigation items found:', navItems);
    
    // Test navigation to different pages
    const pagesToTest = ['/dashboard', '/scans', '/how-to', '/pricing'];
    for (const pageUrl of pagesToTest) {
      try {
        await page.goto(`${BASE_URL}${pageUrl}`, { waitUntil: 'networkidle2' });
        console.log(`✅ Successfully navigated to ${pageUrl}`);
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log(`❌ Failed to navigate to ${pageUrl}:`, error.message);
      }
    }
    
    console.log('\n✅ Navigation test completed\n');

    // Test 2: Authentication Test
    console.log('📍 TEST 2: Authentication Test');
    console.log('============================');
    
    // Go to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'login-page');
    
    // Try to fill login form
    try {
      await page.type('input[type="email"]', TEST_USER.email);
      await page.type('input[type="password"]', TEST_USER.password);
      await takeScreenshot(page, 'login-filled');
      
      // Submit login form
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
      
      console.log('✅ Login submitted');
      
      // Check if redirected to dashboard
      if (page.url().includes('/dashboard')) {
        console.log('✅ Successfully logged in and redirected to dashboard');
      } else {
        console.log('⚠️  Login completed but not redirected to dashboard');
      }
    } catch (error) {
      console.log('❌ Login failed:', error.message);
      // Try to register if login fails
      console.log('Attempting to register new user...');
      
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });
      // Add registration logic here if needed
    }
    
    await takeScreenshot(page, 'after-auth');
    console.log('\n✅ Authentication test completed\n');

    // Test 3: WordPress Scan Creation
    console.log('📍 TEST 3: WordPress Scan Creation');
    console.log('=================================');
    
    // Navigate to new scan page
    await page.goto(`${BASE_URL}/scans/new`, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'new-scan-page');
    
    try {
      // Select WordPress scan type
      const scanTypes = await page.$$eval('button, div[role="button"]', elements => 
        elements.map(el => ({ text: el.textContent, class: el.className }))
      );
      console.log('Available scan types:', scanTypes.filter(s => s.text.toLowerCase().includes('wordpress')));
      
      // Click on WordPress scan
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
        const wordpressButton = buttons.find(btn => 
          btn.textContent.toLowerCase().includes('wordpress')
        );
        if (wordpressButton) wordpressButton.click();
      });
      
      await page.waitForTimeout(1000);
      
      // Fill in the target URL
      await page.type('input[name="target"], input[placeholder*="URL"], input[placeholder*="url"]', TARGET_URL);
      console.log(`✅ Entered target URL: ${TARGET_URL}`);
      
      await takeScreenshot(page, 'scan-form-filled');
      
      // Start the scan
      const startButton = await page.$('button[type="submit"], button:has-text("Start"), button:has-text("Scan")');
      if (startButton) {
        await startButton.click();
        console.log('✅ Scan started');
      }
      
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'scan-started');
      
    } catch (error) {
      console.log('❌ Failed to create scan:', error.message);
    }
    
    console.log('\n✅ Scan creation test completed\n');

    // Test 4: Real-time Progress Updates
    console.log('📍 TEST 4: Real-time Progress Updates');
    console.log('====================================');
    
    try {
      // Wait for scan progress indicators
      console.log('Waiting for progress updates...');
      
      let progressChecks = 0;
      const maxChecks = 30; // Check for 30 seconds
      
      while (progressChecks < maxChecks) {
        const progress = await page.evaluate(() => {
          // Look for progress indicators
          const progressBar = document.querySelector('[role="progressbar"], .progress-bar, .progress');
          const statusText = document.querySelector('.scan-status, .status, [class*="status"]');
          const percentText = document.querySelector('.percentage, [class*="percent"]');
          
          return {
            progressBar: progressBar ? progressBar.getAttribute('aria-valuenow') || progressBar.style.width : null,
            status: statusText ? statusText.textContent : null,
            percentage: percentText ? percentText.textContent : null
          };
        });
        
        if (progress.progressBar || progress.status || progress.percentage) {
          console.log(`Progress update: ${JSON.stringify(progress)}`);
          await takeScreenshot(page, `scan-progress-${progressChecks}`);
        }
        
        await page.waitForTimeout(1000);
        progressChecks++;
      }
      
      console.log('✅ Progress monitoring completed');
      
    } catch (error) {
      console.log('❌ Failed to monitor progress:', error.message);
    }
    
    console.log('\n✅ Progress update test completed\n');

    // Test 5: Scan Results Display
    console.log('📍 TEST 5: Scan Results Display');
    console.log('==============================');
    
    try {
      // Wait for scan completion
      await page.waitForSelector('.scan-complete, .results, [class*="result"]', { timeout: 60000 });
      console.log('✅ Scan completed');
      
      await takeScreenshot(page, 'scan-results');
      
      // Extract results data
      const results = await page.evaluate(() => {
        const resultElements = document.querySelectorAll('.vulnerability, .finding, [class*="issue"]');
        return Array.from(resultElements).map(el => el.textContent).slice(0, 5);
      });
      
      console.log('Found results:', results);
      
    } catch (error) {
      console.log('❌ Failed to get scan results:', error.message);
    }
    
    console.log('\n✅ Scan results test completed\n');

    // Test 6: Report Generation
    console.log('📍 TEST 6: Report Generation');
    console.log('===========================');
    
    try {
      // Look for report generation button
      const reportButton = await page.$('button:has-text("Report"), button:has-text("Generate"), a:has-text("Report")');
      if (reportButton) {
        await reportButton.click();
        console.log('✅ Report generation initiated');
        
        await page.waitForTimeout(3000);
        await takeScreenshot(page, 'report-generation');
      }
      
    } catch (error) {
      console.log('❌ Failed to generate report:', error.message);
    }
    
    console.log('\n✅ Report generation test completed\n');

    // Test 7: PDF Download
    console.log('📍 TEST 7: PDF Download Test');
    console.log('===========================');
    
    try {
      // Set up download handling
      const downloadPath = './downloads';
      await page._client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
      });
      
      // Look for download button
      const downloadButton = await page.$('button:has-text("Download"), a:has-text("Download"), a[href*=".pdf"]');
      if (downloadButton) {
        await downloadButton.click();
        console.log('✅ PDF download initiated');
        
        await page.waitForTimeout(5000);
        console.log('✅ Check downloads folder for PDF');
      }
      
    } catch (error) {
      console.log('❌ Failed to download PDF:', error.message);
    }
    
    console.log('\n✅ PDF download test completed\n');

    // Final summary
    console.log('🎉 COMPLETE WORKFLOW TEST FINISHED');
    console.log('==================================');
    console.log('Check the screenshots folder for visual verification');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the test
runCompleteWorkflowTest().catch(console.error);