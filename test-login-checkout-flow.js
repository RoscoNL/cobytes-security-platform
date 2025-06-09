const puppeteer = require('puppeteer');

async function testLoginCheckoutFlow() {
  console.log('🔍 Testing login redirect to checkout flow...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  // Track responses
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`❌ HTTP ${response.status()} - ${response.url()}`);
    }
  });

  try {
    // Test 1: Direct login with redirect parameter
    console.log('1. Testing direct login URL with redirect parameter...');
    const loginUrl = 'http://localhost:3002/login?redirect=/checkout';
    await page.goto(loginUrl, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'test-login-redirect-1.png' });
    
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Check page content
    const pageContent = await page.evaluate(() => document.body.innerText);
    console.log('Page content preview:', pageContent.substring(0, 200));
    
    // Test 2: Try the checkout page directly
    console.log('\n2. Testing direct checkout access...');
    await page.goto('http://localhost:3002/checkout', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'test-checkout-direct.png' });
    console.log('Checkout URL:', page.url());
    
    // Test 3: Navigate through the app flow
    console.log('\n3. Testing normal app flow...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
    
    // Try to find login button
    const loginButton = await page.$('a[href="/login"], button:contains("Login")');
    if (loginButton) {
      console.log('Found login button, clicking...');
      await loginButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-login-via-nav.png' });
    }
    
    // Test 4: Check if we have any error messages
    const errorMessages = await page.evaluate(() => {
      const errors = [];
      // Look for error text
      const elementsWithError = document.querySelectorAll('*');
      elementsWithError.forEach(el => {
        const text = el.textContent || '';
        if (text.includes('not found') || text.includes('404') || text.includes('error')) {
          errors.push(text.trim());
        }
      });
      return [...new Set(errors)].slice(0, 5); // Return first 5 unique errors
    });
    
    if (errorMessages.length > 0) {
      console.log('\n❌ Error messages found on page:');
      errorMessages.forEach(msg => console.log(`  - ${msg}`));
    }
    
    // Test 5: Check React Router errors
    const reactErrors = await page.evaluate(() => {
      return window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.size > 0 
        ? 'React DevTools detected' 
        : 'No React DevTools';
    });
    console.log('\nReact status:', reactErrors);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'test-error-state.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testLoginCheckoutFlow().catch(console.error);