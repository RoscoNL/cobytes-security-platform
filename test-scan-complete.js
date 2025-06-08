const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testCompleteScan() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: { width: 1920, height: 1080 },
        slowMo: 100
    });
    const page = await browser.newPage();

    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'scan-test-complete');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
    }

    try {
        console.log('1. Going to scan creation page...');
        await page.goto('http://localhost:3002/dashboard/scans/new', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(screenshotsDir, '01-scan-form.png') });

        // Enter URL
        console.log('2. Entering target URL...');
        await page.type('input[type="text"]', 'https://www.cobytes.com');
        await page.screenshot({ path: path.join(screenshotsDir, '02-url-entered.png') });

        // Click on the Select Scanner dropdown
        console.log('3. Opening scanner dropdown...');
        await page.click('.MuiSelect-root');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({ path: path.join(screenshotsDir, '03-dropdown-open.png') });

        // Select WordPress Scanner (ID: 270)
        console.log('4. Selecting WordPress Scanner...');
        const menuItems = await page.$$('li[role="option"]');
        let foundWordPress = false;
        
        for (let i = 0; i < menuItems.length; i++) {
            const text = await menuItems[i].evaluate(el => el.textContent);
            if (text && text.includes('WordPress Scanner')) {
                await menuItems[i].click();
                foundWordPress = true;
                console.log('   Found and clicked WordPress Scanner');
                break;
            }
        }
        
        if (!foundWordPress) {
            // Try clicking by value
            await page.click('li[data-value="270"]').catch(() => {
                console.log('   Could not find WordPress Scanner by data-value');
            });
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.screenshot({ path: path.join(screenshotsDir, '04-scanner-selected.png') });

        // Click Start Scan button
        console.log('5. Clicking Start Scan...');
        await page.click('button[type="submit"]');
        
        // Wait for navigation or error
        console.log('6. Waiting for response...');
        await Promise.race([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
            new Promise(resolve => setTimeout(resolve, 5000))
        ]);
        
        const currentUrl = page.url();
        console.log(`   Current URL: ${currentUrl}`);
        await page.screenshot({ path: path.join(screenshotsDir, '05-after-submit.png') });

        // Check if we're on scan status page
        if (currentUrl.includes('/scan-status/')) {
            console.log('7. SUCCESS! Redirected to scan status page');
            console.log(`   Scan ID: ${currentUrl.split('/scan-status/')[1]}`);
            
            // Wait for scan status to load
            await new Promise(resolve => setTimeout(resolve, 3000));
            await page.screenshot({ path: path.join(screenshotsDir, '06-scan-status.png') });
            
            // Check for scan progress elements
            const statusElements = await page.$$('.MuiChip-root, .MuiLinearProgress-root');
            console.log(`   Found ${statusElements.length} status elements`);
            
            // Wait a bit more for updates
            await new Promise(resolve => setTimeout(resolve, 5000));
            await page.screenshot({ path: path.join(screenshotsDir, '07-scan-progress.png') });
        } else {
            console.log('7. ERROR: Did not redirect to scan status page');
            
            // Check for error messages
            const alerts = await page.$$('.MuiAlert-root');
            for (const alert of alerts) {
                const alertText = await alert.evaluate(el => el.textContent);
                console.log(`   Alert: ${alertText}`);
            }
        }

        console.log('\nTest completed! Screenshots saved in:', screenshotsDir);

    } catch (error) {
        console.error('Error during test:', error);
        await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png') });
    }

    await browser.close();
}

testCompleteScan().catch(console.error);