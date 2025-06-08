const puppeteer = require('puppeteer');

async function testCartDebug() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/cart') && response.status() !== 200) {
      console.log('CART API RESPONSE:', response.status(), response.url());
    }
  });
  
  console.log('🛒 Testing Cart Functionality...\n');

  try {
    // Go to products page
    console.log('1️⃣ Loading products page...');
    await page.goto('http://localhost:3002/products', { 
      waitUntil: 'networkidle2' 
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if products loaded
    const productCount = await page.$$eval('[class*="MuiCard"]', cards => cards.length);
    console.log(`   Products loaded: ${productCount}`);
    
    // Find and click first Add to Cart button
    console.log('\n2️⃣ Clicking Add to Cart...');
    const addButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent.includes('Add to Cart'));
      if (addBtn) {
        console.log('Found button:', addBtn.textContent);
        addBtn.click();
        return true;
      }
      return false;
    });
    
    if (!addButtonClicked) {
      console.log('   ❌ Could not find Add to Cart button');
      return;
    }
    
    console.log('   ✅ Clicked Add to Cart button');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check cart badge
    console.log('\n3️⃣ Checking cart badge...');
    const cartBadgeValue = await page.evaluate(() => {
      const badge = document.querySelector('[class*="MuiBadge-badge"]');
      return badge ? badge.textContent : 'No badge found';
    });
    console.log(`   Cart badge shows: ${cartBadgeValue}`);
    
    // Check network requests
    console.log('\n4️⃣ Checking API calls...');
    const apiCalls = await page.evaluate(() => {
      // Check if api object exists
      if (typeof api !== 'undefined' && api) {
        return 'API service found';
      }
      return 'API service not found in window';
    });
    console.log(`   ${apiCalls}`);
    
    // Navigate to cart page
    console.log('\n5️⃣ Navigating to cart page...');
    await page.goto('http://localhost:3002/cart', { 
      waitUntil: 'networkidle2' 
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check cart content
    const cartContent = await page.evaluate(() => {
      const isEmpty = document.body.textContent.includes('empty');
      const itemCount = document.querySelectorAll('[class*="CartItem"], [class*="cart-item"]').length;
      const total = document.body.textContent.match(/\\$[\\d.]+/g);
      return {
        isEmpty,
        itemCount,
        total: total ? total[total.length - 1] : 'No total found'
      };
    });
    
    console.log(`   Cart is empty: ${cartContent.isEmpty}`);
    console.log(`   Items in cart: ${cartContent.itemCount}`);
    console.log(`   Cart total: ${cartContent.total}`);
    
    // Test cart API directly
    console.log('\n6️⃣ Testing Cart API directly...');
    const cartApiTest = await page.evaluate(async () => {
      try {
        // Get cart
        const getResponse = await fetch('http://localhost:3000/api/cart', {
          credentials: 'include'
        });
        const cartData = await getResponse.json();
        
        // Add item
        const addResponse = await fetch('http://localhost:3000/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ productId: 1, quantity: 1 })
        });
        const addData = await addResponse.json();
        
        return {
          getCart: { status: getResponse.status, data: cartData },
          addItem: { status: addResponse.status, data: addData }
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('   Cart API test:', JSON.stringify(cartApiTest, null, 2));
    
    console.log('\n⏸️  Browser will remain open for inspection. Press Ctrl+C to close.');
    await new Promise(() => {}); // Keep running

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'screenshots/cart-error.png' });
  }
}

testCartDebug().catch(console.error);