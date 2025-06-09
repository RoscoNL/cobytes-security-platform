const puppeteer = require('puppeteer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'wordpress-scan-complete');
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

    // Step 1: Login via API to get token
    console.log('\n1. Logging in via API...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@cobytes.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token received');

    // Set token in localStorage
    await page.evaluateOnNewDocument((token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: 'user_1',
        email: 'admin@cobytes.com',
        name: 'Admin User',
        role: 'admin'
      }));
    }, token);

    // Step 2: Navigate directly to scan creation
    console.log('2. Navigating to scan creation page...');
    await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle0' });
    await delay(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '01-scan-create-page.png'), fullPage: true });

    // Check if we're on the scan create page
    const pageTitle = await page.evaluate(() => document.querySelector('h4')?.textContent);
    console.log('Page title:', pageTitle);
    
    if (!pageTitle || !pageTitle.includes('Create New Security Scan')) {
      // If not on scan page, navigate to dashboard first
      console.log('Not on scan page, navigating to dashboard...');
      await page.goto('http://localhost:3002/dashboard', { waitUntil: 'networkidle0' });
      await delay(2000);
      await page.screenshot({ path: path.join(screenshotsDir, '01a-dashboard.png'), fullPage: true });
      
      // Click on "Start New Scan"
      const newScanLink = await page.$('a[href="/scans/new"]');
      if (newScanLink) {
        await newScanLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
      } else {
        await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle0' });
      }
      await delay(2000);
      await page.screenshot({ path: path.join(screenshotsDir, '01b-scan-create-retry.png'), fullPage: true });
    }

    // Step 3: Enter target URL
    console.log('3. Entering target URL...');
    await page.waitForSelector('input[placeholder*="example.com"]', { timeout: 10000 });
    await page.type('input[placeholder*="example.com"]', 'https://www.cobytes.com');
    await page.screenshot({ path: path.join(screenshotsDir, '02-target-entered.png'), fullPage: true });
    
    // Click Next
    const nextButtons = await page.$$('button');
    for (const button of nextButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('Next')) {
        await button.click();
        break;
      }
    }
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '03-scan-type-selection.png'), fullPage: true });

    // Step 4: Select WordPress scanner
    console.log('4. Selecting WordPress scanner...');
    const cards = await page.$$('.MuiCard-root');
    for (const card of cards) {
      const cardText = await card.evaluate(el => el.textContent);
      if (cardText && cardText.includes('WordPress Scanner')) {
        await card.click();
        break;
      }
    }
    await page.screenshot({ path: path.join(screenshotsDir, '04-wordpress-selected.png'), fullPage: true });
    
    // Click Next
    for (const button of await page.$$('button')) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('Next')) {
        await button.click();
        break;
      }
    }
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '05-confirmation-page.png'), fullPage: true });

    // Step 5: Start the scan
    console.log('5. Starting the scan...');
    for (const button of await page.$$('button')) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('Start Scan')) {
        await button.click();
        break;
      }
    }
    await delay(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '06-scan-started.png'), fullPage: true });

    // Step 6: Wait for navigation to scan details
    console.log('6. Waiting for scan details page...');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {
      console.log('Navigation timeout, checking current state...');
    });
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Extract scan ID from URL if we're on the scan details page
    let scanId = null;
    const match = currentUrl.match(/\/scans\/(\d+)/);
    if (match) {
      scanId = match[1];
      console.log('Scan ID:', scanId);
    }
    
    await page.screenshot({ path: path.join(screenshotsDir, '07-scan-details.png'), fullPage: true });

    // Step 7: Monitor scan progress via API
    if (scanId) {
      console.log('7. Monitoring scan progress...');
      let scanComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max

      while (!scanComplete && attempts < maxAttempts) {
        attempts++;
        await delay(10000); // Wait 10 seconds between checks
        
        try {
          const scanResponse = await axios.get(`http://localhost:3001/api/scans/${scanId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const scan = scanResponse.data.data;
          console.log(`Scan status: ${scan.status} (check ${attempts}/${maxAttempts})`);
          
          if (scan.status === 'completed' || scan.status === 'failed') {
            scanComplete = true;
            console.log(`Scan ${scan.status}!`);
            
            // Refresh the page to see final results
            await page.reload({ waitUntil: 'networkidle0' });
            await page.screenshot({ 
              path: path.join(screenshotsDir, `08-scan-final-${scan.status}.png`), 
              fullPage: true 
            });
          }
        } catch (error) {
          console.error('Error checking scan status:', error.message);
        }
      }

      // Step 8: Generate PDF report
      if (scanComplete) {
        console.log('8. Generating PDF report...');
        
        try {
          // Call the report API
          const reportResponse = await axios.post(
            `http://localhost:3001/api/scans/${scanId}/report`,
            { format: 'pdf' },
            {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'arraybuffer'
            }
          );
          
          // Save the PDF
          const pdfPath = path.join(screenshotsDir, `scan-${scanId}-report.pdf`);
          fs.writeFileSync(pdfPath, reportResponse.data);
          console.log(`✅ PDF report saved to: ${pdfPath}`);
        } catch (error) {
          console.error('Error generating PDF report:', error.message);
          
          // Try to find export button on page
          const exportButtons = await page.$$('button');
          for (const button of exportButtons) {
            const text = await button.evaluate(el => el.textContent);
            if (text && (text.includes('Export') || text.includes('Download'))) {
              await button.click();
              await delay(2000);
              await page.screenshot({ path: path.join(screenshotsDir, '09-export-clicked.png'), fullPage: true });
              break;
            }
          }
        }
      }
    }

    // Final screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '10-final-state.png'), fullPage: true });

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