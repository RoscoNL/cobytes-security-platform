const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting browser to test checkout flow...');
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });

  // Enable console log capture
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      console.error('❌ Browser console error:', text);
      
      // Check if this is our React error
      if (text.includes('Objects are not valid as a React child')) {
        console.log('\n🔴 REACT ERROR DETECTED! 🔴');
        console.log('This means the fix did not work properly.');
      }
    } else if (type === 'warning') {
      console.warn('⚠️  Browser console warning:', text);
    }
  });

  // Catch uncaught exceptions
  page.on('pageerror', error => {
    console.error('🔴 Page error:', error.message);
  });

  try {
    console.log('\n1. Going to products page...');
    await page.goto('http://localhost:3002/products', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n2. Going to cart page...');
    await page.goto('http://localhost:3002/cart', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if cart has items or if we need to add some
    const cartEmpty = await page.evaluate(() => {
      return document.body.textContent.includes('Your cart is empty');
    });

    if (cartEmpty) {
      console.log('Cart is empty, going back to add products...');
      await page.goto('http://localhost:3002/products', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Click first Add to Cart button
      const addButton = await page.$('button');
      if (addButton) {
        await addButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Go back to cart
      await page.goto('http://localhost:3002/cart', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n3. Clicking Proceed to Checkout...');
    // Find and click the checkout button
    const checkoutClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const checkoutButton = buttons.find(button => button.textContent.includes('Proceed to Checkout'));
      if (checkoutButton) {
        checkoutButton.click();
        return true;
      }
      return false;
    });

    if (!checkoutClicked) {
      console.log('Could not find checkout button');
      return;
    }

    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n4. Current URL:', page.url());
    
    // Check if we're on login page
    if (page.url().includes('/login')) {
      console.log('Redirected to login page with redirect parameter');
      
      // Fill in login credentials
      console.log('\n5. Filling login form...');
      await page.type('#email', 'user@cobytes.com');
      await page.type('#password', 'pass');
      
      // Submit form
      console.log('\n6. Submitting login...');
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('\n7. After login URL:', page.url());
    }

    // Check final state
    const hasReactError = await page.evaluate(() => {
      const errorOverlay = document.querySelector('.react-error-overlay');
      return !!errorOverlay;
    });

    if (hasReactError) {
      console.log('\n❌ React error overlay detected!');
    } else {
      console.log('\n✅ No React errors detected!');
    }

    // Take final screenshot
    await page.screenshot({ path: 'debug-screenshots/checkout-test-final.png' });
    console.log('\nScreenshot saved to debug-screenshots/checkout-test-final.png');

  } catch (error) {
    console.error('\n❌ Test error:', error);
  }

  console.log('\n👀 Keeping browser open for inspection. Press Ctrl+C to close.');
  
  // Keep browser open
  await new Promise(() => {});
})();