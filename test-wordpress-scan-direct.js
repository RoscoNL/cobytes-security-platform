const puppeteer = require('puppeteer');
const fs = require('fs');

async function testWordPressScanDirect() {
  let browser;
  
  try {
    // Create screenshots directory
    if (!fs.existsSync('wordpress-scan-test')) {
      fs.mkdirSync('wordpress-scan-test');
    }
    
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1366, height: 768 },
      args: ['--window-size=1366,768']
    });
    
    const page = await browser.newPage();
    
    // Step 1: Navigate to all scanners page
    console.log('📍 Navigating to All Scanners page...');
    await page.goto('http://localhost:3002/all-scanners-new', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({ path: 'wordpress-scan-test/01-all-scanners.png' });
    console.log('📸 Screenshot: All Scanners page');
    
    // Step 2: Find and click WordPress Scanner
    console.log('🔍 Looking for WordPress Scanner...');
    
    // Look for WordPress Scanner card
    const wordpressScannerCard = await page.$('.scanner-card:has-text("WordPress Scanner"), div:has-text("WordPress Scanner")');
    if (wordpressScannerCard) {
      console.log('✅ Found WordPress Scanner card');
      await wordpressScannerCard.click();
    } else {
      // Try finding by text content
      const elements = await page.$$('div');
      for (const element of elements) {
        const text = await element.evaluate(el => el.textContent);
        if (text && text.includes('WordPress Scanner') && text.includes('Tool ID: 270')) {
          console.log('✅ Found WordPress Scanner by text');
          await element.click();
          break;
        }
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we're redirected to login
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('login')) {
      console.log('🔐 Login required...');
      await page.screenshot({ path: 'wordpress-scan-test/02-login-page.png' });
      
      // Login
      await page.waitForSelector('input[type="email"], input[name="email"]', { visible: true });
      await page.type('input[type="email"], input[name="email"]', 'user@cobytes.com');
      await page.type('input[type="password"], input[name="password"]', 'pass');
      
      await page.screenshot({ path: 'wordpress-scan-test/03-login-filled.png' });
      
      // Submit
      const loginButton = await page.$('button[type="submit"]');
      if (loginButton) {
        await loginButton.click();
      } else {
        await page.keyboard.press('Enter');
      }
      
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('✅ Logged in successfully');
      
      // Navigate back to WordPress Scanner
      await page.goto('http://localhost:3002/all-scanners-new', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click WordPress Scanner again
      const elements = await page.$$('div');
      for (const element of elements) {
        const text = await element.evaluate(el => el.textContent);
        if (text && text.includes('WordPress Scanner') && text.includes('Tool ID: 270')) {
          console.log('✅ Found WordPress Scanner again');
          await element.click();
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Step 3: Fill in scan form
    console.log('📝 Filling scan form...');
    await page.screenshot({ path: 'wordpress-scan-test/04-scan-form.png' });
    
    // Look for target input
    const targetInputs = [
      'input[name="target"]',
      'input[name="url"]', 
      'input[name="target_name"]',
      'input[placeholder*="URL"]',
      'input[placeholder*="domain"]',
      'input[placeholder*="website"]',
      'input[type="text"]'
    ];
    
    let targetInput = null;
    for (const selector of targetInputs) {
      targetInput = await page.$(selector);
      if (targetInput) {
        console.log(`✅ Found target input with selector: ${selector}`);
        break;
      }
    }
    
    if (targetInput) {
      await targetInput.click({ clickCount: 3 });
      await targetInput.type('https://www.cobytes.com');
      console.log('✅ Entered target URL: https://www.cobytes.com');
      
      await page.screenshot({ path: 'wordpress-scan-test/05-target-entered.png' });
      
      // Step 4: Start the scan
      console.log('🚀 Starting scan...');
      
      // Look for start button
      const startButtons = [
        'button[type="submit"]',
        'button:contains("Start")',
        'button:contains("Scan")',
        'button:contains("Begin")',
        'button:contains("Run")'
      ];
      
      let startButton = null;
      for (const selector of startButtons) {
        try {
          startButton = await page.$(selector);
          if (startButton) {
            console.log(`✅ Found start button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      // If not found, try by text
      if (!startButton) {
        const buttons = await page.$$('button');
        for (const button of buttons) {
          const text = await button.evaluate(el => el.textContent);
          if (text && (text.includes('Start') || text.includes('Scan') || text.includes('Run'))) {
            startButton = button;
            console.log(`✅ Found button with text: ${text.trim()}`);
            break;
          }
        }
      }
      
      if (startButton) {
        await startButton.click();
        console.log('✅ Clicked start button');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.screenshot({ path: 'wordpress-scan-test/06-scan-started.png' });
        
        // Step 5: Monitor scan progress
        console.log('⏳ Monitoring scan progress...');
        
        const maxWaitTime = 3 * 60 * 1000; // 3 minutes
        const startTime = Date.now();
        let lastProgress = 0;
        
        while (Date.now() - startTime < maxWaitTime) {
          // Check current URL for scan ID
          const scanUrl = page.url();
          if (scanUrl.includes('/scan/') || scanUrl.includes('/scan-status/')) {
            const scanId = scanUrl.match(/scan(?:-status)?\/([^\/]+)/)?.[1];
            if (scanId) {
              console.log(`📊 Scan ID: ${scanId}`);
            }
          }
          
          // Look for progress indicators
          const progressElements = await page.$$('[data-progress], .progress, .scan-progress, [class*="progress"]');
          for (const element of progressElements) {
            const text = await element.evaluate(el => el.textContent).catch(() => '');
            if (text && text.includes('%')) {
              const progress = parseInt(text);
              if (!isNaN(progress) && progress !== lastProgress) {
                console.log(`📊 Progress: ${progress}%`);
                lastProgress = progress;
              }
            }
          }
          
          // Check for completion
          const pageContent = await page.content();
          if (pageContent.includes('completed') || pageContent.includes('Complete') || pageContent.includes('finished')) {
            console.log('✅ Scan completed!');
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'wordpress-scan-test/07-final-results.png' });
        
        // Step 6: Analyze results
        console.log('📊 Analyzing results...');
        
        // Look for vulnerabilities or findings
        const findings = await page.$$eval(
          '.vulnerability, .finding, .issue, .result, [data-severity], [class*="vulnerability"], [class*="finding"]',
          elements => elements.map(el => ({
            text: el.textContent.trim(),
            severity: el.getAttribute('data-severity') || 
                     el.className.match(/severity-(\w+)/)?.[1] ||
                     (el.className.includes('high') ? 'high' :
                      el.className.includes('medium') ? 'medium' :
                      el.className.includes('low') ? 'low' : 'info')
          }))
        ).catch(() => []);
        
        console.log('\n📋 SCAN RESULTS SUMMARY:');
        console.log('================================');
        console.log('Target: https://www.cobytes.com');
        console.log('Scanner: WordPress Scanner (Tool ID: 270)');
        console.log(`Total Findings: ${findings.length}`);
        
        if (findings.length > 0) {
          console.log('\nFindings:');
          findings.forEach((finding, index) => {
            console.log(`${index + 1}. [${finding.severity.toUpperCase()}] ${finding.text.substring(0, 100)}${finding.text.length > 100 ? '...' : ''}`);
          });
        } else {
          console.log('\nNo vulnerabilities found or scan still in progress.');
        }
        
        console.log('\nScreenshots saved in: wordpress-scan-test/');
        console.log('================================');
        
      } else {
        console.log('❌ Could not find start button');
        await page.screenshot({ path: 'wordpress-scan-test/error-no-start-button.png' });
      }
      
    } else {
      console.log('❌ Could not find target input field');
      await page.screenshot({ path: 'wordpress-scan-test/error-no-target-input.png' });
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    
    if (browser) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        await pages[0].screenshot({ path: 'wordpress-scan-test/error-screenshot.png' });
      }
    }
  } finally {
    console.log('\n🏁 Test completed. Browser will remain open for inspection.');
    console.log('Press Ctrl+C to exit.');
  }
}

// Run the test
testWordPressScanDirect();