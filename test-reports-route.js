const puppeteer = require('puppeteer');

async function testReportsRoute() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[${type.toUpperCase()}]`, text);
    });

    console.log('🔍 Testing reports route...\n');

    // 1. Login first
    console.log('1. Logging in...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
    
    await page.type('input[type="email"]', 'test@cobytes.com');
    await page.type('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Logged in successfully');

    // 2. Try to navigate to reports page
    console.log('\n2. Navigating to reports page...');
    await page.goto('http://localhost:3002/reports', { waitUntil: 'networkidle0' });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check if we got redirected
    if (currentUrl.includes('/404')) {
      console.log('❌ Got redirected to 404 page');
      
      // Take screenshot
      await page.screenshot({ path: 'reports-404.png', fullPage: true });
      console.log('📸 Screenshot saved: reports-404.png');
    } else {
      console.log('✅ Reports page loaded');
      
      // Check for error messages
      const errorElement = await page.$('.bg-red-50, [role="alert"]');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        console.log('❌ Error displayed:', errorText);
      }
      
      // Take screenshot
      await page.screenshot({ path: 'reports-success.png', fullPage: true });
      console.log('📸 Screenshot saved: reports-success.png');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testReportsRoute().catch(console.error);