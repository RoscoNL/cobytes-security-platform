const puppeteer = require('puppeteer');

async function testCobytesScanner() {
  let browser;
  
  try {
    // Launch browser
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      defaultViewport: null,
      args: ['--window-size=1200,800']
    });
    
    const page = await browser.newPage();
    
    // Navigate to the app
    console.log('Navigating to http://localhost:3002...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
    
    // Click Start Scan button
    console.log('Clicking Start Scan button...');
    await page.waitForSelector('button', { visible: true });
    // Click the "Start Free Scan" button at the bottom
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('Start Free Scan')) {
        await button.click();
        break;
      }
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Select WordPress Scanner
    console.log('Selecting WordPress Scanner...');
    await page.waitForSelector('[data-scan-type="wordpress"]', { visible: true });
    await page.click('[data-scan-type="wordpress"]');
    
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle2' });
    
    // Login with test credentials
    console.log('Logging in with test credentials...');
    await page.waitForSelector('input[type="email"]', { visible: true });
    await page.type('input[type="email"]', 'test@cobytes.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    
    // Click login button
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Check if login was successful
    console.log('Login successful, redirected to:', page.url());
    
    // Navigate back to scan page
    await page.goto('http://localhost:3002/scan/new', { waitUntil: 'networkidle2' });
    
    // Select WordPress Scanner again
    console.log('Selecting WordPress Scanner again...');
    await page.waitForSelector('[data-scan-type="wordpress"]', { visible: true });
    await page.click('[data-scan-type="wordpress"]');
    
    // Wait for scan form to appear
    await page.waitForSelector('input[name="target"]', { visible: true });
    
    // Enter the target URL
    console.log('Entering target URL: https://www.cobytes.com');
    await page.type('input[name="target"]', 'https://www.cobytes.com');
    
    // Start the scan
    console.log('Starting scan...');
    const startButton = await page.$('button[type="submit"]');
    if (startButton) {
      await startButton.click();
    } else {
      // Try alternative selector
      await page.click('button:has-text("Start Scan")');
    }
    
    // Wait for navigation or response
    await page.waitForTimeout(2000);
    
    // Check if scan started
    const currentUrl = page.url();
    console.log('Current URL after scan start:', currentUrl);
    
    // Look for scan status or ID
    if (currentUrl.includes('/scan/')) {
      console.log('Scan started successfully!');
      const scanId = currentUrl.split('/scan/')[1];
      console.log('Scan ID:', scanId);
      
      // Monitor scan progress
      console.log('Monitoring scan progress...');
      
      // Wait for scan status to appear
      await page.waitForSelector('[data-scan-status]', { timeout: 10000 }).catch(() => {
        console.log('No scan status element found, checking alternative selectors...');
      });
      
      // Monitor for up to 5 minutes
      const maxWaitTime = 5 * 60 * 1000; // 5 minutes
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWaitTime) {
        // Check scan status
        const status = await page.$eval('[data-scan-status]', el => el.textContent).catch(() => null);
        
        if (status) {
          console.log('Scan status:', status);
          
          if (status.toLowerCase().includes('completed') || status.toLowerCase().includes('finished')) {
            console.log('Scan completed!');
            
            // Look for report generation button
            const reportButton = await page.$('button:has-text("Generate Report")');
            if (reportButton) {
              console.log('Generating PDF report...');
              await reportButton.click();
              await page.waitForTimeout(3000);
              console.log('Report generated!');
            }
            
            break;
          }
        }
        
        // Wait before checking again
        await page.waitForTimeout(5000); // Check every 5 seconds
      }
    } else {
      console.log('Scan may not have started properly. Check the page for errors.');
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'scan-error-screenshot.png' });
      console.log('Screenshot saved as scan-error-screenshot.png');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
    
    // Take a screenshot on error
    if (browser) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        await pages[0].screenshot({ path: 'error-screenshot.png' });
        console.log('Error screenshot saved as error-screenshot.png');
      }
    }
  } finally {
    // Keep browser open for inspection
    console.log('Test completed. Browser will remain open for inspection.');
    console.log('Press Ctrl+C to exit.');
  }
}

// Run the test
testCobytesScanner();