const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testDirectCors() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true, // Open DevTools to see console
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'cors-test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const logEntry = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(logEntry);
    console.log(logEntry);
  });

  // Collect network errors
  const networkErrors = [];
  page.on('requestfailed', request => {
    const failure = {
      url: request.url(),
      failure: request.failure(),
      method: request.method()
    };
    networkErrors.push(failure);
    console.error('Request failed:', failure);
  });

  try {
    console.log('1. Navigating to direct CORS test page...');
    await page.goto('http://localhost:3002/dashboard/direct-pentest', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Take initial screenshot
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-initial-page.png'),
      fullPage: true 
    });
    console.log('✓ Initial page screenshot taken');

    // Wait for page to load
    await page.waitForSelector('button', { timeout: 10000 });

    // Check if target is set correctly
    const targetValue = await page.evaluate(() => {
      const input = document.querySelector('input[value*="cobytes"]');
      return input ? input.value : 'Target not found';
    });
    console.log(`✓ Target URL: ${targetValue}`);

    // Check selected scanner - find the select element
    const selectedScanner = await page.evaluate(() => {
      const selectEl = document.querySelector('div[role="combobox"]');
      return selectEl ? selectEl.textContent : 'Scanner not found';
    });
    console.log(`✓ Selected scanner: ${selectedScanner}`);

    // Click Start Scan button - find by text content
    console.log('\n2. Clicking Start Scan button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startButton = buttons.find(btn => btn.textContent.includes('Start Scan'));
      if (startButton) {
        startButton.click();
      } else {
        throw new Error('Start Scan button not found');
      }
    });

    // Take screenshot immediately after clicking
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-after-click.png'),
      fullPage: true 
    });

    // Wait for response (either success or error)
    console.log('\n3. Waiting for API response...');
    await new Promise(r => setTimeout(r, 5000));

    // Take screenshot of results
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-api-response.png'),
      fullPage: true 
    });

    // Check for alerts
    const errorAlert = await page.$('div[role="alert"].MuiAlert-colorError');
    const successAlert = await page.$('div[role="alert"].MuiAlert-colorSuccess');

    if (errorAlert) {
      const errorText = await errorAlert.evaluate(el => el.textContent);
      console.log(`\n❌ Error alert found: ${errorText}`);
    }

    if (successAlert) {
      const successText = await successAlert.evaluate(el => el.textContent);
      console.log(`\n✅ Success alert found: ${successText}`);
    }

    // Get API logs from the page
    console.log('\n4. API Logs from page:');
    const apiLogs = await page.$$eval('.MuiBox-root > div', elements => {
      return elements
        .map(el => el.textContent)
        .filter(text => text.includes('['));
    });
    apiLogs.forEach(log => console.log(log));

    // Take final screenshot
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-final-state.png'),
      fullPage: true 
    });

    // Save console logs
    fs.writeFileSync(
      path.join(screenshotsDir, 'console-logs.json'),
      JSON.stringify({ consoleLogs, networkErrors }, null, 2)
    );

    // Summary
    console.log('\n=== CORS Test Summary ===');
    console.log(`Console logs collected: ${consoleLogs.length}`);
    console.log(`Network errors: ${networkErrors.length}`);
    console.log(`Screenshots saved in: ${screenshotsDir}`);
    
    if (networkErrors.length > 0) {
      console.log('\n⚠️  CORS or Network Errors Detected:');
      networkErrors.forEach(err => {
        console.log(`- ${err.method} ${err.url}`);
        console.log(`  Failure: ${err.failure?.errorText}`);
      });
    }

    // Keep browser open for manual inspection
    console.log('\n✓ Test complete. Browser will remain open for inspection.');
    console.log('Press Ctrl+C to close.');
    
    // Wait indefinitely
    await new Promise(() => {});

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'error-state.png'),
      fullPage: true 
    });
  }
}

testDirectCors();