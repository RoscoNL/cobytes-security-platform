const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3002';

// All pages to test
const PUBLIC_PAGES = [
  { path: '/', name: 'Landing Page' },
  { path: '/products', name: 'Products' },
  { path: '/cart', name: 'Cart' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/how-to', name: 'How To' },
  { path: '/scan-demo', name: 'Scan Demo' },
  { path: '/free-scan', name: 'Free Scan' },
  { path: '/login', name: 'Login' },
];

const AUTHENTICATED_PAGES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/dashboard/scans', name: 'My Scans' },
  { path: '/dashboard/scans/new', name: 'New Scan' },
  { path: '/dashboard/reports', name: 'Reports' },
  { path: '/dashboard/scanners', name: 'All Scanners' },
  { path: '/security-dashboard', name: 'Security Dashboard' },
  { path: '/orders', name: 'My Orders' },
  { path: '/checkout', name: 'Checkout' },
];

async function testPage(page, url, pageName, isAuthenticated) {
  console.log(`\n📍 Testing ${pageName} (${isAuthenticated ? 'Logged In' : 'Not Logged In'})...`);
  
  try {
    // Navigate to page
    const response = await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Check response status
    const status = response.status();
    console.log(`   Status: ${status}`);
    
    // Wait a bit for any async rendering
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for React errors
    const hasReactError = await page.evaluate(() => {
      const errorOverlay = document.querySelector('#webpack-dev-server-client-overlay');
      const errorText = document.body.textContent || '';
      return errorOverlay || errorText.includes('Error: Objects are not valid as a React child');
    });
    
    if (hasReactError) {
      console.log(`   ❌ React rendering error detected!`);
      return false;
    }
    
    // Check page loaded content
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasContent: document.body.textContent.length > 100,
        url: window.location.href
      };
    });
    
    // Check if redirected
    if (pageContent.url !== url) {
      console.log(`   ➡️  Redirected to: ${pageContent.url}`);
    }
    
    console.log(`   ✅ Page loaded successfully`);
    console.log(`   Title: ${pageContent.title}`);
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error loading page: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive page tests...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Monitor console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Objects are not valid as a React child')) {
          errors.push(`React Error on ${page.url()}: ${text}`);
          console.error(`\n❌ REACT ERROR DETECTED: ${text}\n`);
        }
      }
    });
    
    page.on('pageerror', error => {
      if (error.message.includes('Objects are not valid as a React child')) {
        errors.push(`Page Error on ${page.url()}: ${error.message}`);
        console.error(`\n❌ PAGE ERROR DETECTED: ${error.message}\n`);
      }
    });
    
    // Test results
    const results = {
      public: { passed: 0, failed: 0, pages: [] },
      authenticated: { passed: 0, failed: 0, pages: [] }
    };
    
    console.log('═══════════════════════════════════════════');
    console.log('PART 1: TESTING PUBLIC PAGES (NOT LOGGED IN)');
    console.log('═══════════════════════════════════════════');
    
    // Test all public pages
    for (const pageInfo of PUBLIC_PAGES) {
      const success = await testPage(page, BASE_URL + pageInfo.path, pageInfo.name, false);
      results.public.pages.push({ ...pageInfo, success });
      if (success) {
        results.public.passed++;
      } else {
        results.public.failed++;
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: `screenshots/public-${pageInfo.name.replace(/\s+/g, '-').toLowerCase()}.png` 
      });
    }
    
    console.log('\n═══════════════════════════════════════════');
    console.log('PART 2: LOGGING IN');
    console.log('═══════════════════════════════════════════');
    
    // Login
    console.log('\n📍 Logging in...');
    await page.goto(`${BASE_URL}/login`);
    await new Promise(r => setTimeout(r, 2000));
    
    await page.type('input[type="email"]', 'user@cobytes.com');
    await page.type('input[type="password"]', 'pass');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000));
    
    // Check if logged in
    const isLoggedIn = await page.evaluate(() => {
      return !!localStorage.getItem('token');
    });
    
    if (isLoggedIn) {
      console.log('✅ Successfully logged in');
    } else {
      console.log('❌ Login failed');
    }
    
    console.log('\n═══════════════════════════════════════════');
    console.log('PART 3: TESTING AUTHENTICATED PAGES (LOGGED IN)');
    console.log('═══════════════════════════════════════════');
    
    // Test all authenticated pages
    for (const pageInfo of AUTHENTICATED_PAGES) {
      const success = await testPage(page, BASE_URL + pageInfo.path, pageInfo.name, true);
      results.authenticated.pages.push({ ...pageInfo, success });
      if (success) {
        results.authenticated.passed++;
      } else {
        results.authenticated.failed++;
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: `screenshots/auth-${pageInfo.name.replace(/\s+/g, '-').toLowerCase()}.png` 
      });
    }
    
    // Summary
    console.log('\n═══════════════════════════════════════════');
    console.log('TEST SUMMARY');
    console.log('═══════════════════════════════════════════');
    
    console.log('\nPublic Pages (Not Logged In):');
    console.log(`✅ Passed: ${results.public.passed}`);
    console.log(`❌ Failed: ${results.public.failed}`);
    results.public.pages.forEach(p => {
      console.log(`   ${p.success ? '✅' : '❌'} ${p.name}`);
    });
    
    console.log('\nAuthenticated Pages (Logged In):');
    console.log(`✅ Passed: ${results.authenticated.passed}`);
    console.log(`❌ Failed: ${results.authenticated.failed}`);
    results.authenticated.pages.forEach(p => {
      console.log(`   ${p.success ? '✅' : '❌'} ${p.name}`);
    });
    
    console.log('\nReact Errors Detected:');
    if (errors.length === 0) {
      console.log('✅ No "Objects are not valid as a React child" errors found!');
    } else {
      console.log(`❌ Found ${errors.length} React errors:`);
      errors.forEach(err => console.log(`   - ${err}`));
    }
    
    const totalPassed = results.public.passed + results.authenticated.passed;
    const totalFailed = results.public.failed + results.authenticated.failed;
    const totalTests = totalPassed + totalFailed;
    
    console.log('\n═══════════════════════════════════════════');
    console.log(`OVERALL: ${totalPassed}/${totalTests} pages passed (${Math.round(totalPassed/totalTests*100)}%)`);
    console.log('═══════════════════════════════════════════');
    
    if (totalFailed === 0 && errors.length === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Ready for deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Please fix issues before deployment.');
    }
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  } finally {
    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run tests
runTests();