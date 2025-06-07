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
const screenshotsDir = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Helper to delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to take screenshot
const takeScreenshot = async (page, name) => {
  const filename = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 ${name}`);
  return filename;
};

async function testSecurityPlatform() {
  console.log('🚀 Testing Cobytes Security Platform\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const testResults = {
    navigation: false,
    authentication: false,
    scanCreation: false,
    scanProgress: false,
    scanResults: false,
    reportGeneration: false,
    pdfDownload: false
  };

  try {
    // Test 1: Navigation
    console.log('1️⃣ Testing Navigation');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await delay(2000);
    await takeScreenshot(page, '01-landing-page');
    
    const pageTitle = await page.title();
    console.log(`   Title: ${pageTitle}`);
    testResults.navigation = true;
    
    // Test 2: Authentication
    console.log('\n2️⃣ Testing Authentication');
    await page.goto(`${BASE_URL}/login`);
    await delay(2000);
    await takeScreenshot(page, '02-login-page');
    
    // Try to find and fill login form
    const emailField = await page.$('input[type="email"]');
    const passwordField = await page.$('input[type="password"]');
    
    if (emailField && passwordField) {
      await emailField.type(TEST_USER.email);
      await passwordField.type(TEST_USER.password);
      await takeScreenshot(page, '03-login-filled');
      
      // Submit form
      await page.keyboard.press('Enter');
      await delay(3000);
      
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        console.log(`   ✅ Logged in successfully`);
        testResults.authentication = true;
      }
    } else {
      console.log(`   ⚠️  Login form not found`);
    }
    
    await takeScreenshot(page, '04-after-login');
    
    // Test 3: Scan Creation
    console.log('\n3️⃣ Testing Scan Creation');
    await page.goto(`${BASE_URL}/scans/new`);
    await delay(2000);
    await takeScreenshot(page, '05-new-scan-page');
    
    // Look for WordPress scan option
    const wpScanClicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, div, label'));
      const wpElement = elements.find(el => 
        el.textContent && el.textContent.toLowerCase().includes('wordpress')
      );
      if (wpElement) {
        wpElement.click();
        return true;
      }
      return false;
    });
    
    if (wpScanClicked) {
      console.log(`   ✅ Selected WordPress scan`);
      await delay(1000);
    }
    
    // Find and fill URL input
    const inputs = await page.$$('input');
    for (const input of inputs) {
      const type = await input.evaluate(el => el.type);
      const placeholder = await input.evaluate(el => el.placeholder);
      const name = await input.evaluate(el => el.name);
      
      if (type === 'text' || type === 'url') {
        if ((placeholder && placeholder.toLowerCase().includes('url')) || 
            (name && (name.includes('url') || name.includes('target')))) {
          await input.click();
          await page.keyboard.type(TARGET_URL);
          console.log(`   ✅ Entered target URL`);
          break;
        }
      }
    }
    
    await takeScreenshot(page, '06-scan-configured');
    
    // Start scan
    const startScanClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.includes('Start') || text.includes('Scan') || text.includes('Begin');
      });
      if (startButton) {
        startButton.click();
        return true;
      }
      return false;
    });
    
    if (startScanClicked) {
      console.log(`   ✅ Scan started`);
      testResults.scanCreation = true;
      await delay(3000);
    }
    
    await takeScreenshot(page, '07-scan-started');
    
    // Test 4: Monitor Progress
    console.log('\n4️⃣ Monitoring Scan Progress');
    let progressFound = false;
    
    for (let i = 0; i < 10; i++) {
      await delay(3000);
      
      const progressInfo = await page.evaluate(() => {
        // Look for progress indicators
        const progressBar = document.querySelector('[role="progressbar"], .progress-bar');
        const percentText = Array.from(document.querySelectorAll('*'))
          .find(el => el.textContent && el.textContent.match(/\d+%/));
        const statusElement = document.querySelector('.status, [class*="status"]');
        
        return {
          hasProgressBar: !!progressBar,
          progressValue: progressBar ? progressBar.getAttribute('aria-valuenow') : null,
          percentText: percentText ? percentText.textContent : null,
          status: statusElement ? statusElement.textContent : null
        };
      });
      
      if (progressInfo.hasProgressBar || progressInfo.percentText) {
        console.log(`   Progress: ${JSON.stringify(progressInfo)}`);
        progressFound = true;
        
        if (i === 3) {
          await takeScreenshot(page, '08-scan-progress');
        }
      }
    }
    
    testResults.scanProgress = progressFound;
    
    // Test 5: Check Results
    console.log('\n5️⃣ Checking Scan Results');
    await delay(5000);
    
    const resultsFound = await page.evaluate(() => {
      const keywords = ['vulnerability', 'finding', 'issue', 'result', 'threat', 'risk'];
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.some(el => {
        const text = (el.textContent || '').toLowerCase();
        return keywords.some(keyword => text.includes(keyword));
      });
    });
    
    if (resultsFound) {
      console.log(`   ✅ Scan results found`);
      testResults.scanResults = true;
    }
    
    await takeScreenshot(page, '09-scan-results');
    
    // Test 6: Report Generation
    console.log('\n6️⃣ Testing Report Generation');
    const reportClicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a'));
      const reportElement = elements.find(el => {
        const text = (el.textContent || '').toLowerCase();
        return text.includes('report') || text.includes('generate') || text.includes('export');
      });
      if (reportElement) {
        reportElement.click();
        return true;
      }
      return false;
    });
    
    if (reportClicked) {
      console.log(`   ✅ Report generation initiated`);
      testResults.reportGeneration = true;
      await delay(3000);
      await takeScreenshot(page, '10-report-page');
    }
    
    // Test 7: PDF Download
    console.log('\n7️⃣ Testing PDF Download');
    const downloadFound = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a'));
      return elements.some(el => {
        const text = (el.textContent || '').toLowerCase();
        const href = el.getAttribute('href') || '';
        return text.includes('download') || href.includes('.pdf');
      });
    });
    
    if (downloadFound) {
      console.log(`   ✅ Download option available`);
      testResults.pdfDownload = true;
    }
    
    await takeScreenshot(page, '11-final-state');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await takeScreenshot(page, 'error-state');
  }
  
  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  Object.entries(testResults).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  const passedTests = Object.values(testResults).filter(v => v).length;
  const totalTests = Object.values(testResults).length;
  console.log(`\nPassed: ${passedTests}/${totalTests} tests`);
  
  // Keep browser open for manual inspection
  console.log('\nBrowser will remain open for 10 seconds...');
  await delay(10000);
  
  await browser.close();
}

// Run the test
testSecurityPlatform().catch(console.error);