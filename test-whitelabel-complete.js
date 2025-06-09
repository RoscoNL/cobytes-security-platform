const puppeteer = require('puppeteer');

async function testWhitelabelSite() {
  console.log('🔍 Testing whitelabel site after all changes...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // Test 1: Homepage
    console.log('1. Testing homepage...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
    await wait(2000);
    
    // Check for any PenTest Tools references
    const pageContent = await page.content();
    const hasPentestTools = pageContent.toLowerCase().includes('pentest') || 
                           pageContent.toLowerCase().includes('pentest-tools');
    
    if (hasPentestTools) {
      console.log('❌ Found PenTest Tools reference on homepage!');
    } else {
      console.log('✅ Homepage is clean - no PenTest Tools branding');
    }
    await page.screenshot({ path: 'whitelabel-1-homepage.png' });

    // Test 2: All Scanners page
    console.log('\n2. Testing All Scanners page...');
    await page.goto('http://localhost:3002/all-scanners-new', { waitUntil: 'networkidle2' });
    await wait(2000);
    
    const scannersContent = await page.evaluate(() => document.body.innerText);
    console.log('Page title:', scannersContent.split('\n')[0]);
    
    if (scannersContent.includes('PentestTools') || scannersContent.includes('Pentest Tools')) {
      console.log('❌ Found PenTest Tools reference on scanners page!');
    } else {
      console.log('✅ Scanners page is clean');
    }
    await page.screenshot({ path: 'whitelabel-2-scanners.png' });

    // Test 3: Create WordPress scan
    console.log('\n3. Testing WordPress scan creation...');
    
    // Click on WordPress Scanner
    const wpScannerClicked = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="MuiCard"]');
      for (const card of cards) {
        if (card.textContent?.includes('WordPress Scanner')) {
          card.click();
          return true;
        }
      }
      return false;
    });

    if (wpScannerClicked) {
      console.log('✅ Clicked WordPress Scanner');
      await wait(2000);
      
      // Check dialog content
      const dialogContent = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog ? dialog.innerText : '';
      });
      
      if (dialogContent.includes('PentestTools') || dialogContent.includes('View in PentestTools')) {
        console.log('❌ Found PenTest Tools reference in dialog!');
      } else {
        console.log('✅ Dialog is clean');
      }
      
      // Fill in URL
      await page.evaluate(() => {
        const input = document.querySelector('input[label="Target"], input[type="text"]');
        if (input) {
          input.value = 'https://www.example.com';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      
      await wait(1000);
      await page.screenshot({ path: 'whitelabel-3-scan-dialog.png' });
      
      // Start scan
      const scanStarted = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.includes('Start Scan')) {
            button.click();
            return true;
          }
        }
        return false;
      });
      
      if (scanStarted) {
        console.log('✅ Scan started');
        await wait(3000);
        
        // Check if we see "View Scan Status" instead of "View in PentestTools"
        const hasCorrectButton = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          let hasViewStatus = false;
          let hasViewPentest = false;
          
          for (const button of buttons) {
            if (button.textContent?.includes('View Scan Status')) hasViewStatus = true;
            if (button.textContent?.includes('PentestTools')) hasViewPentest = true;
          }
          
          return { hasViewStatus, hasViewPentest };
        });
        
        if (hasCorrectButton.hasViewPentest) {
          console.log('❌ Still showing "View in PentestTools" button!');
        } else if (hasCorrectButton.hasViewStatus) {
          console.log('✅ Showing correct "View Scan Status" button');
        }
        
        await page.screenshot({ path: 'whitelabel-4-scan-started.png' });
      }
    }

    // Test 4: Login page
    console.log('\n4. Testing login page...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle2' });
    await wait(2000);
    
    const loginContent = await page.evaluate(() => document.body.innerText);
    if (loginContent.includes('PentestTools')) {
      console.log('❌ Found PenTest Tools reference on login page!');
    } else {
      console.log('✅ Login page is clean');
    }
    await page.screenshot({ path: 'whitelabel-5-login.png' });

    // Test 5: Check API endpoints
    console.log('\n5. Testing API endpoints...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3001/api/system/api-status');
        return await response.json();
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('API Status:', apiResponse);

    console.log('\n✅ Whitelabel testing complete!');
    console.log('Check the whitelabel-*.png screenshots for visual verification.');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'whitelabel-error.png' });
  } finally {
    await browser.close();
  }
}

testWhitelabelSite().catch(console.error);