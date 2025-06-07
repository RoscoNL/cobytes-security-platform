// test-api-client.js
const axios = require('axios');

class CobytesTestClient {
  constructor(baseUrl = 'http://localhost:3001') {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async testHealth() {
    try {
      const response = await this.client.get('/health');
      console.log('✅ Health Check:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Health Check Failed:', error.message);
      throw error;
    }
  }

  async testAPI() {
    try {
      const response = await this.client.get('/api');
      console.log('✅ API Info:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Info Failed:', error.message);
      throw error;
    }
  }

  async testAuth(email, password) {
    try {
      const response = await this.client.post('/api/auth', {
        email,
        password
      });
      console.log('✅ Auth Success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Auth Failed:', error.response?.data || error.message);
      return null;
    }
  }

  async testProtectedEndpoint(endpoint, token) {
    try {
      const response = await this.client.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`✅ ${endpoint}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ ${endpoint} Failed:`, error.response?.status, error.response?.data || error.message);
      return null;
    }
  }
}

// PentestTools Mock Test (zonder echte API key)
class PentestToolsMockTest {
  constructor() {
    this.tools = {
      SUBDOMAIN_FINDER: 20,
      TCP_PORT_SCANNER: 70,
      WEBSITE_SCANNER: 170,
      API_SCANNER: 510,
      CLOUD_SCANNER: 520
    };
  }

  displayAvailableTools() {
    console.log('\n📋 PentestTools Available Scanners:');
    Object.entries(this.tools).forEach(([name, id]) => {
      console.log(`  - ${name}: ${id}`);
    });
  }

  generateSampleRequest(toolId, target) {
    const requests = {
      170: { // Website Scanner
        tool_id: 170,
        target_name: target,
        tool_params: {
          scan_type: 'full_new',
          follow_redirects: true
        }
      },
      510: { // API Scanner
        tool_id: 510,
        target_name: target,
        tool_params: {
          spec_url: `${target}/openapi.json`,
          authentication_headers: {
            'Authorization': 'Bearer YOUR_TOKEN'
          }
        }
      },
      70: { // Port Scanner
        tool_id: 70,
        target_name: target,
        tool_params: {
          port_range: '1-1000',
          scan_speed: 'normal'
        }
      }
    };

    return requests[toolId] || null;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting API Client Tests\n');
  
  // Test Cobytes API
  console.log('=== COBYTES API TESTS ===\n');
  const cobytes = new CobytesTestClient();
  
  await cobytes.testHealth();
  await cobytes.testAPI();
  
  // Try auth with dummy credentials
  console.log('\n📧 Testing Authentication...');
  const authResult = await cobytes.testAuth('test@example.com', 'password123');
  
  if (authResult && authResult.token) {
    console.log('\n🔒 Testing Protected Endpoints...');
    await cobytes.testProtectedEndpoint('/api/users', authResult.token);
    await cobytes.testProtectedEndpoint('/api/scans', authResult.token);
    await cobytes.testProtectedEndpoint('/api/reports', authResult.token);
  } else {
    console.log('\n⚠️  No auth token received, skipping protected endpoints');
  }

  // Display PentestTools info
  console.log('\n\n=== PENTESTTOOLS API INFO ===\n');
  const ptTools = new PentestToolsMockTest();
  ptTools.displayAvailableTools();
  
  console.log('\n📝 Sample API Requests:');
  const sampleRequests = [
    { tool: 'Website Scanner', id: 170 },
    { tool: 'API Scanner', id: 510 },
    { tool: 'Port Scanner', id: 70 }
  ];
  
  sampleRequests.forEach(({ tool, id }) => {
    const request = ptTools.generateSampleRequest(id, 'https://example.com');
    console.log(`\n${tool} Request:`);
    console.log(JSON.stringify(request, null, 2));
  });

  console.log('\n\n✅ Test Suite Completed!');
}

// Check if axios is installed
try {
  require('axios');
  runTests().catch(console.error);
} catch (error) {
  console.log('📦 Installing axios...');
  require('child_process').execSync('npm install axios', { stdio: 'inherit' });
  console.log('✅ Axios installed, please run again!');
}
