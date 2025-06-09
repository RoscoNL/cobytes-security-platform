import { ApiClient, createTestUser, waitFor } from '../utils/test-helpers';

describe('Security Scans API Tests', () => {
  let api: ApiClient;
  let testUser = createTestUser();
  let scanId: number;

  beforeAll(async () => {
    api = new ApiClient();
    
    // Register and login
    await api.post('/api/auth/register', {
      email: testUser.email,
      password: testUser.password,
      name: 'Test Scanner',
    });
    
    const loginResponse = await api.post('/api/auth/login', {
      email: testUser.email,
      password: testUser.password,
    });
    
    api.setAuthToken(loginResponse.data.token);
  });

  describe('Create Scans', () => {
    test('Should create a WordPress scan', async () => {
      const response = await api.post('/api/scans', {
        target: 'https://example.com',
        type: 'wordpress',
        parameters: {},
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('status', 'pending');
      expect(response.data).toHaveProperty('type', 'wordpress');
      
      scanId = response.data.id;
    });

    test('Should create a subdomain scan', async () => {
      const response = await api.post('/api/scans', {
        target: 'example.com',
        type: 'subdomain',
        parameters: {},
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('type', 'subdomain');
    });

    test('Should validate target URL', async () => {
      const response = await api.post('/api/scans', {
        target: 'not-a-valid-url',
        type: 'wordpress',
      });

      expect(response.status).toBe(400);
    });

    test('Should validate scan type', async () => {
      const response = await api.post('/api/scans', {
        target: 'https://example.com',
        type: 'invalid-type',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Get Scans', () => {
    test('Should get all user scans', async () => {
      const response = await api.get('/api/scans');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    test('Should get scan by ID', async () => {
      const response = await api.get(`/api/scans/${scanId}`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', scanId);
    });

    test('Should return 404 for non-existent scan', async () => {
      const response = await api.get('/api/scans/999999');

      expect(response.status).toBe(404);
    });

    test('Should filter scans by status', async () => {
      const response = await api.get('/api/scans?status=pending');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('Should filter scans by type', async () => {
      const response = await api.get('/api/scans?type=wordpress');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      response.data.forEach((scan: any) => {
        expect(scan.type).toBe('wordpress');
      });
    });
  });

  describe('Update Scans', () => {
    test('Should start a scan', async () => {
      const response = await api.post(`/api/scans/${scanId}/start`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'running');
    });

    test('Should get scan progress', async () => {
      // Wait a bit for scan to start
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await api.get(`/api/scans/${scanId}/progress`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('progress');
      expect(response.data.progress).toBeGreaterThanOrEqual(0);
      expect(response.data.progress).toBeLessThanOrEqual(100);
    });

    test('Should cancel a running scan', async () => {
      const response = await api.post(`/api/scans/${scanId}/cancel`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'cancelled');
    });
  });

  describe('Scan Results', () => {
    let completedScanId: number;

    beforeAll(async () => {
      // Create and wait for a scan to complete
      const createResponse = await api.post('/api/scans', {
        target: 'https://example.com',
        type: 'ssl',
        parameters: {},
      });
      
      completedScanId = createResponse.data.id;
      
      // Start the scan
      await api.post(`/api/scans/${completedScanId}/start`);
      
      // Wait for completion (mock scanner should be fast)
      await waitFor(async () => {
        const scan = await api.get(`/api/scans/${completedScanId}`);
        return scan.data.status === 'completed';
      }, 30000);
    });

    test('Should get scan results', async () => {
      const response = await api.get(`/api/scans/${completedScanId}/results`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      response.data.forEach((result: any) => {
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('severity');
        expect(result).toHaveProperty('title');
      });
    });

    test('Should filter results by severity', async () => {
      const response = await api.get(`/api/scans/${completedScanId}/results?severity=high`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Scheduled Scans', () => {
    let scheduledScanId: number;

    test('Should create a scheduled scan', async () => {
      const response = await api.post('/api/scans/scheduled', {
        name: 'Daily WordPress Scan',
        target: 'https://example.com',
        scan_type: 'wordpress',
        frequency: 'daily',
        parameters: {},
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('frequency', 'daily');
      expect(response.data).toHaveProperty('is_active', true);
      
      scheduledScanId = response.data.id;
    });

    test('Should get scheduled scans', async () => {
      const response = await api.get('/api/scans/scheduled');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    test('Should update scheduled scan', async () => {
      const response = await api.put(`/api/scans/scheduled/${scheduledScanId}`, {
        frequency: 'weekly',
        is_active: false,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('frequency', 'weekly');
      expect(response.data).toHaveProperty('is_active', false);
    });

    test('Should delete scheduled scan', async () => {
      const response = await api.delete(`/api/scans/scheduled/${scheduledScanId}`);

      expect(response.status).toBe(200);
      
      // Verify deletion
      const getResponse = await api.get(`/api/scans/scheduled/${scheduledScanId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});