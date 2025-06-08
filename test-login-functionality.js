const puppeteer = require('puppeteer');
const axios = require('axios');

async function testLoginFunctionality() {
  console.log('🚀 Testing login functionality...\n');

  // First test API directly
  console.log('📍 Testing API login endpoint...');
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'user@cobytes.com',
      password: 'pass'
    });
    console.log('✅ API login successful:', response.data);
  } catch (error) {
    console.log('❌ API login failed:', error.response?.data || error.message);
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    
    // Monitor console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser error:', msg.text());
      }
    });

    // Go to login page
    console.log('\n📍 Testing browser login...');
    await page.goto('http://localhost:3002/login');
    await new Promise(r => setTimeout(r, 2000));

    // Try login
    await page.type('input[type="email"]', 'user@cobytes.com');
    await page.type('input[type="password"]', 'pass');
    
    // Click submit
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000));

    // Check if logged in
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const currentUrl = page.url();
    
    console.log('Current URL:', currentUrl);
    console.log('Token exists:', !!token);

    if (token) {
      console.log('✅ Login successful!');
      
      // Test accessing protected page
      await page.goto('http://localhost:3002/dashboard/scans');
      await new Promise(r => setTimeout(r, 2000));
      
      const onProtectedPage = page.url().includes('/dashboard/scans');
      console.log('Can access protected pages:', onProtectedPage ? '✅' : '❌');
    } else {
      console.log('❌ Login failed - no token stored');
      
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const errorElement = document.querySelector('.bg-red-50');
        return errorElement?.textContent || null;
      });
      
      if (errorText) {
        console.log('Error message:', errorText);
      }
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
  }
}

testLoginFunctionality();