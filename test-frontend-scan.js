const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';

// Helper to delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'test-screenshots-final');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Helper function to take screenshot
const takeScreenshot = async (page, name) => {
  const filename = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 ${name}`);
  return filename;
};

async function testFrontendWorkflow() {
  console.log('🚀 Testing Complete Frontend Workflow\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser error:', msg.text());
    }
  });
  
  // Monitor network
  await page.setRequestInterception(true);
  const apiCalls = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      const call = {
        method: request.method(),
        url: request.url(),
        timestamp: new Date().toISOString()
      };
      apiCalls.push(call);
      console.log(`🔄 API: ${call.method} ${call.url.replace('http://localhost:3001', '')}`);
    }
    request.continue();
  });

  try {
    // 1. Go to landing page
    console.log('1️⃣ Landing Page');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await delay(2000);
    await takeScreenshot(page, '01-landing');
    
    // 2. Navigate to login
    console.log('\n2️⃣ Login');
    await page.goto(`${BASE_URL}/login`);
    await delay(1000);
    await takeScreenshot(page, '02-login');
    
    // 3. Try admin login
    await page.type('input[type="email"]', 'admin@cobytes.com');
    await page.type('input[type="password"]', 'admin123');
    await takeScreenshot(page, '03-login-filled');
    
    await page.keyboard.press('Enter');
    await delay(3000);
    await takeScreenshot(page, '04-after-login');
    
    // 4. Go to new scan
    console.log('\n3️⃣ Creating WordPress Scan');
    await page.goto(`${BASE_URL}/scans/new`);
    await delay(2000);
    await takeScreenshot(page, '05-new-scan');
    
    // 5. Click WordPress scanner
    const wordpressClicked = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.scan-type-card, [class*="card"], button, div'));
      const wpCard = cards.find(card => {
        const text = card.textContent || '';
        return text.toLowerCase().includes('wordpress');
      });
      if (wpCard) {
        wpCard.click();
        return true;
      }
      return false;
    });
    
    if (wordpressClicked) {
      console.log('✅ Selected WordPress scanner');
      await delay(1000);
      await takeScreenshot(page, '06-wordpress-selected');
    }
    
    // 6. Enter target URL
    const urlInputs = await page.$$('input[type="text"], input[type="url"]');
    for (const input of urlInputs) {
      const placeholder = await input.evaluate(el => el.placeholder);
      if (placeholder && placeholder.toLowerCase().includes('url')) {
        await input.click();
        await input.type('https://www.cobytes.com');
        console.log('✅ Entered target URL');
        break;
      }
    }
    
    await takeScreenshot(page, '07-url-entered');
    
    // 7. Start scan
    const startButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => {
        const text = btn.textContent || '';
        return text.includes('Start') || text.includes('Scan') || text.includes('Begin');
      });
    });
    
    if (startButton) {
      await startButton.click();
      console.log('✅ Scan started');
      await delay(3000);
      await takeScreenshot(page, '08-scan-started');
    }
    
    // 8. Monitor progress for 30 seconds
    console.log('\n4️⃣ Monitoring Progress');
    for (let i = 0; i < 15; i++) {
      await delay(2000);
      
      const progress = await page.evaluate(() => {
        const progressBar = document.querySelector('[role="progressbar"], .progress-bar');
        const statusEl = document.querySelector('.status, [class*="status"]');
        const percentEl = Array.from(document.querySelectorAll('*')).find(el => 
          el.textContent && el.textContent.match(/\d+%/)
        );
        
        return {
          hasProgress: !!progressBar,
          status: statusEl ? statusEl.textContent : null,
          percent: percentEl ? percentEl.textContent : null
        };
      });
      
      if (progress.hasProgress || progress.status || progress.percent) {
        console.log(`Progress: ${JSON.stringify(progress)}`);
      }
      
      if (i === 5) {
        await takeScreenshot(page, '09-scan-progress');
      }
    }
    
    // 9. Check for results
    console.log('\n5️⃣ Checking Results');
    await delay(5000);
    const hasResults = await page.evaluate(() => {
      const keywords = ['vulnerability', 'finding', 'result', 'issue', 'threat'];
      return keywords.some(keyword => 
        document.body.textContent.toLowerCase().includes(keyword)
      );
    });
    
    if (hasResults) {
      console.log('✅ Results found');
      await takeScreenshot(page, '10-scan-results');
    }
    
    // 10. Check for report option
    console.log('\n6️⃣ Report Generation');
    const reportButton = await page.evaluateHandle(() => {
      const elements = Array.from(document.querySelectorAll('button, a'));
      return elements.find(el => {
        const text = (el.textContent || '').toLowerCase();
        return text.includes('report') || text.includes('download');
      });
    });
    
    if (reportButton) {
      console.log('✅ Report option available');
      await takeScreenshot(page, '11-report-option');
    }
    
    // Summary
    console.log('\n📊 WORKFLOW TEST COMPLETE');
    console.log('========================');
    console.log(`Total API calls: ${apiCalls.length}`);
    console.log(`Screenshots saved: ${fs.readdirSync(screenshotsDir).length}`);
    console.log('\nCheck screenshots in:', screenshotsDir);
    
    // Save API log
    fs.writeFileSync(
      path.join(screenshotsDir, 'api-calls.json'),
      JSON.stringify(apiCalls, null, 2)
    );
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await takeScreenshot(page, 'error-state');
  }
  
  console.log('\nKeeping browser open for 10 seconds...');
  await delay(10000);
  await browser.close();
}

testFrontendWorkflow();