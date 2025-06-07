const puppeteer = require('puppeteer');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const TEST_TARGETS = {
  wordpress: 'https://www.cobytes.com',
  generic: 'example.com',
  ip: '192.168.1.1'
};

// Scanner configurations to test
const SCANNERS_TO_TEST = [
  { id: 270, name: 'WordPress Scanner', target: TEST_TARGETS.wordpress },
  { id: 20, name: 'Subdomain Finder', target: TEST_TARGETS.generic },
  { id: 170, name: 'Website Scanner', target: TEST_TARGETS.wordpress },
  { id: 450, name: 'SSL Scanner', target: TEST_TARGETS.generic },
  { id: 90, name: 'URL Fuzzer', target: TEST_TARGETS.wordpress },
  { id: 310, name: 'Website Recon', target: TEST_TARGETS.wordpress },
  { id: 500, name: 'WAF Detector', target: TEST_TARGETS.wordpress },
  { id: 70, name: 'TCP Port Scanner', target: TEST_TARGETS.generic },
  { id: 160, name: 'Virtual Host Finder', target: TEST_TARGETS.generic }
];

async function testScanners() {
  console.log('🚀 Starting scanner tests with Puppeteer...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/automated testing
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('PAGE ERROR:', msg.text());
      } else if (msg.text().includes('scan') || msg.text().includes('Scan')) {
        console.log('PAGE LOG:', msg.text());
      }
    });

    // Navigate to the all scanners page
    console.log('📍 Navigating to All Scanners page...');
    await page.goto(`${FRONTEND_URL}/all-scanners-new`, { waitUntil: 'networkidle2' });
    
    // Wait for scanners to load
    await page.waitForSelector('[role="button"]', { timeout: 10000 });
    
    const results = [];
    
    // Test each scanner
    for (const scanner of SCANNERS_TO_TEST) {
      console.log(`\n🔍 Testing ${scanner.name} (ID: ${scanner.id})...`);
      
      try {
        // Find and click the scanner card by looking for the Tool ID chip
        const scannerCard = await page.evaluateHandle((scannerId) => {
          const chips = Array.from(document.querySelectorAll('.MuiChip-label'));
          const chip = chips.find(c => c.textContent === `Tool ID: ${scannerId}`);
          if (chip) {
            return chip.closest('.MuiCard-root');
          }
          return null;
        }, scanner.id);

        if (!scannerCard || await scannerCard.evaluate(el => !el)) {
          console.error(`❌ Scanner card not found for ID ${scanner.id}`);
          results.push({ scanner: scanner.name, status: 'NOT_FOUND', error: 'Scanner card not found' });
          continue;
        }

        // Click the scanner card
        await scannerCard.click();
        
        // Wait for dialog to open
        await page.waitForSelector('.MuiDialog-root', { timeout: 5000 });
        
        // Enter target
        const targetInput = await page.$('input[label="Target"]');
        if (targetInput) {
          await targetInput.click({ clickCount: 3 }); // Select all
          await targetInput.type(scanner.target);
        }
        
        // Click Start Scan button
        const startButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(b => b.textContent === 'Start Scan');
        });
        
        if (startButton) {
          console.log('  ⏳ Starting scan...');
          await startButton.click();
          
          // Wait for scan to start (progress bar appears)
          try {
            await page.waitForSelector('.MuiLinearProgress-root', { timeout: 10000 });
            console.log('  ✅ Scan started successfully!');
            
            // Wait a bit to see if there are any immediate errors
            await page.waitForTimeout(3000);
            
            // Check for errors
            const errorAlert = await page.$('.MuiAlert-standardError');
            if (errorAlert) {
              const errorText = await errorAlert.evaluate(el => el.textContent);
              console.error(`  ❌ Scan error: ${errorText}`);
              results.push({ scanner: scanner.name, status: 'ERROR', error: errorText });
            } else {
              // Check if scan is progressing
              const progressText = await page.$eval('.MuiTypography-caption', el => el.textContent).catch(() => null);
              console.log(`  📊 Progress: ${progressText || 'In progress'}`);
              results.push({ scanner: scanner.name, status: 'SUCCESS', progress: progressText });
            }
            
          } catch (error) {
            console.error(`  ❌ Scan failed to start: ${error.message}`);
            results.push({ scanner: scanner.name, status: 'FAILED', error: error.message });
          }
        }
        
        // Close dialog
        const closeButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(b => b.textContent === 'Close');
        });
        if (closeButton) {
          await closeButton.click();
          await page.waitForTimeout(500); // Wait for dialog to close
        }
        
      } catch (error) {
        console.error(`❌ Error testing ${scanner.name}: ${error.message}`);
        results.push({ scanner: scanner.name, status: 'ERROR', error: error.message });
      }
    }
    
    // Print summary
    console.log('\n📋 TEST SUMMARY:');
    console.log('================');
    results.forEach(result => {
      const icon = result.status === 'SUCCESS' ? '✅' : result.status === 'ERROR' ? '❌' : '⚠️';
      console.log(`${icon} ${result.scanner}: ${result.status}${result.error ? ` - ${result.error}` : ''}`);
    });
    
    const successCount = results.filter(r => r.status === 'SUCCESS').length;
    console.log(`\n🎯 Success rate: ${successCount}/${results.length} scanners`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n👀 Browser will remain open for inspection. Press Ctrl+C to exit.');
    // await browser.close();
  }
}

// Run the tests
testScanners().catch(console.error);