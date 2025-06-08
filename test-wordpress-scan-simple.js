const puppeteer = require('puppeteer');
const fs = require('fs');

async function testWordPressScan() {
    let browser;
    
    try {
        console.log('Starting WordPress scan test...');
        
        // Launch browser
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1280, height: 800 }
        });
        
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            console.log(`Browser console [${msg.type()}]:`, msg.text());
        });
        
        page.on('pageerror', error => {
            console.error('Page error:', error.message);
        });
        
        // Navigate to the platform
        console.log('Navigating to http://localhost:3002...');
        await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
        
        // Take screenshot of landing page
        await page.screenshot({ path: 'screenshots/01-landing-page.png' });
        console.log('Screenshot saved: 01-landing-page.png');
        
        // Check if we're on a login page or need to navigate to login
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);
        
        // Try to find login link
        const loginLink = await page.$('a[href="/login"], a:contains("Login"), a:contains("Sign In")');
        if (loginLink) {
            console.log('Found login link, clicking...');
            await loginLink.click();
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        } else {
            // Try navigating directly to login
            console.log('No login link found, navigating directly to /login');
            await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
        }
        
        await page.screenshot({ path: 'screenshots/02-login-page.png' });
        console.log('Screenshot saved: 02-login-page.png');
        
        // Try to find and fill login form
        console.log('Looking for login form...');
        
        // Wait for any input field
        await page.waitForSelector('input', { timeout: 5000 }).catch(() => {
            console.log('No input fields found');
        });
        
        // Get all inputs on the page
        const inputs = await page.$$eval('input', elements => 
            elements.map(el => ({
                type: el.type,
                name: el.name,
                placeholder: el.placeholder,
                id: el.id
            }))
        );
        
        console.log('Found inputs:', inputs);
        
        // Try to fill email/username
        const emailSelectors = ['input[type="email"]', 'input[name="email"]', 'input[name="username"]', 'input[placeholder*="email" i]'];
        for (const selector of emailSelectors) {
            const field = await page.$(selector);
            if (field) {
                await field.type('user@cobytes.com');
                console.log(`Filled email using selector: ${selector}`);
                break;
            }
        }
        
        // Try to fill password
        const passwordSelectors = ['input[type="password"]', 'input[name="password"]', 'input[placeholder*="password" i]'];
        for (const selector of passwordSelectors) {
            const field = await page.$(selector);
            if (field) {
                await field.type('pass');
                console.log(`Filled password using selector: ${selector}`);
                break;
            }
        }
        
        await page.screenshot({ path: 'screenshots/03-login-filled.png' });
        console.log('Screenshot saved: 03-login-filled.png');
        
        // Find and click submit button
        const submitButton = await page.$('button[type="submit"], button:contains("Login"), button:contains("Sign In")');
        if (submitButton) {
            await submitButton.click();
        } else {
            // Try to find any button that might be the login button
            await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                    const text = btn.textContent.toLowerCase();
                    if (text.includes('login') || text.includes('sign in') || text.includes('submit')) {
                        btn.click();
                        break;
                    }
                }
            });
        }
        
        // Wait for navigation or response
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await page.screenshot({ path: 'screenshots/04-after-login.png' });
        console.log('Screenshot saved: 04-after-login.png');
        
        console.log('Current URL after login:', page.url());
        
        // Look for new scan option
        console.log('Looking for new scan option...');
        
        // Take screenshot of current state
        await page.screenshot({ path: 'screenshots/05-current-state.png' });
        
        // Get all links and buttons on the page
        const links = await page.$$eval('a', elements => 
            elements.map(el => ({
                text: el.textContent,
                href: el.href
            }))
        );
        
        console.log('Found links:', links);
        
        console.log('\nTest completed. Browser will remain open for 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('Test failed:', error);
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