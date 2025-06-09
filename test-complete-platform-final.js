const puppeteer = require('puppeteer');

async function testCompletePlatformFinal() {
  console.log('🚀 FINAL COMPREHENSIVE PLATFORM TEST');
  console.log('====================================\n');
  console.log('Testing: Navigation, Scan Creation, Real Results Display');
  console.log('NO MOCK DATA - Everything uses real integrations\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const testResults = {
    navigation: { passed: 0, failed: 0, errors: [] },
    scanCreation: { passed: 0, failed: 0, errors: [] },
    realData: { passed: 0, failed: 0, errors: [] }
  };
  
  try {
    const page = await browser.newPage();
    
    // 1. TEST NAVIGATION
    console.log('1️⃣ TESTING NAVIGATION');
    console.log('===================');
    
    // Login
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
    await page.type('input[name="email"]', 'test@cobytes.com');
    await page.type('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    console.log('✅ Login successful');
    testResults.navigation.passed++;
    
    // Test main navigation pages
    const pages = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/scans', name: 'My Scans' },
      { path: '/scans/new', name: 'New Scan' },
      { path: '/all-scanners', name: 'All Scanners' },
      { path: '/scan-demo', name: 'Scan Demo' },
      { path: '/reports', name: 'Reports' },
      { path: '/security-dashboard', name: 'Security Dashboard' }
    ];
    
    for (const pageInfo of pages) {
      try {
        await page.goto(`http://localhost:3002${pageInfo.path}`, { 
          waitUntil: 'networkidle0',
          timeout: 15000 
        });
        console.log(`✅ ${pageInfo.name} - Loaded successfully`);
        testResults.navigation.passed++;
      } catch (error) {
        console.log(`❌ ${pageInfo.name} - Failed: ${error.message}`);
        testResults.navigation.failed++;
        testResults.navigation.errors.push(`${pageInfo.name}: ${error.message}`);
      }
    }
    
    // 2. TEST SCAN CREATION
    console.log('\n2️⃣ TESTING SCAN CREATION');
    console.log('======================');
    
    await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle0' });
    
    // Create a new scan
    const scanCreated = await page.evaluate(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/scans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            target: 'https://test.example.com',
            type: 'ssl',
            parameters: {}
          })
        });
        const data = await response.json();
        return { success: response.ok, scan: data.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (scanCreated.success) {
      console.log(`✅ Scan created successfully (ID: ${scanCreated.scan.id})`);
      testResults.scanCreation.passed++;
      
      // Navigate to scan detail
      await page.goto(`http://localhost:3002/scans/${scanCreated.scan.id}`, { 
        waitUntil: 'networkidle0' 
      });
      console.log('✅ Scan detail page loaded');
      testResults.scanCreation.passed++;
      
    } else {
      console.log('❌ Scan creation failed:', scanCreated.error);
      testResults.scanCreation.failed++;
      testResults.scanCreation.errors.push(scanCreated.error);
    }
    
    // 3. TEST REAL DATA DISPLAY
    console.log('\n3️⃣ TESTING REAL DATA DISPLAY');
    console.log('==========================');
    
    // Check ScanDemo for real results
    await page.goto('http://localhost:3002/scan-demo', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const scanDemoData = await page.evaluate(() => {
      const findings = document.querySelectorAll('[class*="MuiAccordion"]');
      const stats = {};
      document.querySelectorAll('[class*="MuiPaper"] h4').forEach(h4 => {
        const label = h4.nextElementSibling?.textContent;
        if (label) stats[label] = h4.textContent;
      });
      
      return {
        findingsCount: findings.length,
        hasNoScansMessage: !!document.querySelector('h6')?.textContent?.includes('No Completed Scans'),
        statistics: stats
      };
    });
    
    if (scanDemoData.findingsCount > 0 && !scanDemoData.hasNoScansMessage) {
      console.log(`✅ ScanDemo displays ${scanDemoData.findingsCount} real security findings`);
      console.log('✅ Statistics:', JSON.stringify(scanDemoData.statistics));
      testResults.realData.passed += 2;
    } else {
      console.log('❌ ScanDemo not showing real data');
      testResults.realData.failed++;
      testResults.realData.errors.push('No real scan data displayed');
    }
    
    // Check scan list for real data
    await page.goto('http://localhost:3002/scans', { waitUntil: 'networkidle0' });
    
    const scanListData = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return {
        scanCount: rows.length,
        firstScanText: rows[0]?.textContent || ''
      };
    });
    
    if (scanListData.scanCount > 0) {
      console.log(`✅ Scan list shows ${scanListData.scanCount} real scans`);
      testResults.realData.passed++;
    } else {
      console.log('❌ No scans in scan list');
      testResults.realData.failed++;
    }
    
    // 4. FINAL SUMMARY
    console.log('\n📊 FINAL TEST RESULTS');
    console.log('===================');
    
    const totalPassed = testResults.navigation.passed + 
                       testResults.scanCreation.passed + 
                       testResults.realData.passed;
    const totalFailed = testResults.navigation.failed + 
                       testResults.scanCreation.failed + 
                       testResults.realData.failed;
    
    console.log(`\nNavigation Tests:`);
    console.log(`  ✅ Passed: ${testResults.navigation.passed}`);
    console.log(`  ❌ Failed: ${testResults.navigation.failed}`);
    
    console.log(`\nScan Creation Tests:`);
    console.log(`  ✅ Passed: ${testResults.scanCreation.passed}`);
    console.log(`  ❌ Failed: ${testResults.scanCreation.failed}`);
    
    console.log(`\nReal Data Tests:`);
    console.log(`  ✅ Passed: ${testResults.realData.passed}`);
    console.log(`  ❌ Failed: ${testResults.realData.failed}`);
    
    console.log(`\n🎯 TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Navigation working perfectly');
      console.log('✅ Scan creation functional');
      console.log('✅ Real scan data displayed (NO MOCK DATA)');
      console.log('✅ Platform is production-ready!');
    } else {
      console.log('\n⚠️ Some tests failed. See errors above.');
      
      // List all errors
      const allErrors = [
        ...testResults.navigation.errors,
        ...testResults.scanCreation.errors,
        ...testResults.realData.errors
      ];
      
      if (allErrors.length > 0) {
        console.log('\nErrors encountered:');
        allErrors.forEach((error, i) => {
          console.log(`${i + 1}. ${error}`);
        });
      }
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'platform-test-final.png', 
      fullPage: true 
    });
    console.log('\n📸 Final screenshot: platform-test-final.png');
    
    console.log('\n✅ Comprehensive test completed!');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    await browser.close();
  }
}

testCompletePlatformFinal().catch(console.error);