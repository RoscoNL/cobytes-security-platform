const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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
    if (!msg.text().includes('React DevTools') && !msg.text().includes('React Router')) {
      console.log('Browser:', msg.text());
    }
  });

  try {
    // Step 1: Go to all-scanners-new page which seems to be the scan creation page
    console.log('1. Navigating to all-scanners-new page...');
    await page.goto(`${baseUrl}/all-scanners-new`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: `${environment}-1-all-scanners.png` });

    // Check if we need to login
    if (page.url().includes('/login')) {
      console.log('2. Need to login first...');
      
      // Fill login form
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'Test123!@#');
      await page.screenshot({ path: `${environment}-2-login-filled.png` });
      
      // Submit login
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      
      // Navigate back to all-scanners-new
      await page.goto(`${baseUrl}/all-scanners-new`, { waitUntil: 'networkidle2' });
    }

    // Alternative: Try the dashboard scan creation route
    console.log('3. Trying dashboard scan creation route...');
    await page.goto(`${baseUrl}/dashboard/scans/new`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: `${environment}-3-scan-create.png` });

    // If still on login, authenticate
    if (page.url().includes('/login')) {
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'Test123!@#');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      await page.goto(`${baseUrl}/dashboard/scans/new`, { waitUntil: 'networkidle2' });
    }

    // Wait for the form to load
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${environment}-4-scan-form.png` });

    // Step 4: Fill in the URL
    console.log('4. Looking for URL input...');
    
    // Try to find URL input field
    const urlInput = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const urlInput = inputs.find(input => 
        input.name === 'url' || 
        input.type === 'url' ||
        (input.placeholder && input.placeholder.toLowerCase().includes('url')) ||
        (input.placeholder && input.placeholder.toLowerCase().includes('domain')) ||
        (input.placeholder && input.placeholder.toLowerCase().includes('website'))
      );
      if (urlInput) {
        urlInput.value = 'https://www.cobytes.com';
        urlInput.dispatchEvent(new Event('input', { bubbles: true }));
        urlInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    });

    if (urlInput) {
      console.log('✅ URL entered');
    } else {
      console.log('❌ Could not find URL input');
    }

    await page.screenshot({ path: `${environment}-5-url-entered.png` });

    // Step 5: Select WordPress scanner
    console.log('5. Selecting scanner...');
    
    // Try to find and select WordPress scanner
    const scannerSelected = await page.evaluate(() => {
      // Check for select dropdown
      const select = document.querySelector('select');
      if (select) {
        const options = Array.from(select.options);
        const wpOption = options.find(opt => 
          opt.text.toLowerCase().includes('wordpress') || 
          opt.value === 'wordpress'
        );
        if (wpOption) {
          select.value = wpOption.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      
      // Check for radio buttons or checkboxes
      const radios = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      for (const radio of radios) {
        const label = radio.parentElement?.textContent || '';
        if (label.toLowerCase().includes('wordpress')) {
          radio.click();
          return true;
        }
      }
      
      return false;
    });

    if (scannerSelected) {
      console.log('✅ Scanner selected');
    }

    await page.screenshot({ path: `${environment}-6-scanner-selected.png` });

    // Step 6: Submit the form
    console.log('6. Submitting scan...');
    
    const submitted = await page.evaluate(() => {
      // Find submit button
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitButton = buttons.find(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('start') || text.includes('scan') || text.includes('begin') || text.includes('submit');
      });
      
      if (submitButton) {
        submitButton.click();
        return true;
      }
      
      // Try form submit
      const forms = document.querySelectorAll('form');
      if (forms.length > 0) {
        forms[0].submit();
        return true;
      }
      
      return false;
    });

    if (submitted) {
      console.log('✅ Scan submitted');
    }

    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${environment}-7-after-submit.png` });

    // Step 7: Check if we're on scan status page
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/scan-status/') || currentUrl.includes('/dashboard/scans/')) {
      console.log('7. Monitoring scan progress...');
      
      // Monitor for up to 2 minutes
      for (let i = 0; i < 24; i++) {
        await page.waitForTimeout(5000);
        
        const status = await page.evaluate(() => {
          const body = document.body.innerText;
          return {
            hasDownload: body.includes('Download'),
            hasComplete: body.includes('Complete') || body.includes('Completed'),
            hasError: body.includes('Error') || body.includes('Failed'),
            content: body.substring(0, 200)
          };
        });
        
        console.log(`  Check ${i + 1}: ${status.hasComplete ? 'Complete' : 'In Progress'}`);
        
        if (status.hasComplete || status.hasDownload) {
          console.log('✅ Scan completed!');
          await page.screenshot({ path: `${environment}-8-scan-complete.png` });
          
          // Try to download PDF
          const downloadLink = await page.$('a[href*="pdf"], button:contains("Download")');
          if (downloadLink) {
            console.log('📥 Downloading PDF...');
            await downloadLink.click();
            await page.waitForTimeout(5000);
          }
          break;
        }
        
        if (status.hasError) {
          console.log('❌ Scan failed');
          break;
        }
      }
    }

    await page.screenshot({ path: `${environment}-9-final-state.png` });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: `${environment}-error.png` });
  } finally {
    await browser.close();
  }
}

async function runTests() {
  // Create downloads directory
  const downloadsDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // Test local environment
  await testWordPressScan('http://localhost:3002', 'local');
  
  // Wait before testing production
  console.log('\n⏳ Waiting 5 seconds before testing production...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test production environment
  await testWordPressScan('https://securityscan.cobytes.com', 'production');
  
  console.log('\n✅ Tests completed. Check the screenshots in the current directory.');
}

// Run the tests
runTests().catch(console.error);