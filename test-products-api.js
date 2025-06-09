const puppeteer = require('puppeteer');

async function testProductsAPI() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Log all network requests
  page.on('request', request => {
    if (request.url().includes('localhost:3001')) {
      console.log(`Request: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('localhost:3001')) {
      console.log(`Response: ${response.url()} - Status: ${response.status()}`);
    }
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console Error:', msg.text());
    }
  });
  
  try {
    console.log('Navigating to products page...');
    await page.goto('http://localhost:3002/products', { waitUntil: 'networkidle2' });
    
    await page.screenshot({ path: 'products-api-test.png' });
    
    // Wait a bit to see all requests
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testProductsAPI().catch(console.error);