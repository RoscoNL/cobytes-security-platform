const puppeteer = require('puppeteer');

async function testWordPressScan() {
  console.log('🔍 Testing WordPress scan for https://www.cobytes.com\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    
    // Monitor console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser error:', msg.text());
      }
    });

    // 1. Login first
    console.log('📍 Step 1: Logging in...');
    await page.goto('http://localhost:3002/login');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.type('input[type="email"]', 'user@cobytes.com');
    await page.type('input[type="password"]', 'pass');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000));
    
    const token = await page.evaluate(() => localStorage.getItem('token'));
    if (!token) {
      console.log('❌ Login failed');
      return;
    }
    console.log('✅ Logged in successfully');

    // 2. Go to new scan page
    console.log('\n📍 Step 2: Going to new scan page...');
    await page.goto('http://localhost:3002/dashboard/scans/new');
    await new Promise(r => setTimeout(r, 3000));
    
    // 3. Fill in the scan form
    console.log('📍 Step 3: Filling scan form...');
    
    // Enter target URL
    const urlInput = await page.$('input[name="target"]');
    if (urlInput) {
      await urlInput.type('https://www.cobytes.com');
      console.log('✅ Entered target URL: https://www.cobytes.com');
    }
    
    // Select WordPress scan type
    const scanTypeFound = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const scanTypeSelect = selects.find(s => s.name === 'scan_type');
      if (scanTypeSelect) {
        // Look for WordPress option
        const options = Array.from(scanTypeSelect.options);
        const wpOption = options.find(opt => 
          opt.text.toLowerCase().includes('wordpress') || 
          opt.value.toLowerCase().includes('wordpress')
        );
        if (wpOption) {
          scanTypeSelect.value = wpOption.value;
          scanTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          return wpOption.text;
        }
      }
      return null;
    });
    
    if (scanTypeFound) {
      console.log(`✅ Selected scan type: ${scanTypeFound}`);
    } else {
      console.log('⚠️  WordPress scan type not found, checking available options...');
      
      // List available scan types
      const scanTypes = await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('select'));
        const scanTypeSelect = selects.find(s => s.name === 'scan_type');
        if (scanTypeSelect) {
          return Array.from(scanTypeSelect.options).map(opt => ({
            value: opt.value,
            text: opt.text
          }));
        }
        return [];
      });
      
      console.log('Available scan types:', scanTypes);
      
      // Try to find CMS or similar scan
      const cmsOption = scanTypes.find(opt => 
        opt.text.toLowerCase().includes('cms') || 
        opt.text.toLowerCase().includes('wordpress') ||
        opt.text.toLowerCase().includes('website')
      );
      
      if (cmsOption) {
        await page.evaluate((value) => {
          const selects = Array.from(document.querySelectorAll('select'));
          const scanTypeSelect = selects.find(s => s.name === 'scan_type');
          if (scanTypeSelect) {
            scanTypeSelect.value = value;
            scanTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, cmsOption.value);
        console.log(`✅ Selected alternative: ${cmsOption.text}`);
      }
    }
    
    await page.screenshot({ path: 'screenshots/wordpress-scan-form.png' });
    
    // 4. Submit the scan
    console.log('\n📍 Step 4: Starting scan...');
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      console.log('✅ Scan submitted');
      await new Promise(r => setTimeout(r, 5000));
      
      // Check if we're on scan detail page
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      if (currentUrl.includes('/dashboard/scans/')) {
        console.log('✅ Redirected to scan detail page');
        
        // Wait for scan to start processing
        console.log('\n📍 Step 5: Monitoring scan progress...');
        
        // Monitor scan status for up to 2 minutes
        let scanComplete = false;
        let attempts = 0;
        const maxAttempts = 24; // 2 minutes with 5 second intervals
        
        while (!scanComplete && attempts < maxAttempts) {
          attempts++;
          
          const scanStatus = await page.evaluate(() => {
            // Look for status indicator
            const statusElements = document.querySelectorAll('[class*="status"], [class*="Status"]');
            for (const el of statusElements) {
              const text = el.textContent?.toLowerCase() || '';
              if (text.includes('completed') || text.includes('running') || text.includes('failed')) {
                return text;
              }
            }
            return null;
          });
          
          if (scanStatus) {
            console.log(`   Status: ${scanStatus}`);
            if (scanStatus.includes('completed')) {
              scanComplete = true;
            }
          }
          
          // Get progress if available
          const progress = await page.evaluate(() => {
            const progressElements = document.querySelectorAll('[class*="progress"], [class*="Progress"]');
            for (const el of progressElements) {
              const text = el.textContent || '';
              if (text.includes('%')) {
                return text;
              }
            }
            return null;
          });
          
          if (progress) {
            console.log(`   Progress: ${progress}`);
          }
          
          // Get any results
          const results = await page.evaluate(() => {
            const resultElements = document.querySelectorAll('[class*="result"], [class*="Result"], .vulnerability, .finding');
            return resultElements.length;
          });
          
          if (results > 0) {
            console.log(`   Found ${results} results`);
          }
          
          await page.screenshot({ path: `screenshots/wordpress-scan-progress-${attempts}.png` });
          
          if (!scanComplete) {
            await new Promise(r => setTimeout(r, 5000));
          }
        }
        
        // Get final results
        console.log('\n📍 Step 6: Scan Results:');
        
        const scanResults = await page.evaluate(() => {
          const results = {
            status: '',
            findings: [],
            summary: ''
          };
          
          // Get status
          const statusEl = document.querySelector('[class*="status"], [class*="Status"]');
          if (statusEl) {
            results.status = statusEl.textContent?.trim() || '';
          }
          
          // Get findings/vulnerabilities
          const findingElements = document.querySelectorAll('.vulnerability, .finding, [class*="result"]');
          findingElements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 10) {
              results.findings.push(text);
            }
          });
          
          // Get summary info
          const summaryElements = document.querySelectorAll('.summary, [class*="summary"]');
          summaryElements.forEach(el => {
            const text = el.textContent?.trim();
            if (text) {
              results.summary += text + ' ';
            }
          });
          
          return results;
        });
        
        console.log('Status:', scanResults.status);
        console.log('Summary:', scanResults.summary || 'No summary available');
        console.log(`Findings: ${scanResults.findings.length} items found`);
        
        if (scanResults.findings.length > 0) {
          console.log('\nTop findings:');
          scanResults.findings.slice(0, 5).forEach((finding, i) => {
            console.log(`${i + 1}. ${finding.substring(0, 100)}...`);
          });
        }
        
        await page.screenshot({ path: 'screenshots/wordpress-scan-final-results.png', fullPage: true });
        
      } else {
        console.log('❌ Not redirected to scan detail page');
        
        // Check for errors
        const errorText = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('.error, .alert-error, [class*="error"]');
          for (const el of errorElements) {
            const text = el.textContent?.trim();
            if (text) return text;
          }
          return null;
        });
        
        if (errorText) {
          console.log('Error:', errorText);
        }
      }
    }
    
    console.log('\n✅ WordPress scan test completed');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'screenshots/wordpress-scan-error.png' });
  } finally {
    await new Promise(r => setTimeout(r, 5000)); // Keep browser open
    await browser.close();
  }
}

// Run test
testWordPressScan();