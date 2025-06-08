const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'test-screenshots-improved');
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
            // Click on "Try Free Demo" button
            await page.click('a[href="/free-scan"], button:contains("Free Demo"), a:contains("Free Demo")');
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            await takeScreenshot(page, '02-free-scan-page');

            // Enter URL in the input field
            await page.type('input[placeholder="Website URL"]', 'https://example.com');
            await takeScreenshot(page, '03-free-scan-url-entered');

            // Click Start Free Scan button
            await page.click('button:contains("Start Free Scan")');
            await delay(5000); // Wait for scan to start
            await takeScreenshot(page, '04-free-scan-result');

            results.tests.push({
                name: 'Free Scan Feature',
                status: 'success',
                message: 'Free scan initiated successfully'
            });
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
            await page.click('a:contains("Use test credentials")');
            await delay(1000);
            await takeScreenshot(page, '06-login-with-test-creds');

            // Click Sign In button
            await page.click('button:contains("Sign In")');
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
                    // Look for New Scan button or navigate directly
                    try {
                        await page.click('a[href="/scans/new"], button:contains("New Scan")');
                    } catch {
                        await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle2' });
                    }
                    
                    await delay(2000);
                    await takeScreenshot(page, '08-new-scan-page');

                    // Enter the URL
                    const urlInput = await page.$('input[name="url"], input[placeholder*="url" i], input[type="url"]');
                    if (urlInput) {
                        await urlInput.type('https://www.cobytes.com');
                        await takeScreenshot(page, '09-url-entered');
                    }

                    // Look for scanner type selection
                    const scannerSelect = await page.$('select');
                    if (scannerSelect) {
                        // Get all options
                        const options = await page.$$eval('select option', opts => 
                            opts.map(opt => ({ value: opt.value, text: opt.textContent }))
                        );
                        console.log('Available scanners:', options);
                        
                        // Try to select WordPress scanner
                        const wordpressOption = options.find(opt => 
                            opt.text.toLowerCase().includes('wordpress') || 
                            opt.value.toLowerCase().includes('wordpress')
                        );
                        
                        if (wordpressOption) {
                            await scannerSelect.select(wordpressOption.value);
                            console.log('Selected WordPress scanner');
                        }
                    }

                    await takeScreenshot(page, '10-scan-configured');

                    // Start the scan
                    const startButton = await page.$('button[type="submit"], button:contains("Start"), button:contains("Scan")');
                    if (startButton) {
                        await startButton.click();
                        await delay(3000);
                        await takeScreenshot(page, '11-scan-started');

                        // Monitor progress
                        console.log('\n5️⃣ Monitoring Scan Progress...');
                        for (let i = 1; i <= 3; i++) {
                            await delay(5000);
                            await takeScreenshot(page, `12-scan-progress-${i}`);
                            
                            // Look for progress indicators
                            const statusElement = await page.$('.scan-status, .status, [class*="status"]');
                            if (statusElement) {
                                const status = await statusElement.evaluate(el => el.textContent);
                                console.log(`   Progress check ${i}: ${status}`);
                            }
                        }

                        results.tests.push({
                            name: 'WordPress Scan Creation',
                            status: 'success',
                            message: 'WordPress scan created and monitoring progress'
                        });
                    } else {
                        results.tests.push({
                            name: 'WordPress Scan Creation',
                            status: 'failed',
                            message: 'Could not find scan start button'
                        });
                    }
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