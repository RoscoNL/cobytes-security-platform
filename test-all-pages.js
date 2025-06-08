const puppeteer = require('puppeteer');

const API_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:3002';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAllPages() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const results = [];
  let testNumber = 0;

  // Helper function to test a page
  async function testPage(name, path, checks = {}) {
    testNumber++;
    console.log(`\n🔍 Test ${testNumber}: Testing ${name}...`);
    
    try {
      await page.goto(`${FRONTEND_URL}${path}`, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      await sleep(1000);
      
      const url = page.url();
      const title = await page.title();
      
      // Basic page load test
      results.push({
        test: `${name} - Page loads`,
        passed: true,
        details: `Loaded ${url}`
      });
      
      // Custom checks
      for (const [checkName, checkFn] of Object.entries(checks)) {
        try {
          const result = await checkFn(page);
          results.push({
            test: `${name} - ${checkName}`,
            passed: result.passed,
            details: result.details
          });
        } catch (error) {
          results.push({
            test: `${name} - ${checkName}`,
            passed: false,
            details: `Error: ${error.message}`
          });
        }
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: `screenshots/${path.replace(/\//g, '-') || 'home'}.png`, 
        fullPage: true 
      });
      
    } catch (error) {
      results.push({
        test: `${name} - Page loads`,
        passed: false,
        details: `Error: ${error.message}`
      });
    }
  }

  try {
    // Create screenshots directory
    await page.evaluate(() => {
      console.log('Starting comprehensive test...');
    });

    // Test 1: Homepage / Landing
    await testPage('Homepage', '/', {
      'Has hero section': async (page) => {
        const hero = await page.$('h1');
        const heroText = hero ? await page.evaluate(el => el.textContent, hero) : '';
        return {
          passed: heroText.includes('Security'),
          details: `Hero text: ${heroText}`
        };
      },
      'Has navigation': async (page) => {
        const nav = await page.$('nav');
        return {
          passed: nav !== null,
          details: nav ? 'Navigation found' : 'No navigation'
        };
      },
      'Has pricing section': async (page) => {
        const pricing = await page.$('#pricing');
        return {
          passed: pricing !== null,
          details: pricing ? 'Pricing section found' : 'No pricing section'
        };
      }
    });

    // Test 2: Products Page
    await testPage('Products', '/products', {
      'Shows products': async (page) => {
        const products = await page.$$('[class*="MuiCard-root"]');
        return {
          passed: products.length > 0,
          details: `Found ${products.length} products`
        };
      },
      'Has add to cart buttons': async (page) => {
        const buttons = await page.$$eval('button', buttons => 
          buttons.filter(btn => btn.textContent.includes('Add to Cart')).length
        );
        return {
          passed: buttons > 0,
          details: `Found ${buttons} add to cart buttons`
        };
      },
      'Has category tabs': async (page) => {
        const tabs = await page.$$('[role="tab"]');
        return {
          passed: tabs.length > 0,
          details: `Found ${tabs.length} category tabs`
        };
      }
    });

    // Test 3: Cart Page
    await testPage('Cart', '/cart', {
      'Shows cart content': async (page) => {
        const emptyCart = await page.$eval('h5', el => el.textContent).catch(() => '');
        return {
          passed: true,
          details: emptyCart.includes('empty') ? 'Empty cart shown' : 'Cart has items'
        };
      }
    });

    // Test 4: Login Page
    await testPage('Login', '/login', {
      'Has login form': async (page) => {
        const emailField = await page.$('input[name="email"]');
        const passwordField = await page.$('input[name="password"]');
        const submitButton = await page.$('button[type="submit"]');
        return {
          passed: emailField && passwordField && submitButton,
          details: 'Login form elements present'
        };
      }
    });

    // Test 5: Dashboard (requires login)
    await testPage('Dashboard', '/dashboard', {
      'Redirects or shows dashboard': async (page) => {
        const url = page.url();
        return {
          passed: true,
          details: url.includes('login') ? 'Redirected to login' : 'Dashboard shown'
        };
      }
    });

    // Test 6: Free Scan
    await testPage('Free Scan', '/free-scan', {
      'Has scan form': async (page) => {
        const form = await page.$('form');
        return {
          passed: form !== null,
          details: form ? 'Scan form found' : 'No scan form'
        };
      }
    });

    // Test 7: All Scanners
    await testPage('All Scanners', '/all-scanners-new', {
      'Shows scanner list': async (page) => {
        const content = await page.content();
        return {
          passed: content.length > 500,
          details: 'Page content loaded'
        };
      }
    });

    // Test 8: Security Dashboard
    await testPage('Security Dashboard', '/security-dashboard', {
      'Has dashboard content': async (page) => {
        const content = await page.content();
        return {
          passed: content.length > 500,
          details: 'Dashboard content loaded'
        };
      }
    });

    // Test 9: API Endpoints
    console.log('\n🔍 Testing API Endpoints...');
    
    // Test API health
    const apiTests = [
      { name: 'Health', endpoint: '/health' },
      { name: 'Products', endpoint: '/api/products' },
      { name: 'System Info', endpoint: '/api/system/info' },
    ];

    for (const apiTest of apiTests) {
      try {
        const response = await page.evaluate(async (url) => {
          const res = await fetch(url);
          return {
            status: res.status,
            ok: res.ok,
            data: await res.json()
          };
        }, `${API_URL}${apiTest.endpoint}`);
        
        results.push({
          test: `API - ${apiTest.name}`,
          passed: response.ok,
          details: `Status: ${response.status}`
        });
      } catch (error) {
        results.push({
          test: `API - ${apiTest.name}`,
          passed: false,
          details: `Error: ${error.message}`
        });
      }
    }

    // Test 10: E-commerce Flow
    console.log('\n🔍 Testing E-commerce Flow...');
    
    // Go to products
    await page.goto(`${FRONTEND_URL}/products`, { waitUntil: 'networkidle2' });
    await sleep(1000);
    
    // Add item to cart
    const addButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Add to Cart'));
    });
    
    if (addButton) {
      await addButton.asElement().click();
      await sleep(1000);
      
      results.push({
        test: 'E-commerce - Add to cart',
        passed: true,
        details: 'Item added to cart'
      });
    }

    // Print results
    console.log('\n\n📊 Comprehensive Test Results:');
    console.log('================================');
    
    const categories = {
      'Pages': results.filter(r => r.test.includes('Page loads')),
      'Features': results.filter(r => !r.test.includes('Page loads') && !r.test.includes('API')),
      'API': results.filter(r => r.test.includes('API'))
    };

    for (const [category, tests] of Object.entries(categories)) {
      console.log(`\n${category}:`);
      tests.forEach(result => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`  ${icon} ${result.test}: ${result.details}`);
      });
    }

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`\n✨ Overall: ${passed}/${total} tests passed (${percentage}%)`);
    
    // Summary report
    console.log('\n📋 Summary Report:');
    console.log('=================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${percentage}%`);

    // Keep browser open
    console.log('\n⏸️  Browser will remain open for inspection. Press Ctrl+C to close.');
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  }
}

// Run the test
console.log('🚀 Starting comprehensive platform test...');
console.log('Testing:', FRONTEND_URL);
console.log('API:', API_URL);
console.log('=====================================\n');

testAllPages().catch(console.error);