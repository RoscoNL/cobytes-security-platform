const puppeteer = require('puppeteer');
const axios = require('axios');

const FRONTEND_URL = 'http://localhost:3002';
const BACKEND_URL = 'http://localhost:3001';

const pages = [
  { path: '/', name: 'Landing', expectedText: 'Cobytes' },
  { path: '/products', name: 'Products', expectedText: 'Products' },
  { path: '/pricing', name: 'Pricing', expectedText: 'Pricing' },
  { path: '/free-scan', name: 'Free Scan', expectedText: 'Free Security Scan' },
  { path: '/how-to', name: 'How To', expectedText: 'How' },
  { path: '/scan-demo', name: 'Scan Demo', expectedText: 'Demo' },
  { path: '/login', name: 'Login', expectedText: 'Sign' },
  { path: '/register', name: 'Register', expectedText: 'Create Account' },
  { path: '/contact', name: 'Contact', expectedText: 'Contact' },
  { path: '/cart', name: 'Cart', expectedText: 'Cart' },
  // Protected pages (will redirect to login)
  { path: '/dashboard', name: 'Dashboard', expectedText: 'Sign', needsAuth: true },
  { path: '/scans', name: 'Scans List', expectedText: 'Sign', needsAuth: true },
  { path: '/reports', name: 'Reports', expectedText: 'Sign', needsAuth: true },
  { path: '/orders', name: 'Orders', expectedText: 'Sign', needsAuth: true },
  { path: '/profile', name: 'Profile', expectedText: 'Sign', needsAuth: true },
  { path: '/settings', name: 'Settings', expectedText: 'Sign', needsAuth: true },
];

async function checkBackendHealth() {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/system/health`);
    console.log('✅ Backend is healthy:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend is not responding:', error.message);
    return false;
  }
}

async function testFrontendPages() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];
  
  try {
    // Check backend first
    const backendHealthy = await checkBackendHealth();
    if (!backendHealthy) {
      console.log('⚠️  Backend is not healthy, some features may not work');
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Test each page
    for (const pageInfo of pages) {
      console.log(`\nTesting ${pageInfo.name} (${pageInfo.path})...`);
      
      try {
        await page.goto(`${FRONTEND_URL}${pageInfo.path}`, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });

        // Wait a bit for React to render
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if page loaded
        const pageTitle = await page.title();
        const pageText = await page.evaluate(() => document.body.innerText);
        
        // Take screenshot
        await page.screenshot({ 
          path: `screenshots/test-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });

        // Check for expected text
        const hasExpectedText = pageText.toLowerCase().includes(pageInfo.expectedText.toLowerCase());
        
        // Check for error messages
        const hasError = pageText.includes('Error') || pageText.includes('error') || 
                        pageText.includes('404') || pageText.includes('not found');
        
        // Check console errors
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        results.push({
          page: pageInfo.name,
          path: pageInfo.path,
          status: hasExpectedText ? 'PASS' : 'FAIL',
          hasError: hasError,
          title: pageTitle,
          expectedText: pageInfo.expectedText,
          foundExpectedText: hasExpectedText,
          consoleErrors: consoleErrors
        });

        if (hasExpectedText) {
          console.log(`✅ ${pageInfo.name} loaded successfully`);
        } else {
          console.log(`❌ ${pageInfo.name} failed - expected "${pageInfo.expectedText}" not found`);
        }

        if (hasError) {
          console.log(`⚠️  Error detected on page`);
        }

      } catch (error) {
        console.log(`❌ ${pageInfo.name} failed to load:`, error.message);
        results.push({
          page: pageInfo.name,
          path: pageInfo.path,
          status: 'ERROR',
          error: error.message
        });
      }
    }

    // Test navigation links
    console.log('\n\nTesting Navigation Links...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(link => ({
        text: link.innerText,
        href: link.href,
        visible: link.offsetParent !== null
      }));
    });

    console.log(`Found ${links.length} links`);
    links.forEach(link => {
      if (link.visible) {
        console.log(`  - ${link.text}: ${link.href}`);
      }
    });

    // Test API data loading on Products page
    console.log('\n\nTesting API Data Loading...');
    await page.goto(`${FRONTEND_URL}/products`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const productsFound = await page.evaluate(() => {
      const productCards = document.querySelectorAll('[data-testid="product-card"]');
      const productDivs = document.querySelectorAll('div[class*="product"]');
      return {
        byTestId: productCards.length,
        byClass: productDivs.length,
        pageText: document.body.innerText.substring(0, 500)
      };
    });

    console.log(`Products found: ${productsFound.byTestId} (by test-id), ${productsFound.byClass} (by class)`);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n\n=== TEST SUMMARY ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Errors: ${errors}`);

  console.log('\nDetailed Results:');
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '🔥';
    console.log(`${icon} ${r.page} (${r.path}): ${r.status}`);
    if (r.error) console.log(`   Error: ${r.error}`);
    if (r.status === 'FAIL') console.log(`   Expected: "${r.expectedText}"`);
  });
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run tests
testFrontendPages().catch(console.error);