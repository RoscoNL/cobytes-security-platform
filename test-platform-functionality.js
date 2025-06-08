const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'test-screenshots-functionality');
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
            // Look for Free Demo or Free Scan button/link
            const freeScanSelectors = [
                'a[href="/free-scan"]',
                'button:contains("Free Scan")',
                'a:contains("Free Demo")',
                '[data-testid="free-scan"]',
                '.free-scan-button'
            ];
            
            let freeScanFound = false;
            for (const selector of freeScanSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 2000 });
                    await page.click(selector);
                    freeScanFound = true;
                    break;
                } catch (e) {
                    // Try next selector
                }
            }

            if (!freeScanFound) {
                // Try navigating directly
                await page.goto('http://localhost:3002/free-scan', { waitUntil: 'networkidle2' });
            }

            await delay(2000);
            await takeScreenshot(page, '02-free-scan-page');

            // Try to start a scan without login
            const urlInput = await page.$('input[type="url"], input[name="url"], input[placeholder*="url" i], input[placeholder*="website" i]');
            if (urlInput) {
                await urlInput.type('https://example.com');
                await takeScreenshot(page, '03-free-scan-url-entered');

                // Look for scan button
                const scanButton = await page.$('button[type="submit"]') || await page.$('button');
                if (scanButton) {
                    await scanButton.click();
                    await delay(3000);
                    await takeScreenshot(page, '04-free-scan-result');
                    results.tests.push({
                        name: 'Free Scan Feature',
                        status: 'success',
                        message: 'Free scan initiated successfully'
                    });
                } else {
                    results.tests.push({
                        name: 'Free Scan Feature',
                        status: 'partial',
                        message: 'Free scan page found but no scan button detected'
                    });
                }
            } else {
                results.tests.push({
                    name: 'Free Scan Feature',
                    status: 'failed',
                    message: 'No URL input field found on free scan page'
                });
            }
        } catch (error) {
            await takeScreenshot(page, '02-free-scan-error');
            results.tests.push({
                name: 'Free Scan Feature',
                status: 'failed',
                message: `Error accessing free scan: ${error.message}`
            });
        }

        // Test 3: Login
        console.log('\n3️⃣ Testing Login...');
        await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle2' });
        await takeScreenshot(page, '05-login-page');

        try {
            // Fill login form
            await page.type('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'user@cobytes.com');
            await page.type('input[type="password"], input[name="password"], input[placeholder*="password" i]', 'pass');
            await takeScreenshot(page, '06-login-filled');

            // Submit login
            const loginButton = await page.$('button[type="submit"]') || 
                               await page.$('button') || 
                               await page.$('input[type="submit"]');
            if (loginButton) {
                await loginButton.click();
            }
            await delay(3000);

            // Check if login was successful
            const currentUrl = page.url();
            if (currentUrl.includes('dashboard') || currentUrl.includes('scans')) {
                await takeScreenshot(page, '07-after-login');
                results.tests.push({
                    name: 'Login',
                    status: 'success',
                    message: 'Login successful'
                });

                // Test 4: Create WordPress Scan
                console.log('\n4️⃣ Testing WordPress Scan Creation...');
                try {
                    // Navigate to new scan page
                    const newScanSelectors = [
                        'a[href="/scans/new"]',
                        'button:contains("New Scan")',
                        'a:contains("New Scan")',
                        '[data-testid="new-scan"]'
                    ];

                    let newScanFound = false;
                    for (const selector of newScanSelectors) {
                        try {
                            await page.waitForSelector(selector, { timeout: 2000 });
                            await page.click(selector);
                            newScanFound = true;
                            break;
                        } catch (e) {
                            // Try next selector
                        }
                    }

                    if (!newScanFound) {
                        await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle2' });
                    }

                    await delay(2000);
                    await takeScreenshot(page, '08-new-scan-page');

                    // Fill scan details
                    const urlInput = await page.$('input[type="url"], input[name="url"], input[placeholder*="url" i]');
                    if (urlInput) {
                        await urlInput.type('https://www.cobytes.com');
                    }

                    // Select WordPress scan if there's a scanner selection
                    const scannerSelect = await page.$('select[name="scanner"], select[name="scan_type"]');
                    if (scannerSelect) {
                        await scannerSelect.select('wordpress');
                    }

                    await takeScreenshot(page, '09-scan-configured');

                    // Start scan
                    const startButton = await page.$('button[type="submit"]') || await page.$('button');
                    if (startButton) {
                        await startButton.click();
                        await delay(3000);
                        await takeScreenshot(page, '10-scan-started');

                        // Monitor progress for 10 seconds
                        console.log('\n5️⃣ Monitoring Scan Progress...');
                        for (let i = 1; i <= 3; i++) {
                            await delay(3000);
                            await takeScreenshot(page, `11-scan-progress-${i}`);
                            
                            // Check for any progress indicators
                            const progressBar = await page.$('.progress-bar, [role="progressbar"], .scan-progress');
                            const statusText = await page.$('.scan-status, .status-text, [data-testid="scan-status"]');
                            
                            if (progressBar || statusText) {
                                console.log(`   Progress check ${i}: Scan is running`);
                            }
                        }

                        results.tests.push({
                            name: 'WordPress Scan Creation',
                            status: 'success',
                            message: 'WordPress scan created and started successfully'
                        });
                    } else {
                        results.tests.push({
                            name: 'WordPress Scan Creation',
                            status: 'failed',
                            message: 'Could not find scan start button'
                        });
                    }
                } catch (error) {
                    await takeScreenshot(page, '08-scan-creation-error');
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
        await takeScreenshot(page, '12-final-state');

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
            const icon = test.status === 'success' ? '✅' : test.status === 'partial' ? '⚠️' : '❌';
            console.log(`${icon} ${test.name}: ${test.message}`);
        });

        console.log(`\n📁 Screenshots saved in: ${screenshotsDir}`);
        console.log('📄 Test results saved in: test-results.json');

        await browser.close();
    }
}

// Run the test
testPlatform().catch(console.error);