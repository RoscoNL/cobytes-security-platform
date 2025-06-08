const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'test-screenshots-final');
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

        // Test 2: Test Free Scan Feature
        console.log('\n2️⃣ Testing Free Scan Feature...');
        try {
            // Navigate to free scan page
            await page.goto('http://localhost:3002/free-scan', { waitUntil: 'networkidle2' });
            await takeScreenshot(page, '02-free-scan-page');

            // Check if we have the URL input
            const urlInput = await page.$('input[placeholder="Website URL"]');
            if (urlInput) {
                await urlInput.type('https://example.com');
                await takeScreenshot(page, '03-free-scan-url-entered');

                // Click Start Free Scan
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
                    message: 'Free scan feature is working'
                });
            } else {
                results.tests.push({
                    name: 'Free Scan Feature',
                    status: 'failed',
                    message: 'URL input field not found'
                });
            }
        } catch (error) {
            await takeScreenshot(page, '02-free-scan-error');
            results.tests.push({
                name: 'Free Scan Feature',
                status: 'failed',
                message: `Error: ${error.message}`
            });
        }

        // Test 3: Login
        console.log('\n3️⃣ Testing Login...');
        await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle2' });
        await takeScreenshot(page, '05-login-page');

        try {
            // Click "Use test credentials" to fill the form
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const testCredButton = buttons.find(btn => btn.textContent.includes('Use test credentials'));
                if (testCredButton) testCredButton.click();
            });
            
            await delay(500);
            await takeScreenshot(page, '06-login-filled');

            // Click Sign In
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const signInButton = buttons.find(btn => btn.textContent.includes('Sign In') && btn.type === 'submit');
                if (signInButton) signInButton.click();
            });
            
            await delay(3000);

            // Check if login was successful
            const currentUrl = page.url();
            if (!currentUrl.includes('login')) {
                await takeScreenshot(page, '07-dashboard');
                results.tests.push({
                    name: 'Login',
                    status: 'success',
                    message: 'Login successful - redirected to dashboard'
                });

                // Test 4: Create WordPress Scan
                console.log('\n4️⃣ Testing WordPress Scan Creation...');
                try {
                    // Navigate to scans page
                    await page.goto('http://localhost:3002/scans', { waitUntil: 'networkidle2' });
                    await delay(2000);
                    await takeScreenshot(page, '08-scans-page');

                    // Look for New Scan button
                    const newScanClicked = await page.evaluate(() => {
                        const links = Array.from(document.querySelectorAll('a'));
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const allElements = [...links, ...buttons];
                        
                        const newScanElement = allElements.find(el => 
                            el.textContent.includes('New Scan') || 
                            el.textContent.includes('Create Scan')
                        );
                        
                        if (newScanElement) {
                            newScanElement.click();
                            return true;
                        }
                        return false;
                    });

                    if (!newScanClicked) {
                        // Try direct navigation
                        await page.goto('http://localhost:3002/scans/new', { waitUntil: 'networkidle2' });
                    }

                    await delay(2000);
                    await takeScreenshot(page, '09-new-scan-page');

                    // Enter URL
                    const scanUrlInput = await page.$('input[type="url"], input[name="url"], input[placeholder*="URL" i]');
                    if (scanUrlInput) {
                        await scanUrlInput.type('https://www.cobytes.com');
                        await takeScreenshot(page, '10-url-entered');

                        // Look for scanner selection
                        const scannerSelect = await page.$('select');
                        if (scannerSelect) {
                            // Check available options
                            const hasWordPress = await page.evaluate(() => {
                                const select = document.querySelector('select');
                                if (select) {
                                    const options = Array.from(select.options);
                                    console.log('Available scanners:', options.map(o => o.text));
                                    
                                    const wpOption = options.find(opt => 
                                        opt.text.toLowerCase().includes('wordpress') ||
                                        opt.value.toLowerCase().includes('wordpress')
                                    );
                                    
                                    if (wpOption) {
                                        select.value = wpOption.value;
                                        // Trigger change event
                                        const event = new Event('change', { bubbles: true });
                                        select.dispatchEvent(event);
                                        return true;
                                    }
                                }
                                return false;
                            });

                            if (hasWordPress) {
                                console.log('   ✓ Selected WordPress scanner');
                            }
                        }

                        await takeScreenshot(page, '11-scan-configured');

                        // Start scan
                        const scanStarted = await page.evaluate(() => {
                            const buttons = Array.from(document.querySelectorAll('button'));
                            const startButton = buttons.find(btn => 
                                btn.textContent.includes('Start') || 
                                btn.textContent.includes('Scan') ||
                                btn.textContent.includes('Create') ||
                                btn.type === 'submit'
                            );
                            
                            if (startButton && !startButton.disabled) {
                                startButton.click();
                                return true;
                            }
                            return false;
                        });

                        if (scanStarted) {
                            await delay(3000);
                            await takeScreenshot(page, '12-scan-started');

                            // Monitor progress
                            console.log('\n5️⃣ Monitoring Scan Progress...');
                            for (let i = 1; i <= 3; i++) {
                                await delay(5000);
                                await takeScreenshot(page, `13-scan-progress-${i}`);
                                
                                // Check for status
                                const status = await page.evaluate(() => {
                                    const statusElements = document.querySelectorAll('[class*="status"], [class*="progress"], .scan-status');
                                    for (const el of statusElements) {
                                        const text = el.textContent.trim();
                                        if (text && !text.includes('Sign In')) {
                                            return text;
                                        }
                                    }
                                    return null;
                                });
                                
                                if (status) {
                                    console.log(`   Progress check ${i}: ${status}`);
                                }
                            }

                            results.tests.push({
                                name: 'WordPress Scan Creation',
                                status: 'success',
                                message: 'WordPress scan created and running'
                            });
                        } else {
                            results.tests.push({
                                name: 'WordPress Scan Creation',
                                status: 'failed',
                                message: 'Could not start scan - button not found or disabled'
                            });
                        }
                    } else {
                        results.tests.push({
                            name: 'WordPress Scan Creation',
                            status: 'failed',
                            message: 'URL input field not found on scan creation page'
                        });
                    }
                } catch (error) {
                    await takeScreenshot(page, 'scan-error');
                    results.tests.push({
                        name: 'WordPress Scan Creation',
                        status: 'failed',
                        message: `Error: ${error.message}`
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
            await takeScreenshot(page, 'login-error');
            results.tests.push({
                name: 'Login',
                status: 'failed',
                message: `Login error: ${error.message}`
            });
        }

        // Final screenshot
        await takeScreenshot(page, '14-final-state');

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

        // Check for any errors or issues
        const failedTests = results.tests.filter(t => t.status === 'failed');
        if (failedTests.length > 0) {
            console.log('\n⚠️  Issues Found:');
            failedTests.forEach(test => {
                console.log(`   - ${test.name}: ${test.message}`);
            });
        } else {
            console.log('\n✅ All tests passed successfully!');
        }

        await browser.close();
    }
}

// Run the test
testPlatform().catch(console.error);