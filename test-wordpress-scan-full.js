const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testWordPressScan(baseUrl, environment) {
  console.log(`\n🔍 Testing WordPress scan on ${environment}: ${baseUrl}`);
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', error => console.log('Page error:', error.message));

  try {
    // Step 1: Navigate to homepage
    console.log('1. Navigating to homepage...');
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: `${environment}-1-homepage.png` });

    // Step 2: Check if we need to login
    const loginButton = await page.$('a[href="/login"]');
    if (loginButton) {
      console.log('2. Navigating to login page...');
      await loginButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await page.screenshot({ path: `${environment}-2-login.png` });

      // Login with test credentials
      console.log('3. Logging in...');
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'Test123!@#');
      await page.screenshot({ path: `${environment}-3-login-filled.png` });
      
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await page.screenshot({ path: `${environment}-4-after-login.png` });
    }

    // Step 3: Navigate to scan creation page
    console.log('4. Navigating to scan creation...');
    
    // Try different possible routes to scan page
    const scanLink = await page.$('a[href="/scans/new"]') || 
                     await page.$('a[href="/scan/new"]') ||
                     await page.$('button:has-text("New Scan")') ||
                     await page.$('button:has-text("Start Scan")');
    
    if (scanLink) {
      await scanLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    } else {
      // Try direct navigation
      await page.goto(`${baseUrl}/scans/new`, { waitUntil: 'networkidle2' });
    }
    
    await page.screenshot({ path: `${environment}-5-scan-form.png` });

    // Step 4: Fill in scan details
    console.log('5. Filling scan form...');
    
    // Enter URL
    const urlInput = await page.$('input[name="url"]') || 
                     await page.$('input[placeholder*="URL"]') ||
                     await page.$('input[type="url"]');
    
    if (urlInput) {
      await urlInput.click({ clickCount: 3 }); // Select all
      await urlInput.type('https://www.cobytes.com');
    }

    // Select WordPress scanner
    const scannerSelect = await page.$('select[name="scan_type"]') ||
                          await page.$('select[name="scanner"]');
    
    if (scannerSelect) {
      await scannerSelect.select('wordpress');
    } else {
      // Try clicking dropdown
      const dropdown = await page.$('[data-testid="scanner-select"]') ||
                       await page.$('.scanner-dropdown');
      if (dropdown) {
        await dropdown.click();
        await page.waitForTimeout(500);
        await page.click('option[value="wordpress"]');
      }
    }

    await page.screenshot({ path: `${environment}-6-scan-configured.png` });

    // Step 5: Start the scan
    console.log('6. Starting scan...');
    const startButton = await page.$('button[type="submit"]') ||
                        await page.$('button:has-text("Start Scan")') ||
                        await page.$('button:has-text("Begin Scan")');
    
    if (startButton) {
      await startButton.click();
      
      // Wait for navigation or status update
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${environment}-7-scan-started.png` });

      // Step 6: Monitor scan progress
      console.log('7. Monitoring scan progress...');
      let scanComplete = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max

      while (!scanComplete && attempts < maxAttempts) {
        await page.waitForTimeout(5000); // Check every 5 seconds
        
        // Check for completion indicators
        const completed = await page.$('.scan-completed') ||
                          await page.$('[data-status="completed"]') ||
                          await page.$(':has-text("Scan Complete")') ||
                          await page.$(':has-text("Download Report")');
        
        if (completed) {
          scanComplete = true;
          console.log('✅ Scan completed!');
          await page.screenshot({ path: `${environment}-8-scan-complete.png` });
        } else {
          // Log current status
          const statusElement = await page.$('.scan-status') ||
                                await page.$('[data-testid="scan-status"]');
          if (statusElement) {
            const status = await statusElement.evaluate(el => el.textContent);
            console.log(`   Status: ${status}`);
          }
        }
        
        attempts++;
      }

      // Step 7: Download PDF report
      if (scanComplete) {
        console.log('8. Downloading PDF report...');
        
        // Enable download handling
        const downloadPath = path.join(__dirname, 'downloads', environment);
        if (!fs.existsSync(downloadPath)) {
          fs.mkdirSync(downloadPath, { recursive: true });
        }
        
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: downloadPath
        });

        // Click download button
        const downloadButton = await page.$('button:has-text("Download PDF")') ||
                               await page.$('button:has-text("Download Report")') ||
                               await page.$('a[href*=".pdf"]');
        
        if (downloadButton) {
          await downloadButton.click();
          console.log('⏳ Waiting for download...');
          await page.waitForTimeout(5000);
          
          // Check if file was downloaded
          const files = fs.readdirSync(downloadPath);
          const pdfFile = files.find(f => f.endsWith('.pdf'));
          
          if (pdfFile) {
            console.log(`✅ PDF downloaded: ${pdfFile}`);
            console.log(`📁 Location: ${path.join(downloadPath, pdfFile)}`);
          } else {
            console.log('❌ PDF download failed or still in progress');
          }
        }
      }
    }

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
  
  // Wait a bit before testing production
  console.log('\n⏳ Waiting 5 seconds before testing production...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test production environment
  await testWordPressScan('https://securityscan.cobytes.com', 'production');
}

// Run the tests
runTests().catch(console.error);