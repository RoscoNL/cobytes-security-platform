import { BrowserHelper, ApiClient, createTestUser } from '../utils/test-helpers';

describe('Frontend Authentication Flow', () => {
  let browser: BrowserHelper;
  let api: ApiClient;
  let testUser = createTestUser();
  const frontendUrl = process.env.FRONTEND_URL || 'http://frontend-test:3002';
  const backendUrl = process.env.BACKEND_URL || 'http://backend-test:3001';

  beforeAll(async () => {
    // Create test user via API
    api = new ApiClient(backendUrl);
    await api.post('/api/auth/register', {
      email: testUser.email,
      password: testUser.password,
      name: 'Frontend Test User',
    });
  });

  beforeEach(async () => {
    browser = new BrowserHelper();
    await browser.init();
  });

  afterEach(async () => {
    await browser.close();
  });

  test('Complete login flow', async () => {
    // Go to login page
    await browser.goto(`${frontendUrl}/login`);
    await browser.screenshot('auth-1-login-page');

    // Fill login form
    await browser.type('input[type="email"]', testUser.email);
    await browser.type('input[type="password"]', testUser.password);
    await browser.screenshot('auth-2-login-filled');

    // Submit form
    await browser.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await browser.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    await browser.screenshot('auth-3-dashboard');

    // Check user info is displayed
    const userEmail = await browser.getTextContent('[data-testid="user-email"]');
    expect(userEmail).toContain(testUser.email);

    // Check auth token in localStorage
    const page = browser.getPage();
    const token = await page!.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  test('Logout flow', async () => {
    // First login
    await browser.goto(`${frontendUrl}/login`);
    await browser.type('input[type="email"]', testUser.email);
    await browser.type('input[type="password"]', testUser.password);
    await browser.click('button[type="submit"]');
    await browser.waitForSelector('[data-testid="dashboard"]');

    // Click logout
    await browser.click('[data-testid="logout-button"]');
    
    // Should redirect to login
    await browser.waitForSelector('input[type="email"]', { timeout: 5000 });
    await browser.screenshot('auth-4-after-logout');

    // Token should be removed
    const page = browser.getPage();
    const token = await page!.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  test('Protected route redirect', async () => {
    // Try to access dashboard without login
    await browser.goto(`${frontendUrl}/dashboard`);

    // Should redirect to login
    await browser.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    const page = browser.getPage();
    expect(page!.url()).toContain('/login');

    // Should show redirect message
    const message = await browser.getTextContent('[data-testid="redirect-message"]');
    expect(message).toContain('Please login');
  });

  test('Remember me functionality', async () => {
    await browser.goto(`${frontendUrl}/login`);

    // Fill form with remember me checked
    await browser.type('input[type="email"]', testUser.email);
    await browser.type('input[type="password"]', testUser.password);
    await browser.click('input[name="remember"]');
    await browser.screenshot('auth-5-remember-me');

    await browser.click('button[type="submit"]');
    await browser.waitForSelector('[data-testid="dashboard"]');

    // Check if refresh token is stored
    const page = browser.getPage();
    const refreshToken = await page!.evaluate(() => localStorage.getItem('refresh_token'));
    expect(refreshToken).toBeTruthy();
  });

  test('Session persistence', async () => {
    // Login
    await browser.goto(`${frontendUrl}/login`);
    await browser.type('input[type="email"]', testUser.email);
    await browser.type('input[type="password"]', testUser.password);
    await browser.click('button[type="submit"]');
    await browser.waitForSelector('[data-testid="dashboard"]');

    // Get token
    const page = browser.getPage();
    const token = await page!.evaluate(() => localStorage.getItem('auth_token'));

    // Create new page with same token
    const newPage = await browser.init();
    await newPage.evaluateOnNewDocument((token) => {
      localStorage.setItem('auth_token', token);
    }, token);

    // Navigate directly to dashboard
    await browser.goto(`${frontendUrl}/dashboard`);

    // Should stay on dashboard (not redirect to login)
    await browser.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 });
    expect(newPage.url()).toContain('/dashboard');
  });

  test('Invalid credentials error', async () => {
    await browser.goto(`${frontendUrl}/login`);

    // Fill with wrong password
    await browser.type('input[type="email"]', testUser.email);
    await browser.type('input[type="password"]', 'wrong-password');
    await browser.click('button[type="submit"]');

    // Should show error
    await browser.waitForSelector('[data-testid="login-error"]', { timeout: 5000 });
    await browser.screenshot('auth-6-login-error');

    const errorText = await browser.getTextContent('[data-testid="login-error"]');
    expect(errorText).toContain('Invalid credentials');
  });
});