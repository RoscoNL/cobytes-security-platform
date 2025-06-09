const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join(__dirname, 'scan-ui-debug');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function debugScanUI() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true, // Open DevTools
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });

    // Capture failed requests
    page.on('requestfailed', request => {
      console.error('Request failed:', request.url(), request.failure().errorText);
    });

    console.log('1. Setting up authentication...');
    // Set token in localStorage before navigation
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzEiLCJlbWFpbCI6ImFkbWluQGNvYnl0ZXMuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ5NDY5NDM3LCJleHAiOjE3NDk1NTU4Mzd9.xLWHXTZMdIjxEjSadagApSTPu_jO2zdeB-UaUmcpAj8');
      localStorage.setItem('user', JSON.stringify({
        id: 'user_1',
        email: 'admin@cobytes.com',
        name: 'Admin User',
        role: 'admin'
      }));
    });

    console.log('2. Navigating to scan creation page...');
    await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle0' });
    await delay(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '01-scan-page.png'), fullPage: true });

    // Check if we're on the scan page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (!currentUrl.includes('/scans/new')) {
      console.log('Not on scan page, checking what happened...');
      const pageContent = await page.content();
      fs.writeFileSync(path.join(screenshotsDir, 'page-content.html'), pageContent);
    }

    // Enter scan details
    console.log('3. Filling scan form...');
    await page.waitForSelector('input[placeholder*="example.com"]', { timeout: 5000 });
    await page.type('input[placeholder*="example.com"]', 'https://www.cobytes.com');
    await page.screenshot({ path: path.join(screenshotsDir, '02-url-entered.png'), fullPage: true });

    // Click Next
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextButton = buttons.find(btn => btn.textContent.includes('Next'));
      if (nextButton) nextButton.click();
    });
    await delay(1000);

    // Select WordPress scanner
    console.log('4. Selecting scanner...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.MuiCard-root'));
      const wordpressCard = cards.find(card => card.textContent.includes('WordPress'));
      if (wordpressCard) wordpressCard.click();
    });
    await page.screenshot({ path: path.join(screenshotsDir, '03-scanner-selected.png'), fullPage: true });

    // Click Next again
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextButton = buttons.find(btn => btn.textContent.includes('Next'));
      if (nextButton) nextButton.click();
    });
    await delay(1000);

    // Start scan
    console.log('5. Starting scan...');
    
    // Set up response listener before clicking
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/scans') && response.request().method() === 'POST',
      { timeout: 10000 }
    );

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startButton = buttons.find(btn => btn.textContent.includes('Start Scan'));
      if (startButton) {
        console.log('Clicking Start Scan button...');
        startButton.click();
      }
    });

    console.log('6. Waiting for API response...');
    const response = await responsePromise;
    console.log('API Response:', {
      status: response.status(),
      url: response.url(),
      headers: response.headers()
    });

    const responseBody = await response.json();
    console.log('Response body:', responseBody);

    await delay(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '04-after-submit.png'), fullPage: true });

    // Check final URL
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);

    // Save console logs
    fs.writeFileSync(
      path.join(screenshotsDir, 'console-logs.json'),
      JSON.stringify(consoleLogs, null, 2)
    );

    console.log('\n✅ Debug complete!');
    console.log(`Screenshots and logs saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    const page = (await browser.pages())[0];
    await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png'), fullPage: true });
  } finally {
    console.log('\nPress Ctrl+C to close the browser...');
    // Keep browser open for inspection
    await new Promise(() => {});
  }
}

debugScanUI().catch(console.error);