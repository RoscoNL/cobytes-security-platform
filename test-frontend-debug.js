const puppeteer = require('puppeteer');

async function debugFrontend() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    devtools: true
  });

  try {
    const page = await browser.newPage();
    
    // Listen to console messages
    page.on('console', msg => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Listen to page errors
    page.on('pageerror', error => {
      console.error('[Page Error]', error.message);
    });
    
    // Listen to request failures
    page.on('requestfailed', request => {
      console.error('[Request Failed]', request.failure().errorText, request.url());
    });

    console.log('Navigating to http://localhost:3002...');
    await page.goto('http://localhost:3002', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Wait a bit for React to potentially render
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get page content
    const content = await page.content();
    console.log('\nPage content length:', content.length);
    
    // Check if React root exists
    const hasRoot = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        innerHTML: root ? root.innerHTML.substring(0, 200) : null,
        childCount: root ? root.children.length : 0
      };
    });
    
    console.log('\nReact root element:', hasRoot);
    
    // Check for any error messages
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\nBody text:', bodyText || '(empty)');
    
    // Check network activity
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(r => ({
        name: r.name,
        duration: r.duration,
        status: r.responseStatus || 'unknown'
      }));
    });
    
    console.log('\nLoaded resources:');
    resources.forEach(r => {
      if (r.name.includes('.js') || r.name.includes('.css')) {
        console.log(`  - ${r.name.split('/').pop()}: ${r.duration.toFixed(0)}ms`);
      }
    });
    
    // Take screenshot
    await page.screenshot({ path: 'debug-frontend.png', fullPage: true });
    console.log('\nScreenshot saved as debug-frontend.png');
    
    // Try to navigate to a different page
    console.log('\nTrying to navigate to /products...');
    await page.goto('http://localhost:3002/products', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const productsText = await page.evaluate(() => document.body.innerText);
    console.log('Products page text:', productsText || '(empty)');
    
    await page.screenshot({ path: 'debug-products.png', fullPage: true });

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    console.log('\nPress Ctrl+C to close the browser...');
    // Keep browser open for manual inspection
    await new Promise(() => {});
  }
}

debugFrontend().catch(console.error);