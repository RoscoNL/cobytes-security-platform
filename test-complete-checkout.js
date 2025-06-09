const puppeteer = require('puppeteer');

async function testFullCheckoutFlow() {
  console.log('🔍 Testing full checkout flow with login redirect...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  
  // Enable detailed logging
  page.on('console', msg => {
    if (!msg.text().includes('React DevTools')) {
      console.log('Browser:', msg.text());
    }
  });
  
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  // Track network errors
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`❌ HTTP ${response.status()} - ${response.url()}`);
    }
  });

  try {
    // Step 1: Check if login redirect URL works
    console.log('1. Testing login with redirect parameter...');
    const loginUrl = 'http://localhost:3002/login?redirect=/checkout';
    await page.goto(loginUrl, { waitUntil: 'networkidle2' });
    
    console.log('Current URL:', page.url());
    await page.screenshot({ path: 'checkout-test-1-login.png' });
    
    // Check for any error messages
    const errorText = await page.evaluate(() => {
      const body = document.body.innerText;
      if (body.includes('Resource not found') || body.includes('404') || body.includes('Page not found')) {
        return body;
      }
      return null;
    });
    
    if (errorText) {
      console.log('❌ Error found on page:', errorText.substring(0, 200));
    } else {
      console.log('✅ Login page loaded successfully');
    }
    
    // Step 2: Fill login form and submit
    console.log('\n2. Logging in with test credentials...');
    
    // Click "Use test credentials"
    try {
      await page.click('button:text("Use test credentials")');
    } catch {
      console.log('Could not find test credentials button, filling manually...');
      await page.type('input[name="email"]', 'user@cobytes.com');
      await page.type('input[name="password"]', 'pass');
    }
    
    await page.screenshot({ path: 'checkout-test-2-credentials.png' });
    
    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('After login URL:', page.url());
    await page.screenshot({ path: 'checkout-test-3-after-login.png' });
    
    // Step 3: Check if we're redirected to checkout
    if (page.url().includes('/checkout')) {
      console.log('✅ Successfully redirected to checkout');
      
      // Check checkout page content
      const checkoutContent = await page.evaluate(() => document.body.innerText);
      console.log('Checkout page preview:', checkoutContent.substring(0, 200));
    } else if (page.url().includes('/dashboard')) {
      console.log('⚠️  Redirected to dashboard instead of checkout');
    } else {
      console.log('❌ Unexpected redirect to:', page.url());
    }
    
    // Step 4: Try navigating directly to checkout
    console.log('\n3. Testing direct checkout navigation...');
    await page.goto('http://localhost:3002/checkout', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'checkout-test-4-direct.png' });
    
    // Step 5: Test the full shopping flow
    console.log('\n4. Testing full shopping flow...');
    
    // Go to products page
    await page.goto('http://localhost:3002/products', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'checkout-test-5-products.png' });
    
    // Check if products loaded
    const hasProducts = await page.evaluate(() => {
      return document.body.innerText.includes('Add to Cart') || 
             document.body.innerText.includes('Products');
    });
    
    if (hasProducts) {
      console.log('✅ Products page loaded');
      
      // Try to add a product to cart
      const addToCartClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addButton = buttons.find(btn => btn.textContent?.includes('Add to Cart'));
        if (addButton) {
          addButton.click();
          return true;
        }
        return false;
      });
      
      if (addToCartClicked) {
        console.log('✅ Added product to cart');
        await page.waitForTimeout(2000);
        
        // Go to cart
        await page.goto('http://localhost:3002/cart', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: 'checkout-test-6-cart.png' });
        
        // Try to proceed to checkout
        const checkoutClicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          const checkoutButton = buttons.find(el => 
            el.textContent?.toLowerCase().includes('checkout') ||
            el.textContent?.toLowerCase().includes('proceed')
          );
          if (checkoutButton) {
            checkoutButton.click();
            return true;
          }
          return false;
        });
        
        if (checkoutClicked) {
          console.log('✅ Clicked checkout button');
          await page.waitForTimeout(3000);
          console.log('Final URL:', page.url());
          await page.screenshot({ path: 'checkout-test-7-final.png' });
        }
      }
    }
    
    // Step 6: Check console for any React errors
    const reactErrors = await page.evaluate(() => {
      const errors = [];
      if (window.console && window.console.error) {
        // Check for any logged errors
        return 'Check browser console for errors';
      }
      return null;
    });
    
    if (reactErrors) {
      console.log('\n⚠️  React errors may be present:', reactErrors);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'checkout-test-error.png' });
  } finally {
    console.log('\n📸 Screenshots saved. Check checkout-test-*.png files');
    await browser.close();
  }
}

// Run the test
testFullCheckoutFlow().catch(console.error);