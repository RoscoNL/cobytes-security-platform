const puppeteer = require('puppeteer');

async function testScanDetail() {
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
      if (type === 'error') {
        console.log('❌ Console Error:', text);
      } else if (type === 'warning') {
        console.log('⚠️  Console Warning:', text);
      }
    });

    // Enable request logging
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      if (status >= 400) {
        console.log(`❌ HTTP ${status}: ${url}`);
      }
    });

    console.log('🔍 Testing scan detail page...\n');

    // 1. Login first
    console.log('1. Logging in...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
    
    await page.type('input[type="email"]', 'test@cobytes.com');
    await page.type('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Logged in successfully');

    // 2. Try to navigate to scan detail page
    console.log('\n2. Navigating to scan detail page...');
    await page.goto('http://localhost:3002/scans/33', { waitUntil: 'networkidle0' });
    
    // Wait a bit to see what happens
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check if we got redirected
    if (currentUrl.includes('/404')) {
      console.log('❌ Got redirected to 404 page');
      
      // Take screenshot
      await page.screenshot({ path: 'scan-detail-404.png', fullPage: true });
      console.log('📸 Screenshot saved: scan-detail-404.png');
    } else {
      console.log('✅ Scan detail page loaded');
      
      // Check for error messages
      const errorElement = await page.$('.bg-red-50');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        console.log('❌ Error displayed:', errorText);
      }
      
      // Take screenshot
      await page.screenshot({ path: 'scan-detail-success.png', fullPage: true });
      console.log('📸 Screenshot saved: scan-detail-success.png');
    }

    // 3. Try All Scanners page
    console.log('\n3. Testing All Scanners page...');
    await page.goto('http://localhost:3002/all-scanners', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const allScannersUrl = page.url();
    console.log('All Scanners URL:', allScannersUrl);
    
    if (allScannersUrl.includes('/404')) {
      console.log('❌ All Scanners page gives 404');
    } else {
      console.log('✅ All Scanners page loaded');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testScanDetail().catch(console.error);