const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const API_URL = 'https://securityscan.cobytes.com/api';
const FRONTEND_URL = 'https://securityscan.cobytes.com';
const TEST_USER = {
  email: 'test@cobytes.com',
  password: 'TestPassword123!'
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  environment: 'production',
  tests: {},
  navigation: {},
  forms: {},
  features: {},
  errors: []
};

// Create screenshots directory
async function setupDirectories() {
  const dirs = [
    'test-results-production',
    'test-results-production/screenshots',
    'test-results-production/navigation',
    'test-results-production/forms',
    'test-results-production/features'
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Save screenshot with descriptive name
async function saveScreenshot(page, name, category = 'screenshots') {
  const filename = `test-results-production/${category}/${name.replace(/\s+/g, '-').toLowerCase()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  return filename;
}

// Test API health
async function testAPIHealth() {
  console.log('\n🔍 Testing Production API Health...');
  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log('✅ Production API is healthy:', response.data);
    testResults.tests.apiHealth = 'PASSED';
    return true;
  } catch (error) {
    console.error('❌ Production API health check failed:', error.message);
    testResults.tests.apiHealth = 'FAILED';
    testResults.errors.push({ test: 'apiHealth', error: error.message });
    return false;
  }
}

// Test authentication
async function testAuthentication() {
  console.log('\n🔍 Testing Production Authentication...');
  try {
    // First create the user
    try {
      await axios.post(`${API_URL}/auth/register`, {
        email: TEST_USER.email,
        password: TEST_USER.password,
        name: 'Production Test User'
      });
      console.log('✅ Production user created');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  Production user already exists');
      }
    }

    // Test login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.data?.token || loginResponse.data.token;
    
    if (!token) {
      throw new Error('No token received from production login');
    }
    
    console.log('✅ Production authentication successful');
    testResults.tests.authentication = 'PASSED';
    return token;
  } catch (error) {
    console.error('❌ Production authentication failed:', error.message);
    testResults.tests.authentication = 'FAILED';
    testResults.errors.push({ test: 'authentication', error: error.message });
    return null;
  }
}

// Test all navigation links
async function testNavigation(page) {
  console.log('\n🔍 Testing Production Navigation...');
  
  const navigationTests = [
    { name: 'Dashboard', text: 'Dashboard', expectedUrl: '/dashboard' },
    { name: 'Security Dashboard', text: 'Security Dashboard', expectedUrl: '/security' },
    { name: 'Scans', text: 'Scans', expectedUrl: '/scans' },
    { name: 'Reports', text: 'Reports', expectedUrl: '/reports' },
    { name: 'All Scanners', text: 'All Scanners', expectedUrl: '/scanners' },
    { name: 'Pricing', text: 'Pricing', expectedUrl: '/pricing' },
    { name: 'New Scan Button', text: 'New Scan', expectedUrl: '/scans/new', isButton: true }
  ];

  for (const test of navigationTests) {
    try {
      console.log(`  Testing ${test.name}...`);
      
      // Go to dashboard first
      await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle0' });
      await page.waitForTimeout(2000);
      
      // Find and click the element
      if (test.isButton) {
        // Click button containing text
        await page.evaluate((text) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const button = buttons.find(btn => btn.textContent.includes(text));
          if (button) button.click();
        }, test.text);
      } else {
        // Click navigation item containing text
        await page.evaluate((text) => {
          // First try ListItemText elements (Material-UI navigation)
          const listItems = Array.from(document.querySelectorAll('[class*="MuiListItemText"]'));
          for (const item of listItems) {
            if (item.textContent.includes(text)) {
              const clickable = item.closest('[class*="MuiListItemButton"], [class*="MuiListItem"]');
              if (clickable) {
                clickable.click();
                return;
              }
            }
          }
          
          // Fallback to regular links
          const links = Array.from(document.querySelectorAll('a'));
          const link = links.find(a => a.textContent.includes(text));
          if (link) link.click();
        }, test.text);
      }
      
      // Wait for navigation
      await page.waitForTimeout(3000);
      
      // Check URL
      const currentUrl = page.url();
      if (currentUrl.includes(test.expectedUrl)) {
        console.log(`  ✅ ${test.name} navigation works`);
        testResults.navigation[test.name] = 'PASSED';
        await saveScreenshot(page, test.name, 'navigation');
      } else {
        throw new Error(`Expected URL to contain ${test.expectedUrl}, got ${currentUrl}`);
      }
    } catch (error) {
      console.error(`  ❌ ${test.name} navigation failed:`, error.message);
      testResults.navigation[test.name] = 'FAILED';
      testResults.errors.push({ test: `navigation-${test.name}`, error: error.message });
      await saveScreenshot(page, `${test.name}-error`, 'navigation');
    }
  }
}

// Test all forms
async function testForms(page, token) {
  console.log('\n🔍 Testing Production Forms...');
  
  // Test scan creation form
  try {
    console.log('  Testing scan creation form...');
    await page.goto(`${FRONTEND_URL}/dashboard/scans/new`, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'scan-form-empty', 'forms');
    
    // Look for form fields
    const hasTargetInput = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const targetInput = inputs.find(input => 
        input.name === 'target' || 
        input.placeholder?.toLowerCase().includes('url') ||
        input.placeholder?.toLowerCase().includes('target') ||
        input.type === 'url'
      );
      if (targetInput) {
        targetInput.value = 'https://test.example.com';
        targetInput.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    });
    
    if (hasTargetInput) {
      console.log('  ✅ Found and filled target input');
      
      // Select scan type
      const hasTypeSelect = await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('select'));
        if (selects.length > 0) {
          const select = selects[0];
          const options = Array.from(select.options);
          const wordpressOption = options.find(opt => opt.value === 'wordpress' || opt.text.toLowerCase().includes('wordpress'));
          if (wordpressOption) {
            select.value = wordpressOption.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
        return false;
      });
      
      if (hasTypeSelect) {
        console.log('  ✅ Selected WordPress scan type');
      }
      
      await saveScreenshot(page, 'scan-form-filled', 'forms');
      testResults.forms.scanCreation = 'PASSED';
    } else {
      testResults.forms.scanCreation = 'NO_INPUT';
    }
  } catch (error) {
    console.error('  ❌ Scan creation form failed:', error.message);
    testResults.forms.scanCreation = 'FAILED';
    testResults.errors.push({ test: 'form-scanCreation', error: error.message });
  }
  
  // Test search/filter forms on scans page
  try {
    console.log('  Testing search and filter forms...');
    await page.goto(`${FRONTEND_URL}/dashboard/scans`, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000);
    
    // Test search
    const hasSearch = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const searchInput = inputs.find(input => 
        input.type === 'search' || 
        input.placeholder?.toLowerCase().includes('search')
      );
      if (searchInput) {
        searchInput.value = 'example.com';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    });
    
    if (hasSearch) {
      console.log('  ✅ Search form works');
      testResults.forms.search = 'PASSED';
    } else {
      console.log('  ⚠️  No search input found');
      testResults.forms.search = 'NOT_FOUND';
    }
  } catch (error) {
    console.error('  ❌ Search/filter forms failed:', error.message);
    testResults.forms.searchFilter = 'FAILED';
    testResults.errors.push({ test: 'form-searchFilter', error: error.message });
  }
}

// Test all clickable elements and features
async function testFeatures(page, token) {
  console.log('\n🔍 Testing Production Features...');
  
  // Test all scanner types
  try {
    console.log('  Testing all scanner types...');
    await page.goto(`${FRONTEND_URL}/dashboard/scanners`, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'all-scanners', 'features');
    
    // Count scanner elements
    const scannerCount = await page.evaluate(() => {
      const scannerElements = document.querySelectorAll(
        '[class*="scanner"], [class*="Scanner"], [class*="card"], [class*="Card"], .bg-white'
      );
      return scannerElements.length;
    });
    
    console.log(`  ✅ Found ${scannerCount} scanner elements`);
    testResults.features.scannerTypes = scannerCount;
  } catch (error) {
    console.error('  ❌ Scanner types test failed:', error.message);
    testResults.features.scannerTypes = 'FAILED';
    testResults.errors.push({ test: 'feature-scannerTypes', error: error.message });
  }
  
  // Test pricing page
  try {
    console.log('  Testing pricing page...');
    await page.goto(`${FRONTEND_URL}/dashboard/pricing`, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'pricing-page', 'features');
    
    const hasPricingContent = await page.evaluate(() => {
      const content = document.body.textContent;
      return content.includes('€') || content.includes('EUR') || content.includes('price');
    });
    
    if (hasPricingContent) {
      console.log('  ✅ Pricing page has content');
      testResults.features.pricingPage = 'PASSED';
    } else {
      testResults.features.pricingPage = 'NO_CONTENT';
    }
  } catch (error) {
    console.error('  ❌ Pricing page test failed:', error.message);
    testResults.features.pricingPage = 'FAILED';
    testResults.errors.push({ test: 'feature-pricingPage', error: error.message });
  }
}

// Test real scan execution
async function testRealScan(token) {
  console.log('\n🔍 Testing Production Scan Execution...');
  
  try {
    // Create a real scan
    const scanResponse = await axios.post(
      `${API_URL}/scans`,
      {
        target: 'https://test.cobytes.com',
        type: 'ssl'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const scan = scanResponse.data.data || scanResponse.data;
    console.log('✅ Production scan created:', scan.id);
    testResults.features.scanCreation = 'PASSED';
    
    // Check scan status a few times
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const statusResponse = await axios.get(
          `${API_URL}/scans/${scan.id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        const currentScan = statusResponse.data.data || statusResponse.data;
        console.log(`  Scan status: ${currentScan.status} (check ${attempts + 1}/${maxAttempts})`);
        
        if (currentScan.status !== 'pending') {
          console.log(`✅ Scan is processing: ${currentScan.status}`);
          testResults.features.scanExecution = 'RUNNING';
          break;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('  Error checking scan status:', error.message);
        attempts++;
      }
    }
  } catch (error) {
    console.error('❌ Production scan execution failed:', error.message);
    testResults.features.scanExecution = 'FAILED';
    testResults.errors.push({ test: 'realScan', error: error.message });
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting comprehensive PRODUCTION testing...\n');
  console.log('🌐 Testing against: https://securityscan.cobytes.com');
  console.log('===============================================\n');
  
  await setupDirectories();
  
  // Test API first
  const apiHealthy = await testAPIHealth();
  if (!apiHealthy) {
    console.error('\n❌ Production API is not healthy. Critical issue!');
  }
  
  // Test authentication
  const token = await testAuthentication();
  if (!token) {
    console.error('\n❌ Production authentication failed. Critical issue!');
  }
  
  // Launch browser for UI tests
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  // Add helper to wait for timeout
  page.waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    // Test landing page
    console.log('\n🔍 Testing Production Landing Page...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
    await saveScreenshot(page, 'landing-page', 'screenshots');
    testResults.tests.landingPage = 'PASSED';
    
    // Test login flow
    console.log('\n🔍 Testing Production Login Flow...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });
    await saveScreenshot(page, 'login-page', 'screenshots');
    
    // Fill login form
    await page.type('input[name="email"], input[type="email"]', TEST_USER.email);
    await page.type('input[name="password"], input[type="password"]', TEST_USER.password);
    await saveScreenshot(page, 'login-filled', 'screenshots');
    
    // Click submit
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    const dashboardUrl = page.url();
    if (dashboardUrl.includes('/dashboard') || dashboardUrl.includes('/scans')) {
      console.log('✅ Production login successful');
      testResults.tests.loginFlow = 'PASSED';
      await saveScreenshot(page, 'dashboard-after-login', 'screenshots');
    } else {
      throw new Error('Login did not redirect to dashboard');
    }
    
    // Test navigation
    await testNavigation(page);
    
    // Test forms
    await testForms(page, token);
    
    // Test features
    await testFeatures(page, token);
    
    // Test real scan
    if (token) {
      await testRealScan(token);
    }
    
  } catch (error) {
    console.error('\n❌ Production test failed:', error.message);
    testResults.errors.push({ test: 'general', error: error.message });
  } finally {
    await browser.close();
  }
  
  // Generate summary
  const summary = {
    totalTests: Object.keys(testResults.tests).length + 
                Object.keys(testResults.navigation).length + 
                Object.keys(testResults.forms).length + 
                Object.keys(testResults.features).length,
    passed: Object.values({...testResults.tests, ...testResults.navigation, ...testResults.forms, ...testResults.features})
            .filter(v => v === 'PASSED').length,
    failed: Object.values({...testResults.tests, ...testResults.navigation, ...testResults.forms, ...testResults.features})
            .filter(v => v === 'FAILED').length,
    errors: testResults.errors.length
  };
  
  testResults.summary = summary;
  
  // Save results
  await fs.writeFile(
    'test-results-production/test-results.json',
    JSON.stringify(testResults, null, 2)
  );
  
  // Print summary
  console.log('\n📊 PRODUCTION TEST SUMMARY');
  console.log('==========================');
  console.log(`Environment: PRODUCTION`);
  console.log(`URL: ${FRONTEND_URL}`);
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`⚠️  Errors: ${summary.errors}`);
  console.log('\nDetailed results saved to test-results-production/test-results.json');
  
  if (summary.failed > 0 || summary.errors > 0) {
    console.log('\n❌ PRODUCTION TESTS FAILED - Critical issues detected!');
    console.log('\nFailed tests:');
    testResults.errors.forEach(err => {
      console.log(`  - ${err.test}: ${err.error}`);
    });
  } else {
    console.log('\n✅ ALL PRODUCTION TESTS PASSED - System is fully operational!');
  }
}

// Run all tests
runAllTests().catch(console.error);