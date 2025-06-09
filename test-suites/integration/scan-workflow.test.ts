import { BrowserHelper, ApiClient, createTestUser, waitFor } from '../utils/test-helpers';

describe('Complete Scan Workflow Integration', () => {
  let browser: BrowserHelper;
  let api: ApiClient;
  let testUser = createTestUser();
  const frontendUrl = process.env.FRONTEND_URL || 'http://frontend-test:3002';
  const backendUrl = process.env.BACKEND_URL || 'http://backend-test:3001';

  beforeAll(async () => {
    // Create and login test user
    api = new ApiClient(backendUrl);
    const registerResponse = await api.post('/api/auth/register', {
      email: testUser.email,
      password: testUser.password,
      name: 'Integration Test User',
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

  test('Complete scan creation and monitoring workflow', async () => {
    // 1. Login via UI
    await browser.goto(`${frontendUrl}/login`);
    await browser.type('input[type="email"]', testUser.email);
    await browser.type('input[type="password"]', testUser.password);
    await browser.click('button[type="submit"]');
    await browser.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    await browser.screenshot('integration-1-dashboard');

    // 2. Navigate to new scan page
    await browser.click('[data-testid="new-scan-button"]');
    await browser.waitForSelector('[data-testid="scan-form"]', { timeout: 5000 });
    await browser.screenshot('integration-2-scan-form');

    // 3. Fill scan form
    await browser.type('input[name="target"]', 'https://example.com');
    await browser.click('select[name="type"]');
    await browser.click('option[value="wordpress"]');
    await browser.screenshot('integration-3-scan-filled');

    // 4. Submit scan
    await browser.click('button[data-testid="start-scan"]');
    
    // 5. Wait for scan to be created
    await browser.waitForSelector('[data-testid="scan-status"]', { timeout: 10000 });
    await browser.screenshot('integration-4-scan-created');

    // 6. Get scan ID from URL
    const page = browser.getPage();
    const url = page!.url();
    const scanId = url.match(/scans\/(\d+)/)?.[1];
    expect(scanId).toBeTruthy();

    // 7. Monitor scan progress via API
    let scan;
    await waitFor(async () => {
      const response = await api.get(`/api/scans/${scanId}`);
      scan = response.data;
      return scan.status === 'completed' || scan.status === 'failed';
    }, 30000);

    // 8. Verify scan completed
    expect(scan.status).toBe('completed');

    // 9. Check UI updated with results
    await browser.goto(`${frontendUrl}/scans/${scanId}`);
    await browser.waitForSelector('[data-testid="scan-results"]', { timeout: 10000 });
    await browser.screenshot('integration-5-scan-results');

    // 10. Verify results are displayed
    const resultsCount = await page!.$$eval('[data-testid="result-item"]', els => els.length);
    expect(resultsCount).toBeGreaterThan(0);
  });

  test('Real-time scan progress updates via WebSocket', async () => {
    // Create scan via API
    const scanResponse = await api.post('/api/scans', {
      target: 'https://test-websocket.com',
      type: 'ssl',
    });
    const scanId = scanResponse.data.id;

    // Login and navigate to scan
    await browser.goto(`${frontendUrl}/login`);
    await browser.type('input[type="email"]', testUser.email);
    await browser.type('input[type="password"]', testUser.password);
    await browser.click('button[type="submit"]');
    await browser.waitForSelector('[data-testid="dashboard"]');

    // Go to scan details
    await browser.goto(`${frontendUrl}/scans/${scanId}`);
    await browser.waitForSelector('[data-testid="scan-progress"]', { timeout: 5000 });

    // Start scan via API
    await api.post(`/api/scans/${scanId}/start`);

    // Monitor progress updates in UI
    const page = browser.getPage();
    let progressUpdates = 0;
    
    await page!.exposeFunction('onProgressUpdate', () => {
      progressUpdates++;
    });

    await page!.evaluate(() => {
      const progressBar = document.querySelector('[data-testid="progress-bar"]');
      if (progressBar) {
        const observer = new MutationObserver(() => {
          (window as any).onProgressUpdate();
        });
        observer.observe(progressBar, { attributes: true, attributeFilter: ['style', 'aria-valuenow'] });
      }
    });

    // Wait for scan to complete
    await waitFor(async () => {
      const response = await api.get(`/api/scans/${scanId}`);
      return response.data.status === 'completed';
    }, 30000);

    // Verify we received progress updates
    expect(progressUpdates).toBeGreaterThan(2);
    await browser.screenshot('integration-6-websocket-updates');
  });

  test('Scan history and filtering', async () => {
    // Create multiple scans via API
    const scanTypes = ['wordpress', 'ssl', 'subdomain'];
    const scanIds = [];
    
    for (const type of scanTypes) {
      const response = await api.post('/api/scans', {
        target: `https://example-${type}.com`,
        type,
      });
      scanIds.push(response.data.id);
    }

    // Login to UI
    await browser.goto(`${frontendUrl}/login`);
    await browser.type('input[type="email"]', testUser.email);
    await browser.type('input[type="password"]', testUser.password);
    await browser.click('button[type="submit"]');
    await browser.waitForSelector('[data-testid="dashboard"]');

    // Go to scans list
    await browser.click('[data-testid="my-scans-link"]');
    await browser.waitForSelector('[data-testid="scans-list"]', { timeout: 5000 });
    await browser.screenshot('integration-7-scans-list');

    // Verify all scans are displayed
    const page = browser.getPage();
    const scanCount = await page!.$$eval('[data-testid="scan-item"]', els => els.length);
    expect(scanCount).toBeGreaterThanOrEqual(3);

    // Test filtering by type
    await browser.click('select[name="type-filter"]');
    await browser.click('option[value="wordpress"]');
    await browser.screenshot('integration-8-filtered-scans');

    // Verify filter works
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for filter
    const filteredCount = await page!.$$eval('[data-testid="scan-item"]', els => els.length);
    expect(filteredCount).toBeLessThan(scanCount);

    // Test search
    await browser.type('input[name="search"]', 'example-ssl');
    await new Promise(resolve => setTimeout(resolve, 500)); // Debounce
    
    const searchResults = await page!.$$eval('[data-testid="scan-item"]', els => els.length);
    expect(searchResults).toBe(1);
  });

  test('Export scan results', async () => {
    // Create and complete a scan
    const scanResponse = await api.post('/api/scans', {
      target: 'https://export-test.com',
      type: 'wordpress',
    });
    const scanId = scanResponse.data.id;
    
    await api.post(`/api/scans/${scanId}/start`);
    
    // Wait for completion
    await waitFor(async () => {
      const response = await api.get(`/api/scans/${scanId}`);
      return response.data.status === 'completed';
    }, 30000);

    // Login and navigate to scan
    await browser.goto(`${frontendUrl}/login`);
    await browser.type('input[type="email"]', testUser.email);
    await browser.type('input[type="password"]', testUser.password);
    await browser.click('button[type="submit"]');
    await browser.waitForSelector('[data-testid="dashboard"]');

    await browser.goto(`${frontendUrl}/scans/${scanId}`);
    await browser.waitForSelector('[data-testid="scan-results"]');

    // Test PDF export
    const page = browser.getPage();
    
    // Set up download handling
    const downloadPromise = new Promise((resolve) => {
      page!.once('download', async (download) => {
        const path = `/app/test-reports/scan-${scanId}.pdf`;
        await download.saveAs(path);
        resolve(path);
      });
    });

    // Click export button
    await browser.click('[data-testid="export-pdf"]');
    
    // Wait for download
    const downloadPath = await downloadPromise;
    expect(downloadPath).toBeTruthy();
    await browser.screenshot('integration-9-export-complete');
  });
});