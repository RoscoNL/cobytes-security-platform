const puppeteer = require('puppeteer');

async function testWithConsole() {
  console.log('🚀 Testing with console monitoring...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    
    // Monitor console
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.error('❌ Console Error:', text);
      } else if (type === 'warning') {
        console.warn('⚠️  Console Warning:', text);
      } else {
        console.log(`📝 Console ${type}:`, text);
      }
    });
    
    // Monitor page errors
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });
    
    // Go to homepage
    console.log('📍 Loading homepage...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 3000));
    
    // Check if React app loaded
    const reactRoot = await page.$('#root');
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML : 'No root element';
    });
    
    console.log('React root exists:', !!reactRoot);
    console.log('Root content length:', rootContent.length);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/console-test.png', fullPage: true });
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await new Promise(r => setTimeout(r, 5000)); // Keep browser open
    await browser.close();
  }
}

// Run test
testWithConsole();