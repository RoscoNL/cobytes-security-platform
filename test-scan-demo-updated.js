const puppeteer = require('puppeteer');
const axios = require('axios');

async function testScanDemoPage() {
  console.log('🧪 Testing updated ScanDemo page...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Login first
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'test@cobytes.com');
    await page.type('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Logged in successfully');
    
    // Navigate to ScanDemo page
    console.log('📄 Navigating to ScanDemo page...');
    await page.goto('http://localhost:3002/scan-demo', { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: '/Users/jeroenvanrossum/Documents/Claude/cobytes-security-platform/scan-demo-updated.png',
      fullPage: true
    });
    
    // Check page content
    const pageText = await page.evaluate(() => document.body.textContent);
    
    // Check if "No Demo Data Available" message is gone
    const hasNoDataMessage = pageText.includes('No Demo Data Available');
    console.log(`❓ "No Demo Data Available" message: ${hasNoDataMessage ? '❌ Still present' : '✅ Removed'}`);
    
    // Check for completed scans
    const hasCompletedScans = pageText.includes('completed') || pageText.includes('Completed');
    console.log(`📊 Shows completed scans: ${hasCompletedScans ? '✅ Yes' : '❌ No'}`);
    
    // Check for specific security findings from our demo data
    const hasSecurityHeaders = pageText.includes('Missing Security Headers');
    const hasSSLIssue = pageText.includes('SSL Certificate Issue');
    const hasSQLInjection = pageText.includes('SQL Injection Potential');
    
    console.log('🔍 Checking for specific demo findings:');
    console.log(`   - Missing Security Headers: ${hasSecurityHeaders ? '✅ Found' : '❌ Missing'}`);
    console.log(`   - SSL Certificate Issue: ${hasSSLIssue ? '✅ Found' : '❌ Missing'}`);
    console.log(`   - SQL Injection Potential: ${hasSQLInjection ? '✅ Found' : '❌ Missing'}`);
    
    // Check for severity indicators
    const hasCritical = pageText.includes('critical');
    const hasHigh = pageText.includes('high');
    const hasMedium = pageText.includes('medium');
    const hasLow = pageText.includes('low');
    
    console.log('🚨 Severity indicators found:');
    console.log(`   - Critical: ${hasCritical ? '✅' : '❌'}`);
    console.log(`   - High: ${hasHigh ? '✅' : '❌'}`);
    console.log(`   - Medium: ${hasMedium ? '✅' : '❌'}`);
    console.log(`   - Low: ${hasLow ? '✅' : '❌'}`);
    
    console.log('📸 Screenshot saved as scan-demo-updated.png');
    
    return {
      noDataMessageRemoved: !hasNoDataMessage,
      hasCompletedScans,
      hasSpecificFindings: hasSecurityHeaders && hasSSLIssue && hasSQLInjection,
      hasSeverityIndicators: hasCritical || hasHigh || hasMedium || hasLow
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testScanDemoPage().then(result => {
  if (result) {
    console.log('\n📋 Test Results Summary:');
    console.log(`   - No Data message removed: ${result.noDataMessageRemoved ? '✅' : '❌'}`);
    console.log(`   - Shows completed scans: ${result.hasCompletedScans ? '✅' : '❌'}`);
    console.log(`   - Has specific demo findings: ${result.hasSpecificFindings ? '✅' : '❌'}`);
    console.log(`   - Has severity indicators: ${result.hasSeverityIndicators ? '✅' : '❌'}`);
    
    const success = result.noDataMessageRemoved && result.hasCompletedScans && result.hasSpecificFindings;
    console.log(`\n🎯 Overall: ${success ? '✅ SUCCESS - ScanDemo now shows real data!' : '❌ NEEDS WORK'}`);
  }
}).catch(console.error);