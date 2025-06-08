const puppeteer = require('puppeteer');
const fs = require('fs');

async function testWordPressScan() {
  let browser;
  
  try {
    // Create screenshots directory
    if (!fs.existsSync('wordpress-scan-results')) {
      fs.mkdirSync('wordpress-scan-results');
    }
    
    console.log('🚀 Starting WordPress Security Scan Test');
    console.log('=====================================\n');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1366, height: 768 },
      args: ['--window-size=1366,768']
    });
    
    const page = await browser.newPage();
    
    // Step 1: Go to scanners page
    console.log('1️⃣ Navigating to All Scanners page...');
    await page.goto('http://localhost:3002/all-scanners-new', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'wordpress-scan-results/01-all-scanners.png' });
    
    // Step 2: Click on WordPress Scanner
    console.log('2️⃣ Looking for WordPress Scanner...');
    
    // Find the WordPress Scanner card by looking for the text and tool ID
    const wordpressScannerFound = await page.evaluate(() => {
      const cards = document.querySelectorAll('div');
      for (const card of cards) {
        if (card.textContent.includes('WordPress Scanner') && 
            card.textContent.includes('Tool ID: 270') &&
            card.textContent.includes('Scan WordPress sites for vulnerabilities')) {
          card.click();
          return true;
        }
      }
      return false;
    });
    
    if (wordpressScannerFound) {
      console.log('✅ Clicked on WordPress Scanner');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('❌ Could not find WordPress Scanner');
      return;
    }
    
    // Step 3: Handle login if needed
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      console.log('3️⃣ Login required...');
      await page.screenshot({ path: 'wordpress-scan-results/02-login.png' });
      
      await page.type('input[type="email"]', 'user@cobytes.com');
      await page.type('input[type="password"]', 'pass');
      await page.screenshot({ path: 'wordpress-scan-results/03-login-filled.png' });
      
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('✅ Logged in successfully');
      
      // Go back to scanners and click WordPress Scanner again
      await page.goto('http://localhost:3002/all-scanners-new', { waitUntil: 'networkidle2' });
      await page.evaluate(() => {
        const cards = document.querySelectorAll('div');
        for (const card of cards) {
          if (card.textContent.includes('WordPress Scanner') && 
              card.textContent.includes('Tool ID: 270')) {
            card.click();
            return true;
          }
        }
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Step 4: Fill scan form
    console.log('4️⃣ Configuring scan...');
    await page.screenshot({ path: 'wordpress-scan-results/04-scan-form.png' });
    
    // Find and fill target URL
    const targetInput = await page.$('input[type="text"], input[name="target"], input[name="url"]');
    if (targetInput) {
      await targetInput.click({ clickCount: 3 });
      await targetInput.type('https://www.cobytes.com');
      console.log('✅ Entered target URL: https://www.cobytes.com');
      await page.screenshot({ path: 'wordpress-scan-results/05-target-entered.png' });
    }
    
    // Step 5: Start scan
    console.log('5️⃣ Starting scan...');
    const startButton = await page.$('button[type="submit"], button');
    if (startButton) {
      const buttonText = await startButton.evaluate(el => el.textContent);
      console.log(`   Found button: "${buttonText.trim()}"`);
      await startButton.click();
      console.log('✅ Scan started');
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'wordpress-scan-results/06-scan-progress.png' });
    
    // Step 6: Monitor scan
    console.log('6️⃣ Monitoring scan progress...');
    const scanUrl = page.url();
    const scanId = scanUrl.match(/scan(?:-status)?\/([^\/]+)/)?.[1];
    if (scanId) {
      console.log(`   Scan ID: ${scanId}`);
    }
    
    // Wait a bit for initial results
    await new Promise(resolve => setTimeout(resolve, 10000));
    await page.screenshot({ path: 'wordpress-scan-results/07-scan-results.png' });
    
    // Report findings
    console.log('\n📊 SCAN REPORT');
    console.log('=====================================');
    console.log('Target Website: https://www.cobytes.com');
    console.log('Scanner Type: WordPress Scanner (PentestTools API)');
    console.log('Tool ID: 270');
    
    // Check what scan types are available
    console.log('\n📋 Available Scan Types on Platform:');
    console.log('- WordPress Scanner (CMS vulnerabilities)');
    console.log('- Drupal Scanner (CMS vulnerabilities)');
    console.log('- Joomla Scanner (CMS vulnerabilities)');
    console.log('- SharePoint Scanner (CMS vulnerabilities)');
    console.log('- Sniper (Advanced vulnerability scanner)');
    console.log('- And 15+ other security scanners');
    
    console.log('\n📁 Screenshots saved in: wordpress-scan-results/');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (browser) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        await pages[0].screenshot({ path: 'wordpress-scan-results/error.png' });
      }
    }
  } finally {
    console.log('\n✅ Test completed. Browser remains open for inspection.');
    console.log('Press Ctrl+C to exit.');
  }
}

// Run the test
testWordPressScan();