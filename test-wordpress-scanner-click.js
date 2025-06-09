const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testWordPressScanFromAllScanners(baseUrl, environment) {
  console.log(`\n🔍 Testing WordPress scan on ${environment}: ${baseUrl}`);
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable download handling
  const downloadPath = path.join(__dirname, 'downloads', environment);
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }
  
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  try {
    // Step 1: Navigate to all-scanners-new page
    console.log('1. Navigating to all scanners page...');
    await page.goto(`${baseUrl}/all-scanners-new`, { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(2000);
    await page.screenshot({ path: `${environment}-1-all-scanners.png` });

    // Step 2: Click on WordPress Scanner
    console.log('2. Looking for WordPress Scanner...');
    
    // Find and click WordPress Scanner card/button
    const wordpressClicked = await page.evaluate(() => {
      // Look for elements containing "WordPress Scanner"
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        if (el.textContent?.includes('WordPress Scanner') && 
            !el.textContent.includes('Drupal') && 
            !el.textContent.includes('Joomla')) {
          // Try to find a clickable element within this card
          const button = el.querySelector('button') || 
                        el.closest('button') || 
                        el.closest('a') ||
                        el.closest('[role="button"]');
          if (button) {
            button.click();
            return true;
          }
          // If no button found, try clicking the element itself
          el.click();
          return true;
        }
      }
      return false;
    });

    if (wordpressClicked) {
      console.log('✅ Clicked WordPress Scanner');
      await wait(3000);
      await page.screenshot({ path: `${environment}-2-after-click.png` });
    } else {
      console.log('❌ Could not find WordPress Scanner to click');
    }

    // Step 3: Check if we're on a scan form or need to enter URL
    console.log('3. Looking for scan form...');
    
    // Check if there's a URL input field now
    const hasUrlInput = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"], input[type="url"], input[placeholder*="URL"], input[placeholder*="domain"]');
      return inputs.length > 0;
    });

    if (hasUrlInput) {
      console.log('✅ Found URL input field');
      
      // Enter the URL
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input[type="url"], input[placeholder*="URL"], input[placeholder*="domain"]');
        if (inputs.length > 0) {
          inputs[0].value = 'https://www.cobytes.com';
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      
      await wait(1000);
      await page.screenshot({ path: `${environment}-3-url-entered.png` });
      
      // Submit the scan
      const submitted = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          const text = button.textContent?.toLowerCase() || '';
          if (text.includes('start') || text.includes('scan') || text.includes('submit') || text.includes('begin')) {
            button.click();
            return true;
          }
        }
        return false;
      });
      
      if (submitted) {
        console.log('✅ Scan submitted');
        await wait(5000);
        await page.screenshot({ path: `${environment}-4-scan-started.png` });
        
        // Monitor scan progress
        console.log('4. Monitoring scan progress...');
        let scanComplete = false;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes
        
        while (!scanComplete && attempts < maxAttempts) {
          await wait(5000);
          
          const status = await page.evaluate(() => {
            const bodyText = document.body.innerText.toLowerCase();
            return {
              hasComplete: bodyText.includes('complete') || bodyText.includes('finished'),
              hasDownload: bodyText.includes('download'),
              hasError: bodyText.includes('error') || bodyText.includes('failed'),
              url: window.location.href
            };
          });
          
          console.log(`  Check ${attempts + 1}: ${status.url}`);
          
          if (status.hasComplete || status.hasDownload) {
            scanComplete = true;
            console.log('✅ Scan appears complete');
            await page.screenshot({ path: `${environment}-5-scan-complete.png` });
            
            // Try to download PDF
            const downloadClicked = await page.evaluate(() => {
              const links = document.querySelectorAll('a, button');
              for (const link of links) {
                const text = link.textContent?.toLowerCase() || '';
                if (text.includes('download') && (text.includes('pdf') || text.includes('report'))) {
                  link.click();
                  return true;
                }
              }
              return false;
            });
            
            if (downloadClicked) {
              console.log('📥 Download initiated');
              await wait(5000);
              
              // Check downloads folder
              const files = fs.readdirSync(downloadPath);
              const pdfFile = files.find(f => f.endsWith('.pdf'));
              if (pdfFile) {
                console.log(`✅ PDF downloaded: ${pdfFile}`);
              }
            }
          }
          
          if (status.hasError) {
            console.log('❌ Scan failed');
            break;
          }
          
          attempts++;
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: `${environment}-error.png` });
  } finally {
    await wait(2000);
    await browser.close();
  }
}

async function runTests() {
  // Test local environment
  await testWordPressScanFromAllScanners('http://localhost:3002', 'local');
  
  // Wait before testing production
  console.log('\n⏳ Waiting 5 seconds before testing production...\n');
  await wait(5000);
  
  // Test production environment
  await testWordPressScanFromAllScanners('https://securityscan.cobytes.com', 'production');
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests().catch(console.error);