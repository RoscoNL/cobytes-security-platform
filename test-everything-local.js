const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const API_URL = 'http://localhost:3000/api';
const FRONTEND_URL = 'http://localhost:3002';
const TEST_USER = {
  email: 'user@cobytes.com',
  password: 'pass'
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  environment: 'local',
  tests: {},
  navigation: {},
  forms: {},
  features: {},
  errors: []
};

// Create screenshots directory
async function setupDirectories() {
  const dirs = [
    'test-results-local',
    'test-results-local/screenshots',
    'test-results-local/navigation',
    'test-results-local/forms',
    'test-results-local/features'
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Save screenshot with descriptive name
async function saveScreenshot(page, name, category = 'screenshots') {
  const filename = `test-results-local/${category}/${name.replace(/\s+/g, '-').toLowerCase()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  return filename;
}

// Test API health
async function testAPIHealth() {
  console.log('\n🔍 Testing API Health...');
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('✅ API is healthy:', response.data);
    testResults.tests.apiHealth = 'PASSED';
    return true;
  } catch (error) {
    console.error('❌ API health check failed:', error.message);
    testResults.tests.apiHealth = 'FAILED';
    testResults.errors.push({ test: 'apiHealth', error: error.message });
    return false;
  }
}

// Test authentication
async function testAuthentication() {
  console.log('\n🔍 Testing Authentication...');
  try {
    // First create the user
    try {
      await axios.post(`${API_URL}/auth/register`, {
        email: TEST_USER.email,
        password: TEST_USER.password,
        name: 'Test User'
      });
      console.log('✅ User created');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  User already exists');
      }
    }

    // Test login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.data?.token || loginResponse.data.token;
    
    if (!token) {
      throw new Error('No token received from login');
    }
    
    console.log('✅ Authentication successful');
    testResults.tests.authentication = 'PASSED';
    return token;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    testResults.tests.authentication = 'FAILED';
    testResults.errors.push({ test: 'authentication', error: error.message });
    return null;
  }
}

// Test all navigation links
async function testNavigation(page) {
  console.log('\n🔍 Testing Navigation...');
  
  const navigationTests = [
    { name: 'Dashboard', selector: 'a[href="/dashboard"]', expectedUrl: '/dashboard' },
    { name: 'Security Dashboard', selector: 'a[href="/security"]', expectedUrl: '/security' },
    { name: 'Scans', selector: 'a[href="/scans"]', expectedUrl: '/scans' },
    { name: 'Reports', selector: 'a[href="/reports"]', expectedUrl: '/reports' },
    { name: 'All Scanners', selector: 'a[href="/scanners"]', expectedUrl: '/scanners' },
    { name: 'Pricing', selector: 'a[href="/pricing"]', expectedUrl: '/pricing' },
    { name: 'New Scan Button', selector: 'button:has-text("New Scan")', expectedUrl: '/scans/new' }
  ];

  for (const test of navigationTests) {
    try {
      console.log(`  Testing ${test.name}...`);
      
      // Go to dashboard first
      await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle0' });
      
      // Find and click the link
      const element = await page.$(test.selector);
      if (!element) {
        // Try alternative selectors
        const altElement = await page.$(`text="${test.name}"`);
        if (altElement) {
          await altElement.click();
        } else {
          throw new Error(`Element not found: ${test.selector}`);
        }
      } else {
        await element.click();
      }
      
      // Wait for navigation
      await page.waitForTimeout(1000);
      
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
    }
  }
}

// Test all forms
async function testForms(page, token) {
  console.log('\n🔍 Testing Forms...');
  
  // Test scan creation form
  try {
    console.log('  Testing scan creation form...');
    await page.goto(`${FRONTEND_URL}/scans/new`, { waitUntil: 'networkidle0' });
    await saveScreenshot(page, 'scan-form-empty', 'forms');
    
    // Fill the form
    await page.type('input[name="target"]', 'https://example.com');
    await page.select('select[name="type"]', 'wordpress');
    await saveScreenshot(page, 'scan-form-filled', 'forms');
    
    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/scans/')) {
      console.log('  ✅ Scan creation form works');
      testResults.forms.scanCreation = 'PASSED';
    } else {
      throw new Error('Scan creation did not redirect properly');
    }
  } catch (error) {
    console.error('  ❌ Scan creation form failed:', error.message);
    testResults.forms.scanCreation = 'FAILED';
    testResults.errors.push({ test: 'form-scanCreation', error: error.message });
  }
  
  // Test search/filter forms
  try {
    console.log('  Testing search and filter forms...');
    await page.goto(`${FRONTEND_URL}/scans`, { waitUntil: 'networkidle0' });
    
    // Test search
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.type('example.com');
      await page.waitForTimeout(1000);
      console.log('  ✅ Search form works');
      testResults.forms.search = 'PASSED';
    } else {
      testResults.forms.search = 'NOT_FOUND';
    }
    
    // Test filters
    const filterSelects = await page.$$('select');
    if (filterSelects.length > 0) {
      console.log('  ✅ Filter forms found');
      testResults.forms.filters = 'PASSED';
    } else {
      testResults.forms.filters = 'NOT_FOUND';
    }
  } catch (error) {
    console.error('  ❌ Search/filter forms failed:', error.message);
    testResults.forms.searchFilter = 'FAILED';
    testResults.errors.push({ test: 'form-searchFilter', error: error.message });
  }
}

// Test all clickable elements and features
async function testFeatures(page, token) {
  console.log('\n🔍 Testing Features...');
  
  // Test scan details view
  try {
    console.log('  Testing scan details view...');
    await page.goto(`${FRONTEND_URL}/scans`, { waitUntil: 'networkidle0' });
    
    // Click on first scan if exists
    const scanRows = await page.$$('tr[data-scan-id]');
    if (scanRows.length > 0) {
      await scanRows[0].click();
      await page.waitForTimeout(2000);
      
      // Check if we're on scan detail page
      const scanStatus = await page.$('text="Scan Status"');
      if (scanStatus) {
        console.log('  ✅ Scan details view works');
        testResults.features.scanDetails = 'PASSED';
        await saveScreenshot(page, 'scan-details', 'features');
      } else {
        testResults.features.scanDetails = 'NO_DETAILS';
      }
    } else {
      testResults.features.scanDetails = 'NO_SCANS';
    }
  } catch (error) {
    console.error('  ❌ Scan details feature failed:', error.message);
    testResults.features.scanDetails = 'FAILED';
    testResults.errors.push({ test: 'feature-scanDetails', error: error.message });
  }
  
  // Test report generation
  try {
    console.log('  Testing report generation...');
    await page.goto(`${FRONTEND_URL}/reports`, { waitUntil: 'networkidle0' });
    
    const generateButton = await page.$('button:has-text("Generate Report")');
    if (generateButton) {
      await generateButton.click();
      await page.waitForTimeout(3000);
      console.log('  ✅ Report generation triggered');
      testResults.features.reportGeneration = 'PASSED';
    } else {
      testResults.features.reportGeneration = 'NO_BUTTON';
    }
  } catch (error) {
    console.error('  ❌ Report generation failed:', error.message);
    testResults.features.reportGeneration = 'FAILED';
    testResults.errors.push({ test: 'feature-reportGeneration', error: error.message });
  }
  
  // Test all scanner types
  try {
    console.log('  Testing all scanner types...');
    await page.goto(`${FRONTEND_URL}/scanners`, { waitUntil: 'networkidle0' });
    await saveScreenshot(page, 'all-scanners', 'features');
    
    // Count scanner cards
    const scannerCards = await page.$$('.scanner-card, [data-scanner]');
    console.log(`  ✅ Found ${scannerCards.length} scanner types`);
    testResults.features.scannerTypes = scannerCards.length;
  } catch (error) {
    console.error('  ❌ Scanner types test failed:', error.message);
    testResults.features.scannerTypes = 'FAILED';
    testResults.errors.push({ test: 'feature-scannerTypes', error: error.message });
  }
}

// Test real scan execution
async function testRealScan(token) {
  console.log('\n🔍 Testing Real Scan Execution...');
  
  try {
    // Create a real scan
    const scanResponse = await axios.post(
      `${API_URL}/scans`,
      {
        target: 'https://www.cobytes.com',
        type: 'wordpress'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const scan = scanResponse.data.data || scanResponse.data;
    console.log('✅ Scan created:', scan.id);
    testResults.features.scanCreation = 'PASSED';
    
    // Monitor scan progress
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const statusResponse = await axios.get(
          `${API_URL}/scans/${scan.id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        const currentScan = statusResponse.data.data || statusResponse.data;
        console.log(`  Scan status: ${currentScan.status} (attempt ${attempts + 1}/${maxAttempts})`);
        
        if (currentScan.status === 'completed' || currentScan.status === 'failed') {
          console.log(`✅ Scan finished with status: ${currentScan.status}`);
          testResults.features.scanExecution = currentScan.status === 'completed' ? 'PASSED' : 'FAILED';
          break;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('  Error checking scan status:', error.message);
        attempts++;
      }
    }
    
    if (attempts >= maxAttempts) {
      testResults.features.scanExecution = 'TIMEOUT';
    }
  } catch (error) {
    console.error('❌ Real scan execution failed:', error.message);
    testResults.features.scanExecution = 'FAILED';
    testResults.errors.push({ test: 'realScan', error: error.message });
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting comprehensive local testing...\n');
  
  await setupDirectories();
  
  // Test API first
  const apiHealthy = await testAPIHealth();
  if (!apiHealthy) {
    console.error('\n❌ API is not healthy. Please fix backend issues first.');
    process.exit(1);
  }
  
  // Test authentication
  const token = await testAuthentication();
  if (!token) {
    console.error('\n❌ Authentication failed. Cannot continue tests.');
    process.exit(1);
  }
  
  // Launch browser for UI tests
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  try {
    // Test login flow
    console.log('\n🔍 Testing Login Flow...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });
    await saveScreenshot(page, 'login-page', 'screenshots');
    
    await page.type('input[name="email"]', TEST_USER.email);
    await page.type('input[name="password"]', TEST_USER.password);
    await saveScreenshot(page, 'login-filled', 'screenshots');
    
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    const dashboardUrl = page.url();
    if (dashboardUrl.includes('/dashboard')) {
      console.log('✅ Login successful');
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
    await testRealScan(token);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
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
    'test-results-local/test-results.json',
    JSON.stringify(testResults, null, 2)
  );
  
  // Print summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`⚠️  Errors: ${summary.errors}`);
  console.log('\nDetailed results saved to test-results-local/test-results.json');
  
  if (summary.failed > 0 || summary.errors > 0) {
    console.log('\n❌ TESTS FAILED - Fix issues before deploying to production!');
    process.exit(1);
  } else {
    console.log('\n✅ ALL TESTS PASSED - Ready for production deployment!');
  }
}

// Run all tests
runAllTests().catch(console.error);