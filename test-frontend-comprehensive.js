const puppeteer = require('puppeteer');
const axios = require('axios');

const FRONTEND_URL = 'http://localhost:3002';
const BACKEND_URL = 'http://localhost:3001';

const tests = {
  navigation: [],
  dataDisplay: [],
  forms: [],
  errors: [],
  responsive: []
};

async function testComprehensive() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Test 1: Landing Page Navigation
    console.log('\n=== Testing Landing Page Navigation ===');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    
    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav a, header a'));
      return links.map(link => ({
        text: link.innerText.trim(),
        href: link.href,
        visible: link.offsetParent !== null
      })).filter(l => l.visible && l.text);
    });
    
    console.log(`Found ${navLinks.length} navigation links`);
    tests.navigation.push({
      test: 'Landing page navigation',
      status: navLinks.length > 0 ? 'PASS' : 'FAIL',
      links: navLinks
    });

    // Test 2: Products Page Data Display
    console.log('\n=== Testing Products Page Data Display ===');
    await page.goto(`${FRONTEND_URL}/products`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const productsData = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid="product-card"]');
      const prices = Array.from(document.querySelectorAll('*')).filter(el => 
        el.innerText && el.innerText.includes('€')
      );
      return {
        cardCount: cards.length,
        priceCount: prices.length,
        hasProducts: cards.length > 0
      };
    });
    
    console.log(`Found ${productsData.cardCount} product cards`);
    tests.dataDisplay.push({
      test: 'Products display',
      status: productsData.hasProducts ? 'PASS' : 'FAIL',
      details: productsData
    });

    // Test 3: Cart Functionality
    console.log('\n=== Testing Cart Functionality ===');
    await page.goto(`${FRONTEND_URL}/cart`, { waitUntil: 'networkidle2' });
    
    const cartData = await page.evaluate(() => {
      const emptyMessage = document.body.innerText.includes('empty') || 
                          document.body.innerText.includes('Empty');
      const hasCartItems = document.querySelectorAll('[data-testid="cart-item"]').length > 0;
      return {
        isEmpty: emptyMessage,
        hasItems: hasCartItems,
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    
    tests.dataDisplay.push({
      test: 'Cart display',
      status: 'PASS',
      details: cartData
    });

    // Test 4: Login Form
    console.log('\n=== Testing Login Form ===');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    
    const loginForm = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButton = document.querySelector('button[type="submit"]');
      return {
        hasEmailInput: !!emailInput,
        hasPasswordInput: !!passwordInput,
        hasSubmitButton: !!submitButton
      };
    });
    
    tests.forms.push({
      test: 'Login form elements',
      status: loginForm.hasEmailInput && loginForm.hasPasswordInput && loginForm.hasSubmitButton ? 'PASS' : 'FAIL',
      details: loginForm
    });

    // Test 5: Free Scan Page
    console.log('\n=== Testing Free Scan Page ===');
    await page.goto(`${FRONTEND_URL}/free-scan`, { waitUntil: 'networkidle2' });
    
    const scanForm = await page.evaluate(() => {
      const urlInput = document.querySelector('input[placeholder*="domain"], input[placeholder*="URL"], input[name="url"]');
      const scanButton = document.querySelector('button');
      const pageText = document.body.innerText;
      return {
        hasUrlInput: !!urlInput,
        hasScanButton: !!scanButton,
        pageTitle: document.title,
        hasFreeScanText: pageText.toLowerCase().includes('free') || pageText.toLowerCase().includes('scan')
      };
    });
    
    tests.forms.push({
      test: 'Free scan form',
      status: scanForm.hasUrlInput && scanForm.hasScanButton ? 'PASS' : 'FAIL',
      details: scanForm
    });

    // Test 6: Pricing Page
    console.log('\n=== Testing Pricing Page ===');
    await page.goto(`${FRONTEND_URL}/pricing`, { waitUntil: 'networkidle2' });
    
    const pricingData = await page.evaluate(() => {
      const pricingCards = document.querySelectorAll('[data-testid="pricing-plan"]');
      const priceElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.innerText && (el.innerText.includes('€') || el.innerText.includes('$'))
      );
      return {
        planCount: pricingCards.length,
        priceCount: priceElements.length,
        hasPricing: pricingCards.length > 0 || priceElements.length > 0
      };
    });
    
    tests.dataDisplay.push({
      test: 'Pricing plans display',
      status: pricingData.hasPricing ? 'PASS' : 'FAIL',
      details: pricingData
    });

    // Test 7: Error Handling (404 page)
    console.log('\n=== Testing Error Handling ===');
    await page.goto(`${FRONTEND_URL}/non-existent-page`, { waitUntil: 'networkidle2' });
    
    const errorPage = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        has404: bodyText.includes('404'),
        hasNotFound: bodyText.toLowerCase().includes('not found'),
        hasHomeLink: !!document.querySelector('a[href="/"]')
      };
    });
    
    tests.errors.push({
      test: '404 error page',
      status: errorPage.has404 || errorPage.hasNotFound ? 'PASS' : 'FAIL',
      details: errorPage
    });

    // Test 8: Mobile Responsiveness
    console.log('\n=== Testing Mobile Responsiveness ===');
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    
    const mobileView = await page.evaluate(() => {
      const hamburger = document.querySelector('[data-testid="mobile-menu-button"], button[aria-label*="menu"]');
      const navigation = document.querySelector('nav');
      return {
        hasHamburgerMenu: !!hamburger,
        navigationVisible: navigation ? navigation.offsetParent !== null : false
      };
    });
    
    tests.responsive.push({
      test: 'Mobile navigation',
      status: mobileView.hasHamburgerMenu || !mobileView.navigationVisible ? 'PASS' : 'WARN',
      details: mobileView
    });

    // Test 9: Dashboard (Protected Route)
    console.log('\n=== Testing Protected Routes ===');
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle2' });
    
    const dashboardAccess = await page.evaluate(() => {
      const url = window.location.pathname;
      const bodyText = document.body.innerText.toLowerCase();
      return {
        redirectedToLogin: url === '/login',
        hasLoginForm: bodyText.includes('sign in') || bodyText.includes('login'),
        currentPath: url
      };
    });
    
    tests.navigation.push({
      test: 'Protected route redirect',
      status: dashboardAccess.redirectedToLogin || dashboardAccess.hasLoginForm ? 'PASS' : 'FAIL',
      details: dashboardAccess
    });

    // Test 10: Contact Form
    console.log('\n=== Testing Contact Form ===');
    await page.goto(`${FRONTEND_URL}/contact`, { waitUntil: 'networkidle2' });
    
    const contactForm = await page.evaluate(() => {
      const nameInput = document.querySelector('input[name="name"], [data-testid="contact-name"]');
      const emailInput = document.querySelector('input[name="email"], [data-testid="contact-email"]');
      const messageInput = document.querySelector('textarea[name="message"], [data-testid="contact-message"]');
      const submitButton = document.querySelector('button[type="submit"], [data-testid="contact-submit"]');
      return {
        hasNameInput: !!nameInput,
        hasEmailInput: !!emailInput,
        hasMessageInput: !!messageInput,
        hasSubmitButton: !!submitButton,
        isComplete: !!nameInput && !!emailInput && !!messageInput && !!submitButton
      };
    });
    
    tests.forms.push({
      test: 'Contact form',
      status: contactForm.isComplete ? 'PASS' : 'FAIL',
      details: contactForm
    });

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }

  // Generate Report
  console.log('\n\n=== COMPREHENSIVE TEST REPORT ===\n');
  
  Object.entries(tests).forEach(([category, results]) => {
    console.log(`\n${category.toUpperCase()} TESTS:`);
    console.log('=' .repeat(50));
    
    results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                  result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.details && result.status !== 'PASS') {
        console.log(`   Details:`, JSON.stringify(result.details, null, 2));
      }
    });
  });

  // Summary
  const allResults = Object.values(tests).flat();
  const passed = allResults.filter(r => r.status === 'PASS').length;
  const failed = allResults.filter(r => r.status === 'FAIL').length;
  const warnings = allResults.filter(r => r.status === 'WARN').length;
  
  console.log('\n\nSUMMARY:');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${allResults.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`Success Rate: ${((passed / allResults.length) * 100).toFixed(1)}%`);
}

testComprehensive().catch(console.error);