const puppeteer = require('puppeteer');

async function testLogin() {
  console.log('Testing login functionality...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });
    
    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle2' });
    
    // Take screenshot
    await page.screenshot({ path: 'test-login-1-initial.png' });
    
    // Wait for form elements
    console.log('2. Waiting for form elements...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Fill form
    console.log('3. Filling form...');
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'Test123!@#');
    
    await page.screenshot({ path: 'test-login-2-filled.png' });
    
    // Click submit button
    console.log('4. Finding and clicking submit button...');
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      console.log('   Submit button found, clicking...');
      
      // Set up promises for navigation and error
      const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => null);
      const errorPromise = page.waitForSelector('.MuiAlert-root', { timeout: 2000 }).catch(() => null);
      
      await submitButton.click();
      
      // Wait for either navigation or error
      console.log('5. Waiting for response...');
      const [navigation, errorElement] = await Promise.all([navigationPromise, errorPromise]);
      
      await page.screenshot({ path: 'test-login-3-after-click.png' });
      
      if (navigation) {
        console.log('   Navigation occurred!');
        console.log('   Current URL:', page.url());
      } else {
        console.log('   No navigation occurred');
      }
      
      if (errorElement) {
        const errorText = await errorElement.evaluate(el => el.textContent);
        console.log('   Error message:', errorText);
      } else {
        console.log('   No error message found');
      }
      
      // Check for any visible text
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('\n6. Page content preview:');
      console.log(bodyText.substring(0, 500) + '...');
      
    } else {
      console.log('   ERROR: Submit button not found!');
    }
    
    // Wait a bit before closing
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testLogin();