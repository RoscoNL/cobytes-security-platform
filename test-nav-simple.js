const puppeteer = require('puppeteer');

async function testNavigation() {
  console.log('🚀 Testing navigation functionality...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    
    // Go to homepage
    console.log('📍 Loading homepage...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Check page structure
    const pageTitle = await page.$eval('h1', el => el.textContent).catch(() => 'No H1 found');
    console.log('Page title:', pageTitle);
    
    // Check for navigation elements
    const navBar = await page.$('.MuiAppBar-root');
    console.log('✅ AppBar exists:', !!navBar);
    
    const drawer = await page.$('.MuiDrawer-root');
    console.log('✅ Drawer exists:', !!drawer);
    
    // Get all buttons
    const buttons = await page.$$eval('button', elements => 
      elements.map(el => el.textContent?.trim()).filter(Boolean)
    );
    console.log('✅ Buttons found:', buttons);
    
    // Get all links
    const links = await page.$$eval('a', elements => 
      elements.map(el => ({ text: el.textContent?.trim(), href: el.href })).filter(item => item.text)
    );
    console.log('✅ Links found:', links);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/nav-test-1.png' });
    
    // Try to click Login button
    const loginButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loginBtn = buttons.find(btn => btn.textContent?.includes('Login'));
      if (loginBtn) {
        loginBtn.click();
        return true;
      }
      return false;
    });
    
    if (loginButton) {
      console.log('\n📍 Clicked login button');
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: 'screenshots/nav-test-2-login.png' });
      
      // Fill login form
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        await page.type('input[type="email"]', 'test@example.com');
        await page.type('input[type="password"]', 'Test123!');
        await page.screenshot({ path: 'screenshots/nav-test-3-filled.png' });
        
        // Submit
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await new Promise(r => setTimeout(r, 3000));
          await page.screenshot({ path: 'screenshots/nav-test-4-after-login.png' });
          
          // Check current URL
          console.log('Current URL:', page.url());
          
          // Check for menu items
          const menuItems = await page.$$eval('.MuiListItemText-root', elements => 
            elements.map(el => el.textContent?.trim()).filter(Boolean)
          );
          console.log('✅ Menu items after login:', menuItems);
        }
      }
    }
    
    console.log('\n✅ Navigation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/nav-test-error.png' });
  } finally {
    await new Promise(r => setTimeout(r, 3000)); // Keep browser open for inspection
    await browser.close();
  }
}

// Run test
testNavigation();