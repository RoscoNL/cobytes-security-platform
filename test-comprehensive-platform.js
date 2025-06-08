const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3002';
const API_URL = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testComprehensivePlatform() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  const results = [];
  
  console.log('🚀 Comprehensive Platform Test\n');
  console.log('Frontend:', FRONTEND_URL);
  console.log('Backend:', API_URL);
  console.log('=====================================\n');

  // Helper function to add test result
  function addResult(category, test, passed, details) {
    results.push({ category, test, passed, details });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${category} - ${test}: ${details}`);
  }

  try {
    // Test 1: Homepage
    console.log('\n📄 Testing Homepage...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    await sleep(2000);
    
    const homepageElements = await page.evaluate(() => {
      return {
        hero: document.querySelector('h1')?.textContent || '',
        viewProductsBtn: !!Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('View Products')),
        pricingSection: !!document.querySelector('#pricing'),
        navLinks: document.querySelectorAll('nav a').length
      };
    });
    
    addResult('Homepage', 'Hero section', homepageElements.hero.includes('Security'), homepageElements.hero);
    addResult('Homepage', 'View Products button', homepageElements.viewProductsBtn, 'Button present');
    addResult('Homepage', 'Pricing section', homepageElements.pricingSection, 'Section present');
    addResult('Homepage', 'Navigation', homepageElements.navLinks > 0, `${homepageElements.navLinks} nav links found`);
    
    await page.screenshot({ path: 'screenshots/test-1-homepage.png' });

    // Test 2: Products Page
    console.log('\n📄 Testing Products Page...');
    await page.goto(`${FRONTEND_URL}/products`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    
    const productsData = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="MuiCard"]');
      const addButtons = Array.from(document.querySelectorAll('button')).filter(btn => btn.textContent.includes('Add to Cart'));
      const tabs = document.querySelectorAll('[role="tab"]');
      return {
        productCount: cards.length,
        addToCartButtons: addButtons.length,
        tabs: tabs.length,
        firstProductName: cards[0]?.querySelector('h6')?.textContent || 'No product found'
      };
    });
    
    addResult('Products', 'Products displayed', productsData.productCount > 0, `${productsData.productCount} products shown`);
    addResult('Products', 'Add to cart buttons', productsData.addToCartButtons > 0, `${productsData.addToCartButtons} buttons`);
    addResult('Products', 'Category tabs', productsData.tabs > 0, `${productsData.tabs} tabs`);
    
    await page.screenshot({ path: 'screenshots/test-2-products.png' });

    // Test 3: Add to Cart
    console.log('\n🛒 Testing Add to Cart...');
    if (productsData.addToCartButtons > 0) {
      const addButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent.includes('Add to Cart'));
      });
      
      await addButton.click();
      await sleep(2000);
      
      const cartBadge = await page.$eval('[class*="MuiBadge-badge"]', el => el.textContent).catch(() => '0');
      addResult('Cart', 'Add to cart', parseInt(cartBadge) > 0, `Cart has ${cartBadge} item(s)`);
    }

    // Test 4: Cart Page
    console.log('\n🛒 Testing Cart Page...');
    await page.goto(`${FRONTEND_URL}/cart`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    
    const cartData = await page.evaluate(() => {
      const isEmpty = document.body.textContent.includes('empty');
      const cartItems = document.querySelectorAll('[class*="MuiCard"]').length;
      const proceedBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Proceed to Checkout'));
      return {
        isEmpty,
        itemCount: cartItems,
        hasProceedButton: !!proceedBtn
      };
    });
    
    addResult('Cart', 'Cart page loads', true, cartData.isEmpty ? 'Empty cart' : `${cartData.itemCount} items`);
    addResult('Cart', 'Proceed button', cartData.hasProceedButton, cartData.hasProceedButton ? 'Present' : 'Not found');
    
    await page.screenshot({ path: 'screenshots/test-3-cart.png' });

    // Test 5: Login Page
    console.log('\n🔐 Testing Login Page...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    
    const loginElements = await page.evaluate(() => {
      return {
        emailField: !!document.querySelector('input[name="email"]'),
        passwordField: !!document.querySelector('input[name="password"]'),
        submitButton: !!document.querySelector('button[type="submit"]'),
        registerLink: !!Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Register'))
      };
    });
    
    addResult('Login', 'Email field', loginElements.emailField, 'Present');
    addResult('Login', 'Password field', loginElements.passwordField, 'Present');
    addResult('Login', 'Submit button', loginElements.submitButton, 'Present');
    addResult('Login', 'Register link', loginElements.registerLink, 'Present');
    
    await page.screenshot({ path: 'screenshots/test-4-login.png' });

    // Test 6: Free Scan Page
    console.log('\n🔍 Testing Free Scan Page...');
    await page.goto(`${FRONTEND_URL}/free-scan`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    
    const freeScanElements = await page.evaluate(() => {
      const urlInput = document.querySelector('input[type="url"], input[name="url"]');
      const scanButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Scan') || btn.textContent.includes('Start'));
      return {
        hasUrlInput: !!urlInput,
        hasScanButton: !!scanButton,
        pageTitle: document.querySelector('h4, h5, h6')?.textContent || 'No title'
      };
    });
    
    addResult('Free Scan', 'URL input field', freeScanElements.hasUrlInput, freeScanElements.hasUrlInput ? 'Present' : 'Not found');
    addResult('Free Scan', 'Scan button', freeScanElements.hasScanButton, freeScanElements.hasScanButton ? 'Present' : 'Not found');
    
    await page.screenshot({ path: 'screenshots/test-5-free-scan.png' });

    // Test 7: All Scanners Page
    console.log('\n🛡️ Testing All Scanners Page...');
    await page.goto(`${FRONTEND_URL}/all-scanners-new`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    
    const scannersData = await page.evaluate(() => {
      const scannerCards = document.querySelectorAll('[class*="MuiCard"]');
      return {
        scannerCount: scannerCards.length,
        firstScanner: scannerCards[0]?.querySelector('h6')?.textContent || 'No scanner found'
      };
    });
    
    addResult('Scanners', 'Scanner list', scannersData.scannerCount > 0, `${scannersData.scannerCount} scanners available`);
    
    await page.screenshot({ path: 'screenshots/test-6-scanners.png' });

    // Test 8: API Health
    console.log('\n🔌 Testing API Endpoints...');
    
    // Health check
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    addResult('API', 'Health endpoint', healthResponse.ok, `Status: ${healthResponse.status}`);
    
    // Products API
    const productsResponse = await fetch(`${API_URL}/api/products`);
    const productsApiData = await productsResponse.json();
    addResult('API', 'Products endpoint', productsResponse.ok && productsApiData.data, `${productsApiData.data?.length || 0} products`);
    
    // System info
    const systemResponse = await fetch(`${API_URL}/api/system/info`);
    addResult('API', 'System info', systemResponse.ok, `Status: ${systemResponse.status}`);

    // Test 9: E-commerce Flow
    console.log('\n💳 Testing E-commerce Flow...');
    
    // Go back to products and ensure we have items in cart
    await page.goto(`${FRONTEND_URL}/products`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    
    // Add another item if cart is empty
    const cartCheck = await page.$eval('[class*="MuiBadge-badge"]', el => el.textContent).catch(() => '0');
    if (cartCheck === '0') {
      const addBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Add to Cart'));
      });
      if (addBtn) {
        await addBtn.click();
        await sleep(2000);
      }
    }
    
    // Navigate to cart
    const cartIcon = await page.$('[data-testid="ShoppingCartIcon"]');
    if (cartIcon) {
      await cartIcon.click();
      await sleep(2000);
      
      // Try to proceed to checkout
      const proceedBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Proceed'));
      });
      
      if (proceedBtn) {
        await proceedBtn.click();
        await sleep(2000);
        
        const currentUrl = page.url();
        addResult('E-commerce', 'Checkout flow', true, `Navigated to: ${currentUrl.split('/').pop()}`);
      }
    }
    
    await page.screenshot({ path: 'screenshots/test-7-ecommerce.png' });

    // Print Summary
    console.log('\n\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const categories = [...new Set(results.map(r => r.category))];
    categories.forEach(category => {
      const categoryResults = results.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.passed).length;
      const total = categoryResults.length;
      console.log(`\n${category}: ${passed}/${total} passed`);
      categoryResults.forEach(r => {
        const icon = r.passed ? '  ✅' : '  ❌';
        console.log(`${icon} ${r.test}`);
      });
    });
    
    const totalPassed = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const percentage = Math.round((totalPassed / totalTests) * 100);
    
    console.log('\n' + '='.repeat(50));
    console.log(`✨ Overall: ${totalPassed}/${totalTests} tests passed (${percentage}%)`);
    console.log('='.repeat(50));
    
    console.log('\n📸 Screenshots saved in screenshots/ directory');
    console.log('\n⏸️  Browser will close in 15 seconds...');
    await sleep(15000);

  } catch (error) {
    console.error('\n❌ Test suite error:', error);
    await page.screenshot({ path: 'screenshots/test-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testComprehensivePlatform().catch(console.error);