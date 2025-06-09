const puppeteer = require('puppeteer');

async function testFixScanDemoAuth() {
  console.log('🔧 Fixing ScanDemo Authentication');
  console.log('=================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log(`Browser [${msg.type()}]:`, msg.text());
    });
    
    // First, let's login properly
    console.log('1️⃣ Logging in first...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
    
    await page.type('input[name="email"]', 'test@cobytes.com');
    await page.type('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    console.log('✅ Logged in successfully');
    
    // Now navigate to ScanDemo
    console.log('\n2️⃣ Navigating to ScanDemo page...');
    await page.goto('http://localhost:3002/scan-demo', { waitUntil: 'networkidle0' });
    
    // Wait for data to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check what's displayed now
    const pageData = await page.evaluate(() => {
      const result = {
        isAuthenticated: !!localStorage.getItem('token'),
        hasNoScansMessage: false,
        scanCards: [],
        findings: [],
        stats: {}
      };
      
      // Check authentication
      result.token = localStorage.getItem('token') ? 'Present' : 'Missing';
      
      // Check for no scans message
      const noScansEl = document.querySelector('h6');
      if (noScansEl && noScansEl.textContent.includes('No Completed Scans')) {
        result.hasNoScansMessage = true;
      }
      
      // Get scan cards
      const cards = document.querySelectorAll('[class*="MuiCard"][class*="cursor-pointer"]');
      cards.forEach(card => {
        const target = card.querySelector('[class*="subtitle1"]')?.textContent;
        const findings = card.querySelector('[class*="body2"]')?.textContent;
        const type = card.querySelector('[class*="MuiChip"]')?.textContent;
        if (target) {
          result.scanCards.push({ target, findings, type });
        }
      });
      
      // Get findings/accordions
      const accordions = document.querySelectorAll('[class*="MuiAccordion"]');
      accordions.forEach(acc => {
        const title = acc.querySelector('[class*="subtitle1"]')?.textContent;
        const severity = acc.querySelector('[class*="body2"]')?.textContent;
        if (title) {
          result.findings.push({ title, severity });
        }
      });
      
      // Get statistics
      const statBoxes = document.querySelectorAll('[class*="MuiPaper"] h4');
      statBoxes.forEach((stat, i) => {
        const value = stat.textContent;
        const label = stat.nextElementSibling?.textContent;
        if (label) {
          result.stats[label] = value;
        }
      });
      
      return result;
    });
    
    console.log('\n📊 Page Analysis:');
    console.log('=================');
    console.log(`Authentication: ${pageData.isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}`);
    console.log(`Token: ${pageData.token}`);
    console.log(`Has "No Scans" message: ${pageData.hasNoScansMessage ? '❌ Yes' : '✅ No'}`);
    console.log(`Scan cards found: ${pageData.scanCards.length}`);
    console.log(`Findings displayed: ${pageData.findings.length}`);
    
    if (pageData.scanCards.length > 0) {
      console.log('\n📋 Available Scans:');
      pageData.scanCards.forEach((scan, i) => {
        console.log(`${i + 1}. ${scan.target}`);
        console.log(`   Type: ${scan.type}`);
        console.log(`   ${scan.findings}`);
      });
    }
    
    if (Object.keys(pageData.stats).length > 0) {
      console.log('\n📈 Statistics:');
      Object.entries(pageData.stats).forEach(([label, value]) => {
        console.log(`   ${label}: ${value}`);
      });
    }
    
    if (pageData.findings.length > 0) {
      console.log('\n🔍 Findings (first 5):');
      pageData.findings.slice(0, 5).forEach((finding, i) => {
        console.log(`${i + 1}. ${finding.title}`);
        console.log(`   ${finding.severity}`);
      });
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'scan-demo-authenticated.png', 
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved: scan-demo-authenticated.png');
    
    // If we have scans, click on one
    if (pageData.scanCards.length > 0 && !pageData.hasNoScansMessage) {
      console.log('\n3️⃣ Clicking on first scan card...');
      const firstCard = await page.$('[class*="MuiCard"][class*="cursor-pointer"]');
      if (firstCard) {
        await firstCard.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check results after click
        const afterClick = await page.evaluate(() => {
          const accordions = document.querySelectorAll('[class*="MuiAccordion"]');
          return accordions.length;
        });
        
        console.log(`✅ After clicking: ${afterClick} findings visible`);
        
        await page.screenshot({ 
          path: 'scan-demo-with-results.png', 
          fullPage: true 
        });
        console.log('📸 Screenshot saved: scan-demo-with-results.png');
      }
    }
    
    console.log('\n✅ Test completed!');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testFixScanDemoAuth().catch(console.error);