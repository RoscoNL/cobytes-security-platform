const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function debugScanCreation() {
  try {
    // Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'user@cobytes.com',
      password: 'pass'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Logged in\n');
    
    // Create API client with auth
    const api = axios.create({
      baseURL: API_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Get scan types
    console.log('2. Getting scan types...');
    const scanTypesResponse = await api.get('/scans/scan-types');
    console.log('Scan types response structure:', {
      status: scanTypesResponse.status,
      dataKeys: Object.keys(scanTypesResponse.data),
      dataLength: scanTypesResponse.data.data?.length || scanTypesResponse.data.length
    });
    
    // Try to create a scan
    console.log('\n3. Creating a scan...');
    const scanData = {
      type: 'ssl',
      target: 'cobytes.com',
      name: 'Test SSL Scan',
      parameters: {}
    };
    
    console.log('Sending scan data:', scanData);
    
    const createResponse = await api.post('/scans', scanData);
    
    console.log('\nCreate scan response:');
    console.log('Status:', createResponse.status);
    console.log('Response structure:', JSON.stringify(createResponse.data, null, 2));
    
    // Extract scan ID properly
    const scan = createResponse.data.data || createResponse.data;
    console.log('\nExtracted scan object:', scan);
    console.log('Scan ID:', scan.id);
    
    // If we have an ID, try to get status
    if (scan.id) {
      console.log('\n4. Getting scan status...');
      const statusResponse = await api.get(`/scans/${scan.id}`);
      console.log('Status response:', JSON.stringify(statusResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

debugScanCreation();