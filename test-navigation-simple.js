const puppeteer = require('puppeteer');

async function testNavigation() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    console.log('🔍 Testing navigation...\n');

    // Test routes that should work without authentication
    const publicRoutes = [
      'http://localhost:3002/',
      'http://localhost:3002/products',
      'http://localhost:3002/pricing', 
      'http://localhost:3002/free-scan',
      'http://localhost:3002/all-scanners',
      'http://localhost:3002/scan-demo',
      'http://localhost:3002/how-to'
    ];

    for (const route of publicRoutes) {
      console.log(`Testing: ${route}`);
      await page.goto(route, { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentUrl = page.url();
      if (currentUrl.includes('/404')) {
        console.log(`❌ ${route} -> 404`);
      } else {
        console.log(`✅ ${route} -> OK`);
      }
    }

    console.log('\n🔐 Testing protected routes (should redirect to login)...\n');

    const protectedRoutes = [
      'http://localhost:3002/dashboard',
      'http://localhost:3002/scans',
      'http://localhost:3002/scans/new',
      'http://localhost:3002/scans/33'
    ];

    for (const route of protectedRoutes) {
      console.log(`Testing: ${route}`);
      await page.goto(route, { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.log(`✅ ${route} -> redirected to login (correct)`);
      } else if (currentUrl.includes('/404')) {
        console.log(`❌ ${route} -> 404 (should redirect to login)`);
      } else {
        console.log(`⚠️  ${route} -> ${currentUrl} (unexpected)`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testNavigation().catch(console.error);