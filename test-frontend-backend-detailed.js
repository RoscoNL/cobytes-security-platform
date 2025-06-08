const puppeteer = require('puppeteer');

async function testFrontendBackendConnection() {
  console.log('Starting Frontend-Backend Connection Test\n');
  console.log('=' . repeat(50));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Collect all console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      time: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR]:`, msg.text());
    }
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      time: new Date().toISOString()
    });
    console.log('[PAGE ERROR]:', error.message);
  });

  // Collect API requests and responses
  const apiRequests = [];
  const apiResponses = [];

  page.on('request', request => {
    if (request.url().includes('/api/')) {
      const requestInfo = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        time: new Date().toISOString()
      };
      apiRequests.push(requestInfo);
      console.log(`[API REQUEST] ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      let responseBody = null;
      try {
        responseBody = await response.text();
      } catch (e) {
        responseBody = 'Could not read response body';
      }

      const responseInfo = {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        body: responseBody,
        time: new Date().toISOString()
      };
      apiResponses.push(responseInfo);
      
      console.log(`[API RESPONSE] ${response.status()} ${response.url()}`);
      if (response.status() !== 200 && response.status() !== 204) {
        console.log('Response Headers:', response.headers());
        console.log('Response Body:', responseBody);
      }
    }
  });

  // Collect failed requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    if (request.url().includes('/api/')) {
      const failureInfo = {
        url: request.url(),
        reason: request.failure().errorText,
        time: new Date().toISOString()
      };
      failedRequests.push(failureInfo);
      console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
    }
  });

  try {
    console.log('\nNavigating to http://localhost:3002/products...\n');
    await page.goto('http://localhost:3002/products', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Page loaded successfully!\n');
    
    // Wait for potential API calls
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Generate report
    console.log('\n' + '=' . repeat(50));
    console.log('FRONTEND-BACKEND CONNECTION TEST REPORT');
    console.log('=' . repeat(50) + '\n');

    // Summary
    console.log('SUMMARY:');
    console.log(`- Products API calls made: ${apiRequests.filter(r => r.url.includes('/api/products')).length}`);
    console.log(`- Cart API calls made: ${apiRequests.filter(r => r.url.includes('/api/cart')).length}`);
    console.log(`- Total API calls: ${apiRequests.length}`);
    console.log(`- Failed requests: ${failedRequests.length}`);
    console.log(`- Page errors: ${pageErrors.length}`);
    console.log(`- Console errors: ${consoleLogs.filter(l => l.type === 'error').length}\n`);

    // API Call Details
    console.log('API CALLS DETAIL:');
    for (const response of apiResponses) {
      if (response.url.includes('/api/products') || response.url.includes('/api/cart')) {
        console.log(`\n${response.url}:`);
        console.log(`  Status: ${response.status} ${response.statusText}`);
        console.log(`  Time: ${response.time}`);
        
        if (response.status === 200) {
          try {
            const data = JSON.parse(response.body);
            console.log(`  Response: ${JSON.stringify(data).substring(0, 100)}...`);
          } catch (e) {
            console.log(`  Response: ${response.body.substring(0, 100)}...`);
          }
        }
      }
    }

    // Failed Requests
    if (failedRequests.length > 0) {
      console.log('\nFAILED REQUESTS:');
      failedRequests.forEach(req => {
        console.log(`- ${req.url}: ${req.reason}`);
      });
    }

    // Console Errors
    const consoleErrors = consoleLogs.filter(l => l.type === 'error');
    if (consoleErrors.length > 0) {
      console.log('\nCONSOLE ERRORS:');
      consoleErrors.forEach(err => {
        console.log(`- ${err.text}`);
      });
    }

    // Page Errors
    if (pageErrors.length > 0) {
      console.log('\nPAGE ERRORS:');
      pageErrors.forEach(err => {
        console.log(`- ${err.message}`);
      });
    }

    // CORS Check
    const corsIssues = apiResponses.filter(r => 
      r.status === 0 || 
      (r.headers['access-control-allow-origin'] !== '*' && 
       r.headers['access-control-allow-origin'] !== 'http://localhost:3002')
    );
    
    if (corsIssues.length > 0) {
      console.log('\nPOTENTIAL CORS ISSUES DETECTED!');
      console.log('Check the Access-Control-Allow-Origin headers.');
    }

    // Final verdict
    console.log('\n' + '=' . repeat(50));
    const hasSuccessfulProductsCall = apiResponses.some(r => 
      r.url.includes('/api/products') && r.status === 200
    );
    
    if (hasSuccessfulProductsCall) {
      console.log('✅ FRONTEND-BACKEND CONNECTION: WORKING');
      console.log('The frontend is successfully connecting to the backend API.');
    } else if (apiRequests.length > 0) {
      console.log('⚠️  FRONTEND-BACKEND CONNECTION: PARTIAL');
      console.log('API calls are being made but not all are successful.');
    } else {
      console.log('❌ FRONTEND-BACKEND CONNECTION: NOT WORKING');
      console.log('No API calls detected from the frontend.');
    }
    console.log('=' . repeat(50));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testFrontendBackendConnection().catch(console.error);