const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function testScanAPI() {
  try {
    console.log('Testing Cobytes Security Platform API...\n');
    
    // Test 1: Health check
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is healthy:', healthResponse.data, '\n');
    
    // Test 2: Get available scan types
    console.log('2. Getting available scan types...');
    const scanTypesResponse = await axios.get(`${BACKEND_URL}/api/v1/scans/types`);
    console.log('✅ Found', scanTypesResponse.data.data.length, 'scan types');
    console.log('Available scan types:', scanTypesResponse.data.data.map(t => t.name).slice(0, 5).join(', '), '...\n');
    
    // Test 3: Create a subdomain scan
    console.log('3. Creating a subdomain scan...');
    const scanResponse = await axios.post(`${BACKEND_URL}/api/v1/scans`, {
      target: 'example.com',
      type: 'subdomain',
      parameters: {
        scan_type: 'light',
        web_details: true,
        whois: false,
        unresolved_results: false
      }
    });
    console.log('✅ Scan created successfully!');
    console.log('Scan ID:', scanResponse.data.data.id);
    console.log('Status:', scanResponse.data.data.status);
    console.log('Target:', scanResponse.data.data.target, '\n');
    
    // Test 4: Check scan status
    const scanId = scanResponse.data.data.id;
    console.log('4. Checking scan status...');
    
    let attempts = 0;
    let scanStatus;
    
    while (attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      const statusResponse = await axios.get(`${BACKEND_URL}/api/v1/scans/${scanId}`);
      scanStatus = statusResponse.data.data;
      
      console.log(`Status: ${scanStatus.status} (Progress: ${scanStatus.progress}%)`);
      
      if (scanStatus.status === 'completed' || scanStatus.status === 'failed') {
        break;
      }
      
      attempts++;
    }
    
    if (scanStatus.status === 'completed') {
      console.log('\n✅ Scan completed successfully!');
      console.log('Results:', scanStatus.results?.length || 0, 'findings');
      
      if (scanStatus.results && scanStatus.results.length > 0) {
        console.log('\nSample results:');
        scanStatus.results.slice(0, 3).forEach(result => {
          console.log(`- ${result.title}: ${result.description}`);
        });
      }
    } else {
      console.log('\n⚠️  Scan status:', scanStatus.status);
      if (scanStatus.error_message) {
        console.log('Error:', scanStatus.error_message);
      }
    }
    
    console.log('\n🎉 Integration test completed!');
    
  } catch (error) {
    console.error('❌ API Test Failed:');
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

// Run the test
testScanAPI();