const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3002';
const API_URL = 'http://localhost:3000';

async function testProductsDebug() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => 
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
  );
  
  console.log('🚀 Testing Products Page...\n');

  try {
    // Check API directly first
    console.log('1️⃣ Testing API directly...');
    const apiResponse = await fetch(`${API_URL}/api/products`);
    const apiData = await apiResponse.json();
    console.log(`API Response: ${apiResponse.status}`);
    console.log(`Products count: ${apiData.data ? apiData.data.length : 0}`);
    console.log('');

    // Go to products page
    console.log('2️⃣ Loading products page...');
    await page.goto(`${FRONTEND_URL}/products`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit for React to render
    await page.waitForTimeout(3000);
    
    // Check for loading state
    const loadingText = await page.$eval('body', el => el.textContent).catch(() => '');
    if (loadingText.includes('Loading')) {
      console.log('⏳ Page shows loading state');
    }
    
    // Check for error messages
    if (loadingText.includes('Error') || loadingText.includes('error')) {
      console.log('❌ Page shows error state');
    }
    
    // Check page content
    console.log('3️⃣ Checking page content...');
    
    // Check for tabs
    const tabs = await page.$$('[role="tab"]');
    console.log(`Tabs found: ${tabs.length}`);
    
    // Get tab labels
    if (tabs.length > 0) {
      const tabLabels = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[role="tab"]')).map(tab => tab.textContent);
      });
      console.log(`Tab labels: ${tabLabels.join(', ')}`);
    }
    
    // Check for product cards
    const productCards = await page.$$('[class*="MuiCard"]');
    console.log(`Product cards found: ${productCards.length}`);
    
    // Check for any product-related elements
    const productElements = await page.evaluate(() => {
      const elements = {
        cards: document.querySelectorAll('[class*="MuiCard"]').length,
        grids: document.querySelectorAll('[class*="MuiGrid"]').length,
        buttons: Array.from(document.querySelectorAll('button')).filter(btn => 
          btn.textContent.includes('Add to Cart')).length,
        prices: Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent.match(/\\$\\d+\\.\\d{2}/)).length
      };
      return elements;
    });
    
    console.log('Page elements:', productElements);
    
    // Check network requests
    console.log('\n4️⃣ Checking network requests...');
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });
    
    // Reload page to capture requests
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    console.log('API requests made:');
    requests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
    });
    
    // Check React component state
    console.log('\n5️⃣ Checking React state...');
    const reactState = await page.evaluate(() => {
      // Try to find React fiber
      const container = document.getElementById('root');
      if (!container) return 'No root element found';
      
      // Check if React DevTools are available
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return 'React DevTools detected';
      }
      
      return 'React app detected';
    });
    console.log(reactState);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/products-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved as products-debug.png');
    
    console.log('\n⏸️  Browser will remain open for inspection. Press Ctrl+C to close.');
    await new Promise(() => {}); // Keep running

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'screenshots/products-error.png' });
  }
}

testProductsDebug().catch(console.error);