const puppeteer = require('puppeteer');

async function debugScanForm() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    console.log('1. Logging in...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
    
    await page.type('input[type="email"]', 'test@cobytes.com');
    await page.type('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Logged in');

    console.log('2. Going to scan form...');
    await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'debug-scan-form.png' });

    // Debug: List all input elements
    const inputs = await page.$$eval('input', elements => 
      elements.map(el => ({
        type: el.type,
        name: el.name,
        placeholder: el.placeholder,
        id: el.id,
        label: el.getAttribute('aria-label') || el.parentElement?.querySelector('label')?.textContent
      }))
    );
    console.log('Available inputs:', inputs);

    // Debug: List all buttons
    const buttons = await page.$$eval('button', elements => 
      elements.map(el => ({
        text: el.textContent,
        type: el.type,
        disabled: el.disabled
      }))
    );
    console.log('Available buttons:', buttons);

    // Try to find the target input
    const targetInput = await page.$('input[placeholder*="example"]');
    if (targetInput) {
      console.log('✅ Found target input');
      await targetInput.type('https://www.cobytes.com');
      
      // Find next button
      const nextButton = await page.$('button:has-text("Next")') || await page.$('button[type="submit"]');
      if (nextButton) {
        console.log('✅ Found next button');
        await nextButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'debug-after-next.png' });
      } else {
        console.log('❌ No next button found');
      }
    } else {
      console.log('❌ No target input found');
    }

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugScanForm().catch(console.error);