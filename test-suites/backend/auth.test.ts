import { ApiClient, createTestUser } from '../utils/test-helpers';

describe('Authentication Tests', () => {
  let api: ApiClient;
  let testUser = createTestUser();

  beforeAll(() => {
    api = new ApiClient();
  });

  describe('User Registration', () => {
    test('Should register a new user successfully', async () => {
      const response = await api.post('/api/auth/register', {
        email: testUser.email,
        password: testUser.password,
        name: 'Test User',
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(testUser.email);
      expect(response.data).toHaveProperty('token');
    });

    test('Should not register duplicate email', async () => {
      const response = await api.post('/api/auth/register', {
        email: testUser.email,
        password: testUser.password,
        name: 'Test User 2',
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('message');
    });

    test('Should validate email format', async () => {
      const response = await api.post('/api/auth/register', {
        email: 'invalid-email',
        password: testUser.password,
        name: 'Test User',
      });

      expect(response.status).toBe(400);
    });

    test('Should validate password strength', async () => {
      const response = await api.post('/api/auth/register', {
        email: 'another@example.com',
        password: '123',
        name: 'Test User',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('User Login', () => {
    test('Should login with valid credentials', async () => {
      const response = await api.post('/api/auth/login', {
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
      
      testUser.token = response.data.token;
    });

    test('Should fail with invalid password', async () => {
      const response = await api.post('/api/auth/login', {
        email: testUser.email,
        password: 'wrong-password',
      });

      expect(response.status).toBe(401);
    });

    test('Should fail with non-existent email', async () => {
      const response = await api.post('/api/auth/login', {
        email: 'nonexistent@example.com',
        password: testUser.password,
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Protected Routes', () => {
    test('Should access protected route with valid token', async () => {
      api.setAuthToken(testUser.token!);
      const response = await api.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('email', testUser.email);
    });

    test('Should fail without token', async () => {
      const unauthApi = new ApiClient();
      const response = await unauthApi.get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    test('Should fail with invalid token', async () => {
      const unauthApi = new ApiClient();
      unauthApi.setAuthToken('invalid-token');
      const response = await unauthApi.get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('Logout', () => {
    test('Should logout successfully', async () => {
      api.setAuthToken(testUser.token!);
      const response = await api.post('/api/auth/logout');

      expect(response.status).toBe(200);
    });
  });
});