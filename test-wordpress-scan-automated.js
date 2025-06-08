const puppeteer = require('puppeteer');
const fs = require('fs');

async function testWordPressScan() {
    let browser;
    
    try {
        console.log('Starting WordPress scan test...');
        
        // Launch browser
        browser = await puppeteer.launch({
            headless: false, // Set to false to see the browser
            defaultViewport: { width: 1280, height: 800 }
        });
        
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            // Log console messages
            if (type === 'error') {
                console.error('Browser console error:', text);
            } else if (type === 'warning') {
                console.warn('Browser console warning:', text);
            } else {
                console.log(`Browser console [${type}]:`, text);
            }
        });
        
        // Capture network errors
        page.on('pageerror', error => {
            console.error('Page error:', error.message);
        });
        
        page.on('requestfailed', request => {
            console.error('Request failed:', request.url(), request.failure().errorText);
        });
        
        // 1. Navigate to the platform
        console.log('1. Navigating to http://localhost:3002...');
        await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 2. Login
        console.log('2. Logging in...');
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', 'user@cobytes.com');
        await page.type('input[type="password"]', 'pass');
        
        // Take screenshot of login form
        await page.screenshot({ path: 'screenshots/01-login-form.png' });
        console.log('Screenshot saved: 01-login-form.png');
        
        // Submit login
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for login to process
        
        // 3. Navigate to new scan page
        console.log('3. Looking for "Start New Scan" option...');
        
        // Try different methods to find the scan button/link
        const scanSelectors = [
            'a[href="/scans/new"]',
            'button:contains("Start New Scan")',
            'a:contains("Start New Scan")',
            'button:contains("New Scan")',
            'a:contains("New Scan")',
            '[class*="scan"][class*="new"]',
            '[class*="new"][class*="scan"]'
        ];
        
        let scanButtonFound = false;
        for (const selector of scanSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    await element.click();
                    scanButtonFound = true;
                    console.log(`Found scan button with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continue trying other selectors
            }
        }
        
        // If not found, try evaluating in page context
        if (!scanButtonFound) {
            console.log('Trying to find scan button using page evaluate...');
            const clicked = await page.evaluate(() => {
                // Look for elements with text containing "scan" or "new scan"
                const elements = Array.from(document.querySelectorAll('a, button'));
                for (const el of elements) {
                    const text = el.textContent.toLowerCase();
                    if (text.includes('new scan') || text.includes('start scan') || 
                        (text.includes('new') && el.href && el.href.includes('scan'))) {
                        el.click();
                        return true;
                    }
                }
                return false;
            });
            
            if (clicked) {
                scanButtonFound = true;
                console.log('Found and clicked scan button via evaluate');
            }
        }
        
        // If still not found, navigate directly
        if (!scanButtonFound) {
            console.log('Could not find scan button, navigating directly to /scans/new');
            await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle0' });
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Take screenshot of current page
        await page.screenshot({ path: 'screenshots/02-after-login.png' });
        console.log('Screenshot saved: 02-after-login.png');
        
        // 4. Fill out scan form
        console.log('4. Filling out scan form...');
        
        // Wait for form elements
        try {
            // Enter target URL
            await page.waitForSelector('input[name="target"], input[placeholder*="URL"], input[placeholder*="url"], input[type="url"]', { timeout: 10000 });
            const urlInput = await page.$('input[name="target"], input[placeholder*="URL"], input[placeholder*="url"], input[type="url"]');
            if (urlInput) {
                await urlInput.type('https://www.cobytes.com');
                console.log('Entered target URL');
            }
            
            // Select WordPress Scanner
            const selectElement = await page.$('select');
            if (selectElement) {
                await page.select('select', 'wordpress');
                console.log('Selected WordPress Scanner');
            }
            
            // Take screenshot of filled form
            await page.screenshot({ path: 'screenshots/03-scan-form-filled.png' });
            console.log('Screenshot saved: 03-scan-form-filled.png');
            
            // Submit the form
            console.log('5. Submitting scan...');
            const submitButton = await page.$('button[type="submit"], button:contains("Start Scan"), button:contains("Submit")');
            if (submitButton) {
                await submitButton.click();
            } else {
                // Try clicking any button that might submit the form
                await page.evaluate(() => {
                    const buttons = document.querySelectorAll('button');
                    for (const btn of buttons) {
                        if (btn.textContent.toLowerCase().includes('start') || 
                            btn.textContent.toLowerCase().includes('submit') ||
                            btn.textContent.toLowerCase().includes('scan')) {
                            btn.click();
                            break;
                        }
                    }
                });
            }
            
            // Wait for response
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Take screenshot of result
            await page.screenshot({ path: 'screenshots/04-scan-result.png' });
            console.log('Screenshot saved: 04-scan-result.png');
            
            // Check for errors
            const errorElements = await page.$$('.error, .alert-danger, [class*="error"], [class*="Error"]');
            if (errorElements.length > 0) {
                console.log('Found error elements on page');
                await page.screenshot({ path: 'screenshots/05-error-state.png' });
                console.log('Screenshot saved: 05-error-state.png');
            }
            
            // Get console logs one more time
            console.log('\n6. Final browser console check...');
            
        } catch (error) {
            console.error('Error during form filling:', error);
            await page.screenshot({ path: 'screenshots/error-during-test.png' });
        }
        
        // Wait a bit to capture any final console messages
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('\nTest completed. Check the screenshots directory for results.');
        
    } catch (error) {
        console.error('Test failed:', error);
        if (browser) {
            const page = await browser.newPage();
            await page.screenshot({ path: 'screenshots/fatal-error.png' });
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