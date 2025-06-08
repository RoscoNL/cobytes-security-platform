const puppeteer = require('puppeteer');

const API_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3002';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFullEcommerceFlow() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const results = [];

  try {
    // Test 1: Homepage
    console.log('\n🔍 Test 1: Loading homepage...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    await sleep(1000);
    
    const title = await page.title();
    results.push({
      test: 'Homepage loads',
      passed: title.includes('Cobytes Security Platform'),
      details: `Title: ${title}`
    });

    // Test 2: Navigate to Products
    console.log('\n🔍 Test 2: Navigating to products...');
    // Look for "View Products" button
    const productsButton = await page.$('button');
    if (productsButton) {
      const buttonText = await page.evaluate(el => el.textContent, productsButton);
      console.log('Found button:', buttonText);
      
      // Find the View Products button specifically
      const viewProductsButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent.includes('View Products'));
      });
      
      if (viewProductsButton) {
        await viewProductsButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await sleep(1000);
        
        const url = page.url();
        results.push({
          test: 'Navigate to products',
          passed: url.includes('/products'),
          details: `URL: ${url}`
        });
      }
    }

    // Test 3: Check Products Display
    console.log('\n🔍 Test 3: Checking products display...');
    const productCards = await page.$$('[class*="MuiCard-root"]');
    const productCount = productCards.length;
    results.push({
      test: 'Products displayed',
      passed: productCount > 0,
      details: `Found ${productCount} products`
    });

    // Test 4: Add Product to Cart
    console.log('\n🔍 Test 4: Adding product to cart...');
    if (productCount > 0) {
      // Click first "Add to Cart" button
      const addToCartButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent.includes('Add to Cart'));
      });
      
      if (addToCartButton) {
        await addToCartButton.click();
        await sleep(1500);
        
        // Check if cart badge updated
        const cartBadge = await page.$('[class*="MuiBadge-badge"]');
        let cartCount = '0';
        if (cartBadge) {
          cartCount = await page.evaluate(el => el.textContent, cartBadge);
        }
        
        results.push({
          test: 'Add product to cart',
          passed: parseInt(cartCount) > 0,
          details: `Cart has ${cartCount} item(s)`
        });
      }
    }

    // Test 5: Navigate to Cart
    console.log('\n🔍 Test 5: Navigating to cart...');
    const cartIcon = await page.$('[data-testid="ShoppingCartIcon"]');
    if (cartIcon) {
      await cartIcon.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await sleep(1000);
      
      const url = page.url();
      const hasCartContent = await page.$('[class*="MuiPaper-root"]');
      results.push({
        test: 'Navigate to cart',
        passed: url.includes('/cart') && hasCartContent !== null,
        details: `Cart page loaded at ${url}`
      });
    }

    // Test 6: Check Cart Content
    console.log('\n🔍 Test 6: Checking cart content...');
    const cartItemName = await page.$eval('h6', el => el.textContent).catch(() => '');
    const proceedButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Proceed to Checkout'));
    });
    
    results.push({
      test: 'Cart has items',
      passed: cartItemName.length > 0 && proceedButton !== null,
      details: `Cart contains: ${cartItemName}`
    });

    // Test 7: Navigate to Checkout
    console.log('\n🔍 Test 7: Proceeding to checkout...');
    if (proceedButton) {
      await proceedButton.asElement().click();
      await sleep(2000);
      
      const url = page.url();
      if (url.includes('/login')) {
        results.push({
          test: 'Checkout requires login',
          passed: true,
          details: 'Redirected to login page as expected'
        });
        
        // Test 8: Login
        console.log('\n🔍 Test 8: Testing login...');
        await page.type('input[name="email"]', 'test@example.com');
        await page.type('input[name="password"]', 'password');
        
        const loginButton = await page.$('button[type="submit"]');
        if (loginButton) {
          await loginButton.click();
          await sleep(2000);
          
          const afterLoginUrl = page.url();
          results.push({
            test: 'Login functionality',
            passed: afterLoginUrl.includes('/checkout') || afterLoginUrl.includes('/dashboard'),
            details: `After login URL: ${afterLoginUrl}`
          });
        }
      } else if (url.includes('/checkout')) {
        results.push({
          test: 'Direct to checkout',
          passed: true,
          details: 'Navigated directly to checkout'
        });
      }
    }

    // Test 9: Check Checkout Page
    console.log('\n🔍 Test 9: Checking checkout page...');
    const checkoutUrl = page.url();
    if (checkoutUrl.includes('/checkout')) {
      const stepper = await page.$('[class*="MuiStepper-root"]');
      const billingForm = await page.$('input[name="billing_name"]');
      
      results.push({
        test: 'Checkout page structure',
        passed: stepper !== null && billingForm !== null,
        details: 'Checkout form and stepper present'
      });
    }

    // Test 10: API Health Check
    console.log('\n🔍 Test 10: Checking API health...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3001/health');
        return await response.json();
      } catch (error) {
        return { error: error.message };
      }
    });
    
    results.push({
      test: 'Backend API health',
      passed: apiResponse.status === 'healthy',
      details: `API status: ${apiResponse.status || apiResponse.error}`
    });

    // Print results
    console.log('\n\n📊 E-commerce Test Results:');
    console.log('==========================');
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.details}`);
    });

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    console.log(`\n✨ Total: ${passed}/${total} tests passed`);
    
    // Take screenshot
    await page.screenshot({ path: 'test-ecommerce-final.png', fullPage: true });
    console.log('\n📸 Screenshot saved as test-ecommerce-final.png');

    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will remain open for inspection. Press Ctrl+C to close.');
    await new Promise(() => {}); // Keep running

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test-ecommerce-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as test-ecommerce-error.png');
  }
}

// Run the test
testFullEcommerceFlow().catch(console.error);