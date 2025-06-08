const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testScanSimple() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: { width: 1920, height: 1080 }
    });
    const page = await browser.newPage();

    const screenshotsDir = path.join(__dirname, 'scan-test-simple');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
    }

    try {
        console.log('1. Navigating to scan creation page...');
        await page.goto('http://localhost:3002/dashboard/scans/new', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(screenshotsDir, '01-initial.png') });

        console.log('2. Filling in target URL...');
        // Wait for the form to be ready
        await page.waitForSelector('input[type="text"]');
        await page.type('input[type="text"]', 'https://www.cobytes.com');
        await page.screenshot({ path: path.join(screenshotsDir, '02-url-filled.png') });

        console.log('3. Clicking on scanner dropdown...');
        // Click on the dropdown - Material UI Select uses a div with specific attributes
        const selectElement = await page.$('[aria-haspopup="listbox"]');
        if (selectElement) {
            await selectElement.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.screenshot({ path: path.join(screenshotsDir, '03-dropdown-open.png') });

            console.log('4. Looking for WordPress Scanner...');
            // Wait for menu items to appear
            await page.waitForSelector('li[role="option"]');
            
            // Find and click WordPress Scanner
            const menuItems = await page.$$('li[role="option"]');
            let clicked = false;
            
            for (const item of menuItems) {
                const text = await item.evaluate(el => el.textContent);
                console.log(`   Found option: ${text}`);
                if (text && text.includes('WordPress Scanner')) {
                    await item.click();
                    clicked = true;
                    console.log('   ✓ Clicked WordPress Scanner');
                    break;
                }
            }
            
            if (!clicked) {
                console.log('   ✗ WordPress Scanner not found');
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            await page.screenshot({ path: path.join(screenshotsDir, '04-scanner-selected.png') });
        } else {
            console.log('   ✗ Could not find dropdown selector');
        }

        console.log('5. Submitting form...');
        await page.click('button[type="submit"]');
        
        console.log('6. Waiting for response...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const finalUrl = page.url();
        console.log(`   Final URL: ${finalUrl}`);
        await page.screenshot({ path: path.join(screenshotsDir, '05-final-state.png') });

        if (finalUrl.includes('/scan-status/')) {
            console.log('\n✓ SUCCESS: Scan created and redirected to status page!');
            const scanId = finalUrl.split('/scan-status/')[1];
            console.log(`  Scan ID: ${scanId}`);
            
            // Take a few more screenshots of the status page
            await new Promise(resolve => setTimeout(resolve, 3000));
            await page.screenshot({ path: path.join(screenshotsDir, '06-status-update.png') });
        } else {
            console.log('\n✗ FAILED: Did not redirect to scan status page');
            
            // Check for errors
            const errorElements = await page.$$('.MuiAlert-message');
            for (const errorEl of errorElements) {
                const errorText = await errorEl.evaluate(el => el.textContent);
                console.log(`  Error: ${errorText}`);
            }
        }

    } catch (error) {
        console.error('\nError during test:', error.message);
        await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png') });
    }

    console.log(`\nScreenshots saved in: ${screenshotsDir}`);
    await browser.close();
}

testScanSimple().catch(console.error);