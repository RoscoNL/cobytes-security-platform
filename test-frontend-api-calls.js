const puppeteer = require('puppeteer');

async function testFrontendAPICalls() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Log all network requests
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('localhost:3001')) {
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('localhost:3001')) {
      console.log(`API Response: ${response.url()} - Status: ${response.status()}`);
    }
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console Error:', msg.text());
    }
  });
  
  try {
    console.log('Navigating to landing page...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
    
    console.log('\nAPI calls made:');
    apiCalls.forEach(call => {
      console.log(`${call.method} ${call.url}`);
    });
    
    await page.screenshot({ path: 'api-calls-test.png' });
    
    // Wait a bit to see all requests
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testFrontendAPICalls().catch(console.error);