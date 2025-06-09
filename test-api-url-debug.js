const puppeteer = require('puppeteer');

async function debugAPIUrl() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to page
    await page.goto('http://localhost:3002');
    
    // Check what API_BASE_URL is being used
    const apiBaseUrl = await page.evaluate(() => {
      // Try to access the global axios instance or check window
      return {
        envVar: process.env.REACT_APP_API_URL || 'not set',
        // Check if there's a global API URL
        windowApiUrl: window.API_URL || 'not set',
      };
    });
    
    console.log('API Configuration:', apiBaseUrl);
    
    // Check localStorage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    
    console.log('\nLocalStorage:', localStorage);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugAPIUrl().catch(console.error);