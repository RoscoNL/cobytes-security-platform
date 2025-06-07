const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3002';

const PAGES_TO_TEST = [
  { name: 'Landing', path: '/', waitFor: 'h1' },
  { name: 'Dashboard', path: '/dashboard', waitFor: '.MuiTypography-h4' },
  { name: 'All Scanners', path: '/all-scanners-new', waitFor: '.MuiCard-root' },
  { name: 'Integration Status', path: '/integration-status', waitFor: '.MuiTypography-h4' },
  { name: 'Scan Demo', path: '/scan-demo', waitFor: '.MuiTypography-h4' },
];

async function testAllPages() {
  console.log('🚀 Testing all frontend pages...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];
  let allPassed = true;

  try {
    const page = await browser.newPage();
    
    // Catch console errors
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        console.error(`  ❌ Console Error: ${msg.text()}`);
        allPassed = false;
      }
    });

    // Catch page errors
    page.on('pageerror', error => {
      console.error(`  ❌ Page Error: ${error.message}`);
      allPassed = false;
    });

    // Test each page
    for (const pageInfo of PAGES_TO_TEST) {
      console.log(`📄 Testing ${pageInfo.name} (${pageInfo.path})...`);
      
      try {
        const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
          waitUntil: 'networkidle2',
          timeout: 10000
        });

        if (!response.ok()) {
          console.error(`  ❌ HTTP ${response.status()}`);
          results.push({ page: pageInfo.name, status: 'FAILED', error: `HTTP ${response.status()}` });
          allPassed = false;
        } else {
          // Wait for specific element
          await page.waitForSelector(pageInfo.waitFor, { timeout: 5000 });
          console.log(`  ✅ Page loaded successfully`);
          results.push({ page: pageInfo.name, status: 'PASSED' });
        }
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        results.push({ page: pageInfo.name, status: 'FAILED', error: error.message });
        allPassed = false;
      }
    }

    // Test scanner functionality
    console.log('\n🔧 Testing Scanner Functionality...');
    
    await page.goto(`${BASE_URL}/all-scanners-new`, { waitUntil: 'networkidle2' });
    
    // Check if scanner cards are present
    const scannerCards = await page.$$('.MuiCard-root');
    if (scannerCards.length > 0) {
      console.log(`  ✅ Found ${scannerCards.length} scanner cards`);
      
      // Click on first scanner
      await scannerCards[0].click();
      
      // Wait for dialog
      try {
        await page.waitForSelector('.MuiDialog-root', { timeout: 3000 });
        console.log('  ✅ Scanner dialog opens correctly');
        
        // Close dialog
        const closeButton = await page.$('button:has-text("Close")');
        if (closeButton) {
          await closeButton.click();
          console.log('  ✅ Dialog closes correctly');
        }
      } catch (error) {
        console.error('  ❌ Dialog functionality error:', error.message);
        allPassed = false;
      }
    } else {
      console.error('  ❌ No scanner cards found');
      allPassed = false;
    }

  } catch (error) {
    console.error('Fatal error:', error);
    allPassed = false;
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n📋 TEST SUMMARY:');
  console.log('================');
  
  results.forEach(result => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} ${result.page}: ${result.status}${result.error ? ` - ${result.error}` : ''}`);
  });
  
  if (allPassed) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  }
}

// Run the tests
testAllPages().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});