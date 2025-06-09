import { BrowserHelper } from '../utils/test-helpers';

describe('Frontend Page Tests', () => {
  let browser: BrowserHelper;
  const frontendUrl = process.env.FRONTEND_URL || 'http://frontend-test:3002';

  beforeEach(async () => {
    browser = new BrowserHelper();
    await browser.init();
  });

  afterEach(async () => {
    await browser.close();
  });

  describe('Public Pages', () => {
    test('Landing page should load', async () => {
      await browser.goto(frontendUrl);
      await browser.screenshot('landing-page');
      
      const title = await browser.getTextContent('h1');
      expect(title).toContain('Cobytes');
      
      // Check for key elements
      await browser.waitForSelector('button[contains(text(), "Get Started")]', { timeout: 5000 });
    });

    test('Login page should render', async () => {
      await browser.goto(`${frontendUrl}/login`);
      await browser.screenshot('login-page');
      
      await browser.waitForSelector('input[type="email"]');
      await browser.waitForSelector('input[type="password"]');
      await browser.waitForSelector('button[type="submit"]');
    });

    test('Products page should show items', async () => {
      await browser.goto(`${frontendUrl}/products`);
      await browser.screenshot('products-page');
      
      await browser.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
      
      const page = browser.getPage();
      const productCount = await page!.$$eval('[data-testid="product-card"]', els => els.length);
      expect(productCount).toBeGreaterThan(0);
    });

    test('Pricing page should display plans', async () => {
      await browser.goto(`${frontendUrl}/pricing`);
      await browser.screenshot('pricing-page');
      
      await browser.waitForSelector('[data-testid="pricing-plan"]');
      
      const page = browser.getPage();
      const plans = await page!.$$eval('[data-testid="pricing-plan"]', els => els.length);
      expect(plans).toBeGreaterThanOrEqual(3);
    });

    test('Free scan page should have form', async () => {
      await browser.goto(`${frontendUrl}/free-scan`);
      await browser.screenshot('free-scan-page');
      
      await browser.waitForSelector('input[placeholder*="domain"]');
      await browser.waitForSelector('button[contains(text(), "Start")]');
    });
  });

  describe('Navigation', () => {
    test('Navigation menu should work', async () => {
      await browser.goto(frontendUrl);
      
      // Click on Products link
      await browser.click('a[href="/products"]');
      await browser.waitForSelector('[data-testid="product-card"]');
      
      const page = browser.getPage();
      expect(page!.url()).toContain('/products');
    });

    test('Mobile navigation should toggle', async () => {
      const page = browser.getPage();
      await page!.setViewport({ width: 375, height: 667 }); // Mobile viewport
      
      await browser.goto(frontendUrl);
      await browser.screenshot('mobile-view');
      
      // Look for hamburger menu
      await browser.waitForSelector('[data-testid="mobile-menu-button"]');
      await browser.click('[data-testid="mobile-menu-button"]');
      
      // Check if menu is visible
      await browser.waitForSelector('[data-testid="mobile-menu"]');
    });
  });

  describe('Error Handling', () => {
    test('404 page should render', async () => {
      await browser.goto(`${frontendUrl}/non-existent-page`);
      await browser.screenshot('404-page');
      
      const text = await browser.getTextContent('body');
      expect(text).toContain('404');
    });

    test('Should handle API errors gracefully', async () => {
      // Navigate to a page that makes API calls
      await browser.goto(`${frontendUrl}/products`);
      
      // Check that page still renders even if API is down
      const page = browser.getPage();
      
      // Intercept API calls and make them fail
      await page!.setRequestInterception(true);
      page!.on('request', (request) => {
        if (request.url().includes('/api/')) {
          request.abort('failed');
        } else {
          request.continue();
        }
      });
      
      // Reload page
      await browser.goto(`${frontendUrl}/products`);
      await browser.screenshot('products-error-state');
      
      // Should show error message
      await browser.waitForSelector('[data-testid="error-message"]', { timeout: 5000 });
    });
  });

  describe('Forms', () => {
    test('Login form validation should work', async () => {
      await browser.goto(`${frontendUrl}/login`);
      
      // Try to submit empty form
      await browser.click('button[type="submit"]');
      
      // Should show validation errors
      await browser.waitForSelector('[data-testid="error-message"]');
      await browser.screenshot('login-validation-error');
    });

    test('Contact form should submit', async () => {
      await browser.goto(`${frontendUrl}/contact`);
      
      // Fill form
      await browser.type('input[name="name"]', 'Test User');
      await browser.type('input[name="email"]', 'test@example.com');
      await browser.type('textarea[name="message"]', 'This is a test message');
      
      await browser.screenshot('contact-form-filled');
      
      // Submit form
      await browser.click('button[type="submit"]');
      
      // Should show success message
      await browser.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    });
  });
});