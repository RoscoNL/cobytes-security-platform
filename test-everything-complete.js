const puppeteer = require('puppeteer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Create test results directory
const testResultsDir = path.join(__dirname, 'complete-test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test configuration
const BACKEND_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:3002';
const TEST_USER = {
  email: 'admin@cobytes.com',
  password: 'admin123'
};

// Scans to create
const SCAN_CONFIGS = [
  {
    name: 'WordPress Scan',
    target: 'https://www.cobytes.com',
    type: 'wordpress',
    description: 'WordPress vulnerability scan for Cobytes website'
  },
  {
    name: 'SSL/TLS Scan', 
    target: 'https://www.google.com',
    type: 'ssl',
    description: 'SSL/TLS configuration analysis'
  },
  {
    name: 'Website Security Scan',
    target: 'https://example.com',
    type: 'website',
    description: 'Comprehensive website security scan'
  }
];

async function runCompleteTest() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const testResults = {
    navigation: {},
    scans: {},
    scanProgress: {},
    reports: {},
    errors: []
  };

  try {
    const page = await browser.newPage();
    
    // Capture errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.errors.push({
          type: 'console',
          message: msg.text()
        });
      }
    });

    console.log('🚀 Starting complete platform test...\n');

    // Step 1: Login
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Set auth in browser
    await page.evaluateOnNewDocument((token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: 'user_1',
        email: 'admin@cobytes.com',
        name: 'Admin User',
        role: 'admin'
      }));
    }, token);

    // Step 2: Test all navigation links
    console.log('2️⃣ Testing navigation links...');
    const routes = [
      '/dashboard',
      '/scans',
      '/scans/new',
      '/reports',
      '/security-dashboard',
      '/all-scanners',
      '/products',
      '/cart',
      '/orders'
    ];

    for (const route of routes) {
      await page.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'networkidle0' });
      await delay(1000);
      
      const is404 = await page.evaluate(() => {
        return document.body.textContent.includes('404') || 
               document.body.textContent.includes('Page Not Found');
      });
      
      testResults.navigation[route] = is404 ? 'FAILED - 404' : 'PASSED';
      console.log(`${is404 ? '❌' : '✅'} ${route}`);
      
      await page.screenshot({ 
        path: path.join(testResultsDir, `nav-${route.replace(/\//g, '-')}.png`),
        fullPage: true 
      });
    }

    console.log('\n3️⃣ Creating 3 different scans...');
    const createdScans = [];

    for (const scanConfig of SCAN_CONFIGS) {
      console.log(`\nCreating ${scanConfig.name}...`);
      
      // Create scan via API for reliability
      try {
        const scanResponse = await axios.post(
          `${BACKEND_URL}/scans`,
          {
            target: scanConfig.target,
            type: scanConfig.type
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (scanResponse.data.success) {
          const scan = scanResponse.data.data;
          console.log(`✅ Created - ID: ${scan.id}, Status: ${scan.status}`);
          createdScans.push({
            ...scanConfig,
            ...scan
          });
          testResults.scans[scanConfig.name] = {
            status: 'CREATED',
            id: scan.id,
            pentestToolsId: scan.pentest_tools_scan_id
          };
        }
      } catch (error) {
        console.log(`❌ Failed to create: ${error.response?.data?.message || error.message}`);
        testResults.scans[scanConfig.name] = {
          status: 'FAILED',
          error: error.message
        };
      }
    }

    // Step 4: Monitor scan progress
    if (createdScans.length > 0) {
      console.log('\n4️⃣ Monitoring scan progress...');
      console.log('Checking every 10 seconds...\n');
      
      let checkCount = 0;
      const maxChecks = 60; // 10 minutes max
      let allComplete = false;

      while (!allComplete && checkCount < maxChecks) {
        checkCount++;
        allComplete = true;
        
        console.log(`[Check ${checkCount}/${maxChecks}]`);
        
        for (const scan of createdScans) {
          try {
            const statusResponse = await axios.get(
              `${BACKEND_URL}/scans/${scan.id}`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            
            const scanData = statusResponse.data.data;
            const progress = scanData.progress || 0;
            const status = scanData.status;
            
            console.log(`${scan.name}: ${status} (${progress}%)`);
            
            testResults.scanProgress[scan.name] = {
              status: status,
              progress: progress,
              resultsCount: scanData.results?.length || 0
            };
            
            if (status !== 'completed' && status !== 'failed') {
              allComplete = false;
            }
            
          } catch (error) {
            console.log(`${scan.name}: Error - ${error.message}`);
          }
        }
        
        if (!allComplete) {
          await delay(10000); // Wait 10 seconds
        }
      }
      
      console.log('\n5️⃣ Testing scan detail pages...');
      for (const scan of createdScans) {
        await page.goto(`${FRONTEND_URL}/scans/${scan.id}`, { waitUntil: 'networkidle0' });
        await delay(2000);
        
        const is404 = await page.evaluate(() => {
          return document.body.textContent.includes('404');
        });
        
        console.log(`${is404 ? '❌' : '✅'} Scan ${scan.id} detail page`);
        
        await page.screenshot({
          path: path.join(testResultsDir, `scan-detail-${scan.id}.png`),
          fullPage: true
        });
      }
      
      console.log('\n6️⃣ Generating PDF reports...');
      for (const scan of createdScans) {
        try {
          // First check if backend is compiled
          await axios.get(`${BACKEND_URL}/health`);
          
          // Try to generate PDF
          const reportResponse = await axios.post(
            `${BACKEND_URL}/scans/${scan.id}/report`,
            { format: 'pdf' },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              responseType: 'arraybuffer',
              validateStatus: function (status) {
                return status < 500; // Accept any status < 500
              }
            }
          );
          
          if (reportResponse.status === 200) {
            const pdfPath = path.join(testResultsDir, `report-${scan.id}.pdf`);
            fs.writeFileSync(pdfPath, reportResponse.data);
            console.log(`✅ ${scan.name} - PDF saved`);
            testResults.reports[scan.name] = 'PDF_GENERATED';
          } else {
            // Fallback to JSON
            const jsonResponse = await axios.get(
              `${BACKEND_URL}/scans/${scan.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const jsonPath = path.join(testResultsDir, `report-${scan.id}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(jsonResponse.data.data, null, 2));
            console.log(`⚠️  ${scan.name} - JSON saved (PDF not available)`);
            testResults.reports[scan.name] = 'JSON_FALLBACK';
          }
        } catch (error) {
          console.log(`❌ ${scan.name} - Failed: ${error.message}`);
          testResults.reports[scan.name] = 'FAILED';
        }
      }
    }

    // Generate summary
    const summary = `
COBYTES SECURITY PLATFORM - COMPLETE TEST RESULTS
================================================
Date: ${new Date().toLocaleString()}

NAVIGATION TEST RESULTS
----------------------
${Object.entries(testResults.navigation)
  .map(([route, status]) => `${status === 'PASSED' ? '✅' : '❌'} ${route}: ${status}`)
  .join('\n')}

SCAN CREATION RESULTS
--------------------
${Object.entries(testResults.scans)
  .map(([name, result]) => `${result.status === 'CREATED' ? '✅' : '❌'} ${name}: ${result.status} ${result.id ? `(ID: ${result.id})` : ''}`)
  .join('\n')}

SCAN PROGRESS
-------------
${Object.entries(testResults.scanProgress)
  .map(([name, progress]) => `${name}: ${progress.status} (${progress.progress}%) - ${progress.resultsCount} findings`)
  .join('\n')}

REPORT GENERATION
----------------
${Object.entries(testResults.reports)
  .map(([name, status]) => `${status.includes('GENERATED') ? '✅' : '❌'} ${name}: ${status}`)
  .join('\n')}

ERRORS DETECTED
--------------
${testResults.errors.length === 0 ? 'No console errors detected' : 
  testResults.errors.map(e => `- ${e.type}: ${e.message}`).join('\n')}

SUMMARY
-------
✅ Passed: ${Object.values(testResults.navigation).filter(s => s === 'PASSED').length + 
             Object.values(testResults.scans).filter(s => s.status === 'CREATED').length +
             Object.values(testResults.reports).filter(s => s.includes('GENERATED')).length}
❌ Failed: ${Object.values(testResults.navigation).filter(s => s !== 'PASSED').length +
             Object.values(testResults.scans).filter(s => s.status !== 'CREATED').length +
             Object.values(testResults.reports).filter(s => !s.includes('GENERATED')).length}

Test results saved to: ${testResultsDir}
`;

    console.log(summary);
    
    // Save results
    fs.writeFileSync(
      path.join(testResultsDir, 'test-results.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    fs.writeFileSync(
      path.join(testResultsDir, 'test-summary.txt'),
      summary
    );

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    testResults.errors.push({
      type: 'fatal',
      message: error.message
    });
  } finally {
    await browser.close();
  }
}

// Run the test
console.log('🔧 Cobytes Security Platform - Complete Test Suite\n');
runCompleteTest().catch(console.error);