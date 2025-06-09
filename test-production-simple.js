const puppeteer = require('puppeteer');

async function testProduction() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();

  try {
    console.log('1. Navigating to production site...');
    await page.goto('https://securityscan.cobytes.com', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    console.log('2. Taking screenshot...');
    await page.screenshot({ path: 'production-homepage.png' });
    
    console.log('3. Checking page content...');
    const title = await page.title();
    console.log('   Page title:', title);
    
    // Check for React app
    const reactRoot = await page.$('#root');
    if (reactRoot) {
      console.log('   ✓ React root element found');
    } else {
      console.log('   ✗ React root element NOT found');
    }
    
    // Check for any errors
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('   Body preview:', bodyText.substring(0, 200));
    
    // Try to find navigation elements
    const navElements = await page.$$eval('nav a', links => links.map(a => a.textContent));
    console.log('   Navigation links:', navElements);
    
    // Check for error messages
    const errors = await page.$$eval('.error, .MuiAlert-message', els => els.map(el => el.textContent));
    if (errors.length > 0) {
      console.log('   Errors found:', errors);
    }
    
    console.log('\n4. Checking API endpoint...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('https://securityscan.cobytes.com/api/health');
        const data = await response.json();
        return { status: response.status, data };
      } catch (err) {
        return { error: err.message };
      }
    });
    console.log('   API response:', apiResponse);
    
    // Wait a bit to see what's happening
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'production-error.png' });
  }

  console.log('\nDone. Check the screenshot.');
  await browser.close();
}

testProduction().catch(console.error);
