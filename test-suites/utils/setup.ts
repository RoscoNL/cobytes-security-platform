import axios from 'axios';

// Global test setup
beforeAll(async () => {
  // Set default axios config
  axios.defaults.validateStatus = () => true; // Don't throw on any status
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.BACKEND_URL = process.env.BACKEND_URL || 'http://backend-test:3001';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://frontend-test:3002';
});

// Clean up after all tests
afterAll(async () => {
  // Close any open connections
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Add custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});