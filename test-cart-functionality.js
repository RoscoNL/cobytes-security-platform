const puppeteer = require('puppeteer');

async function testCartFunctionality() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('error', err => console.error('Browser error:', err));
    page.on('pageerror', err => console.error('Page error:', err));
    
    console.log('1. Navigating to products page...');
    await page.goto('http://localhost:3002/products', { waitUntil: 'networkidle0' });
    
    // Wait for products to load
    console.log('2. Waiting for products to load...');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    // Get initial cart count
    const initialCartCount = await page.$eval('[data-testid="cart-badge"]', el => {
      const badge = el.querySelector('.MuiBadge-badge');
      return badge ? parseInt(badge.textContent) || 0 : 0;
    }).catch(() => 0);
    
    console.log(`3. Initial cart count: ${initialCartCount}`);
    
    // Click the first "Add to Cart" button
    console.log('4. Clicking Add to Cart button...');
    await page.click('[data-testid="add-to-cart-button"]:first-of-type');
    
    // Wait a moment for the cart to update
    await page.waitForTimeout(2000);
    
    // Check new cart count
    const newCartCount = await page.$eval('[data-testid="cart-badge"]', el => {
      const badge = el.querySelector('.MuiBadge-badge');
      return badge ? parseInt(badge.textContent) || 0 : 0;
    }).catch(() => 0);
    
    console.log(`5. New cart count: ${newCartCount}`);
    
    if (newCartCount > initialCartCount) {
      console.log('✅ SUCCESS: Product added to cart!');
      
      // Navigate to cart page
      console.log('6. Navigating to cart page...');
      await page.click('[data-testid="cart-badge"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      // Check if cart has items
      const cartItems = await page.$$('[data-testid="cart-item"]');
      console.log(`7. Cart page shows ${cartItems.length} item(s)`);
      
      if (cartItems.length > 0) {
        console.log('✅ Cart page displays items correctly');
      } else {
        console.log('❌ Cart page is empty despite badge count');
      }
    } else {
      console.log('❌ FAILED: Cart count did not increase');
      
      // Check for network errors
      const networkErrors = await page.evaluate(() => {
        return window.performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('/api/'))
          .map(entry => ({ name: entry.name, status: entry.responseStatus }));
      });
      
      console.log('Network requests:', networkErrors);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'cart-test-result.png' });
    console.log('Screenshot saved as cart-test-result.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testCartFunctionality();