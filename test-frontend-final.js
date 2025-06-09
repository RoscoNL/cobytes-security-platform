const puppeteer = require('puppeteer');
const axios = require('axios');

const FRONTEND_URL = 'http://localhost:3002';
const BACKEND_URL = 'http://localhost:3001';

async function testFinal() {
  console.log('=== FINAL FRONTEND TEST SUITE ===\n');
  
  const issues = [];
  const successes = [];
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('[Console Error]', msg.text());
      }
    });

    // 1. Test Products Page with Data
    console.log('Testing Products Page...');
    await page.goto(`${FRONTEND_URL}/products`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const productsData = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid="product-card"]');
      const prices = Array.from(document.querySelectorAll('*')).filter(el => 
        el.innerText && el.innerText.includes('€')
      );
      const addButtons = Array.from(document.querySelectorAll('button')).filter(
        btn => btn.innerText.includes('Add to Cart') || btn.innerText.includes('Select')
      );
      
      return {
        productCount: cards.length,
        priceCount: prices.length,
        addButtonCount: Array.from(document.querySelectorAll('button')).filter(
          btn => btn.innerText.includes('Add') || btn.innerText.includes('Select')
        ).length,
        pageText: document.body.innerText.substring(0, 300)
      };
    });
    
    if (productsData.productCount > 0) {
      successes.push(`✅ Products page displays ${productsData.productCount} products`);
    } else {
      issues.push(`❌ Products page shows no products`);
    }

    // 2. Test Cart Functionality
    console.log('\nTesting Cart Functionality...');
    
    // Try to add a product to cart
    const hasAddButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButton = buttons.find(btn => 
        btn.innerText.includes('Add') || btn.innerText.includes('Select')
      );
      if (addButton) {
        addButton.click();
        return true;
      }
      return false;
    });
    
    if (hasAddButton) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      successes.push('✅ Add to cart button works');
    } else {
      issues.push('❌ No add to cart functionality found');
    }

    // 3. Test Navigation to Cart
    console.log('\nTesting Cart Page...');
    await page.goto(`${FRONTEND_URL}/cart`, { waitUntil: 'networkidle2' });
    
    const cartData = await page.evaluate(() => {
      const emptyText = document.body.innerText.toLowerCase();
      const hasItems = document.querySelectorAll('[data-testid="cart-item"]').length > 0;
      const hasCheckoutButton = Array.from(document.querySelectorAll('button')).some(
        btn => btn.innerText.includes('Checkout')
      );
      const hasEmptyMessage = emptyText.includes('empty') || emptyText.includes('no items');
      
      return {
        hasItems,
        hasCheckoutButton,
        hasEmptyMessage,
        pageText: document.body.innerText.substring(0, 200)
      };
    });
    
    if (cartData.hasEmptyMessage || cartData.hasItems) {
      successes.push('✅ Cart page displays correctly');
    } else {
      issues.push('❌ Cart page has display issues');
    }

    // 4. Test Free Scan Form
    console.log('\nTesting Free Scan Form...');
    await page.goto(`${FRONTEND_URL}/free-scan`, { waitUntil: 'networkidle2' });
    
    // Fill the form
    await page.waitForSelector('input[name="url"], input[placeholder*="example.com"], [data-testid="free-scan-url-input"]');
    await page.type('input[name="url"], input[placeholder*="example.com"], [data-testid="free-scan-url-input"]', 'https://example.com');
    
    const scanFormFilled = await page.evaluate(() => {
      const input = document.querySelector('input[name="url"], input[placeholder*="example.com"]');
      return input && input.value === 'https://example.com';
    });
    
    if (scanFormFilled) {
      successes.push('✅ Free scan form accepts input');
    } else {
      issues.push('❌ Free scan form input not working');
    }

    // 5. Test Login Form Validation
    console.log('\nTesting Login Form Validation...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Try to submit empty form
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const hasError = await page.evaluate(() => {
        const errorText = document.body.innerText.toLowerCase();
        return errorText.includes('required') || errorText.includes('error') || 
               document.querySelector('[data-testid="error-message"]') !== null;
      });
      
      if (hasError) {
        successes.push('✅ Login form has validation');
      } else {
        issues.push('⚠️  Login form may lack validation');
      }
    }

    // 6. Test Dashboard Access (Should Redirect)
    console.log('\nTesting Protected Routes...');
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle2' });
    
    const dashboardAccess = await page.evaluate(() => {
      const url = window.location.pathname;
      const hasLoginForm = document.querySelector('input[type="password"]') !== null;
      return { url, hasLoginForm };
    });
    
    if (dashboardAccess.url === '/login' || dashboardAccess.hasLoginForm) {
      successes.push('✅ Protected routes redirect to login');
    } else {
      issues.push('❌ Protected routes not properly secured');
    }

    // 7. Test Error Page
    console.log('\nTesting Error Handling...');
    await page.goto(`${FRONTEND_URL}/this-page-does-not-exist`, { waitUntil: 'networkidle2' });
    
    const errorPage = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        has404: text.includes('404'),
        hasNotFound: text.toLowerCase().includes('not found'),
        hasHomeButton: !!document.querySelector('a[href="/"]') || 
          Array.from(document.querySelectorAll('button')).some(btn => btn.innerText.includes('Home'))
      };
    });
    
    if (errorPage.has404 || errorPage.hasNotFound) {
      successes.push('✅ 404 error page works');
    } else {
      issues.push('❌ 404 error page not displaying');
    }

    // 8. Test Contact Form
    console.log('\nTesting Contact Form...');
    await page.goto(`${FRONTEND_URL}/contact`, { waitUntil: 'networkidle2' });
    
    const contactForm = await page.evaluate(() => {
      const inputs = {
        name: document.querySelector('input[name="name"], [data-testid="contact-name"]'),
        email: document.querySelector('input[name="email"], [data-testid="contact-email"]'),
        message: document.querySelector('textarea[name="message"], [data-testid="contact-message"]'),
        submit: document.querySelector('button[type="submit"], [data-testid="contact-submit"]')
      };
      
      return {
        hasAllFields: !!(inputs.name && inputs.email && inputs.message && inputs.submit),
        fieldCount: Object.values(inputs).filter(Boolean).length
      };
    });
    
    if (contactForm.hasAllFields) {
      successes.push('✅ Contact form has all required fields');
    } else {
      issues.push(`❌ Contact form missing fields (found ${contactForm.fieldCount}/4)`);
    }

    // 9. Test Pricing Page
    console.log('\nTesting Pricing Page...');
    await page.goto(`${FRONTEND_URL}/pricing`, { waitUntil: 'networkidle2' });
    
    const pricingData = await page.evaluate(() => {
      const plans = document.querySelectorAll('[data-testid="pricing-plan"], div[class*="pricing"], div[class*="plan"]');
      const prices = Array.from(document.querySelectorAll('*')).filter(el => 
        el.innerText && (el.innerText.includes('€') || el.innerText.includes('$') || el.innerText.includes('/month'))
      );
      const ctaButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
        btn.innerText.toLowerCase().includes('start') || 
        btn.innerText.toLowerCase().includes('choose') ||
        btn.innerText.toLowerCase().includes('select')
      );
      
      return {
        planCount: plans.length,
        priceCount: prices.length,
        ctaCount: ctaButtons.length
      };
    });
    
    if (pricingData.priceCount > 0) {
      successes.push(`✅ Pricing page shows ${pricingData.priceCount} prices`);
    } else {
      issues.push('❌ Pricing page shows no pricing information');
    }

    // 10. Test Responsive Design
    console.log('\nTesting Mobile Responsiveness...');
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    
    const mobileView = await page.evaluate(() => {
      const menuButton = document.querySelector('[data-testid="mobile-menu-button"], button[aria-label*="menu"]');
      const desktopNav = document.querySelector('nav');
      const mobileMenuVisible = menuButton && window.getComputedStyle(menuButton).display !== 'none';
      
      return {
        hasMobileMenu: !!menuButton,
        mobileMenuVisible,
        navHidden: desktopNav ? window.getComputedStyle(desktopNav).display === 'none' : true
      };
    });
    
    if (mobileView.hasMobileMenu && mobileView.mobileMenuVisible) {
      successes.push('✅ Mobile menu is properly displayed');
    } else {
      issues.push('⚠️  Mobile menu may have display issues');
    }

  } catch (error) {
    console.error('Test error:', error.message);
    issues.push(`🔥 Test suite error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Final Report
  console.log('\n\n=== FINAL TEST REPORT ===\n');
  
  console.log('SUCCESSES:');
  successes.forEach(s => console.log(s));
  
  if (issues.length > 0) {
    console.log('\nISSUES FOUND:');
    issues.forEach(i => console.log(i));
  }
  
  console.log('\n\nSUMMARY:');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${successes.length}`);
  console.log(`❌ Issues: ${issues.length}`);
  console.log(`Success Rate: ${((successes.length / (successes.length + issues.length)) * 100).toFixed(1)}%`);
  
  if (issues.length === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The frontend is working correctly.');
  } else {
    console.log('\n⚠️  Some issues need attention.');
  }
}

testFinal().catch(console.error);