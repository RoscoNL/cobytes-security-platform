const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting browser...');
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true, // Opens DevTools automatically
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
      console.error('Browser console error:', text);
      
      // Check if this is our React error
      if (text.includes('Objects are not valid as a React child')) {
        console.log('\n🔴 FOUND THE ERROR! 🔴');
        console.log('Full error message:', text);
        
        // Try to get the stack trace
        msg.args().forEach(async (arg) => {
          try {
            const jsonValue = await arg.jsonValue();
            console.log('Error details:', JSON.stringify(jsonValue, null, 2));
          } catch (e) {
            console.log('Could not parse error arg:', e.message);
          }
        });
      }
    } else if (type === 'log') {
      console.log('Browser console:', text);
    }
  });

  // Enable request interception to log API calls
  await page.setRequestInterception(true);
  
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('API Request:', request.method(), request.url());
    }
    request.continue();
  });

  page.on('response', response => {
    if (response.url().includes('/api/') && response.status() !== 200) {
      console.log('API Response Error:', response.status(), response.url());
      response.text().then(body => {
        try {
          const parsed = JSON.parse(body);
          console.log('Error response body:', parsed);
        } catch (e) {
          console.log('Error response body (raw):', body);
        }
      }).catch(() => {});
    }
  });

  try {
    console.log('\n1. Going to products page...');
    await page.goto('http://localhost:3002/products', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot
    await page.screenshot({ path: 'debug-screenshots/01-products.png' });

    // Click on the first "Add to Cart" button
    console.log('\n2. Adding product to cart...');
    const addToCartButton = await page.waitForSelector('button', { timeout: 5000 });
    await addToCartButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take screenshot after adding to cart
    await page.screenshot({ path: 'debug-screenshots/02-after-add-to-cart.png' });

    // Go to cart
    console.log('\n3. Going to cart...');
    await page.goto('http://localhost:3002/cart', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot of cart
    await page.screenshot({ path: 'debug-screenshots/03-cart.png' });

    // Click Proceed to Checkout
    console.log('\n4. Clicking Proceed to Checkout...');
    // Find the checkout button - it contains "Proceed to Checkout"
    const checkoutButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent.includes('Proceed to Checkout'));
    });
    if (!checkoutButton) throw new Error('Could not find checkout button');
    await checkoutButton.click();
    
    // Wait for navigation to login page
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot of login page
    await page.screenshot({ path: 'debug-screenshots/04-login-redirect.png' });

    console.log('\n5. Current URL:', page.url());
    console.log('Should be login with redirect parameter');

    // Fill in login form
    console.log('\n6. Filling login form...');
    await page.type('#email', 'user@cobytes.com');
    await page.type('#password', 'pass');

    // Take screenshot after filling
    await page.screenshot({ path: 'debug-screenshots/05-login-filled.png' });

    // Submit login form
    console.log('\n7. Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take screenshot of current state
    await page.screenshot({ path: 'debug-screenshots/06-after-login.png' });

    console.log('\n8. Current URL after login:', page.url());

    // Check for React errors in the DOM
    const reactErrorElement = await page.$('.react-error-overlay');
    if (reactErrorElement) {
      console.log('\n🔴 React Error Overlay detected!');
      const errorText = await page.evaluate(el => el.textContent, reactErrorElement);
      console.log('Error overlay content:', errorText);
    }

    // Also check for any error messages in the UI
    const errorMessages = await page.$$eval('[class*="error"], [class*="Error"]', elements => 
      elements.map(el => ({
        className: el.className,
        text: el.textContent,
        html: el.innerHTML
      }))
    );

    if (errorMessages.length > 0) {
      console.log('\n🔴 Found error elements in the DOM:');
      errorMessages.forEach((err, index) => {
        console.log(`\nError ${index + 1}:`);
        console.log('Class:', err.className);
        console.log('Text:', err.text);
        console.log('HTML:', err.html.substring(0, 200) + '...');
      });
    }

    // Wait a bit more to see if any delayed errors appear
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Final screenshot
    await page.screenshot({ path: 'debug-screenshots/07-final-state.png' });

    console.log('\n✅ Test completed. Check the screenshots and console output above.');
    console.log('Screenshots saved in debug-screenshots/ directory');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'debug-screenshots/error-state.png' });
  }

  // Keep browser open for manual inspection
  console.log('\n👀 Browser will remain open for manual inspection. Press Ctrl+C to close.');
  
  // Prevent the script from exiting
  await new Promise(() => {});
})();