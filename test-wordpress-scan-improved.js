const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function waitForSelector(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function testWordPressScan(baseUrl, environment) {
  console.log(`\n🔍 Testing WordPress scan on ${environment}: ${baseUrl}`);
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (!msg.text().includes('Download the React DevTools')) {
      console.log('Browser console:', msg.text());
    }
  });

  try {
    // Step 1: Navigate to homepage
    console.log('1. Navigating to homepage...');
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: `${environment}-1-homepage.png` });

    // Step 2: Try to navigate directly to free scan page
    console.log('2. Trying free scan page...');
    await page.goto(`${baseUrl}/free-scan`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: `${environment}-2-free-scan.png` });

    // Check if we're redirected to login
    if (page.url().includes('/login')) {
      console.log('3. Need to login first...');
      
      // Fill login form
      await page.waitForSelector('input[type="email"]');
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'Test123!@#');
      await page.screenshot({ path: `${environment}-3-login-filled.png` });
      
      // Submit login
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${environment}-4-after-login.png` });
      
      // Try navigating to scan page again
      await page.goto(`${baseUrl}/free-scan`, { waitUntil: 'networkidle2' });
    }

    // Step 3: Try different scan pages
    console.log('4. Looking for scan form...');
    
    const scanPages = ['/free-scan', '/scans/new', '/scan/new', '/all-scanners'];
    let foundScanForm = false;
    
    for (const scanPage of scanPages) {
      if (!foundScanForm) {
        try {
          await page.goto(`${baseUrl}${scanPage}`, { waitUntil: 'networkidle2' });
          await page.waitForTimeout(2000);
          
          // Check if we have a URL input field
          const urlInput = await page.$('input[name="url"], input[placeholder*="URL"], input[placeholder*="domain"], input[type="url"]');
          if (urlInput) {
            foundScanForm = true;
            console.log(`✅ Found scan form at ${scanPage}`);
            break;
          }
        } catch (e) {
          console.log(`  - ${scanPage} not accessible`);
        }
      }
    }

    if (!foundScanForm) {
      console.log('❌ Could not find scan form');
      await browser.close();
      return;
    }

    await page.screenshot({ path: `${environment}-5-scan-form.png` });

    // Step 4: Fill scan form
    console.log('5. Filling scan form...');
    
    // Find and fill URL input
    const urlSelectors = [
      'input[name="url"]',
      'input[placeholder*="URL"]',
      'input[placeholder*="domain"]',
      'input[placeholder*="website"]',
      'input[type="url"]'
    ];
    
    let urlFilled = false;
    for (const selector of urlSelectors) {
      const input = await page.$(selector);
      if (input) {
        await input.click({ clickCount: 3 });
        await input.type('https://www.cobytes.com');
        urlFilled = true;
        console.log('✅ URL entered');
        break;
      }
    }

    if (!urlFilled) {
      console.log('❌ Could not find URL input');
      await browser.close();
      return;
    }

    await page.screenshot({ path: `${environment}-6-url-entered.png` });

    // Step 5: Select WordPress scanner if available
    console.log('6. Selecting WordPress scanner...');
    
    // Try select dropdown
    const selectElement = await page.$('select');
    if (selectElement) {
      try {
        await selectElement.select('wordpress');
        console.log('✅ WordPress scanner selected');
      } catch {
        // Try selecting by text
        await page.evaluate(() => {
          const select = document.querySelector('select');
          if (select) {
            const options = Array.from(select.options);
            const wpOption = options.find(opt => 
              opt.text.toLowerCase().includes('wordpress') || 
              opt.value.toLowerCase().includes('wordpress')
            );
            if (wpOption) {
              select.value = wpOption.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        });
      }
    }

    await page.screenshot({ path: `${environment}-7-scanner-selected.png` });

    // Step 6: Start scan
    console.log('7. Starting scan...');
    
    // Find submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:contains("Start")',
      'button:contains("Scan")',
      'button:contains("Begin")',
      'input[type="submit"]'
    ];
    
    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const buttons = await page.$$(selector);
        for (const button of buttons) {
          const text = await button.evaluate(el => el.textContent || el.value);
          if (text && (text.includes('Start') || text.includes('Scan') || text.includes('Begin'))) {
            await button.click();
            submitted = true;
            console.log('✅ Scan started');
            break;
          }
        }
        if (submitted) break;
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!submitted) {
      // Try clicking any visible button
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.offsetParent && (
            button.textContent.includes('Start') ||
            button.textContent.includes('Scan') ||
            button.textContent.includes('Begin')
          )) {
            button.click();
            break;
          }
        }
      });
    }

    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${environment}-8-after-submit.png` });

    // Step 7: Check scan status
    console.log('8. Checking scan status...');
    
    // Wait for potential redirect or status update
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/scan/') || currentUrl.includes('/scans/')) {
      console.log('✅ Redirected to scan details page');
      
      // Monitor scan progress
      let attempts = 0;
      const maxAttempts = 30; // 2.5 minutes
      
      while (attempts < maxAttempts) {
        await page.waitForTimeout(5000);
        
        // Take screenshot of current status
        await page.screenshot({ path: `${environment}-9-scan-progress-${attempts}.png` });
        
        // Check for completion
        const pageContent = await page.content();
        if (pageContent.includes('Download') || 
            pageContent.includes('Complete') || 
            pageContent.includes('Finished')) {
          console.log('✅ Scan appears to be complete');
          break;
        }
        
        attempts++;
        console.log(`  Checking progress... (${attempts}/${maxAttempts})`);
      }
      
      // Try to download report
      console.log('9. Looking for download option...');
      const downloadLinks = await page.$$('a[href*="download"], button:contains("Download")');
      
      if (downloadLinks.length > 0) {
        console.log(`Found ${downloadLinks.length} download links`);
        // Setup download handling
        const downloadPath = path.join(__dirname, 'downloads', environment);
        if (!fs.existsSync(downloadPath)) {
          fs.mkdirSync(downloadPath, { recursive: true });
        }
        
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: downloadPath
        });
        
        // Click first download link
        await downloadLinks[0].click();
        console.log('⏳ Download initiated...');
        await page.waitForTimeout(5000);
      }
    }
    
    await page.screenshot({ path: `${environment}-10-final-state.png` });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: `${environment}-error.png` });
  } finally {
    await browser.close();
  }
}

async function runTests() {
  // Test local environment
  await testWordPressScan('http://localhost:3002', 'local');
  
  // Wait before testing production
  console.log('\n⏳ Waiting 5 seconds before testing production...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test production environment
  await testWordPressScan('https://securityscan.cobytes.com', 'production');
}

// Run the tests
runTests().catch(console.error);