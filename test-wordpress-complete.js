const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testWordPressScan(baseUrl, environment) {
  console.log(`\n🔍 Testing WordPress scan on ${environment}: ${baseUrl}`);
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to homepage first
    console.log('1. Loading homepage...');
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(2000);
    await page.screenshot({ path: `${environment}-1-homepage.png` });

    // Step 2: Navigate to free scan page
    console.log('2. Going to free scan page...');
    await page.goto(`${baseUrl}/free-scan`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: `${environment}-2-free-scan.png` });

    // Step 3: Fill the scan form if available
    console.log('3. Looking for scan form...');
    
    // Check if we have input fields
    const hasForm = await page.evaluate(() => {
      return document.querySelector('input') !== null;
    });

    if (hasForm) {
      console.log('✅ Found form elements');
      
      // Enter URL
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        for (const input of inputs) {
          if (input.type === 'text' || input.type === 'url' || 
              input.placeholder?.toLowerCase().includes('url') ||
              input.placeholder?.toLowerCase().includes('website')) {
            input.value = 'https://www.cobytes.com';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      });
      
      await wait(1000);
      await page.screenshot({ path: `${environment}-3-url-entered.png` });
      
      // Try to select WordPress scanner
      await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        for (const select of selects) {
          const wpOption = Array.from(select.options).find(opt => 
            opt.text.toLowerCase().includes('wordpress') || 
            opt.value === 'wordpress'
          );
          if (wpOption) {
            select.value = wpOption.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });
      
      await wait(1000);
      await page.screenshot({ path: `${environment}-4-configured.png` });
      
      // Submit form
      const clicked = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          const text = button.textContent?.toLowerCase() || '';
          if (text.includes('start') || text.includes('scan') || text.includes('begin')) {
            button.click();
            return true;
          }
        }
        return false;
      });
      
      if (clicked) {
        console.log('✅ Scan started');
        await wait(5000);
        await page.screenshot({ path: `${environment}-5-scan-started.png` });
      }
    } else {
      console.log('❌ No form found on page');
    }

    // Try alternative route: all-scanners-new
    console.log('4. Trying all-scanners-new page...');
    await page.goto(`${baseUrl}/all-scanners-new`, { waitUntil: 'networkidle2' });
    await wait(2000);
    await page.screenshot({ path: `${environment}-6-all-scanners.png` });

    // Check current page content
    const pageContent = await page.evaluate(() => document.body.innerText);
    console.log('Page preview:', pageContent.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: `${environment}-error.png` });
  } finally {
    await wait(2000);
    await browser.close();
  }
}

// Test using direct API calls as well
async function testAPIDirectly(baseUrl, environment) {
  console.log(`\n🔍 Testing API directly on ${environment}`);
  
  try {
    // Test scan creation via API
    const response = await fetch(`${baseUrl.replace('3002', '3001')}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.cobytes.com',
        scan_type: 'wordpress'
      })
    });
    
    if (response.ok) {
      const scan = await response.json();
      console.log('✅ Scan created via API:', scan.id);
      
      // Poll for status
      let attempts = 0;
      while (attempts < 20) {
        await wait(5000);
        const statusResponse = await fetch(`${baseUrl.replace('3002', '3001')}/api/scans/${scan.id}`);
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          console.log(`  Status: ${status.status}`);
          if (status.status === 'completed') {
            console.log('✅ Scan completed!');
            break;
          }
        }
        attempts++;
      }
    } else {
      console.log('❌ API error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
}

async function runTests() {
  // Create downloads directory
  const downloadsDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // Test local environment
  await testWordPressScan('http://localhost:3002', 'local');
  await testAPIDirectly('http://localhost:3002', 'local');
  
  // Wait before testing production
  console.log('\n⏳ Waiting 5 seconds before testing production...\n');
  await wait(5000);
  
  // Test production environment
  await testWordPressScan('https://securityscan.cobytes.com', 'production');
  
  console.log('\n✅ Tests completed. Check the screenshots.');
}

// Run the tests
runTests().catch(console.error);