const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: 'test@cobytes.com',
  password: 'Test123!@#'
};

async function testScanAPI() {
  console.log('🔍 Testing Cobytes Security Platform API\n');
  
  try {
    // 1. Login
    console.log('1️⃣ Authenticating...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    const { token } = loginResponse.data;
    console.log('✅ Logged in successfully');
    
    // Configure axios with auth token
    const api = axios.create({
      baseURL: API_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 2. Get available scan types
    console.log('\n2️⃣ Getting scan types...');
    const scanTypesResponse = await api.get('/scans/scan-types');
    const scanTypes = scanTypesResponse.data;
    console.log(`✅ Found ${scanTypes.length} scan types`);
    
    const wordpressScan = scanTypes.find(type => 
      type.name.toLowerCase().includes('wordpress') || 
      type.key === 'wordpress'
    );
    
    if (wordpressScan) {
      console.log(`✅ WordPress scan available: ${wordpressScan.name}`);
    }
    
    // 3. Create a new scan
    console.log('\n3️⃣ Creating WordPress scan...');
    const scanData = {
      type: wordpressScan ? wordpressScan.key : 'wordpress',
      target: 'https://www.cobytes.com',
      options: {}
    };
    
    const createScanResponse = await api.post('/scans', scanData);
    const scan = createScanResponse.data;
    console.log(`✅ Scan created with ID: ${scan.id}`);
    console.log(`   Status: ${scan.status}`);
    
    // 4. Monitor scan progress
    console.log('\n4️⃣ Monitoring scan progress...');
    let isComplete = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!isComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await api.get(`/scans/${scan.id}`);
      const currentScan = statusResponse.data;
      
      console.log(`   Progress: ${currentScan.progress || 0}% - Status: ${currentScan.status}`);
      
      if (currentScan.status === 'completed' || currentScan.status === 'failed') {
        isComplete = true;
        
        if (currentScan.status === 'completed') {
          console.log('✅ Scan completed successfully!');
          
          // 5. Get scan results
          console.log('\n5️⃣ Fetching scan results...');
          if (currentScan.results && currentScan.results.length > 0) {
            console.log(`✅ Found ${currentScan.results.length} results`);
            currentScan.results.slice(0, 3).forEach((result, i) => {
              console.log(`   ${i + 1}. ${result.title || result.type} - Severity: ${result.severity}`);
            });
          } else {
            console.log('⚠️  No results found in scan');
          }
          
          // 6. Generate report
          console.log('\n6️⃣ Generating report...');
          try {
            const reportResponse = await api.post(`/scans/${scan.id}/report`);
            console.log('✅ Report generated:', reportResponse.data);
          } catch (error) {
            console.log('⚠️  Report generation not available:', error.response?.data?.message || error.message);
          }
        } else {
          console.log('❌ Scan failed:', currentScan.error_message);
        }
      }
      
      attempts++;
    }
    
    if (!isComplete) {
      console.log('⚠️  Scan timeout - still running after 60 seconds');
    }
    
    // 7. List all scans
    console.log('\n7️⃣ Listing all scans...');
    const allScansResponse = await api.get('/scans');
    console.log(`✅ Total scans: ${allScansResponse.data.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Check if axios is installed
try {
  require.resolve('axios');
  testScanAPI();
} catch (e) {
  console.log('Installing axios...');
  require('child_process').execSync('npm install axios', { stdio: 'inherit' });
  testScanAPI();
}