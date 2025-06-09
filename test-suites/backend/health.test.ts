import { ApiClient } from '../utils/test-helpers';

describe('Backend Health Tests', () => {
  let api: ApiClient;

  beforeAll(() => {
    api = new ApiClient();
  });

  test('Health endpoint should return 200', async () => {
    const response = await api.get('/api/health');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'ok');
  });

  test('Database connection should be healthy', async () => {
    const response = await api.get('/api/system/database-health');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('database', 'connected');
  });

  test('Redis connection should be healthy', async () => {
    const response = await api.get('/api/system/redis-health');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('redis', 'connected');
  });

  test('API should handle 404 properly', async () => {
    const response = await api.get('/api/non-existent-endpoint');
    expect(response.status).toBe(404);
  });

  test('CORS headers should be present', async () => {
    const response = await api.get('/api/health');
    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });
});