// Test script voor volledig geïmplementeerde Cobytes API
const axios = require('axios');

const API_BASE = 'http://localhost:3001';
let authToken = null;

// Helper functie voor authenticated requests
const apiRequest = async (method, endpoint, data = null, useAuth = false) => {
  const config = {
    method,
    url: `${API_BASE}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (useAuth && authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test alle endpoints
async function testAllEndpoints() {
  console.log('🧪 Testing Cobytes API - Full Implementation\n');
  
  // 1. Test health endpoint
  console.log('1️⃣ Testing Health Check...');
  try {
    const health = await apiRequest('GET', '/health');
    console.log('✅ Health check:', health);
  } catch (error) {
    console.log('❌ Health check failed');
  }
  
  // 2. Test API info
  console.log('\n2️⃣ Testing API Info...');
  try {
    const apiInfo = await apiRequest('GET', '/api');
    console.log('✅ API info:', apiInfo);
  } catch (error) {
    console.log('❌ API info failed');
  }
  
  // 3. Test Authentication
  console.log('\n3️⃣ Testing Authentication...');
  
  // Login with test user
  try {
    const loginResult = await apiRequest('POST', '/api/auth/login', {
      email: 'admin@cobytes.com',
      password: 'admin123'
    });
    console.log('✅ Login successful');
    authToken = loginResult.data.token;
    console.log('   Token received:', authToken.substring(0, 20) + '...');
    console.log('   User:', loginResult.data.user);
  } catch (error) {
    console.log('❌ Login failed');
  }
  
  // Test token verification
  try {
    const verifyResult = await apiRequest('GET', '/api/auth/verify', null, true);
    console.log('✅ Token verification successful');
    console.log('   Token valid until:', verifyResult.data.token.expiresAt);
  } catch (error) {
    console.log('❌ Token verification failed');
  }
  
  // 4. Test Scan endpoints
  console.log('\n4️⃣ Testing Scan Endpoints...');
  
  // Get available scan types
  try {
    const scanTypes = await apiRequest('GET', '/api/scans/types/available', null, true);
    console.log('✅ Available scan types:', scanTypes.data.length);
    scanTypes.data.forEach(type => {
      console.log(`   - ${type.name} (${type.id})`);
    });
  } catch (error) {
    console.log('❌ Get scan types failed');
  }
  
  // Create a new scan
  let createdScanId = null;
  try {
    const newScan = await apiRequest('POST', '/api/scans', {
      scanType: 'web_vulnerability',
      targets: ['https://example.com', 'https://test.example.com'],
      configuration: {
        depth: 3,
        threads: 10
      }
    }, true);
    console.log('✅ Scan created:', newScan.data.scanId);
    createdScanId = newScan.data.scanId;
  } catch (error) {
    console.log('❌ Create scan failed');
  }
  
  // Get all scans
  try {
    const allScans = await apiRequest('GET', '/api/scans', null, true);
    console.log('✅ All scans:', allScans.data.length);
  } catch (error) {
    console.log('❌ Get all scans failed');
  }
  
  // Get specific scan
  if (createdScanId) {
    try {
      const scan = await apiRequest('GET', `/api/scans/${createdScanId}`, null, true);
      console.log('✅ Get scan details:', {
        id: scan.data.scanId,
        status: scan.data.status
      });
    } catch (error) {
      console.log('❌ Get scan details failed');
    }
  }
  
  // 5. Test Report endpoints
  console.log('\n5️⃣ Testing Report Endpoints...');
  
  // Get report templates
  try {
    const templates = await apiRequest('GET', '/api/reports/templates/available', null, true);
    console.log('✅ Available report templates:', templates.data.length);
    templates.data.forEach(template => {
      console.log(`   - ${template.name} (${template.id})`);
    });
  } catch (error) {
    console.log('❌ Get report templates failed');
  }
  
  // Generate a report
  let createdReportId = null;
  if (createdScanId) {
    try {
      const newReport = await apiRequest('POST', '/api/reports/generate', {
        scanIds: [createdScanId],
        format: 'pdf',
        includeDetails: true,
        template: 'executive_summary'
      }, true);
      console.log('✅ Report generation started:', newReport.data.reportId);
      createdReportId = newReport.data.reportId;
    } catch (error) {
      console.log('❌ Generate report failed');
    }
  }
  
  // Get report statistics
  try {
    const stats = await apiRequest('GET', '/api/reports/stats/overview', null, true);
    console.log('✅ Report statistics:', stats.data);
  } catch (error) {
    console.log('❌ Get report statistics failed');
  }
  
  // 6. Test additional endpoints
  console.log('\n6️⃣ Testing Additional Endpoints...');
  
  // Test echo endpoint
  try {
    const echo = await apiRequest('POST', '/api/echo', {
      message: 'Hello Cobytes!',
      timestamp: new Date()
    });
    console.log('✅ Echo endpoint:', echo.body);
  } catch (error) {
    console.log('❌ Echo endpoint failed');
  }
  
  // Test logout
  try {
    await apiRequest('POST', '/api/auth/logout', null, true);
    console.log('✅ Logout successful');
  } catch (error) {
    console.log('❌ Logout failed');
  }
  
  console.log('\n✨ API Testing Complete!');
  
  // Wait for scan to complete
  if (createdScanId) {
    console.log('\n⏳ Waiting 6 seconds for scan to complete...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    try {
      const completedScan = await apiRequest('GET', `/api/scans/${createdScanId}`, null, true);
      console.log('✅ Scan completed:', {
        status: completedScan.data.status,
        vulnerabilities: completedScan.data.results?.summary
      });
    } catch (error) {
      console.log('❌ Could not get completed scan');
    }
  }
}

// Run tests
testAllEndpoints().catch(console.error);