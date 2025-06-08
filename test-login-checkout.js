const puppeteer = require('puppeteer');

async function testLoginCheckout() {
  console.log('🚀 Testing login with redirect to checkout...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    
    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Console Error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });
    
    // 1. First go to products page
    console.log('📍 Step 1: Loading products page...');
    await page.goto('http://localhost:3002/products', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    // 2. Add a product to cart
    console.log('📍 Step 2: Adding product to cart...');
    const addedToCart = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add to Cart'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    
    if (addedToCart) {
      await new Promise(r => setTimeout(r, 1000));
      console.log('✅ Product added to cart');
    } else {
      console.log('⚠️  No Add to Cart button found');
    }
    
    // 3. Go to cart
    console.log('📍 Step 3: Going to cart...');
    await page.goto('http://localhost:3002/cart');
    await new Promise(r => setTimeout(r, 2000));
    
    // 4. Click checkout (should redirect to login)
    console.log('📍 Step 4: Clicking checkout...');
    const checkoutButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Checkout'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    
    if (checkoutButton) {
      await new Promise(r => setTimeout(r, 2000));
      console.log('✅ Redirected to:', page.url());
    }
    
    // 5. Login with demo credentials
    console.log('📍 Step 5: Logging in with demo credentials...');
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await page.type('input[type="email"]', 'user@cobytes.com');
      await page.type('input[type="password"]', 'pass');
      
      await page.screenshot({ path: 'screenshots/login-before-submit.png' });
      
      // Submit form
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 3000));
      
      // Check where we ended up
      const currentUrl = page.url();
      console.log('✅ After login, redirected to:', currentUrl);
      
      // Take screenshot
      await page.screenshot({ path: 'screenshots/after-login-redirect.png', fullPage: true });
      
      // Check if we're on checkout page
      if (currentUrl.includes('/checkout')) {
        console.log('✅ Successfully redirected to checkout!');
        
        // Check for any errors on the page
        const errorElements = await page.$$('.MuiAlert-root');
        if (errorElements.length > 0) {
          console.log('⚠️  Found error alerts on page');
        }
      } else {
        console.log('❌ Not on checkout page');
      }
    } else {
      console.log('❌ Login form not found');
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/test-error.png' });
  } finally {
    await new Promise(r => setTimeout(r, 5000)); // Keep browser open
    await browser.close();
  }
}

// Run test
testLoginCheckout();