const puppeteer = require('puppeteer');

async function testScanDemoSimple() {
  console.log('🧪 Testing ScanDemo page without login...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
    timeout: 60000
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate directly to ScanDemo page
    console.log('📄 Navigating to ScanDemo page...');
    await page.goto('http://localhost:3002/scan-demo', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/jeroenvanrossum/Documents/Claude/cobytes-security-platform/scan-demo-simple.png',
      fullPage: true
    });
    
    // Get page content
    const pageText = await page.evaluate(() => document.body.textContent);
    
    console.log('📄 Page content check:');
    console.log(`   - Contains "Real Scan Results Demo": ${pageText.includes('Real Scan Results Demo') ? '✅' : '❌'}`);
    console.log(`   - Contains "No Demo Data Available": ${pageText.includes('No Demo Data Available') ? '❌ (old message)' : '✅ (removed)'}`);
    console.log(`   - Contains "No Completed Scans Available": ${pageText.includes('No Completed Scans Available') ? '⚠️ (empty state)' : '✅ (has data)'}`);
    console.log(`   - Contains "Available Completed Scans": ${pageText.includes('Available Completed Scans') ? '✅ (has scans)' : '❌ (no scans)'}`);
    console.log(`   - Contains security findings: ${pageText.includes('Missing Security Headers') || pageText.includes('SSL Certificate') ? '✅' : '❌'}`);
    
    // Log first part of page content for debugging
    console.log('\n📝 First 500 characters of page content:');
    console.log(pageText.substring(0, 500));
    
    console.log('\n📸 Screenshot saved as scan-demo-simple.png');
    
    // Keep browser open for 10 seconds to inspect
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testScanDemoSimple().catch(console.error);