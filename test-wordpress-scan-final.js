const puppeteer = require('puppeteer');
const fs = require('fs');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWordPressScan() {
    let browser;
    
    try {
        console.log('Starting WordPress scan test...');
        console.log('================================\n');
        
        // Launch browser
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1280, height: 900 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Collect console messages
        const consoleMessages = [];
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            consoleMessages.push({ type, text });
            
            if (type === 'error') {
                console.error('🔴 Browser console error:', text);
            } else if (type === 'warning') {
                console.warn('🟡 Browser console warning:', text);
            }
        });
        
        // Collect network errors
        const networkErrors = [];
        page.on('requestfailed', request => {
            const error = {
                url: request.url(),
                error: request.failure().errorText
            };
            networkErrors.push(error);
            console.error('🔴 Network request failed:', error.url, '-', error.error);
        });
        
        // Step 1: Navigate to the platform
        console.log('1. Navigating to http://localhost:3002...');
        await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
        await delay(2000);
        
        await page.screenshot({ path: 'screenshots/01-landing-page.png' });
        console.log('✅ Screenshot saved: 01-landing-page.png');
        
        // Step 2: Click Login button
        console.log('\n2. Clicking Login button...');
        const loginClicked = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('a, button'));
            for (const el of elements) {
                if (el.textContent.trim() === 'Login') {
                    el.click();
                    return true;
                }
            }
            return false;
        });
        
        if (!loginClicked) {
            console.log('Could not find Login button, navigating directly to /login');
            await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
        }
        
        await delay(2000);
        
        await page.screenshot({ path: 'screenshots/02-login-page.png' });
        console.log('✅ Screenshot saved: 02-login-page.png');
        
        // Step 3: Fill login form
        console.log('\n3. Filling login credentials...');
        await page.type('input[type="email"]', 'user@cobytes.com');
        await page.type('input[type="password"]', 'pass');
        
        await page.screenshot({ path: 'screenshots/03-login-filled.png' });
        console.log('✅ Screenshot saved: 03-login-filled.png');
        
        // Step 4: Submit login
        console.log('\n4. Submitting login form...');
        await page.click('button[type="submit"]');
        await delay(3000);
        
        await page.screenshot({ path: 'screenshots/04-after-login.png' });
        console.log('✅ Screenshot saved: 04-after-login.png');
        console.log('Current URL:', page.url());
        
        // Step 5: Navigate to new scan
        console.log('\n5. Looking for New Scan option...');
        
        // Try to find scan button/link using evaluate
        const scanButtonClicked = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('a, button'));
            for (const el of elements) {
                const text = el.textContent.toLowerCase();
                if (text.includes('new scan') || text.includes('start scan') || 
                    (text.includes('scan') && text.includes('new'))) {
                    el.click();
                    return true;
                }
            }
            return false;
        });
        
        if (!scanButtonClicked) {
            console.log('Could not find scan button, navigating directly to /scans/new');
            await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle0' });
        }
        
        await delay(2000);
        await page.screenshot({ path: 'screenshots/05-new-scan-page.png' });
        console.log('✅ Screenshot saved: 05-new-scan-page.png');
        
        // Step 6: Fill scan form
        console.log('\n6. Filling scan form...');
        
        // Enter target URL
        const urlInput = await page.$('input[name="target"], input[placeholder*="URL" i], input[placeholder*="domain" i], input[type="url"]');
        if (urlInput) {
            await urlInput.type('https://www.cobytes.com');
            console.log('✅ Entered target URL: https://www.cobytes.com');
        } else {
            console.error('❌ Could not find URL input field');
        }
        
        // Select WordPress Scanner
        const selectElement = await page.$('select');
        if (selectElement) {
            // Get all options
            const options = await page.$$eval('select option', opts => 
                opts.map(opt => ({ value: opt.value, text: opt.textContent }))
            );
            console.log('Available scanner options:', options);
            
            // Try to select WordPress scanner
            const wordpressOption = options.find(opt => 
                opt.text.toLowerCase().includes('wordpress') || 
                opt.value.toLowerCase().includes('wordpress')
            );
            
            if (wordpressOption) {
                await page.select('select', wordpressOption.value);
                console.log('✅ Selected WordPress Scanner');
            } else {
                console.error('❌ WordPress Scanner option not found');
            }
        } else {
            console.error('❌ Could not find scanner select element');
        }
        
        await delay(1000);
        await page.screenshot({ path: 'screenshots/06-scan-form-filled.png' });
        console.log('✅ Screenshot saved: 06-scan-form-filled.png');
        
        // Step 7: Submit scan
        console.log('\n7. Submitting scan...');
        
        // Find and click submit button
        const submitClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            for (const btn of buttons) {
                const text = btn.textContent.toLowerCase();
                if (text.includes('start') || text.includes('submit') || text.includes('scan')) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });
        
        if (submitClicked) {
            console.log('✅ Clicked submit button');
        } else {
            console.error('❌ Could not find submit button');
        }
        
        await delay(3000);
        
        // Step 8: Check for errors and capture final state
        console.log('\n8. Checking scan result...');
        
        await page.screenshot({ path: 'screenshots/07-scan-result.png' });
        console.log('✅ Screenshot saved: 07-scan-result.png');
        
        // Check for visible errors
        const errorElements = await page.$$eval('.error, .alert-danger, [class*="error" i], [class*="Error"]', 
            elements => elements.map(el => el.textContent)
        );
        
        if (errorElements.length > 0) {
            console.error('❌ Found error messages:', errorElements);
            await page.screenshot({ path: 'screenshots/08-error-state.png' });
            console.log('✅ Screenshot saved: 08-error-state.png');
        }
        
        // Check if scan started successfully
        const scanStarted = await page.evaluate(() => {
            const body = document.body.textContent.toLowerCase();
            return body.includes('scan started') || body.includes('scanning') || 
                   body.includes('in progress') || body.includes('pending');
        });
        
        if (scanStarted) {
            console.log('✅ Scan appears to have started successfully');
        }
        
        // Wait a bit more to capture any async errors
        await delay(5000);
        
        // Final screenshot
        await page.screenshot({ path: 'screenshots/09-final-state.png' });
        console.log('✅ Screenshot saved: 09-final-state.png');
        
        // Step 9: Summary
        console.log('\n================================');
        console.log('TEST SUMMARY:');
        console.log('================================');
        console.log(`Total console errors: ${consoleMessages.filter(m => m.type === 'error').length}`);
        console.log(`Total network errors: ${networkErrors.length}`);
        
        if (networkErrors.length > 0) {
            console.log('\nNetwork errors detail:');
            networkErrors.forEach((err, i) => {
                console.log(`${i + 1}. ${err.url}`);
                console.log(`   Error: ${err.error}`);
            });
        }
        
        // Check for CORS errors specifically
        const corsErrors = consoleMessages.filter(m => 
            m.text.toLowerCase().includes('cors') || 
            m.text.toLowerCase().includes('cross-origin')
        );
        
        if (corsErrors.length > 0) {
            console.log('\n⚠️  CORS ERRORS DETECTED:');
            corsErrors.forEach(err => console.log(`   - ${err.text}`));
        }
        
        console.log('\n✅ Test completed. Check the screenshots directory for visual results.');
        console.log('Browser will remain open for 10 seconds for manual inspection...');
        
        await delay(10000);
        
    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        if (page) {
            await page.screenshot({ path: 'screenshots/fatal-error.png' });
            console.log('Screenshot saved: fatal-error.png');
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Create screenshots directory if it doesn't exist
if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
}

// Run the test
testWordPressScan();