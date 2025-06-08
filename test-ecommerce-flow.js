const puppeteer = require('puppeteer');

const API_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3002';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEcommerceFlow() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  const results = [];

  try {
    // Test 1: Visit Homepage
    console.log('\n🔍 Test 1: Visiting homepage...');
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const heroText = await page.$eval('h1', el => el.textContent);
    const hasHero = heroText.includes('Professional Security Scanning Platform');
    results.push({
      test: 'Homepage loads',
      passed: hasHero,
      details: hasHero ? 'Hero section displayed' : 'Hero section not found'
    });

    // Test 2: Navigate to Products
    console.log('\n🔍 Test 2: Navigating to products page...');
    const productsButton = await page.waitForSelector('button:has-text("View Products")', { timeout: 5000 });
    await productsButton.click();
    await page.waitForNavigation();
    await sleep(1000);
    
    const productsTitle = await page.$eval('h4', el => el.textContent).catch(() => '');
    const onProductsPage = productsTitle.includes('Security Products');
    results.push({
      test: 'Navigate to products',
      passed: onProductsPage,
      details: onProductsPage ? 'Products page loaded' : 'Failed to load products page'
    });

    // Test 3: Add Product to Cart
    console.log('\n🔍 Test 3: Adding product to cart...');
    const addToCartButtons = await page.$$('button:has-text("Add to Cart")');
    if (addToCartButtons.length > 0) {
      await addToCartButtons[0].click();
      await sleep(1000);
      
      // Check if cart badge updated
      const cartBadge = await page.$eval('.MuiBadge-badge', el => el.textContent).catch(() => '0');
      const itemAdded = parseInt(cartBadge) > 0;
      results.push({
        test: 'Add product to cart',
        passed: itemAdded,
        details: itemAdded ? `Cart has ${cartBadge} item(s)` : 'Failed to add item to cart'
      });
    } else {
      results.push({
        test: 'Add product to cart',
        passed: false,
        details: 'No add to cart buttons found'
      });
    }

    // Test 4: Navigate to Cart
    console.log('\n🔍 Test 4: Navigating to cart...');
    const cartIcon = await page.waitForSelector('[data-testid="ShoppingCartIcon"]', { timeout: 5000 });
    await cartIcon.click();
    await page.waitForNavigation();
    await sleep(1000);
    
    const cartTitle = await page.$eval('h4', el => el.textContent).catch(() => '');
    const onCartPage = cartTitle.includes('Shopping Cart');
    results.push({
      test: 'Navigate to cart',
      passed: onCartPage,
      details: onCartPage ? 'Cart page loaded' : 'Failed to load cart page'
    });

    // Test 5: Proceed to Checkout
    console.log('\n🔍 Test 5: Proceeding to checkout...');
    const checkoutButton = await page.waitForSelector('button:has-text("Proceed to Checkout")', { timeout: 5000 });
    await checkoutButton.click();
    await page.waitForNavigation();
    await sleep(1000);
    
    // Should redirect to login if not authenticated
    const currentUrl = page.url();
    const redirectedToLogin = currentUrl.includes('/login');
    results.push({
      test: 'Checkout requires login',
      passed: redirectedToLogin,
      details: redirectedToLogin ? 'Redirected to login page' : 'Did not redirect to login'
    });

    // Test 6: Login
    console.log('\n🔍 Test 6: Logging in...');
    if (redirectedToLogin) {
      await page.type('input[name="email"]', 'test@example.com');
      await page.type('input[name="password"]', 'password');
      const loginButton = await page.waitForSelector('button[type="submit"]');
      await loginButton.click();
      await sleep(2000);
      
      const afterLoginUrl = page.url();
      const loggedIn = afterLoginUrl.includes('/checkout');
      results.push({
        test: 'Login and redirect to checkout',
        passed: loggedIn,
        details: loggedIn ? 'Successfully logged in and redirected' : 'Login failed'
      });
    }

    // Test 7: Fill Checkout Form
    console.log('\n🔍 Test 7: Filling checkout form...');
    const checkoutTitle = await page.$eval('h4', el => el.textContent).catch(() => '');
    if (checkoutTitle.includes('Checkout')) {
      // Fill billing information
      await page.type('input[name="billing_name"]', 'Test User');
      await page.type('input[name="billing_email"]', 'test@example.com');
      await page.type('input[name="billing_address"]', '123 Test Street');
      await page.type('input[name="billing_city"]', 'Amsterdam');
      await page.type('input[name="billing_postal_code"]', '1234AB');
      
      // Click Next
      const nextButton = await page.waitForSelector('button:has-text("Next")');
      await nextButton.click();
      await sleep(1000);
      
      // Select payment method (should be on step 2 now)
      const paymentRadio = await page.$('input[value="stripe"]');
      if (paymentRadio) {
        await paymentRadio.click();
        
        // Click Next again
        await nextButton.click();
        await sleep(1000);
        
        // Should be on review step
        const agreeCheckbox = await page.$('input[name="agree_terms"]');
        if (agreeCheckbox) {
          await agreeCheckbox.click();
          
          results.push({
            test: 'Fill checkout form',
            passed: true,
            details: 'Successfully filled all checkout steps'
          });
        }
      }
    } else {
      results.push({
        test: 'Fill checkout form',
        passed: false,
        details: 'Not on checkout page'
      });
    }

    // Print results
    console.log('\n📊 Test Results:');
    console.log('================');
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.details}`);
    });

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    console.log(`\n✨ Total: ${passed}/${total} tests passed`);

    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will remain open for inspection. Press Ctrl+C to close.');
    await new Promise(() => {}); // Keep running

  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testEcommerceFlow().catch(console.error);