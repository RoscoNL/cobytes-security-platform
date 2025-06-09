import { BrowserHelper, ApiClient, createTestUser, waitFor, saveTestArtifact } from '../utils/test-helpers';

describe('End-to-End Platform Tests', () => {
  let browser: BrowserHelper;
  let api: ApiClient;
  let adminApi: ApiClient;
  const frontendUrl = process.env.FRONTEND_URL || 'http://frontend-test:3002';
  const backendUrl = process.env.BACKEND_URL || 'http://backend-test:3001';
  
  const testUser = createTestUser();
  const adminUser = {
    email: 'admin@cobytes.nl',
    password: 'AdminPassword123!',
  };

  beforeAll(async () => {
    api = new ApiClient(backendUrl);
    adminApi = new ApiClient(backendUrl);
    
    // Create admin user if not exists
    try {
      await adminApi.post('/api/auth/register', {
        ...adminUser,
        name: 'Admin User',
        role: 'admin',
      });
    } catch (e) {
      // User might already exist
    }
    
    // Login as admin
    const adminLogin = await adminApi.post('/api/auth/login', adminUser);
    adminApi.setAuthToken(adminLogin.data.token);
    
    // Create regular test user
    const registerResponse = await api.post('/api/auth/register', {
      email: testUser.email,
      password: testUser.password,
      name: 'E2E Test User',
    });
    
    testUser.token = registerResponse.data.token;
    api.setAuthToken(testUser.token);
  });

  beforeEach(async () => {
    browser = new BrowserHelper();
    await browser.init();
  });

  afterEach(async () => {
    await browser.close();
  });

  test('Complete user journey: registration to scan completion', async () => {
    const journeyUser = createTestUser();
    const testResults = {
      startTime: new Date().toISOString(),
      steps: [],
    };

    try {
      // 1. Visit landing page
      await browser.goto(frontendUrl);
      await browser.screenshot('e2e-1-landing');
      testResults.steps.push({ step: 'Landing page loaded', status: 'success' });

      // 2. Navigate to registration
      await browser.click('[data-testid="get-started-button"]');
      await browser.waitForSelector('[data-testid="register-form"]', { timeout: 5000 });
      await browser.screenshot('e2e-2-register-page');

      // 3. Complete registration
      await browser.type('input[name="email"]', journeyUser.email);
      await browser.type('input[name="password"]', journeyUser.password);
      await browser.type('input[name="confirmPassword"]', journeyUser.password);
      await browser.type('input[name="name"]', 'Journey User');
      await browser.screenshot('e2e-3-register-filled');

      await browser.click('button[type="submit"]');
      await browser.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
      testResults.steps.push({ step: 'Registration completed', status: 'success' });

      // 4. Create first scan
      await browser.click('[data-testid="new-scan-button"]');
      await browser.waitForSelector('[data-testid="scan-form"]');
      await browser.type('input[name="target"]', 'https://journey-test.com');
      await browser.click('select[name="type"]');
      await browser.click('option[value="wordpress"]');
      await browser.screenshot('e2e-4-scan-form');

      await browser.click('button[data-testid="start-scan"]');
      await browser.waitForSelector('[data-testid="scan-status"]', { timeout: 10000 });
      testResults.steps.push({ step: 'Scan created', status: 'success' });

      // 5. Wait for scan completion
      const page = browser.getPage();
      const url = page!.url();
      const scanId = url.match(/scans\/(\d+)/)?.[1];

      // Create API client for journey user
      const journeyApi = new ApiClient(backendUrl);
      const loginResponse = await journeyApi.post('/api/auth/login', journeyUser);
      journeyApi.setAuthToken(loginResponse.data.token);

      await waitFor(async () => {
        const response = await journeyApi.get(`/api/scans/${scanId}`);
        return response.data.status === 'completed';
      }, 30000);

      testResults.steps.push({ step: 'Scan completed', status: 'success' });

      // 6. View results
      await browser.goto(`${frontendUrl}/scans/${scanId}`);
      await browser.waitForSelector('[data-testid="scan-results"]');
      await browser.screenshot('e2e-5-scan-results');

      // 7. Generate report
      await browser.click('[data-testid="generate-report"]');
      await browser.waitForSelector('[data-testid="report-ready"]', { timeout: 15000 });
      await browser.screenshot('e2e-6-report');
      testResults.steps.push({ step: 'Report generated', status: 'success' });

      // 8. Test user settings
      await browser.click('[data-testid="user-menu"]');
      await browser.click('[data-testid="settings-link"]');
      await browser.waitForSelector('[data-testid="settings-page"]');
      
      // Update user name
      const nameInput = await page!.$('input[name="name"]');
      await nameInput?.click({ clickCount: 3 }); // Select all
      await browser.type('input[name="name"]', 'Updated Journey User');
      await browser.click('[data-testid="save-settings"]');
      
      await browser.waitForSelector('[data-testid="success-message"]');
      testResults.steps.push({ step: 'User settings updated', status: 'success' });

      testResults.endTime = new Date().toISOString();
      testResults.result = 'success';

    } catch (error) {
      testResults.steps.push({ step: 'Error occurred', status: 'failed', error: error.message });
      testResults.result = 'failed';
      await browser.screenshot('e2e-error');
      throw error;
    } finally {
      saveTestArtifact('e2e-journey-results.json', testResults);
    }
  });

  test('Admin functionality', async () => {
    // Login as admin
    await browser.goto(`${frontendUrl}/login`);
    await browser.type('input[type="email"]', adminUser.email);
    await browser.type('input[type="password"]', adminUser.password);
    await browser.click('button[type="submit"]');
    await browser.waitForSelector('[data-testid="dashboard"]');

    // Navigate to admin panel
    await browser.click('[data-testid="admin-link"]');
    await browser.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 5000 });
    await browser.screenshot('e2e-7-admin-dashboard');

    // Check admin statistics
    const page = browser.getPage();
    const stats = await page!.evaluate(() => {
      return {
        totalUsers: document.querySelector('[data-testid="total-users"]')?.textContent,
        totalScans: document.querySelector('[data-testid="total-scans"]')?.textContent,
        activeScans: document.querySelector('[data-testid="active-scans"]')?.textContent,
      };
    });

    expect(parseInt(stats.totalUsers || '0')).toBeGreaterThan(0);
    expect(parseInt(stats.totalScans || '0')).toBeGreaterThanOrEqual(0);

    // Test user management
    await browser.click('[data-testid="users-tab"]');
    await browser.waitForSelector('[data-testid="users-table"]');
    
    const userCount = await page!.$$eval('[data-testid="user-row"]', els => els.length);
    expect(userCount).toBeGreaterThan(0);

    // Test scan management
    await browser.click('[data-testid="scans-tab"]');
    await browser.waitForSelector('[data-testid="scans-table"]');
    await browser.screenshot('e2e-8-admin-scans');
  });

  test('Performance and load testing', async () => {
    const performanceResults = {
      pageLoadTimes: {},
      apiResponseTimes: {},
      concurrentUsers: 5,
    };

    // Test page load times
    const pages = ['/', '/products', '/pricing', '/login'];
    
    for (const path of pages) {
      const startTime = Date.now();
      await browser.goto(`${frontendUrl}${path}`);
      await browser.waitForSelector('body');
      const loadTime = Date.now() - startTime;
      
      performanceResults.pageLoadTimes[path] = loadTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    }

    // Test API response times
    const endpoints = [
      { method: 'get', path: '/api/health' },
      { method: 'get', path: '/api/products' },
      { method: 'get', path: '/api/scans' },
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await api[endpoint.method](endpoint.path);
      const responseTime = Date.now() - startTime;
      
      performanceResults.apiResponseTimes[endpoint.path] = responseTime;
      expect(responseTime).toBeLessThan(1000); // API should respond within 1 second
      expect(response.status).toBeLessThan(500); // No server errors
    }

    // Simulate concurrent scan creation
    const concurrentScans = Array(performanceResults.concurrentUsers).fill(null).map((_, i) => 
      api.post('/api/scans', {
        target: `https://load-test-${i}.com`,
        type: 'ssl',
      })
    );

    const startTime = Date.now();
    const results = await Promise.allSettled(concurrentScans);
    const totalTime = Date.now() - startTime;

    performanceResults.concurrentScanCreation = {
      totalTime,
      averageTime: totalTime / performanceResults.concurrentUsers,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
    };

    expect(performanceResults.concurrentScanCreation.successful).toBe(performanceResults.concurrentUsers);
    
    saveTestArtifact('e2e-performance-results.json', performanceResults);
  });

  test('Error recovery and edge cases', async () => {
    // Test network failure recovery
    const page = browser.getPage();
    
    // Login first
    await browser.goto(`${frontendUrl}/login`);
    await browser.type('input[type="email"]', testUser.email);
    await browser.type('input[type="password"]', testUser.password);
    await browser.click('button[type="submit"]');
    await browser.waitForSelector('[data-testid="dashboard"]');

    // Simulate network failure
    await page!.setOfflineMode(true);
    
    // Try to create scan
    await browser.click('[data-testid="new-scan-button"]');
    await browser.waitForSelector('[data-testid="offline-message"]', { timeout: 5000 });
    await browser.screenshot('e2e-9-offline');

    // Restore network
    await page!.setOfflineMode(false);
    
    // Retry should work
    await browser.click('[data-testid="retry-button"]');
    await browser.waitForSelector('[data-testid="scan-form"]', { timeout: 5000 });

    // Test session expiry
    // Manually expire token
    await page!.evaluate(() => {
      localStorage.setItem('auth_token', 'expired-token');
    });

    // Try to access protected resource
    await browser.goto(`${frontendUrl}/dashboard`);
    
    // Should redirect to login with message
    await browser.waitForSelector('input[type="email"]', { timeout: 5000 });
    const message = await browser.getTextContent('[data-testid="session-expired-message"]');
    expect(message).toContain('session expired');

    // Test large scan results handling
    // Create scan with many results (mock scanner should generate these)
    const largeResultScan = await api.post('/api/scans', {
      target: 'https://large-results.com',
      type: 'subdomain',
      parameters: { generateLargeResults: true },
    });

    await api.post(`/api/scans/${largeResultScan.data.id}/start`);
    
    await waitFor(async () => {
      const response = await api.get(`/api/scans/${largeResultScan.data.id}`);
      return response.data.status === 'completed';
    }, 30000);

    // Login again and view results
    await browser.type('input[type="email"]', testUser.email);
    await browser.type('input[type="password"]', testUser.password);
    await browser.click('button[type="submit"]');
    await browser.waitForSelector('[data-testid="dashboard"]');

    await browser.goto(`${frontendUrl}/scans/${largeResultScan.data.id}`);
    await browser.waitForSelector('[data-testid="scan-results"]');
    
    // Should have pagination
    await browser.waitForSelector('[data-testid="pagination"]');
    await browser.screenshot('e2e-10-large-results');
  });
});