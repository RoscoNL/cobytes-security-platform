const puppeteer = require('puppeteer');
const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const API_URL = 'http://localhost:3001/api';

async function testScanDemo() {
  console.log('🔍 Testing Scan Demo Functionality\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    slowMo: 100, // Slow down actions
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Test 1: Check API endpoints directly
    console.log('1️⃣ Testing API endpoints directly...');
    
    try {
      const healthResponse = await axios.get('http://localhost:3001/health');
      console.log('✅ Health endpoint:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health endpoint error:', error.response?.status, error.response?.data);
    }
    
    try {
      const scanTypesResponse = await axios.get(`${API_URL}/scans/scan-types`);
      console.log('✅ Scan types endpoint: Found', scanTypesResponse.data.data.length, 'scan types');
    } catch (error) {
      console.log('❌ Scan types endpoint error:', error.response?.status, error.response?.data);
    }
    
    // Test 2: Test scan demo page
    console.log('\n2️⃣ Testing scan demo page...');
    
    const page = await browser.newPage();
    
    // Log console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Log network errors
    page.on('requestfailed', request => {
      console.log('Request failed:', request.url(), request.failure());
    });
    
    await page.goto(`${BASE_URL}/scan-demo`, { waitUntil: 'networkidle2' });
    console.log('✅ Loaded scan demo page');
    
    // Wait for input field
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    console.log('✅ Found URL input field');
    
    // Enter URL
    await page.type('input[type="text"]', 'https://www.example.com');
    console.log('✅ Entered target URL');
    
    // Find and click start scan button
    const buttons = await page.$$('button');
    let scanButton = null;
    
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('Start Scan')) {
        scanButton = button;
        console.log('✅ Found Start Scan button');
        break;
      }
    }
    
    if (!scanButton) {
      throw new Error('Start Scan button not found');
    }
    
    // Click the button
    await scanButton.click();
    console.log('✅ Clicked Start Scan button');
    
    // Wait for scan to start
    await page.waitForSelector('.MuiLinearProgress-root', { timeout: 5000 });
    console.log('✅ Scan started, progress bar visible');
    
    // Wait for scan results or error
    const result = await Promise.race([
      page.waitForSelector('.MuiAlert-root.MuiAlert-standardSuccess', { timeout: 30000 }).then(() => 'success'),
      page.waitForSelector('.MuiAlert-root.MuiAlert-standardError', { timeout: 30000 }).then(() => 'error'),
      page.waitForSelector('[class*="CheckCircleOutlined"]', { timeout: 30000 }).then(() => 'completed')
    ]);
    
    console.log('✅ Scan finished with result:', result);
    
    // Take screenshot
    await page.screenshot({ path: 'test-scan-demo-result.png', fullPage: true });
    console.log('✅ Screenshot saved as test-scan-demo-result.png');
    
    // Test 3: Test free scan API directly
    console.log('\n3️⃣ Testing free scan API directly...');
    
    try {
      const freeScanResponse = await axios.post(`${API_URL}/scans/free`, {
        target: 'https://www.example.com',
        type: 'ssl'
      });
      
      console.log('✅ Created free scan:', freeScanResponse.data);
      
      // Poll for status
      const scanId = freeScanResponse.data.data.id;
      let attempts = 0;
      let scanComplete = false;
      
      while (attempts < 30 && !scanComplete) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const statusResponse = await axios.get(`${API_URL}/scans/free/${scanId}`);
          const scan = statusResponse.data.data;
          
          console.log(`   Scan progress: ${scan.progress}% (${scan.status})`);
          
          if (scan.status === 'completed' || scan.status === 'failed') {
            scanComplete = true;
            console.log('✅ Scan completed with status:', scan.status);
            if (scan.results) {
              console.log('   Results:', scan.results.length, 'findings');
            }
          }
        } catch (error) {
          console.log('   Error checking status:', error.message);
        }
        
        attempts++;
      }
      
      if (!scanComplete) {
        console.log('⚠️  Scan did not complete within timeout');
      }
      
    } catch (error) {
      console.log('❌ Free scan API error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testScanDemo()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });