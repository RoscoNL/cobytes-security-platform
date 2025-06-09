const puppeteer = require('puppeteer');

async function testDashboard() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();

  try {
    console.log('1. Testing direct dashboard access...');
    await page.goto('https://securityscan.cobytes.com/dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    await page.screenshot({ path: 'production-dashboard-direct.png' });
    const url = page.url();
    console.log('   Current URL:', url);
    
    console.log('\n2. Testing scan creation page...');
    await page.goto('https://securityscan.cobytes.com/dashboard/scans/new', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    await page.screenshot({ path: 'production-scan-new.png' });
    console.log('   Current URL:', page.url());
    
    console.log('\n3. Testing login page...');
    await page.goto('https://securityscan.cobytes.com/login', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    await page.screenshot({ path: 'production-login.png' });
    console.log('   Current URL:', page.url());
    
    // Try to login
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (emailInput && passwordInput) {
      console.log('\n4. Attempting login...');
      await emailInput.type('demo@cobytes.com');
      await passwordInput.type('Demo123\!');
      await page.screenshot({ path: 'production-login-filled.png' });
      
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
        await page.screenshot({ path: 'production-after-login.png' });
        console.log('   After login URL:', page.url());
      }
    }
    
    console.log('\n5. Checking API endpoints...');
    const endpoints = [
      '/api/products',
      '/api/auth/status',
      '/api/scans'
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.evaluate(async (ep) => {
        try {
          const resp = await fetch(`https://securityscan.cobytes.com${ep}`);
          return { endpoint: ep, status: resp.status, ok: resp.ok };
        } catch (err) {
          return { endpoint: ep, error: err.message };
        }
      }, endpoint);
      console.log('   ', response);
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\nDone. Check the screenshots.');
  await browser.close();
}

testDashboard().catch(console.error);
