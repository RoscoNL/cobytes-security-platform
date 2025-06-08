const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting full checkout flow test...');
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Track errors
  let errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      console.error('❌ Console error:', text);
      errors.push(text);
      
      if (text.includes('Objects are not valid as a React child')) {
        console.log('\n🔴 FOUND THE REACT CHILD ERROR! 🔴');
      }
    }
  });

  page.on('pageerror', error => {
    console.error('🔴 Page error:', error.message);
    errors.push(error.message);
  });

  try {
    console.log('\n1. Going to Products page...');
    await page.goto('http://localhost:3002/products', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'debug-screenshots/01-products.png' });

    console.log('\n2. Adding first product to cart...');
    const addButtons = await page.$$('button');
    for (const button of addButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Add to Cart')) {
        await button.click();
        console.log('Clicked Add to Cart button');
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n3. Going to Cart page...');
    await page.goto('http://localhost:3002/cart', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'debug-screenshots/02-cart.png' });

    console.log('\n4. Clicking Proceed to Checkout...');
    const checkoutButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent && button.textContent.includes('Proceed to Checkout'));
    });
    
    if (checkoutButton && checkoutButton.asElement()) {
      await checkoutButton.asElement().click();
      console.log('Clicked checkout button');
    } else {
      console.log('Could not find checkout button');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'debug-screenshots/03-after-checkout-click.png' });

    console.log('\n5. Current URL:', page.url());
    
    if (page.url().includes('/login')) {
      console.log('✅ Correctly redirected to login with redirect parameter');
      
      console.log('\n6. Filling login form...');
      await page.type('#email', 'user@cobytes.com');
      await page.type('#password', 'pass');
      await page.screenshot({ path: 'debug-screenshots/04-login-filled.png' });
      
      console.log('\n7. Submitting login...');
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.screenshot({ path: 'debug-screenshots/05-after-login.png' });
      
      console.log('\n8. Final URL:', page.url());
      console.log('Should be on checkout page:', page.url().includes('/checkout') ? '✅' : '❌');
    }

    // Check for the specific React error
    const hasReactChildError = errors.some(err => err.includes('Objects are not valid as a React child'));
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('Total errors:', errors.length);
    console.log('Has React child error:', hasReactChildError ? '❌ YES' : '✅ NO');
    
    if (hasReactChildError) {
      console.log('\n🔴 The "Objects are not valid as a React child" error is still present!');
      console.log('This happens during the checkout redirect flow.');
    } else {
      console.log('\n✅ The React child error has been fixed!');
      console.log('The checkout flow works without rendering objects as React children.');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'debug-screenshots/error-state.png' });
  }

  console.log('\n📸 Screenshots saved to debug-screenshots/');
  console.log('👀 Browser stays open. Press Ctrl+C to close.');
  await new Promise(() => {});
})();