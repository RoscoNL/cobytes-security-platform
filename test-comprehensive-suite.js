const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3002';
const API_URL = 'http://localhost:3001';
const API_PREFIX = '/api';
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!@#'
};

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  },
  pages: {},
  api: {},
  functionality: {},
  performance: {}
};

// Utility functions
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const screenshotDir = './test-results/screenshots';
  await fs.mkdir(screenshotDir, { recursive: true });
  await page.screenshot({ 
    path: path.join(screenshotDir, `${name}.png`),
    fullPage: true 
  });
}

async function testPage(browser, url, name, options = {}) {
  const { requiresAuth = false, waitForSelector = null } = options;
  console.log(`\n🔍 Testing page: ${name} (${url})`);
  
  const page = await browser.newPage();
  const result = {
    url,
    status: 'pending',
    loadTime: 0,
    errors: [],
    consoleErrors: [],
    networkErrors: []
  };
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      result.consoleErrors.push(msg.text());
    }
  });
  
  // Capture network errors
  page.on('requestfailed', request => {
    result.networkErrors.push({
      url: request.url(),
      failure: request.failure()
    });
  });
  
  try {
    const startTime = Date.now();
    
    // Navigate to page
    const response = await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    result.loadTime = Date.now() - startTime;
    result.httpStatus = response.status();
    
    // Wait for specific selector if provided
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 });
    }
    
    // Check for React errors
    const hasReactError = await page.evaluate(() => {
      const errorElement = document.querySelector('#root')?.textContent || '';
      return errorElement.includes('Something went wrong') || 
             errorElement.includes('Error boundary');
    });
    
    if (hasReactError) {
      result.errors.push('React error boundary triggered');
    }
    
    // Take screenshot
    await takeScreenshot(page, name.replace(/\s+/g, '-').toLowerCase());
    
    // Check for common error indicators
    const pageContent = await page.content();
    if (pageContent.includes('Failed to fetch') || 
        pageContent.includes('Network error') ||
        pageContent.includes('500 Internal Server Error') ||
        pageContent.includes('404 Not Found')) {
      result.errors.push('Page contains error messages');
    }
    
    result.status = result.errors.length === 0 && 
                   result.consoleErrors.length === 0 && 
                   result.networkErrors.length === 0 ? 'passed' : 'failed';
    
  } catch (error) {
    result.status = 'failed';
    result.errors.push(error.message);
    await takeScreenshot(page, `${name}-error`);
  } finally {
    await page.close();
  }
  
  testResults.pages[name] = result;
  testResults.summary.total++;
  if (result.status === 'passed') {
    testResults.summary.passed++;
    console.log(`  ✅ ${name} - Passed (${result.loadTime}ms)`);
  } else {
    testResults.summary.failed++;
    testResults.summary.errors.push({
      type: 'page',
      name,
      errors: result.errors,
      consoleErrors: result.consoleErrors,
      networkErrors: result.networkErrors
    });
    console.log(`  ❌ ${name} - Failed`);
    if (result.errors.length > 0) console.log(`     Errors: ${result.errors.join(', ')}`);
    if (result.consoleErrors.length > 0) console.log(`     Console: ${result.consoleErrors.join(', ')}`);
  }
  
  return result;
}

async function testAPI(endpoint, method = 'GET', options = {}) {
  const { data = null, headers = {}, requiresAuth = false, name = endpoint, usePrefix = true } = options;
  console.log(`\n🔍 Testing API: ${method} ${endpoint}`);
  
  const result = {
    endpoint,
    method,
    status: 'pending',
    responseTime: 0,
    httpStatus: null,
    errors: []
  };
  
  try {
    const startTime = Date.now();
    const url = `${API_URL}${endpoint}`;
    const requestHeaders = { ...headers };
    if (method !== 'GET' && method !== 'DELETE') {
      requestHeaders['Content-Type'] = 'application/json';
    }
    
    const response = await axios({
      method,
      url,
      data,
      headers: requestHeaders,
      validateStatus: () => true // Don't throw on error status codes
    });
    
    result.responseTime = Date.now() - startTime;
    result.httpStatus = response.status;
    
    // Check for successful response
    if (response.status >= 200 && response.status < 300) {
      result.status = 'passed';
    } else if (response.status === 401 && !requiresAuth) {
      // 401 is expected for protected endpoints without auth
      result.status = 'passed';
    } else {
      result.status = 'failed';
      result.errors.push(`HTTP ${response.status}: ${response.statusText}`);
      if (response.data?.error) {
        result.errors.push(JSON.stringify(response.data.error));
      }
    }
    
  } catch (error) {
    result.status = 'failed';
    result.errors.push(error.message);
  }
  
  testResults.api[name] = result;
  testResults.summary.total++;
  if (result.status === 'passed') {
    testResults.summary.passed++;
    console.log(`  ✅ ${name} - Passed (${result.responseTime}ms)`);
  } else {
    testResults.summary.failed++;
    testResults.summary.errors.push({
      type: 'api',
      name,
      errors: result.errors
    });
    console.log(`  ❌ ${name} - Failed`);
    if (result.errors.length > 0) console.log(`     Errors: ${result.errors.join(', ')}`);
  }
  
  return result;
}

async function testFunctionality(browser, name, testFn) {
  console.log(`\n🔍 Testing functionality: ${name}`);
  
  const result = {
    name,
    status: 'pending',
    duration: 0,
    errors: [],
    steps: []
  };
  
  try {
    const startTime = Date.now();
    await testFn(browser, result);
    result.duration = Date.now() - startTime;
    result.status = result.errors.length === 0 ? 'passed' : 'failed';
  } catch (error) {
    result.status = 'failed';
    result.errors.push(error.message);
  }
  
  testResults.functionality[name] = result;
  testResults.summary.total++;
  if (result.status === 'passed') {
    testResults.summary.passed++;
    console.log(`  ✅ ${name} - Passed (${result.duration}ms)`);
  } else {
    testResults.summary.failed++;
    testResults.summary.errors.push({
      type: 'functionality',
      name,
      errors: result.errors
    });
    console.log(`  ❌ ${name} - Failed`);
    if (result.errors.length > 0) console.log(`     Errors: ${result.errors.join(', ')}`);
  }
  
  return result;
}

async function checkDockerLogs() {
  console.log('\n📋 Checking Docker logs for errors...');
  
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  const services = ['postgres', 'redis', 'backend', 'frontend'];
  const logErrors = {};
  
  for (const service of services) {
    try {
      const { stdout } = await execPromise(`docker compose logs ${service} --tail 100 2>&1`);
      const errors = stdout.split('\n').filter(line => 
        line.includes('ERROR') || 
        line.includes('FATAL') || 
        line.includes('Exception') ||
        line.includes('Error:') ||
        line.includes('failed')
      );
      
      if (errors.length > 0) {
        logErrors[service] = errors.slice(-10); // Last 10 errors
      }
    } catch (error) {
      console.log(`  ⚠️  Could not check logs for ${service}`);
    }
  }
  
  return logErrors;
}

// Main test suite
async function runTestSuite() {
  console.log('🚀 Starting Comprehensive Test Suite');
  console.log('=====================================\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Test 1: Public Pages
    console.log('📄 Testing Public Pages');
    console.log('----------------------');
    
    await testPage(browser, BASE_URL, 'Landing Page');
    await testPage(browser, `${BASE_URL}/products`, 'Products Page');
    await testPage(browser, `${BASE_URL}/pricing`, 'Pricing Page');
    await testPage(browser, `${BASE_URL}/login`, 'Login Page');
    await testPage(browser, `${BASE_URL}/cart`, 'Shopping Cart');
    await testPage(browser, `${BASE_URL}/free-scan`, 'Free Scan');
    await testPage(browser, `${BASE_URL}/scan-demo`, 'Scan Demo');
    await testPage(browser, `${BASE_URL}/how-to`, 'How To');
    await testPage(browser, `${BASE_URL}/all-scanners-new`, 'All Scanners');
    
    // Test 2: API Endpoints
    console.log('\n📡 Testing API Endpoints');
    console.log('-----------------------');
    
    await testAPI('/health', 'GET', { name: 'Health Check', usePrefix: false });
    await testAPI(`${API_PREFIX}/products`, 'GET', { name: 'Get Products' });
    await testAPI(`${API_PREFIX}/scans/scan-types`, 'GET', { name: 'Get Scan Types' });
    await testAPI(`${API_PREFIX}/auth/register`, 'POST', { 
      name: 'Register User',
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'Test123!@#',
        name: 'Test User'
      }
    });
    
    // Test 3: Authentication Flow
    console.log('\n🔐 Testing Authentication');
    console.log('------------------------');
    
    await testFunctionality(browser, 'Login Flow', async (browser, result) => {
      const page = await browser.newPage();
      
      try {
        // Navigate to login
        await page.goto(`${BASE_URL}/login`);
        result.steps.push('Navigated to login page');
        
        // Fill login form
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', TEST_USER.email);
        await page.type('input[type="password"]', TEST_USER.password);
        result.steps.push('Filled login form');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Wait for something to happen (navigation, error, or timeout)
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
          
          // Check if logged in
          const url = page.url();
          if (url.includes('dashboard') || url === BASE_URL + '/') {
            result.steps.push('Login successful');
          } else {
            result.errors.push('Login failed - unexpected redirect to: ' + url);
          }
        } catch (navError) {
          // Navigation didn't happen, check for error message
          await delay(1000); // Give time for error to appear
          
          const errorElement = await page.$('.MuiAlert-root');
          if (errorElement) {
            const errorText = await errorElement.evaluate(el => el.textContent);
            result.errors.push(`Login error: ${errorText}`);
          } else {
            result.errors.push('Login failed - no navigation and no error message');
          }
        }
        
        await takeScreenshot(page, 'login-test');
      } finally {
        await page.close();
      }
    });
    
    // Test 4: Scan Functionality
    console.log('\n🔍 Testing Scan Features');
    console.log('-----------------------');
    
    await testFunctionality(browser, 'Free SSL Scan', async (browser, result) => {
      const page = await browser.newPage();
      
      try {
        // Navigate to scan demo
        await page.goto(`${BASE_URL}/scan-demo`);
        result.steps.push('Navigated to scan demo');
        
        // Wait for input
        await page.waitForSelector('input[type="text"]', { timeout: 10000 });
        
        // Clear and enter URL
        const input = await page.$('input[type="text"]');
        await input.click({ clickCount: 3 });
        await input.type('https://www.example.com');
        result.steps.push('Entered target URL');
        
        // Start scan
        const scanButtons = await page.$$('button');
        let scanButton = null;
        for (const button of scanButtons) {
          const text = await button.evaluate(el => el.textContent);
          if (text && text.includes('Start Scan')) {
            scanButton = button;
            break;
          }
        }
        
        if (scanButton) {
          await scanButton.click();
          result.steps.push('Started scan');
          
          // Wait for scan to start (progress bar or error)
          await delay(3000);
          
          // Check for error first
          const hasError = await page.$('.MuiAlert-root.MuiAlert-standardError');
          if (hasError) {
            const errorText = await hasError.evaluate(el => el.textContent);
            result.errors.push(`Scan error: ${errorText}`);
          } else {
            // Check if scanning is in progress
            const progressBar = await page.$('[role="progressbar"]');
            if (progressBar) {
              result.steps.push('Scan is in progress');
              
              // Wait a bit longer for scan to complete (but not too long for the test)
              await delay(10000);
              
              // Check final state
              const finalError = await page.$('.MuiAlert-root.MuiAlert-standardError');
              if (finalError) {
                const errorText = await finalError.evaluate(el => el.textContent);
                result.errors.push(`Scan failed: ${errorText}`);
              } else {
                // Check if we have results (scan completed or still running is OK for test)
                const hasResults = await page.evaluate(() => {
                  const text = document.body.innerText;
                  return text.includes('Scan Results') || text.includes('Scanning') || text.includes('progress');
                });
                
                if (hasResults) {
                  result.steps.push('Scan completed or in progress - test passed');
                } else {
                  result.errors.push('No scan progress or results found');
                }
              }
            } else {
              result.errors.push('Scan did not start - no progress bar found');
            }
          }
        } else {
          result.errors.push('Scan button not found');
        }
        
        await takeScreenshot(page, 'scan-test');
      } finally {
        await page.close();
      }
    });
    
    // Test 5: E-commerce Flow
    console.log('\n🛒 Testing E-commerce Features');
    console.log('-----------------------------');
    
    await testFunctionality(browser, 'Add to Cart', async (browser, result) => {
      const page = await browser.newPage();
      
      try {
        // Navigate to products
        await page.goto(`${BASE_URL}/products`);
        result.steps.push('Navigated to products page');
        
        // Wait for products to load
        await page.waitForSelector('.MuiCard-root', { timeout: 10000 });
        
        // Click first add to cart button
        const cartButtons = await page.$$('button');
        let addToCartButton = null;
        for (const button of cartButtons) {
          const text = await button.evaluate(el => el.textContent);
          if (text && text.includes('Add to Cart')) {
            addToCartButton = button;
            break;
          }
        }
        
        if (addToCartButton) {
          await addToCartButton.click();
          result.steps.push('Clicked add to cart');
          
          // Check for success message or cart update
          await delay(1000);
          
          // Navigate to cart
          await page.goto(`${BASE_URL}/cart`);
          await page.waitForSelector('.MuiContainer-root', { timeout: 10000 });
          
          // Check if item is in cart
          const cartItems = await page.$$('.MuiCard-root');
          if (cartItems.length > 0) {
            result.steps.push('Item added to cart successfully');
          } else {
            result.errors.push('Cart is empty after adding item');
          }
        } else {
          result.errors.push('Add to cart button not found');
        }
        
        await takeScreenshot(page, 'cart-test');
      } finally {
        await page.close();
      }
    });
    
    // Test 6: Protected Pages (will fail without auth)
    console.log('\n🔒 Testing Protected Pages (Expected 401 errors)');
    console.log('-----------------------------------------------');
    
    // These pages should redirect to login when not authenticated
    await testFunctionality(browser, 'Protected Pages Access', async (browser, result) => {
      const protectedPages = [
        { url: `${BASE_URL}/dashboard`, name: 'Dashboard' },
        { url: `${BASE_URL}/dashboard/scans`, name: 'Scans List' },
        { url: `${BASE_URL}/dashboard/reports`, name: 'Reports' },
        { url: `${BASE_URL}/dashboard/orders`, name: 'Orders' }
      ];
      
      for (const pageInfo of protectedPages) {
        const page = await browser.newPage();
        try {
          await page.goto(pageInfo.url, { waitUntil: 'networkidle2' });
          
          // Wait a bit for any redirects to complete
          await delay(2000);
          
          const finalUrl = page.url();
          
          // Check if redirected to login
          if (finalUrl.includes('/login')) {
            result.steps.push(`${pageInfo.name}: Correctly redirected to login`);
          } else if (finalUrl === pageInfo.url) {
            // Page loaded without auth - this is an error
            result.errors.push(`${pageInfo.name}: Loaded without authentication!`);
          } else {
            result.steps.push(`${pageInfo.name}: Redirected to ${finalUrl}`);
          }
        } catch (error) {
          result.errors.push(`${pageInfo.name}: ${error.message}`);
        } finally {
          await page.close();
        }
      }
    });
    
    // Test 7: Check Docker Logs
    const dockerErrors = await checkDockerLogs();
    if (Object.keys(dockerErrors).length > 0) {
      console.log('\n⚠️  Docker Log Errors Found:');
      for (const [service, errors] of Object.entries(dockerErrors)) {
        console.log(`\n  ${service}:`);
        errors.forEach(error => console.log(`    - ${error}`));
      }
    }
    
    // Test 8: Performance Checks
    console.log('\n⚡ Performance Analysis');
    console.log('---------------------');
    
    const slowPages = Object.entries(testResults.pages)
      .filter(([_, result]) => result.loadTime > 3000)
      .map(([name, result]) => ({ name, loadTime: result.loadTime }));
    
    if (slowPages.length > 0) {
      console.log('  Slow pages (>3s):');
      slowPages.forEach(({ name, loadTime }) => {
        console.log(`    - ${name}: ${loadTime}ms`);
      });
    } else {
      console.log('  ✅ All pages load within acceptable time');
    }
    
    // Save results
    await fs.writeFile(
      './test-results/comprehensive-test-results.json',
      JSON.stringify(testResults, null, 2)
    );
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('==============');
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed} ✅`);
    console.log(`Failed: ${testResults.summary.failed} ❌`);
    console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
    
    if (testResults.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.summary.errors.forEach(error => {
        console.log(`\n  ${error.type.toUpperCase()}: ${error.name}`);
        if (error.errors && error.errors.length > 0) {
          error.errors.forEach(e => console.log(`    - ${e}`));
        }
        if (error.consoleErrors && error.consoleErrors.length > 0) {
          console.log('    Console errors:');
          error.consoleErrors.forEach(e => console.log(`      - ${e}`));
        }
      });
    }
    
  } catch (error) {
    console.error('Test suite failed:', error);
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run the test suite
runTestSuite()
  .then(() => {
    console.log('\n✅ Test suite completed');
    process.exit(testResults.summary.failed === 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });