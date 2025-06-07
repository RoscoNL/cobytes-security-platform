const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3002';

const PAGES_TO_TEST = [
  { name: 'Landing', path: '/' },
  { name: 'All Scanners New', path: '/all-scanners-new' },
  { name: 'Integration Status', path: '/integration-status' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Scan Status (Example)', path: '/scan-status/35663682' },
];

async function testAllPages() {
  console.log('🚀 Starting comprehensive page tests...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' && !text.includes('favicon')) {
        console.error(`❌ Console Error: ${text}`);
      }
    });

    // Catch page errors
    page.on('pageerror', error => {
      console.error(`❌ Page Error: ${error.message}`);
    });

    // Test each page
    for (const pageInfo of PAGES_TO_TEST) {
      console.log(`\n📄 Testing ${pageInfo.name} (${pageInfo.path})...`);
      
      const testResult = {
        name: pageInfo.name,
        path: pageInfo.path,
        status: 'pending',
        errors: [],
        loadTime: 0
      };

      try {
        const startTime = Date.now();
        
        // Navigate to the page
        const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        const loadTime = Date.now() - startTime;
        testResult.loadTime = loadTime;

        // Check response status
        if (!response.ok()) {
          testResult.errors.push(`HTTP ${response.status()}`);
          testResult.status = 'error';
        } else {
          console.log(`  ✅ Page loaded successfully (${loadTime}ms)`);
          testResult.status = 'success';
        }

        // Take screenshot
        const screenshotName = `screenshot-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        await page.screenshot({ path: screenshotName, fullPage: false });
        console.log(`  📸 Screenshot saved: ${screenshotName}`);

        // Page-specific tests
        if (pageInfo.path === '/all-scanners-new') {
          // Test if scanner cards are visible
          const scannerCards = await page.$$('.MuiCard-root');
          console.log(`  📊 Found ${scannerCards.length} scanner cards`);
          
          if (scannerCards.length === 0) {
            testResult.errors.push('No scanner cards found');
          }
        }

        if (pageInfo.path === '/integration-status') {
          // Check if integration checklist is visible
          const checklist = await page.$('.MuiList-root');
          if (checklist) {
            console.log('  ✅ Integration checklist found');
          } else {
            testResult.errors.push('Integration checklist not found');
          }
        }

        if (pageInfo.path === '/dashboard') {
          // Check for PentestTools scans section
          const pentestSection = await page.evaluate(() => {
            const headings = Array.from(document.querySelectorAll('h6'));
            return headings.some(h => h.textContent.includes('PentestTools'));
          });
          
          if (pentestSection) {
            console.log('  ✅ PentestTools section found on dashboard');
          } else {
            testResult.errors.push('PentestTools section not found on dashboard');
          }
        }

        if (pageInfo.path.includes('/scan-status/')) {
          // Check if scan details are loading
          const scanInfo = await page.waitForSelector('.MuiCard-root', { timeout: 5000 }).catch(() => null);
          if (scanInfo) {
            console.log('  ✅ Scan details loaded');
          } else {
            testResult.errors.push('Scan details failed to load');
          }
        }

        // Wait a bit to catch any delayed errors
        await page.waitForTimeout(2000);

      } catch (error) {
        console.error(`  ❌ Error testing ${pageInfo.name}: ${error.message}`);
        testResult.status = 'error';
        testResult.errors.push(error.message);
      }

      results.push(testResult);
    }

    // Test scanner functionality
    console.log('\n🔧 Testing Scanner Functionality...');
    
    await page.goto(`${BASE_URL}/all-scanners-new`, { waitUntil: 'networkidle2' });
    
    // Click on WordPress scanner
    const wpScannerCard = await page.evaluateHandle(() => {
      const chips = Array.from(document.querySelectorAll('.MuiChip-label'));
      const chip = chips.find(c => c.textContent === 'Tool ID: 270');
      return chip ? chip.closest('.MuiCard-root') : null;
    });

    if (wpScannerCard && await wpScannerCard.evaluate(el => el !== null)) {
      await wpScannerCard.click();
      console.log('  ✅ Clicked WordPress Scanner');
      
      // Wait for dialog
      await page.waitForSelector('.MuiDialog-root', { timeout: 5000 });
      console.log('  ✅ Scanner dialog opened');
      
      // Close dialog
      const closeButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.textContent === 'Close');
      });
      
      if (closeButton) {
        await closeButton.click();
        console.log('  ✅ Dialog closed');
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);
  }

  // Print summary
  console.log('\n📋 TEST SUMMARY:');
  console.log('================');
  
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`${icon} ${result.name} (${result.path})`);
    if (result.loadTime) {
      console.log(`   Load time: ${result.loadTime}ms`);
    }
    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        console.log(`   Error: ${error}`);
      });
    }
  });
  
  const successCount = results.filter(r => r.status === 'success').length;
  console.log(`\n🎯 Success rate: ${successCount}/${results.length} pages`);
  
  console.log('\n👀 Browser will remain open for manual inspection. Press Ctrl+C to exit.');
  
  // Keep browser open
  // await browser.close();
}

// Run the tests
testAllPages().catch(console.error);