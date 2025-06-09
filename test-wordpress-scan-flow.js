const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'wordpress-scan-test');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testWordPressScan() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    console.log('Starting WordPress scan test...');

    // Step 1: Navigate to login page
    console.log('\n1. Navigating to login page...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png'), fullPage: true });

    // Step 2: Login with test credentials
    console.log('2. Logging in...');
    await page.type('input[name="email"]', 'admin@cobytes.com');
    await page.type('input[name="password"]', 'admin123');
    await page.screenshot({ path: path.join(screenshotsDir, '02-login-filled.png'), fullPage: true });
    
    await page.click('button[type="submit"]');
    await delay(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '03-after-login.png'), fullPage: true });

    // Step 3: Navigate to scan creation
    console.log('3. Navigating to scan creation...');
    await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle0' });
    await delay(2000);
    
    // Check if we got redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('Redirected to login, logging in again...');
      await page.type('input[name="email"]', 'admin@cobytes.com');
      await page.type('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await delay(3000);
      
      // Try navigating again
      await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle0' });
      await delay(2000);
    }
    
    await page.screenshot({ path: path.join(screenshotsDir, '04-scan-create-page.png'), fullPage: true });

    // Step 4: Enter target URL
    console.log('4. Entering target URL...');
    
    // Check if we're on the scan create page
    const pageTitle = await page.evaluate(() => document.querySelector('h4')?.textContent);
    console.log('Page title:', pageTitle);
    
    if (!pageTitle || !pageTitle.includes('Create New Security Scan')) {
      console.log('Not on scan create page, current URL:', page.url());
      throw new Error('Failed to navigate to scan create page');
    }
    
    await page.waitForSelector('input[placeholder*="example.com"]', { timeout: 10000 });
    await page.type('input[placeholder*="example.com"]', 'https://www.cobytes.com');
    await page.screenshot({ path: path.join(screenshotsDir, '05-target-entered.png'), fullPage: true });
    
    // Click Next
    const nextButtons = await page.$$('button');
    let nextButton = null;
    for (const button of nextButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('Next')) {
        nextButton = button;
        break;
      }
    }
    
    if (nextButton) {
      await nextButton.click();
    } else {
      throw new Error('Next button not found');
    }
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '06-scan-type-selection.png'), fullPage: true });

    // Step 5: Select WordPress scanner
    console.log('5. Selecting WordPress scanner...');
    // Click on the WordPress Scanner card
    const cards = await page.$$eval('.MuiCard-root', (cards, searchText) => {
      const index = cards.findIndex(card => card.textContent.includes(searchText));
      return index;
    }, 'WordPress Scanner');
    
    if (cards >= 0) {
      const cardElements = await page.$$('.MuiCard-root');
      await cardElements[cards].click();
    }
    await page.screenshot({ path: path.join(screenshotsDir, '07-wordpress-selected.png'), fullPage: true });
    
    // Click Next
    const nextButton2 = await page.waitForSelector('button:has-text("Next"):not([disabled])');
    await nextButton2.click();
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '08-confirmation-page.png'), fullPage: true });

    // Step 6: Start the scan
    console.log('6. Starting the scan...');
    const startButton = await page.waitForSelector('button:has-text("Start Scan")');
    await startButton.click();
    await delay(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '09-scan-started.png'), fullPage: true });

    // Step 7: Wait for redirect to scan details
    console.log('7. Waiting for scan details page...');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await delay(2000);
    const scanDetailsUrl = page.url();
    console.log('Current URL:', scanDetailsUrl);
    await page.screenshot({ path: path.join(screenshotsDir, '10-scan-details.png'), fullPage: true });

    // Step 8: Monitor scan progress
    console.log('8. Monitoring scan progress...');
    let scanComplete = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max

    while (!scanComplete && attempts < maxAttempts) {
      attempts++;
      await delay(10000); // Wait 10 seconds between checks
      
      await page.reload({ waitUntil: 'networkidle0' });
      await page.screenshot({ 
        path: path.join(screenshotsDir, `11-scan-progress-${attempts}.png`), 
        fullPage: true 
      });

      // Check if scan is complete
      const pageContent = await page.content();
      if (pageContent.includes('COMPLETED') || pageContent.includes('completed')) {
        scanComplete = true;
        console.log('Scan completed!');
      } else {
        console.log(`Scan still in progress... (check ${attempts}/${maxAttempts})`);
      }
    }

    // Step 9: Generate PDF report
    if (scanComplete) {
      console.log('9. Generating PDF report...');
      
      // Look for download/export button
      const exportButton = await page.$('button:has-text("Export"), button:has-text("Download")');
      if (exportButton) {
        await exportButton.click();
        await delay(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '12-export-clicked.png'), fullPage: true });
        
        // Look for PDF option
        const pdfOption = await page.$('text=PDF');
        if (pdfOption) {
          await pdfOption.click();
          await delay(5000);
          console.log('PDF generation initiated');
        }
      }
    }

    // Final screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '13-final-state.png'), fullPage: true });

    console.log('\n✅ WordPress scan test completed!');
    console.log(`Screenshots saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('\n❌ Error during test:', error);
    const page = (await browser.pages())[0];
    await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testWordPressScan().catch(console.error);