const puppeteer = require('puppeteer');

async function testProtectedPages() {
  console.log('Testing protected pages...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const protectedPages = [
      { url: 'http://localhost:3002/dashboard', name: 'Dashboard' },
      { url: 'http://localhost:3002/dashboard/scans', name: 'Scans List' },
      { url: 'http://localhost:3002/dashboard/reports', name: 'Reports' },
      { url: 'http://localhost:3002/orders', name: 'Orders' }
    ];
    
    for (const pageInfo of protectedPages) {
      console.log(`Testing ${pageInfo.name}...`);
      const page = await browser.newPage();
      
      try {
        await page.goto(pageInfo.url, { waitUntil: 'networkidle2' });
        
        // Wait a bit for any redirects
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const finalUrl = page.url();
        console.log(`  Initial URL: ${pageInfo.url}`);
        console.log(`  Final URL: ${finalUrl}`);
        
        if (finalUrl.includes('/login')) {
          console.log(`  ✅ Correctly redirected to login`);
        } else if (finalUrl === pageInfo.url) {
          console.log(`  ❌ Page loaded without authentication!`);
          
          // Check page content
          const title = await page.title();
          const bodyText = await page.evaluate(() => document.body.innerText);
          console.log(`  Page title: ${title}`);
          console.log(`  Page content preview: ${bodyText.substring(0, 200)}...`);
        } else {
          console.log(`  ⚠️ Redirected to unexpected URL: ${finalUrl}`);
        }
        
        await page.screenshot({ path: `test-protected-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png` });
        
      } finally {
        await page.close();
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testProtectedPages();