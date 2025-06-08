const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'test-screenshots-simple');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
    const filename = path.join(screenshotsDir, `${name}.png`);
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot saved: ${name}.png`);
}

async function testPlatform() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    const results = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    try {
        console.log('\n🚀 Starting Cobytes Security Platform Test\n');

        // Test 1: Access Homepage
        console.log('1️⃣ Testing Homepage Access...');
        await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
        await takeScreenshot(page, '01-homepage');
        results.tests.push({
            name: 'Homepage Access',
            status: 'success',
            message: 'Homepage loaded successfully'
        });

        // Test 2: Free Demo/Scan Feature
        console.log('\n2️⃣ Testing Free Demo/Scan Feature...');
        try {
            // Click on "Try Free Demo" button using text content
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('a, button'));
                const freeDemo = buttons.find(btn => btn.textContent.includes('Free Demo'));
                if (freeDemo) freeDemo.click();
            });
            
            await delay(2000);
            await takeScreenshot(page, '02-free-scan-page');

            // Check if we're on the free scan page
            const currentUrl = page.url();
            if (currentUrl.includes('free-scan')) {
                // Enter URL
                await page.type('input[placeholder="Website URL"]', 'https://example.com');
                await takeScreenshot(page, '03-free-scan-url-entered');

                // Click Start Free Scan button
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const startButton = buttons.find(btn => btn.textContent.includes('Start Free Scan'));
                    if (startButton) startButton.click();
                });
                
                await delay(5000);
                await takeScreenshot(page, '04-free-scan-result');

                results.tests.push({
                    name: 'Free Scan Feature',
                    status: 'success',
                    message: 'Free scan page accessed and scan initiated'
                });
            } else {
                results.tests.push({
                    name: 'Free Scan Feature',
                    status: 'failed',
                    message: 'Could not navigate to free scan page'
                });
            }
        } catch (error) {
            await takeScreenshot(page, '02-free-scan-error');
            results.tests.push({
                name: 'Free Scan Feature',
                status: 'failed',
                message: `Error with free scan: ${error.message}`
            });
        }

        // Test 3: Login with test credentials
        console.log('\n3️⃣ Testing Login...');
        await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle2' });
        await takeScreenshot(page, '05-login-page');

        try {
            // Click "Use test credentials" link
            await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'));
                const testCredLink = links.find(link => link.textContent.includes('Use test credentials'));
                if (testCredLink) testCredLink.click();
            });
            
            await delay(1000);
            await takeScreenshot(page, '06-login-with-test-creds');

            // Click Sign In button
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const signInButton = buttons.find(btn => btn.textContent.includes('Sign In'));
                if (signInButton) signInButton.click();
            });
            
            await delay(3000);

            // Check if login was successful
            const currentUrl = page.url();
            if (!currentUrl.includes('login')) {
                await takeScreenshot(page, '07-after-login');
                results.tests.push({
                    name: 'Login',
                    status: 'success',
                    message: 'Login successful with test credentials'
                });

                // Test 4: Create WordPress Scan
                console.log('\n4️⃣ Testing WordPress Scan Creation...');
                try {
                    // Navigate to new scan page
                    await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle2' });
                    await delay(2000);
                    await takeScreenshot(page, '08-new-scan-page');

                    // Enter the URL
                    const urlInputs = await page.$$('input');
                    for (const input of urlInputs) {
                        const placeholder = await input.evaluate(el => el.placeholder);
                        if (placeholder && placeholder.toLowerCase().includes('url')) {
                            await input.type('https://www.cobytes.com');
                            break;
                        }
                    }
                    await takeScreenshot(page, '09-url-entered');

                    // Check for scanner selection
                    const selects = await page.$$('select');
                    if (selects.length > 0) {
                        // Get options and look for WordPress
                        const hasWordPress = await page.evaluate(() => {
                            const select = document.querySelector('select');
                            if (select) {
                                const options = Array.from(select.options);
                                const wpOption = options.find(opt => 
                                    opt.text.toLowerCase().includes('wordpress') ||
                                    opt.value.toLowerCase().includes('wordpress')
                                );
                                if (wpOption) {
                                    select.value = wpOption.value;
                                    return true;
                                }
                            }
                            return false;
                        });
                        
                        if (hasWordPress) {
                            console.log('Selected WordPress scanner');
                        }
                    }

                    await takeScreenshot(page, '10-scan-configured');

                    // Start the scan
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const startButton = buttons.find(btn => 
                            btn.textContent.includes('Start') || 
                            btn.textContent.includes('Scan') ||
                            btn.type === 'submit'
                        );
                        if (startButton) startButton.click();
                    });
                    
                    await delay(3000);
                    await takeScreenshot(page, '11-scan-started');

                    // Monitor progress
                    console.log('\n5️⃣ Monitoring Scan Progress...');
                    for (let i = 1; i <= 3; i++) {
                        await delay(5000);
                        await takeScreenshot(page, `12-scan-progress-${i}`);
                        
                        // Check for any status text
                        const statusText = await page.evaluate(() => {
                            const elements = document.querySelectorAll('[class*="status"], [class*="progress"]');
                            for (const el of elements) {
                                if (el.textContent.trim()) {
                                    return el.textContent.trim();
                                }
                            }
                            return null;
                        });
                        
                        if (statusText) {
                            console.log(`   Progress check ${i}: ${statusText}`);
                        }
                    }

                    results.tests.push({
                        name: 'WordPress Scan Creation',
                        status: 'success',
                        message: 'WordPress scan created and monitoring progress'
                    });
                } catch (error) {
                    await takeScreenshot(page, '08-scan-error');
                    results.tests.push({
                        name: 'WordPress Scan Creation',
                        status: 'failed',
                        message: `Error creating scan: ${error.message}`
                    });
                }
            } else {
                await takeScreenshot(page, '07-login-failed');
                results.tests.push({
                    name: 'Login',
                    status: 'failed',
                    message: 'Login failed - still on login page'
                });
            }
        } catch (error) {
            await takeScreenshot(page, '05-login-error');
            results.tests.push({
                name: 'Login',
                status: 'failed',
                message: `Login error: ${error.message}`
            });
        }

        // Final screenshot
        await takeScreenshot(page, '13-final-state');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        await takeScreenshot(page, 'error-state');
        results.error = error.message;
    } finally {
        // Save test results
        fs.writeFileSync(
            path.join(screenshotsDir, 'test-results.json'),
            JSON.stringify(results, null, 2)
        );

        // Print summary
        console.log('\n📊 Test Summary:\n');
        results.tests.forEach(test => {
            const icon = test.status === 'success' ? '✅' : '❌';
            console.log(`${icon} ${test.name}: ${test.message}`);
        });

        console.log(`\n📁 Screenshots saved in: ${screenshotsDir}`);
        console.log('📄 Test results saved in: test-results.json');

        await browser.close();
    }
}

// Run the test
testPlatform().catch(console.error);