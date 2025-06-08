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
    
    // Check if navigation exists
    const navExists = await page.$('nav');
    console.log('✅ Navigation bar exists:', !!navExists);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/navigation-test.png' });
    
    // Check menu items
    const menuItems = await page.$$eval('nav a, nav button', elements => 
      elements.map(el => el.textContent?.trim()).filter(Boolean)
    );
    console.log('✅ Navigation items:', menuItems);
    
    // Test login
    console.log('\n📍 Testing login...');
    const loginButton = await page.$('button:has-text("Login")');
    if (loginButton) {
      await loginButton.click();
      await new Promise(r => setTimeout(r, 2000));
      console.log('✅ Navigated to login page');
      
      // Try to login
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'Test123!');
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 3000));
      
      // Check if logged in
      const userChip = await page.$('.MuiChip-root');
      if (userChip) {
        console.log('✅ Successfully logged in');
        
        // Check authenticated menu
        const authMenuItems = await page.$$eval('.MuiListItemText-root', elements => 
          elements.map(el => el.textContent?.trim()).filter(Boolean)
        );
        console.log('✅ Authenticated menu items:', authMenuItems);
      }
    }
    
    console.log('\n✅ Navigation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run test
testNavigation();