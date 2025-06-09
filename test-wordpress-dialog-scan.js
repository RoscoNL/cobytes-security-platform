const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testWordPressScanWithDialog(baseUrl, environment) {
  console.log(`\n🔍 Testing WordPress scan on ${environment}: ${baseUrl}`);
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (!msg.text().includes('React DevTools') && !msg.text().includes('React Router')) {
      console.log('Browser:', msg.text());
    }
  });

  try {
    // Step 1: Navigate to all-scanners-new page
    console.log('1. Navigating to all scanners page...');
    await page.goto(`${baseUrl}/all-scanners-new`, { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(2000);
    await page.screenshot({ path: `${environment}-1-all-scanners.png` });

    // Step 2: Click on WordPress Scanner card
    console.log('2. Clicking WordPress Scanner card...');
    
    // Find and click the WordPress Scanner card
    const clicked = await page.evaluate(() => {
      // Find all cards
      const cards = document.querySelectorAll('[class*="MuiCard"]');
      for (const card of cards) {
        if (card.textContent?.includes('WordPress Scanner') && 
            !card.textContent.includes('Drupal') && 
            !card.textContent.includes('Joomla')) {
          card.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      console.log('✅ Clicked WordPress Scanner card');
      await wait(2000); // Wait for dialog to open
      await page.screenshot({ path: `${environment}-2-dialog-open.png` });
    } else {
      console.log('❌ Could not find WordPress Scanner card');
      return;
    }

    // Step 3: Fill in the target URL in the dialog
    console.log('3. Filling target URL...');
    
    // Wait for the dialog to be fully loaded
    await page.waitForSelector('input[label="Target"], input[placeholder*="wordpress"]', { timeout: 5000 });
    
    // Enter the target URL
    const targetEntered = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        // Find the target input field in the dialog
        if (input.getAttribute('label') === 'Target' || 
            input.placeholder?.includes('wordpress') ||
            (input.closest('[role="dialog"]') && input.type === 'text')) {
          input.value = 'https://www.cobytes.com';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    });

    if (targetEntered) {
      console.log('✅ Target URL entered');
      await wait(1000);
      await page.screenshot({ path: `${environment}-3-url-entered.png` });
    } else {
      console.log('❌ Could not find target input field');
    }

    // Step 4: Click Start Scan button
    console.log('4. Starting scan...');
    
    const scanStarted = await page.evaluate(() => {
      // Find buttons within the dialog
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        const buttons = dialog.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent?.includes('Start Scan')) {
            button.click();
            return true;
          }
        }
      }
      return false;
    });

    if (scanStarted) {
      console.log('✅ Scan started');
      await wait(3000);
      await page.screenshot({ path: `${environment}-4-scan-started.png` });
      
      // Wait for scan to complete or show progress
      console.log('5. Monitoring scan...');
      
      // Check if we got redirected to scan status page
      const url = page.url();
      if (url.includes('/scan-status/')) {
        console.log('✅ Redirected to scan status page');
        await wait(5000);
        await page.screenshot({ path: `${environment}-5-scan-status.png` });
      } else {
        // Check dialog for success message
        const hasSuccess = await page.evaluate(() => {
          const alerts = document.querySelectorAll('[class*="MuiAlert-success"]');
          return alerts.length > 0;
        });
        
        if (hasSuccess) {
          console.log('✅ Scan created successfully');
          
          // Try to click View Scan Status button
          await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const button of buttons) {
              if (button.textContent?.includes('View Scan Status')) {
                button.click();
                break;
              }
            }
          });
          
          await wait(5000);
          await page.screenshot({ path: `${environment}-6-viewing-status.png` });
        }
      }
    } else {
      console.log('❌ Could not start scan');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: `${environment}-error.png` });
  } finally {
    await wait(2000);
    await browser.close();
  }
}

// Test direct API approach
async function testDirectAPI(baseUrl, environment) {
  console.log(`\n🔍 Testing direct API for ${environment}`);
  
  try {
    const apiUrl = environment === 'local' 
      ? 'http://localhost:3001' 
      : 'https://api.securityscan.cobytes.com';
    
    // Try to create a WordPress scan
    const response = await fetch(`${apiUrl}/api/proxy/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool_id: 270, // WordPress Scanner ID
        target_name: 'https://www.cobytes.com',
        tool_params: {}
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Scan created via API:', result);
    } else {
      console.log('❌ API error:', response.status, await response.text());
    }
  } catch (error) {
    console.log('❌ API request failed:', error.message);
  }
}

async function runTests() {
  // Create downloads directory
  const downloadsDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // Test local environment
  await testWordPressScanWithDialog('http://localhost:3002', 'local');
  await testDirectAPI('http://localhost:3002', 'local');
  
  // Wait before testing production
  console.log('\n⏳ Waiting 5 seconds before testing production...\n');
  await wait(5000);
  
  // Test production environment
  await testWordPressScanWithDialog('https://securityscan.cobytes.com', 'production');
  await testDirectAPI('https://securityscan.cobytes.com', 'production');
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests().catch(console.error);