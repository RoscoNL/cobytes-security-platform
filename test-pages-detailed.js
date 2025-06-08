const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3002';
const API_URL = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPagesDetailed() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  console.log('🚀 Starting detailed page tests...\n');

  try {
    // Test 1: Homepage / Landing
    console.log('📄 Test 1: Homepage / Landing');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    await sleep(1000);
    
    // Check for hero section
    const heroText = await page.$eval('h1', el => el.textContent).catch(() => 'No hero found');
    console.log(`  Hero: ${heroText}`);
    
    // Check for View Products button
    const viewProductsBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('View Products')) ? 'Found' : 'Not found';
    });
    console.log(`  View Products button: ${viewProductsBtn}`);
    
    // Check for pricing section
    const pricingSection = await page.$('#pricing');
    console.log(`  Pricing section: ${pricingSection ? 'Found' : 'Not found'}`);
    
    await page.screenshot({ path: 'screenshots/homepage.png' });
    console.log('  ✅ Screenshot saved\n');

    // Test 2: Products Page
    console.log('📄 Test 2: Products Page');
    await page.goto(`${FRONTEND_URL}/products`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    
    // Check for product cards
    const productCards = await page.$$('[class*="MuiCard"]');
    console.log(`  Product cards found: ${productCards.length}`);
    
    // Check for category tabs
    const tabs = await page.$$('[role="tab"]');
    console.log(`  Category tabs: ${tabs.length}`);
    
    // Check for add to cart buttons
    const addToCartBtns = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn => btn.textContent.includes('Add to Cart')).length;
    });
    console.log(`  Add to Cart buttons: ${addToCartBtns}`);
    
    await page.screenshot({ path: 'screenshots/products.png' });
    console.log('  ✅ Screenshot saved\n');

    // Test 3: Cart Page
    console.log('📄 Test 3: Cart Page');
    await page.goto(`${FRONTEND_URL}/cart`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    
    // Check cart status
    const cartContent = await page.content();
    const isEmpty = cartContent.includes('empty');
    console.log(`  Cart status: ${isEmpty ? 'Empty' : 'Has items'}`);
    
    await page.screenshot({ path: 'screenshots/cart.png' });
    console.log('  ✅ Screenshot saved\n');

    // Test 4: Login Page
    console.log('📄 Test 4: Login Page');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    
    // Check for form elements
    const emailField = await page.$('input[name="email"]');
    const passwordField = await page.$('input[name="password"]');
    const submitBtn = await page.$('button[type="submit"]');
    
    console.log(`  Email field: ${emailField ? 'Found' : 'Not found'}`);
    console.log(`  Password field: ${passwordField ? 'Found' : 'Not found'}`);
    console.log(`  Submit button: ${submitBtn ? 'Found' : 'Not found'}`);
    
    await page.screenshot({ path: 'screenshots/login.png' });
    console.log('  ✅ Screenshot saved\n');

    // Test 5: Free Scan Page
    console.log('📄 Test 5: Free Scan Page');
    await page.goto(`${FRONTEND_URL}/free-scan`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    
    // Check for scan form
    const scanForm = await page.$('form');
    const urlInput = await page.$('input[name="url"]');
    console.log(`  Scan form: ${scanForm ? 'Found' : 'Not found'}`);
    console.log(`  URL input: ${urlInput ? 'Found' : 'Not found'}`);
    
    await page.screenshot({ path: 'screenshots/free-scan.png' });
    console.log('  ✅ Screenshot saved\n');

    // Test 6: All Scanners Page
    console.log('📄 Test 6: All Scanners Page');
    await page.goto(`${FRONTEND_URL}/all-scanners-new`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    
    // Check for scanner list
    const scannerCards = await page.$$('[class*="MuiCard"]');
    console.log(`  Scanner cards found: ${scannerCards.length}`);
    
    await page.screenshot({ path: 'screenshots/all-scanners.png' });
    console.log('  ✅ Screenshot saved\n');

    // Test 7: Security Dashboard
    console.log('📄 Test 7: Security Dashboard');
    await page.goto(`${FRONTEND_URL}/security-dashboard`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    
    const dashboardContent = await page.content();
    console.log(`  Dashboard loaded: ${dashboardContent.length > 1000 ? 'Yes' : 'No'}`);
    
    await page.screenshot({ path: 'screenshots/security-dashboard.png' });
    console.log('  ✅ Screenshot saved\n');

    // Test 8: API Health Check
    console.log('📡 Test 8: API Health Check');
    const healthResponse = await page.evaluate(async (url) => {
      try {
        const res = await fetch(`${url}/health`);
        return { status: res.status, data: await res.json() };
      } catch (error) {
        return { error: error.message };
      }
    }, API_URL);
    
    console.log(`  Health endpoint: ${healthResponse.status || 'Error'}`);
    console.log(`  Response: ${JSON.stringify(healthResponse.data || healthResponse.error).substring(0, 100)}...\n`);

    // Test 9: E-commerce Flow
    console.log('🛒 Test 9: E-commerce Flow');
    
    // Go to products and add item
    await page.goto(`${FRONTEND_URL}/products`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    
    // Try to add first product to cart
    const addButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent.includes('Add to Cart'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    
    if (addButton) {
      console.log('  ✅ Added product to cart');
      await sleep(1500);
      
      // Check cart badge
      const cartBadge = await page.$('[class*="MuiBadge-badge"]');
      if (cartBadge) {
        const count = await page.evaluate(el => el.textContent, cartBadge);
        console.log(`  Cart badge shows: ${count} item(s)`);
      }
    } else {
      console.log('  ❌ Could not add product to cart');
    }

    console.log('\n✨ All tests completed!');
    console.log('⏸️  Browser will close in 10 seconds...');
    await sleep(10000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'screenshots/error.png' });
  } finally {
    await browser.close();
  }
}

testPagesDetailed().catch(console.error);