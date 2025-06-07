// test-cobytes-advanced.js
const axios = require('axios');

class CobytesAdvancedTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
      validateStatus: () => true // Don't throw on any status
    });
  }

  async discoverEndpoints() {
    console.log('🔍 Discovering Cobytes Endpoints...\n');
    
    const endpoints = [
      // Base endpoints
      { method: 'GET', path: '/', name: 'Root' },
      { method: 'GET', path: '/health', name: 'Health' },
      { method: 'GET', path: '/api', name: 'API Info' },
      
      // Auth variations
      { method: 'POST', path: '/api/auth', name: 'Auth (POST)' },
      { method: 'POST', path: '/api/auth/login', name: 'Login' },
      { method: 'POST', path: '/api/auth/register', name: 'Register' },
      { method: 'GET', path: '/api/auth/status', name: 'Auth Status' },
      
      // Resource endpoints
      { method: 'GET', path: '/api/users', name: 'Users List' },
      { method: 'GET', path: '/api/users/me', name: 'Current User' },
      { method: 'GET', path: '/api/scans', name: 'Scans List' },
      { method: 'POST', path: '/api/scans', name: 'Create Scan' },
      { method: 'GET', path: '/api/reports', name: 'Reports List' },
      { method: 'GET', path: '/api/organizations', name: 'Organizations' },
      { method: 'GET', path: '/api/admin', name: 'Admin' },
      
      // Additional discovery
      { method: 'GET', path: '/api/tools', name: 'Tools' },
      { method: 'GET', path: '/api/vulnerabilities', name: 'Vulnerabilities' },
      { method: 'GET', path: '/api/settings', name: 'Settings' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }
  }

  async testEndpoint({ method, path, name, data }) {
    try {
      const config = {
        method,
        url: path,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (data) {
        config.data = data;
      }

      const response = await this.client.request(config);
      
      const status = response.status;
      const statusIcon = status < 300 ? '✅' : status < 400 ? '🔄' : status < 500 ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${name.padEnd(20)} [${method} ${path}] - ${status}`);
      
      if (status === 200 && response.data) {
        this.displayResponseSummary(response.data);
      }
      
    } catch (error) {
      console.log(`💥 ${name.padEnd(20)} [${method} ${path}] - Error: ${error.message}`);
    }
  }

  displayResponseSummary(data) {
    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        console.log(`   └─ Response keys: ${keys.join(', ')}`);
      }
    }
  }

  async testAuthFlow() {
    console.log('\n\n🔐 Testing Authentication Flow...\n');
    
    const authAttempts = [
      {
        name: 'Default Admin',
        data: { email: 'admin@cobytes.com', password: 'admin123' }
      },
      {
        name: 'Test User',
        data: { email: 'test@test.com', password: 'test123' }
      },
      {
        name: 'Username variant',
        data: { username: 'admin', password: 'admin' }
      }
    ];

    for (const attempt of authAttempts) {
      console.log(`\nTrying ${attempt.name}:`);
      
      // Try different auth endpoints
      const authEndpoints = ['/api/auth', '/api/auth/login', '/auth/login', '/login'];
      
      for (const endpoint of authEndpoints) {
        const response = await this.client.post(endpoint, attempt.data, {
          validateStatus: () => true
        });
        
        if (response.status === 200) {
          console.log(`✅ Success on ${endpoint}!`);
          console.log('Response:', JSON.stringify(response.data, null, 2));
          return response.data;
        } else if (response.status === 404) {
          // Skip 404s
        } else {
          console.log(`  ${endpoint}: ${response.status} - ${response.data?.message || response.statusText}`);
        }
      }
    }
    
    return null;
  }

  async analyzeServerBehavior() {
    console.log('\n\n📊 Analyzing Server Behavior...\n');
    
    // Test content negotiation
    console.log('Content Type Support:');
    const contentTypes = ['application/json', 'text/html', 'application/xml'];
    
    for (const contentType of contentTypes) {
      const response = await this.client.get('/api', {
        headers: { 'Accept': contentType }
      });
      console.log(`  ${contentType}: ${response.headers['content-type'] || 'not specified'}`);
    }
    
    // Check for API versioning
    console.log('\nAPI Versioning:');
    const versions = ['/api/v1', '/api/v2', '/v1/api', '/v2/api'];
    for (const version of versions) {
      const response = await this.client.get(version);
      console.log(`  ${version}: ${response.status}`);
    }
    
    // Check CORS headers
    console.log('\nCORS Configuration:');
    const response = await this.client.options('/api');
    const corsHeaders = ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers'];
    corsHeaders.forEach(header => {
      if (response.headers[header]) {
        console.log(`  ${header}: ${response.headers[header]}`);
      }
    });
  }
}

// Run the advanced tests
async function runAdvancedTests() {
  const tester = new CobytesAdvancedTester();
  
  console.log('🚀 Cobytes Advanced API Testing\n');
  console.log('================================\n');
  
  await tester.discoverEndpoints();
  await tester.testAuthFlow();
  await tester.analyzeServerBehavior();
  
  console.log('\n\n✨ Advanced Testing Complete!\n');
}

runAdvancedTests().catch(console.error);
