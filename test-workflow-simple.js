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
  console.log(`📸 Screenshot: ${name}`);
  return filename;
};

// Main test function
async function runWorkflowTest() {
  console.log('🚀 Starting Security Platform Workflow Test\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Monitor network requests
  await page.setRequestInterception(true);
  let apiCalls = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiCalls.push({
        method: request.method(),
        url: request.url(),
        timestamp: new Date().toISOString()
      });
    }
    request.continue();
  });

  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`API: ${response.status()} ${response.url().replace(API_URL, '')}`);
    }
  });

  try {
    // 1. Test Landing Page
    console.log('1️⃣ Testing Landing Page');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '01-landing');
    
    // Check if we're on the landing page by looking for common elements
    const pageTitle = await page.title();
    console.log(`   Page title: ${pageTitle}`);
    
    // 2. Navigate to Login
    console.log('\n2️⃣ Testing Login Flow');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '02-login-page');
    
    // Fill login form
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.type('input[type="email"]', TEST_USER.email);
      await page.type('input[type="password"]', TEST_USER.password);
      await takeScreenshot(page, '03-login-filled');
      
      // Submit login
      await page.keyboard.press('Enter');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log(`   ✅ Login submitted`);
      
      const afterLoginUrl = page.url();
      console.log(`   Redirected to: ${afterLoginUrl}`);
      await takeScreenshot(page, '04-after-login');
      
    } catch (error) {
      console.log(`   ⚠️ Login form not found or error: ${error.message}`);
    }
    
    // 3. Navigate to Scans
    console.log('\n3️⃣ Testing Scans Page');
    await page.goto(`${BASE_URL}/scans`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '05-scans-list');
    
    // 4. Create New Scan
    console.log('\n4️⃣ Testing New Scan Creation');
    await page.goto(`${BASE_URL}/scans/new`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '06-new-scan-page');
    
    // Look for scan type options
    const scanTypes = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
      return buttons.map(btn => btn.textContent).filter(text => text && text.length < 50);
    });
    console.log(`   Found ${scanTypes.length} buttons/options`);
    
    // Try to select WordPress scan
    const wordpressScan = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const wpElement = elements.find(el => 
        el.textContent && el.textContent.toLowerCase().includes('wordpress') && 
        (el.tagName === 'BUTTON' || el.tagName === 'DIV' || el.tagName === 'LABEL')
      );
      if (wpElement) {
        wpElement.click();
        return true;
      }
      return false;
    });
    
    if (wordpressScan) {
      console.log(`   ✅ Selected WordPress scan`);
      await page.waitForTimeout(1000);
    }
    
    // Fill URL field
    try {
      const urlInputs = await page.$$('input[type="text"], input[type="url"]');
      console.log(`   Found ${urlInputs.length} input fields`);
      
      if (urlInputs.length > 0) {
        // Try to find the right input field
        for (const input of urlInputs) {
          const placeholder = await input.evaluate(el => el.placeholder);
          const name = await input.evaluate(el => el.name);
          console.log(`   Input field: name="${name}", placeholder="${placeholder}"`);
          
          if (placeholder && placeholder.toLowerCase().includes('url') || 
              name && (name.includes('url') || name.includes('target'))) {
            await input.click();
            await input.type(TARGET_URL);
            console.log(`   ✅ Entered URL: ${TARGET_URL}`);
            break;
          }
        }
      }
      
      await takeScreenshot(page, '07-scan-configured');
      
      // Try to start scan
      const startButtons = await page.$$('button[type="submit"], button');
      for (const button of startButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && (text.includes('Start') || text.includes('Scan') || text.includes('Submit'))) {
          await button.click();
          console.log(`   ✅ Clicked "${text}" button`);
          break;
        }
      }
      
      await page.waitForTimeout(3000);
      await takeScreenshot(page, '08-scan-started');
      
    } catch (error) {
      console.log(`   ⚠️ Error creating scan: ${error.message}`);
    }
    
    // 5. Monitor Progress
    console.log('\n5️⃣ Monitoring Scan Progress');
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(3000);
      
      const progress = await page.evaluate(() => {
        const progressBar = document.querySelector('[role="progressbar"]');
        const statusText = Array.from(document.querySelectorAll('*'))
          .find(el => el.textContent && el.textContent.match(/\d+%/));
        
        return {
          progressBar: progressBar ? progressBar.getAttribute('aria-valuenow') : null,
          statusText: statusText ? statusText.textContent : null
        };
      });
      
      if (progress.progressBar || progress.statusText) {
        console.log(`   Progress update ${i+1}: ${JSON.stringify(progress)}`);
      }
      
      if (i === 2) {
        await takeScreenshot(page, '09-scan-progress');
      }
    }
    
    // 6. Check for Results
    console.log('\n6️⃣ Checking for Results');
    await page.waitForTimeout(5000);
    
    const results = await page.evaluate(() => {
      const resultElements = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const text = el.textContent || '';
          return (text.includes('vulnerability') || text.includes('issue') || 
                  text.includes('finding') || text.includes('result')) &&
                 el.children.length < 3;
        });
      return resultElements.slice(0, 5).map(el => el.textContent.trim());
    });
    
    if (results.length > 0) {
      console.log(`   ✅ Found ${results.length} potential results`);
    }
    
    await takeScreenshot(page, '10-scan-results');
    
    // 7. Report Generation
    console.log('\n7️⃣ Testing Report Generation');
    const reportButtons = await page.$$('button, a');
    let reportButtonFound = false;
    
    for (const button of reportButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.toLowerCase().includes('report')) {
        await button.click();
        console.log(`   ✅ Clicked report button`);
        reportButtonFound = true;
        break;
      }
    }
    
    if (reportButtonFound) {
      await page.waitForTimeout(3000);
      await takeScreenshot(page, '11-report-page');
    }
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`Total API calls made: ${apiCalls.length}`);
    console.log(`Screenshots saved: ${fs.readdirSync(screenshotsDir).length}`);
    console.log(`\nCheck screenshots in: ${screenshotsDir}`);
    
    // Save API calls log
    fs.writeFileSync(
      path.join(screenshotsDir, 'api-calls.json'), 
      JSON.stringify(apiCalls, null, 2)
    );
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await takeScreenshot(page, 'error-final');
  } finally {
    console.log('\nTest completed. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
runWorkflowTest().catch(console.error);