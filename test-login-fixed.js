const puppeteer = require('puppeteer');

async function testLoginFixed() {
  console.log('🔍 Testing fixed login and checkout flow...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // Wait for frontend to restart
    console.log('Waiting for frontend to restart...');
    await wait(5000);
    
    // Test 1: Navigate to login with redirect
    console.log('1. Testing login page with redirect to checkout...');
    await page.goto('http://localhost:3002/login?redirect=/checkout', { 
      waitUntil: 'networkidle2' 
    });
    
    await page.screenshot({ path: 'fixed-1-login-page.png' });
    
    // Test 2: Use test credentials button
    console.log('2. Clicking "Use test credentials" button...');
    
    const testCredsButton = await page.$('button');
    const buttons = await page.$$('button');
    
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Use test credentials')) {
        await button.click();
        console.log('✅ Clicked test credentials button');
        break;
      }
    }
    
    await wait(1000);
    await page.screenshot({ path: 'fixed-2-credentials-filled.png' });
    
    // Test 3: Submit login
    console.log('3. Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await wait(3000);
    
    const currentUrl = page.url();
    console.log('After login URL:', currentUrl);
    
    if (currentUrl.includes('/checkout')) {
      console.log('✅ Successfully redirected to checkout!');
      await page.screenshot({ path: 'fixed-3-checkout-page.png' });
      
      // Check checkout content
      const checkoutContent = await page.evaluate(() => document.body.innerText);
      console.log('Checkout page preview:', checkoutContent.substring(0, 200));
    } else if (currentUrl.includes('/dashboard')) {
      console.log('⚠️  Redirected to dashboard instead of checkout');
      await page.screenshot({ path: 'fixed-3-dashboard.png' });
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Still on login page');
      
      // Check for errors
      const errorText = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[class*="error"], [class*="red"]');
        return Array.from(errorElements).map(el => el.textContent).join(' | ');
      });
      
      if (errorText) {
        console.log('Error:', errorText);
      }
      await page.screenshot({ path: 'fixed-3-login-error.png' });
    }
    
    // Test 4: Try direct checkout access
    console.log('\n4. Testing direct checkout access...');
    await page.goto('http://localhost:3002/checkout', { waitUntil: 'networkidle2' });
    await wait(2000);
    
    console.log('Direct checkout URL:', page.url());
    await page.screenshot({ path: 'fixed-4-direct-checkout.png' });

  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'fixed-error.png' });
  } finally {
    await browser.close();
  }
}

testLoginFixed().catch(console.error);