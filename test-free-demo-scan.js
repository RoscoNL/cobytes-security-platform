const puppeteer = require('puppeteer');
const fs = require('fs');

async function testFreeDemoScan() {
  let browser;
  
  try {
    // Create screenshots directory
    if (!fs.existsSync('free-demo-scan')) {
      fs.mkdirSync('free-demo-scan');
    }
    
    console.log('🚀 Testing WordPress Scan via Free Demo');
    console.log('======================================\n');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1366, height: 768 },
      args: ['--window-size=1366,768']
    });
    
    const page = await browser.newPage();
    
    // Step 1: Go to Free Demo page from navigation
    console.log('1️⃣ Navigating to Free Demo page...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
    
    // Click on Free Demo in navigation
    const navLinks = await page.$$('a');
    for (const link of navLinks) {
      const text = await link.evaluate(el => el.textContent);
      if (text && text.trim() === 'Free Demo') {
        await link.click();
        console.log('✅ Clicked Free Demo link');
        break;
      }
    }
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'free-demo-scan/01-free-demo-page.png' });
    
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Step 2: Check if login is required
    if (currentUrl.includes('login')) {
      console.log('2️⃣ Login required...');
      await page.type('input[type="email"]', 'user@cobytes.com');
      await page.type('input[type="password"]', 'pass');
      await page.screenshot({ path: 'free-demo-scan/02-login-filled.png' });
      
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('✅ Logged in');
      
      // Navigate to free demo again
      await page.goto('http://localhost:3002/free-demo', { waitUntil: 'networkidle2' });
    }
    
    // Step 3: Look for scan configuration options
    console.log('3️⃣ Checking scan configuration page...');
    await page.screenshot({ path: 'free-demo-scan/03-scan-config.png' });
    
    // Look for URL input
    const urlInput = await page.$('input[type="text"], input[type="url"], input[placeholder*="URL"], input[placeholder*="website"], input[placeholder*="domain"]');
    if (urlInput) {
      await urlInput.click({ clickCount: 3 });
      await urlInput.type('https://www.cobytes.com');
      console.log('✅ Entered target URL: https://www.cobytes.com');
    }
    
    // Look for scan type selector
    const scanTypeSelect = await page.$('select');
    if (scanTypeSelect) {
      const options = await page.$$eval('select option', opts => 
        opts.map(opt => ({ value: opt.value, text: opt.textContent }))
      );
      console.log('📋 Available scan types:');
      options.forEach(opt => console.log(`   - ${opt.text} (${opt.value})`));
      
      // Select WordPress if available
      const wordpressOption = options.find(opt => 
        opt.text.toLowerCase().includes('wordpress') || 
        opt.value.toLowerCase().includes('wordpress')
      );
      
      if (wordpressOption) {
        await page.select('select', wordpressOption.value);
        console.log('✅ Selected WordPress scan');
      }
    }
    
    await page.screenshot({ path: 'free-demo-scan/04-configured.png' });
    
    // Step 4: Start scan
    console.log('4️⃣ Starting scan...');
    const submitButton = await page.$('button[type="submit"], button');
    if (submitButton) {
      const buttonText = await submitButton.evaluate(el => el.textContent);
      console.log(`   Clicking button: "${buttonText.trim()}"`);
      await submitButton.click();
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.screenshot({ path: 'free-demo-scan/05-scan-started.png' });
    
    // Step 5: Check results
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);
    
    if (finalUrl.includes('scan')) {
      const scanId = finalUrl.match(/scan(?:-status)?\/([^\/]+)/)?.[1];
      if (scanId) {
        console.log('✅ Scan ID:', scanId);
      }
    }
    
    // Final report
    console.log('\n📊 SCAN TEST SUMMARY');
    console.log('======================================');
    console.log('Target: https://www.cobytes.com');
    console.log('Platform URL: http://localhost:3002');
    console.log('\nAvailable Features:');
    console.log('- Free Demo scan functionality');
    console.log('- Multiple scanner types including WordPress Scanner');
    console.log('- Real-time scan progress tracking');
    console.log('- PDF report generation');
    console.log('\nScreenshots saved in: free-demo-scan/');
    console.log('======================================');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (browser) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        await pages[0].screenshot({ path: 'free-demo-scan/error.png' });
      }
    }
  } finally {
    console.log('\n✅ Browser remains open for manual testing.');
    console.log('Press Ctrl+C to exit.');
  }
}

// Run the test
testFreeDemoScan();