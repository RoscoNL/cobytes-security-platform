const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting simple test...');
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
    }
  });

  page.on('pageerror', error => {
    console.error('🔴 Page error:', error.message);
    errors.push(error.message);
  });

  try {
    console.log('\n1. Testing Products page...');
    await page.goto('http://localhost:3002/products', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const productsContent = await page.evaluate(() => document.body.textContent);
    console.log('Products page loaded:', productsContent.includes('SSL/TLS Security Check') ? '✅' : '❌');

    console.log('\n2. Testing Cart page...');
    await page.goto('http://localhost:3002/cart', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const cartContent = await page.evaluate(() => document.body.textContent);
    console.log('Cart page loaded:', cartContent.includes('Shopping Cart') || cartContent.includes('Your cart is empty') ? '✅' : '❌');

    console.log('\n3. Testing Login page with redirect...');
    await page.goto('http://localhost:3002/login?redirect=/checkout', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const loginContent = await page.evaluate(() => document.body.textContent);
    console.log('Login page loaded:', loginContent.includes('Sign In') ? '✅' : '❌');

    // Check for the specific React error
    const hasReactChildError = errors.some(err => err.includes('Objects are not valid as a React child'));
    
    console.log('\n=== TEST RESULTS ===');
    console.log('Total errors:', errors.length);
    console.log('Has React child error:', hasReactChildError ? '❌ YES' : '✅ NO');
    
    if (hasReactChildError) {
      console.log('\n🔴 The "Objects are not valid as a React child" error is still present!');
    } else {
      console.log('\n✅ The React child error has been fixed!');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }

  console.log('\n👀 Browser stays open. Press Ctrl+C to close.');
  await new Promise(() => {});
})();