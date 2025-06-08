const puppeteer = require('puppeteer');

async function testFrontendBackendConnection() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  // Enable error logging
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
  });

  // Enable request logging
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('[REQUEST]:', request.method(), request.url());
    }
  });

  // Enable response logging
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('[RESPONSE]:', response.status(), response.url());
      if (response.status() !== 200) {
        console.log('[RESPONSE HEADERS]:', response.headers());
      }
    }
  });

  // Enable request failure logging
  page.on('requestfailed', request => {
    console.log('[REQUEST FAILED]:', request.url(), request.failure().errorText);
  });

  try {
    console.log('Navigating to http://localhost:3002/products...');
    await page.goto('http://localhost:3002/products', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Page loaded, waiting for potential API calls...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check for any API calls in the Network tab
    const apiCalls = await page.evaluate(() => {
      const performanceEntries = performance.getEntriesByType('resource');
      return performanceEntries
        .filter(entry => entry.name.includes('/api/'))
        .map(entry => ({
          url: entry.name,
          duration: entry.duration,
          status: entry.responseStatus || 'N/A'
        }));
    });

    console.log('\n[API CALLS DETECTED]:', apiCalls.length > 0 ? apiCalls : 'No API calls detected');

    // Check for errors in console
    const consoleErrors = await page.evaluate(() => {
      const errors = [];
      // This is a simplified check - in real scenario, we'd capture console errors as they happen
      return errors;
    });

    // Take a screenshot for reference
    await page.screenshot({ path: 'frontend-backend-test.png', fullPage: true });
    console.log('\nScreenshot saved as frontend-backend-test.png');

    // Wait a bit before closing
    console.log('\nKeeping browser open for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testFrontendBackendConnection().catch(console.error);