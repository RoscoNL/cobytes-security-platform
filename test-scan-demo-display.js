const puppeteer = require('puppeteer');

async function testScanDemoDisplay() {
  console.log('🔍 Testing ScanDemo Page Display');
  console.log('================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Error:', msg.text());
      }
    });
    
    // Navigate to ScanDemo page
    console.log('📄 Navigating to ScanDemo page...');
    await page.goto('http://localhost:3002/scan-demo', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check what's displayed
    const pageAnalysis = await page.evaluate(() => {
      const result = {
        hasNoScansMessage: false,
        hasCompletedScans: false,
        scanCount: 0,
        resultCount: 0,
        errors: [],
        scanDetails: []
      };
      
      // Check for "No Completed Scans" message
      const noScansText = document.querySelector('h6');
      if (noScansText && noScansText.textContent.includes('No Completed Scans')) {
        result.hasNoScansMessage = true;
      }
      
      // Check for scan cards
      const scanCards = document.querySelectorAll('[class*="MuiCard"]');
      result.scanCount = scanCards.length;
      
      // Check for results/findings
      const accordions = document.querySelectorAll('[class*="MuiAccordion"]');
      result.resultCount = accordions.length;
      
      // Get scan details if available
      scanCards.forEach((card, index) => {
        const targetText = card.querySelector('[class*="MuiTypography"][variant="subtitle1"]')?.textContent;
        const findingsText = card.querySelector('[class*="MuiTypography"][variant="body2"]')?.textContent;
        if (targetText) {
          result.scanDetails.push({
            target: targetText,
            findings: findingsText || 'No findings info'
          });
        }
      });
      
      // Check for any error messages
      const alerts = document.querySelectorAll('[class*="MuiAlert"]');
      alerts.forEach(alert => {
        if (alert.textContent) {
          result.errors.push(alert.textContent);
        }
      });
      
      result.hasCompletedScans = result.scanCount > 0 && !result.hasNoScansMessage;
      
      return result;
    });
    
    console.log('\n📊 ScanDemo Page Analysis:');
    console.log('==========================');
    console.log(`Has "No Scans" message: ${pageAnalysis.hasNoScansMessage ? '❌ Yes' : '✅ No'}`);
    console.log(`Has completed scans: ${pageAnalysis.hasCompletedScans ? '✅ Yes' : '❌ No'}`);
    console.log(`Number of scan cards: ${pageAnalysis.scanCount}`);
    console.log(`Number of results shown: ${pageAnalysis.resultCount}`);
    
    if (pageAnalysis.scanDetails.length > 0) {
      console.log('\n📋 Visible Scans:');
      pageAnalysis.scanDetails.forEach((scan, i) => {
        console.log(`${i + 1}. ${scan.target} - ${scan.findings}`);
      });
    }
    
    if (pageAnalysis.errors.length > 0) {
      console.log('\n⚠️ Errors/Alerts:');
      pageAnalysis.errors.forEach(err => console.log(`   - ${err}`));
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'scan-demo-current-state.png', 
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved: scan-demo-current-state.png');
    
    // Check console for errors
    const consoleErrors = await page.evaluate(() => {
      const logs = [];
      // Check if there were any API errors
      return logs;
    });
    
    // Try clicking on a scan if available
    if (pageAnalysis.hasCompletedScans && pageAnalysis.scanCount > 0) {
      console.log('\n🖱️ Clicking on first scan card...');
      await page.click('[class*="MuiCard"]:first-child');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if results are now visible
      const resultsVisible = await page.evaluate(() => {
        const accordions = document.querySelectorAll('[class*="MuiAccordion"]');
        const resultStats = document.querySelectorAll('[class*="MuiPaper"] h4');
        return {
          accordionCount: accordions.length,
          hasStats: resultStats.length > 0
        };
      });
      
      console.log(`\n📊 After clicking scan:`);
      console.log(`   Accordions visible: ${resultsVisible.accordionCount}`);
      console.log(`   Statistics shown: ${resultsVisible.hasStats ? 'Yes' : 'No'}`);
    }
    
    console.log('\n✅ Test completed! Browser will remain open for inspection.');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testScanDemoDisplay().catch(console.error);