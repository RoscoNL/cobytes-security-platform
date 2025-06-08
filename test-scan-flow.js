const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testScanFlow() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: { width: 1920, height: 1080 }
    });
    const page = await browser.newPage();

    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'scan-test-screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
    }

    try {
        console.log('1. Going to http://localhost:3002...');
        await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(screenshotsDir, '01-homepage.png') });

        // Check if we're redirected to login or if login link exists
        const loginLink = await page.$('a[href="/login"]');
        if (loginLink) {
            console.log('2. Clicking login link...');
            await loginLink.click();
            await page.waitForNavigation();
        } else {
            console.log('2. Already on login page or logged in...');
        }

        // Check if we're on login page
        const emailInput = await page.$('input[type="email"], input[name="email"]');
        if (emailInput) {
            console.log('3. Logging in...');
            await page.screenshot({ path: path.join(screenshotsDir, '02-login-page.png') });
            
            await page.type('input[type="email"], input[name="email"]', 'user@cobytes.com');
            await page.type('input[type="password"], input[name="password"]', 'pass');
            await page.screenshot({ path: path.join(screenshotsDir, '03-login-filled.png') });
            
            // Click login button
            await page.click('button[type="submit"]');
            await page.waitForNavigation();
            console.log('4. Logged in successfully');
        }

        await page.screenshot({ path: path.join(screenshotsDir, '04-after-login.png') });

        // Look for "Start New Scan" link
        console.log('5. Looking for Start New Scan...');
        
        // Try different selectors
        const newScanSelectors = [
            'a[href="/scans/new"]',
            'a:contains("Start New Scan")',
            'button:contains("Start New Scan")',
            'a:contains("Nieuwe Scan")',
            '[data-testid="new-scan-button"]',
            '.new-scan-button'
        ];

        let found = false;
        for (const selector of newScanSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    console.log(`Found element with selector: ${selector}`);
                    await element.click();
                    found = true;
                    break;
                }
            } catch (e) {
                // Try next selector
            }
        }

        if (!found) {
            // Try to find by text content
            const links = await page.$$('a');
            for (const link of links) {
                const text = await link.evaluate(el => el.textContent);
                if (text && (text.includes('Start New Scan') || text.includes('Nieuwe Scan') || text.includes('New Scan'))) {
                    console.log(`Found link with text: ${text}`);
                    await link.click();
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            // Navigate directly
            console.log('Could not find Start New Scan link, navigating directly...');
            await page.goto('http://localhost:3002/dashboard/scans/new');
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({ path: path.join(screenshotsDir, '05-scan-creation-form.png') });

        // Enter target URL
        console.log('6. Entering target URL...');
        const urlInput = await page.$('input[type="url"], input[name="url"], input[placeholder*="https://"]');
        if (urlInput) {
            await urlInput.type('https://www.cobytes.com');
            await page.screenshot({ path: path.join(screenshotsDir, '06-url-entered.png') });
        } else {
            console.error('Could not find URL input field');
        }

        // Look for WordPress Scanner
        console.log('7. Looking for WordPress Scanner...');
        const scannerSelectors = [
            'label:contains("WordPress Scanner")',
            'input[value="wordpress_scanner"]',
            'input[id*="wordpress"]',
            '.scanner-option:contains("WordPress")',
            '[data-scanner="wordpress"]'
        ];

        let scannerFound = false;
        for (const selector of scannerSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    await element.click();
                    scannerFound = true;
                    console.log(`Selected WordPress Scanner with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Try next selector
            }
        }

        if (!scannerFound) {
            // Try to find by text
            const labels = await page.$$('label');
            for (const label of labels) {
                const text = await label.evaluate(el => el.textContent);
                if (text && text.includes('WordPress')) {
                    await label.click();
                    scannerFound = true;
                    console.log(`Found and clicked WordPress scanner label: ${text}`);
                    break;
                }
            }
        }

        await page.screenshot({ path: path.join(screenshotsDir, '07-scanner-selected.png') });

        // Click Start Scan button
        console.log('8. Clicking Start Scan...');
        const startScanSelectors = [
            'button:contains("Start Scan")',
            'button[type="submit"]',
            '.start-scan-button',
            'button:contains("Scan Starten")'
        ];

        let startClicked = false;
        for (const selector of startScanSelectors) {
            try {
                const button = await page.$(selector);
                if (button) {
                    await button.click();
                    startClicked = true;
                    console.log(`Clicked start scan button with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Try next selector
            }
        }

        if (!startClicked) {
            // Try to find by text
            const buttons = await page.$$('button');
            for (const button of buttons) {
                const text = await button.evaluate(el => el.textContent);
                if (text && (text.includes('Start') || text.includes('Scan'))) {
                    await button.click();
                    startClicked = true;
                    console.log(`Clicked button with text: ${text}`);
                    break;
                }
            }
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.screenshot({ path: path.join(screenshotsDir, '08-after-start-scan.png') });

        // Check if we're on scan status page
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        
        if (currentUrl.includes('/scan-status/') || currentUrl.includes('/dashboard/scans/')) {
            console.log('9. On scan status page');
            await page.screenshot({ path: path.join(screenshotsDir, '09-scan-status-page.png') });
            
            // Wait a bit for status updates
            await new Promise(resolve => setTimeout(resolve, 5000));
            await page.screenshot({ path: path.join(screenshotsDir, '10-scan-progress.png') });
        }

        // Check for any errors
        const errorElements = await page.$$('.error, .alert-danger, .error-message');
        if (errorElements.length > 0) {
            console.log('Found error elements on page');
            await page.screenshot({ path: path.join(screenshotsDir, '11-errors.png') });
        }

        console.log('\nTest completed! Screenshots saved in:', screenshotsDir);
        console.log('Final URL:', page.url());

    } catch (error) {
        console.error('Error during test:', error);
        await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png') });
    }

    await browser.close();
}

testScanFlow().catch(console.error);