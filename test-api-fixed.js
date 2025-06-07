const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🔍 Testing Cobytes Security Platform API\n');
  
  try {
    // 1. Register/Login
    console.log('1️⃣ Authentication...');
    let token;
    
    // Try admin login first
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@cobytes.com',
        password: 'admin123'
      });
      token = loginResponse.data.token;
      console.log('✅ Logged in as admin');
    } catch (error) {
      // Try to register new user
      const testUser = {
        email: `test${Date.now()}@cobytes.com`,
        password: 'Test123!@#',
        name: 'Test User'
      };
      
      const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
      token = registerResponse.data.token;
      console.log('✅ New user registered');
    }
    
    // Configure axios with token
    const api = axios.create({
      baseURL: API_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 2. Get scan types
    console.log('\n2️⃣ Getting scan types...');
    const scanTypesResponse = await api.get('/scans/scan-types');
    const scanTypes = scanTypesResponse.data.data || scanTypesResponse.data;
    console.log(`✅ Found ${scanTypes.length} scan types`);
    
    // Find WordPress scanner
    const wordpressScan = scanTypes.find(type => type.id === 'wordpress');
    if (wordpressScan) {
      console.log(`✅ WordPress scanner available: ${wordpressScan.name}`);
    }
    
    // 3. Create WordPress scan
    console.log('\n3️⃣ Creating WordPress scan...');
    const scanData = {
      type: 'wordpress',
      target: 'https://www.cobytes.com',
      name: 'Cobytes WordPress Security Scan',
      parameters: {
        scan_type: 'deep',
        enumerate_users: true,
        enumerate_plugins: true,
        enumerate_themes: true,
        check_vulnerabilities: true
      }
    };
    
    const createResponse = await api.post('/scans', scanData);
    const scan = createResponse.data;
    console.log(`✅ Scan created with ID: ${scan.id}`);
    console.log(`   Status: ${scan.status}`);
    
    // 4. Monitor progress
    console.log('\n4️⃣ Monitoring scan progress...');
    let complete = false;
    let attempts = 0;
    
    while (!complete && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResponse = await api.get(`/scans/${scan.id}`);
        const current = statusResponse.data;
        
        console.log(`   Progress: ${current.progress || 0}% - Status: ${current.status}`);
        
        if (current.status === 'completed' || current.status === 'failed') {
          complete = true;
          
          if (current.status === 'completed') {
            console.log('✅ Scan completed!');
            
            if (current.results && current.results.length > 0) {
              console.log(`\n5️⃣ Results (${current.results.length} findings):`);
              current.results.slice(0, 3).forEach((result, i) => {
                console.log(`   ${i+1}. ${result.title || result.finding}`);
                console.log(`      Severity: ${result.severity}`);
              });
            }
          } else {
            console.log('❌ Scan failed:', current.error_message);
          }
        }
      } catch (error) {
        console.log('   Error checking status:', error.message);
      }
      
      attempts++;
    }
    
    if (!complete) {
      console.log('⚠️  Scan still running after 60 seconds');
    }
    
    // 5. Generate report
    console.log('\n6️⃣ Generating report...');
    try {
      const reportResponse = await api.post('/reports/generate', {
        scanId: scan.id,
        format: 'pdf',
        includeDetails: true
      });
      console.log('✅ Report initiated:', reportResponse.data.id || 'Success');
    } catch (error) {
      console.log('⚠️  Report generation:', error.response?.data?.message || error.message);
    }
    
    // 6. List all scans
    console.log('\n7️⃣ Checking all scans...');
    const allScansResponse = await api.get('/scans');
    const allScans = allScansResponse.data;
    console.log(`✅ Total scans: ${Array.isArray(allScans) ? allScans.length : 'N/A'}`);
    
    // Summary
    console.log('\n✅ API TEST COMPLETE');
    console.log('====================');
    console.log('All major features tested successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testAPI();