const puppeteer = require('puppeteer');

async function testLoginIssue() {
  console.log('🔍 Testing login and checkout flow issues...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  
  // Intercept network requests to see what's happening
  await page.setRequestInterception(true);
  
  page.on('request', request => {
    if (request.url().includes('/auth/')) {
      console.log('🌐 Auth request:', request.method(), request.url());
      if (request.method() === 'POST') {
        console.log('   Body:', request.postData());
      }
    }
    request.continue();
  });
  
  page.on('response', response => {
    if (response.url().includes('/auth/') && response.status() >= 400) {
      console.log(`❌ Auth response: ${response.status()} - ${response.url()}`);
    }
  });

  try {
    // Test 1: Check the login page with redirect
    console.log('1. Testing login page with redirect parameter...');
    await page.goto('http://localhost:3002/login?redirect=/checkout', { 
      waitUntil: 'networkidle2' 
    });
    
    // Check what's rendered
    const pageContent = await page.evaluate(() => {
      const title = document.querySelector('h2')?.textContent || 'No title';
      const hasLoginForm = !!document.querySelector('input[name="email"]');
      const hasError = document.body.textContent.includes('Resource not found') || 
                      document.body.textContent.includes('404');
      return { title, hasLoginForm, hasError };
    });
    
    console.log('Page status:', pageContent);
    
    if (pageContent.hasError) {
      console.log('❌ Error found on login page');
      const fullText = await page.evaluate(() => document.body.innerText);
      console.log('Full page text:', fullText.substring(0, 500));
    }
    
    // Test 2: Try logging in with correct credentials
    console.log('\n2. Testing login with admin credentials...');
    
    // Clear fields first
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[name="email"]');
      const passwordInput = document.querySelector('input[name="password"]');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
    
    // Enter admin credentials
    await page.type('input[name="email"]', 'admin@cobytes.com');
    await page.type('input[name="password"]', 'admin123');
    await page.screenshot({ path: 'login-test-admin-creds.png' });
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    console.log('After login URL:', page.url());
    
    // Check if we got redirected
    if (page.url().includes('/checkout')) {
      console.log('✅ Successfully redirected to checkout!');
      
      // Check checkout page
      const checkoutContent = await page.evaluate(() => {
        return {
          hasCart: document.body.textContent.includes('Cart') || 
                   document.body.textContent.includes('cart'),
          hasCheckout: document.body.textContent.includes('Checkout') || 
                       document.body.textContent.includes('checkout'),
          bodyText: document.body.innerText.substring(0, 200)
        };
      });
      
      console.log('Checkout page content:', checkoutContent);
    } else if (page.url().includes('/dashboard')) {
      console.log('⚠️  Redirected to dashboard instead of checkout');
    } else if (page.url().includes('/login')) {
      console.log('❌ Still on login page - login failed');
      
      // Check for error message
      const errorMsg = await page.evaluate(() => {
        const alerts = document.querySelectorAll('[class*="error"], [class*="alert"]');
        return Array.from(alerts).map(el => el.textContent).join('\n');
      });
      
      if (errorMsg) {
        console.log('Error message:', errorMsg);
      }
    }
    
    await page.screenshot({ path: 'login-test-final.png' });

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'login-test-error.png' });
  } finally {
    await browser.close();
  }
}

// Also test the API directly
async function testAPIDirectly() {
  console.log('\n📡 Testing API directly...\n');
  
  const tests = [
    { email: 'admin@cobytes.com', password: 'admin123', expected: 'should work' },
    { email: 'user@cobytes.com', password: 'pass', expected: 'should fail' },
    { email: 'test@example.com', password: 'Test123!@#', expected: 'should fail' }
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: test.email, password: test.password })
      });
      
      const data = await response.json();
      console.log(`${test.email}: ${response.ok ? '✅ Success' : '❌ Failed'} (${test.expected})`);
      if (!response.ok) {
        console.log(`  Error: ${data.error}`);
      }
    } catch (error) {
      console.log(`${test.email}: ❌ Network error`);
    }
  }
}

// Run tests
async function runAllTests() {
  await testLoginIssue();
  await testAPIDirectly();
}

runAllTests().catch(console.error);