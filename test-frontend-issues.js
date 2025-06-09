const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3002';
const SCREENSHOTS_DIR = './frontend-issues';

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Test results
const testResults = {
  timestamp: new Date().toISOString(),
  issues: [],
  performance: {},
  accessibility: {},
  navigation: {},
  responsive: {}
};

async function runFrontendTests() {
  console.log('🧪 Running Frontend Quality Tests...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Test 1: Landing Page Load Performance
    console.log('📊 Testing Landing Page Performance...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    
    const performanceMetrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
      };
    });
    
    testResults.performance = performanceMetrics;
    console.log(`  Load time: ${performanceMetrics.loadTime}ms`);
    console.log(`  DOM ready: ${performanceMetrics.domReady}ms`);
    console.log(`  First paint: ${performanceMetrics.firstPaint}ms\n`);
    
    if (performanceMetrics.loadTime > 3000) {
      testResults.issues.push({
        type: 'performance',
        severity: 'high',
        description: 'Page load time exceeds 3 seconds',
        value: performanceMetrics.loadTime
      });
    }
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-landing.png'), fullPage: true });
    
    // Test 2: Check for Console Errors
    console.log('🔍 Checking for Console Errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      testResults.issues.push({
        type: 'console-errors',
        severity: 'high',
        description: 'Console errors detected',
        errors: consoleErrors
      });
      console.log(`  ❌ Found ${consoleErrors.length} console errors\n`);
    } else {
      console.log('  ✅ No console errors\n');
    }
    
    // Test 3: Check Navigation Elements
    console.log('🧭 Testing Navigation...');
    const navIssues = await page.evaluate(() => {
      const issues = [];
      
      // Check for proper navigation structure
      const nav = document.querySelector('nav');
      if (!nav) {
        issues.push('No navigation element found');
      }
      
      // Check for mobile menu
      const mobileMenu = document.querySelector('[data-testid="mobile-menu-button"]');
      if (!mobileMenu && window.innerWidth < 768) {
        issues.push('No mobile menu button found');
      }
      
      // Check for broken links
      const links = document.querySelectorAll('a');
      const brokenLinks = [];
      links.forEach(link => {
        if (link.href && link.href.includes('#') && !document.querySelector(link.hash)) {
          brokenLinks.push(link.href);
        }
      });
      
      if (brokenLinks.length > 0) {
        issues.push(`${brokenLinks.length} broken anchor links found`);
      }
      
      return issues;
    });
    
    if (navIssues.length > 0) {
      testResults.issues.push({
        type: 'navigation',
        severity: 'medium',
        description: 'Navigation issues detected',
        details: navIssues
      });
      console.log(`  ❌ Navigation issues: ${navIssues.join(', ')}\n`);
    } else {
      console.log('  ✅ Navigation structure OK\n');
    }
    
    // Test 4: Check Responsive Design
    console.log('📱 Testing Responsive Design...');
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await page.waitForTimeout(500);
      
      const layoutIssues = await page.evaluate(() => {
        const issues = [];
        
        // Check for horizontal scrolling
        if (document.documentElement.scrollWidth > window.innerWidth) {
          issues.push('Horizontal scrolling detected');
        }
        
        // Check for overlapping elements
        const elements = document.querySelectorAll('*');
        const overlaps = [];
        
        // Check text readability
        const texts = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6');
        texts.forEach(text => {
          const styles = window.getComputedStyle(text);
          const fontSize = parseFloat(styles.fontSize);
          if (fontSize < 12) {
            issues.push(`Text too small: ${fontSize}px`);
          }
        });
        
        return issues;
      });
      
      if (layoutIssues.length > 0) {
        testResults.issues.push({
          type: 'responsive',
          severity: 'medium',
          viewport: viewport.name,
          description: 'Responsive design issues',
          details: layoutIssues
        });
      }
      
      await page.screenshot({ 
        path: path.join(SCREENSHOTS_DIR, `02-responsive-${viewport.name}.png`),
        fullPage: true 
      });
    }
    
    // Test 5: Check Forms and Inputs
    console.log('📝 Testing Forms...');
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    
    const formIssues = await page.evaluate(() => {
      const issues = [];
      
      // Check for form labels
      const inputs = document.querySelectorAll('input:not([type="hidden"])');
      inputs.forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (!label && !input.getAttribute('aria-label')) {
          issues.push(`Input missing label: ${input.type || 'text'}`);
        }
      });
      
      // Check for form validation
      const forms = document.querySelectorAll('form');
      if (forms.length === 0) {
        issues.push('No forms found on login page');
      }
      
      return issues;
    });
    
    if (formIssues.length > 0) {
      testResults.issues.push({
        type: 'forms',
        severity: 'high',
        description: 'Form accessibility issues',
        details: formIssues
      });
    }
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-login-form.png') });
    
    // Test 6: Check Color Contrast
    console.log('🎨 Testing Color Contrast...');
    const contrastIssues = await page.evaluate(() => {
      const issues = [];
      
      // Simple contrast check for primary elements
      const elements = document.querySelectorAll('button, a, h1, h2, h3, p');
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        // Basic check - would need proper WCAG calculation
        if (bgColor === textColor) {
          issues.push('Same background and text color detected');
        }
      });
      
      return issues;
    });
    
    // Test 7: Check Loading States
    console.log('⏳ Testing Loading States...');
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'domcontentloaded' });
    
    const loadingStates = await page.evaluate(() => {
      const issues = [];
      
      // Check for loading indicators
      const loaders = document.querySelectorAll('[data-testid*="loading"], .loader, .spinner');
      if (loaders.length === 0) {
        // Check if there should be loading states
        const dynamicContent = document.querySelectorAll('[data-testid="product-card"]');
        if (dynamicContent.length === 0) {
          issues.push('No loading states for dynamic content');
        }
      }
      
      return issues;
    });
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-products.png') });
    
    // Test 8: Check Error Handling
    console.log('❌ Testing Error Handling...');
    // Simulate API failure
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    const errorHandling = await page.evaluate(() => {
      const issues = [];
      
      // Check for error messages
      const errorElements = document.querySelectorAll('[data-testid*="error"], .error, .alert-error');
      if (errorElements.length === 0) {
        const content = document.body.textContent;
        if (!content.includes('error') && !content.includes('Error')) {
          issues.push('No error states shown when API fails');
        }
      }
      
      return issues;
    });
    
    if (errorHandling.length > 0) {
      testResults.issues.push({
        type: 'error-handling',
        severity: 'high',
        description: 'Missing error handling UI',
        details: errorHandling
      });
    }
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-error-state.png') });
    
  } catch (error) {
    console.error('Test error:', error);
    testResults.issues.push({
      type: 'test-error',
      severity: 'critical',
      description: error.message
    });
  } finally {
    await browser.close();
  }
  
  // Generate report
  console.log('\n📊 Test Summary');
  console.log('==============');
  console.log(`Total issues found: ${testResults.issues.length}`);
  console.log(`Critical: ${testResults.issues.filter(i => i.severity === 'critical').length}`);
  console.log(`High: ${testResults.issues.filter(i => i.severity === 'high').length}`);
  console.log(`Medium: ${testResults.issues.filter(i => i.severity === 'medium').length}`);
  
  // Save detailed report
  fs.writeFileSync(
    path.join(SCREENSHOTS_DIR, 'test-report.json'),
    JSON.stringify(testResults, null, 2)
  );
  
  console.log(`\nDetailed report saved to: ${SCREENSHOTS_DIR}/test-report.json`);
  console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}/`);
  
  // Return exit code based on critical issues
  const criticalCount = testResults.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length;
  process.exit(criticalCount > 0 ? 1 : 0);
}

// Run tests
runFrontendTests().catch(console.error);