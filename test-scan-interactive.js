const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testScanInteractive() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: { width: 1920, height: 1080 },
        slowMo: 500 // Slow down actions for visibility
    });
    const page = await browser.newPage();

    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'scan-test-interactive');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
    }

    try {
        console.log('1. Going to scan creation page...');
        await page.goto('http://localhost:3002/dashboard/scans/new', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(screenshotsDir, '01-scan-form.png') });

        // Enter URL
        console.log('2. Entering target URL...');
        const urlInput = await page.$('input[type="text"]');
        if (urlInput) {
            await urlInput.click();
            await urlInput.type('https://www.cobytes.com');
            await page.screenshot({ path: path.join(screenshotsDir, '02-url-entered.png') });
        }

        // Click on scanner dropdown
        console.log('3. Opening scanner dropdown...');
        const dropdown = await page.$('div[id^="mui-component-select-"]');
        if (dropdown) {
            await dropdown.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.screenshot({ path: path.join(screenshotsDir, '03-dropdown-open.png') });

            // Look for WordPress Scanner option
            const options = await page.$$('li[role="option"]');
            console.log(`Found ${options.length} scanner options`);
            
            for (const option of options) {
                const text = await option.evaluate(el => el.textContent);
                console.log(`Option: ${text}`);
                if (text && text.includes('WordPress Scanner')) {
                    console.log('4. Selecting WordPress Scanner...');
                    await option.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await page.screenshot({ path: path.join(screenshotsDir, '04-scanner-selected.png') });
                    break;
                }
            }
        }

        // Click Start Scan button
        console.log('5. Clicking Start Scan...');
        const startButton = await page.$('button[type="submit"]');
        if (startButton) {
            await startButton.click();
            console.log('6. Waiting for navigation...');
            
            // Wait for either navigation or error message
            await Promise.race([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                new Promise(resolve => setTimeout(resolve, 5000))
            ]);
            
            await page.screenshot({ path: path.join(screenshotsDir, '05-after-submit.png') });
        }

        const finalUrl = page.url();
        console.log(`Final URL: ${finalUrl}`);

        // Check for any error messages
        const errorElements = await page.$$('.MuiAlert-root, .error-message');
        if (errorElements.length > 0) {
            console.log('Found error messages on page');
            for (const errorEl of errorElements) {
                const errorText = await errorEl.evaluate(el => el.textContent);
                console.log(`Error: ${errorText}`);
            }
        }

        // If we're on a scan status page, wait for updates
        if (finalUrl.includes('/scan-status/') || finalUrl.includes('/dashboard/scans/')) {
            console.log('7. On scan status page, waiting for updates...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            await page.screenshot({ path: path.join(screenshotsDir, '06-scan-progress.png') });
        }

        console.log('\nTest completed! Screenshots saved in:', screenshotsDir);

    } catch (error) {
        console.error('Error during test:', error);
        await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png') });
    }

    // Keep browser open for manual inspection
    console.log('\nBrowser will remain open for inspection. Close it manually when done.');
}

testScanInteractive().catch(console.error);