const puppeteer = require('puppeteer');

async function testReportsDates() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log(`❌ Console Error: ${text}`);
      }
    });

    console.log('1. Logging in...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
    
    await page.type('input[type="email"]', 'test@cobytes.com');
    await page.type('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Logged in');

    console.log('2. Going to reports page...');
    await page.goto('http://localhost:3002/reports', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({ path: 'test-reports-page.png' });

    // Check for "Invalid Date" text
    const invalidDateElements = await page.$$eval('*', elements => 
      elements.filter(el => el.textContent && el.textContent.includes('Invalid Date'))
        .map(el => el.textContent)
    );
    
    if (invalidDateElements.length > 0) {
      console.log('❌ Found Invalid Date elements:', invalidDateElements);
    } else {
      console.log('✅ No Invalid Date found - dates are displaying correctly');
    }

    // Check if reports are loaded
    const reportRows = await page.$$('tbody tr');
    console.log(`Found ${reportRows.length} report rows`);

    if (reportRows.length > 0) {
      // Get the first date cell
      const firstDateCell = await page.$eval('tbody tr:first-child td:nth-child(4)', el => el.textContent);
      console.log(`First report date: ${firstDateCell}`);
      
      if (firstDateCell.includes('Invalid Date')) {
        console.log('❌ Date is still showing as Invalid Date');
      } else {
        console.log('✅ Date is displaying correctly');
      }
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'test-reports-error.png' });
  } finally {
    await browser.close();
  }
}

testReportsDates().catch(console.error);