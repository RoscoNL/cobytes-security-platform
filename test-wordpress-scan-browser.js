const puppeteer = require('puppeteer');
const fs = require('fs');

async function testWordPressScan() {
  let browser;
  
  try {
    // Create screenshots directory
    if (!fs.existsSync('wordpress-scan-screenshots')) {
      fs.mkdirSync('wordpress-scan-screenshots');
    }
    
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1366, height: 768 },
      args: ['--window-size=1366,768']
    });
    
    const page = await browser.newPage();
    
    // Navigate to the app
    console.log('📍 Navigating to http://localhost:3002...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
    
    // Take screenshot of landing page
    await page.screenshot({ path: 'wordpress-scan-screenshots/01-landing-page.png' });
    console.log('📸 Screenshot: Landing page');
    
    // Look for "Free Demo" or "Try Free Demo" button
    console.log('🔍 Looking for Free Demo button...');
    
    // From the screenshot, I can see there's a "Try Free Demo" button
    try {
      // Try XPath selector for the button
      const [tryFreeDemoButton] = await page.$x('//button[contains(text(), "Try Free Demo")]');
      if (tryFreeDemoButton) {
        console.log('✅ Found "Try Free Demo" button');
        await tryFreeDemoButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Alternative: Look for buttons with text
        const buttons = await page.$$('button');
        let clicked = false;
        for (const button of buttons) {
          const text = await button.evaluate(el => el.textContent);
          if (text && text.includes('Try Free Demo')) {
            console.log('✅ Found button with text:', text.trim());
            await button.click();
            clicked = true;
            break;
          }
        }
        
        if (!clicked) {
          // Try navigation links
          const links = await page.$$('a');
          for (const link of links) {
            const text = await link.evaluate(el => el.textContent);
            if (text && text.includes('Free Demo')) {
              console.log('✅ Found link with text:', text.trim());
              await link.click();
              clicked = true;
              break;
            }
          }
        }
        
        if (!clicked) {
          console.log('⚠️ Could not find demo button, navigating directly to /free-demo');
          await page.goto('http://localhost:3002/free-demo', { waitUntil: 'networkidle2' });
        }
      }
    } catch (e) {
      console.log('⚠️ Error finding button, navigating directly to /free-demo');
      await page.goto('http://localhost:3002/free-demo', { waitUntil: 'networkidle2' });
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we need to login
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('login')) {
      console.log('🔐 Login required, entering credentials...');
      await page.screenshot({ path: 'wordpress-scan-screenshots/02-login-page.png' });
      
      // Enter login credentials
      await page.waitForSelector('input[type="email"], input[name="email"]', { visible: true });
      await page.type('input[type="email"], input[name="email"]', 'user@cobytes.com');
      await page.type('input[type="password"], input[name="password"]', 'pass');
      
      await page.screenshot({ path: 'wordpress-scan-screenshots/03-login-filled.png' });
      
      // Submit login
      const loginButton = await page.$('button[type="submit"]');
      if (loginButton) {
        await loginButton.click();
      } else {
        await page.keyboard.press('Enter');
      }
      
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('✅ Login completed');
      
      // Navigate to scan page after login
      await page.goto('http://localhost:3002/free-scan', { waitUntil: 'networkidle2' });
    }
    
    // Take screenshot of scan page
    await page.screenshot({ path: 'wordpress-scan-screenshots/04-scan-page.png' });
    console.log('📸 Screenshot: Scan page');
    
    // Look for URL input field
    console.log('🔍 Looking for URL input field...');
    const urlInput = await page.$('input[name="target"], input[name="url"], input[placeholder*="URL"], input[placeholder*="domain"], input[placeholder*="website"]');
    
    if (urlInput) {
      console.log('✅ Found URL input field');
      await urlInput.click({ clickCount: 3 }); // Triple click to select all
      await urlInput.type('https://www.cobytes.com');
      console.log('✅ Entered target URL: https://www.cobytes.com');
    } else {
      console.log('❌ Could not find URL input field');
      await page.screenshot({ path: 'wordpress-scan-screenshots/error-no-url-input.png' });
    }
    
    // Look for scan type dropdown or selector
    console.log('🔍 Looking for scan type selector...');
    
    // Check what scan types are available
    const scanTypeSelectors = [
      'select[name="type"], select[name="scanType"], select[name="scan_type"]',
      '[data-scan-type]',
      'input[type="radio"][name="scanType"]',
      '.scan-type-selector'
    ];
    
    let scanTypes = [];
    let wordpressScanFound = false;
    
    for (const selector of scanTypeSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`✅ Found scan type elements with selector: ${selector}`);
        
        // Check if it's a select dropdown
        if (selector.includes('select')) {
          const options = await page.$$eval(`${selector} option`, opts => 
            opts.map(opt => ({ value: opt.value, text: opt.textContent }))
          );
          scanTypes = options;
          console.log('📋 Available scan types:', options);
          
          // Select WordPress scan if available
          const wordpressOption = options.find(opt => 
            opt.text.toLowerCase().includes('wordpress') || 
            opt.text.toLowerCase().includes('cms') ||
            opt.value.toLowerCase().includes('wordpress')
          );
          
          if (wordpressOption) {
            await page.select(selector, wordpressOption.value);
            console.log('✅ Selected WordPress/CMS scan');
            wordpressScanFound = true;
          }
        }
        break;
      }
    }
    
    // Take screenshot after configuration
    await page.screenshot({ path: 'wordpress-scan-screenshots/05-scan-configured.png' });
    console.log('📸 Screenshot: Scan configured');
    
    // Start the scan
    console.log('🚀 Starting scan...');
    const startButton = await page.$('button[type="submit"], button:has-text("Start"), button:has-text("Scan"), button:has-text("Begin")');
    
    if (startButton) {
      await startButton.click();
      console.log('✅ Clicked start scan button');
    } else {
      console.log('❌ Could not find start button');
      await page.screenshot({ path: 'wordpress-scan-screenshots/error-no-start-button.png' });
    }
    
    // Wait for scan to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of scan progress
    await page.screenshot({ path: 'wordpress-scan-screenshots/06-scan-started.png' });
    console.log('📸 Screenshot: Scan started');
    
    // Monitor scan progress
    console.log('⏳ Monitoring scan progress...');
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const startTime = Date.now();
    let scanCompleted = false;
    
    while (Date.now() - startTime < maxWaitTime && !scanCompleted) {
      // Check for completion indicators
      const statusElements = await page.$$('[data-status], .scan-status, .status, .progress');
      
      for (const element of statusElements) {
        const text = await element.evaluate(el => el.textContent);
        console.log(`📊 Status: ${text}`);
        
        if (text.toLowerCase().includes('complete') || text.toLowerCase().includes('finished') || text.toLowerCase().includes('done')) {
          scanCompleted = true;
          break;
        }
      }
      
      // Take periodic screenshots
      if ((Date.now() - startTime) % 30000 < 5000) { // Every 30 seconds
        const timestamp = Math.floor((Date.now() - startTime) / 1000);
        await page.screenshot({ path: `wordpress-scan-screenshots/progress-${timestamp}s.png` });
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'wordpress-scan-screenshots/07-final-results.png' });
    console.log('📸 Screenshot: Final results');
    
    // Look for results
    console.log('📊 Checking scan results...');
    const results = await page.$$eval('.vulnerability, .finding, .issue, .result-item, [data-severity]', elements => 
      elements.map(el => ({
        text: el.textContent.trim(),
        severity: el.getAttribute('data-severity') || el.className
      }))
    );
    
    if (results.length > 0) {
      console.log(`\n✅ Found ${results.length} findings:`);
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.text.substring(0, 100)}...`);
      });
    }
    
    // Report summary
    console.log('\n📋 SCAN SUMMARY:');
    console.log('   Target: https://www.cobytes.com');
    console.log('   Scan Type: ' + (wordpressScanFound ? 'WordPress/CMS' : 'Unknown'));
    console.log('   Available Scan Types:', scanTypes.map(t => t.text || t).join(', '));
    console.log('   Status: ' + (scanCompleted ? 'Completed' : 'In Progress/Timeout'));
    console.log('   Screenshots saved in: wordpress-scan-screenshots/');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    
    // Take error screenshot
    if (browser) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        await pages[0].screenshot({ path: 'wordpress-scan-screenshots/error-final.png' });
      }
    }
  } finally {
    console.log('\n🏁 Test completed. Browser will remain open for inspection.');
    console.log('Press Ctrl+C to exit.');
  }
}

// Run the test
testWordPressScan();