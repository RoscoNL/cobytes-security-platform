const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';

async function createScans() {
  try {
    console.log('🚀 Creating various scans to test the integration...\n');
    
    // Test 1: Subdomain scan
    console.log('1. Creating subdomain scan for cobytes.com...');
    try {
      const subdomainScan = await axios.post(`${BACKEND_URL}/api/scans`, {
        target: 'cobytes.com',
        type: 'subdomain',
        parameters: {
          scan_type: 'light'
        }
      });
      console.log('✅ Subdomain scan created:');
      console.log('   - Scan ID:', subdomainScan.data.data.id);
      console.log('   - Pentest-Tools ID:', subdomainScan.data.data.pentest_tools_scan_id || 'Pending');
      console.log('   - Status:', subdomainScan.data.data.status);
    } catch (error) {
      console.error('❌ Failed:', error.response?.data?.error || error.message);
    }
    
    // Test 2: SSL scan
    console.log('\n2. Creating SSL scan for cobytes.com...');
    try {
      const sslScan = await axios.post(`${BACKEND_URL}/api/scans`, {
        target: 'cobytes.com',
        type: 'ssl',
        parameters: {}
      });
      console.log('✅ SSL scan created:');
      console.log('   - Scan ID:', sslScan.data.data.id);
      console.log('   - Pentest-Tools ID:', sslScan.data.data.pentest_tools_scan_id || 'Pending');
      console.log('   - Status:', sslScan.data.data.status);
    } catch (error) {
      console.error('❌ Failed:', error.response?.data?.error || error.message);
    }
    
    // Test 3: HTTP Headers scan
    console.log('\n3. Creating HTTP Headers scan for https://www.cobytes.com...');
    try {
      const headersScan = await axios.post(`${BACKEND_URL}/api/scans`, {
        target: 'https://www.cobytes.com',
        type: 'http_headers',
        parameters: {
          check_security_headers: true,
          check_server_info: true,
          follow_redirects: true
        }
      });
      console.log('✅ HTTP Headers scan created:');
      console.log('   - Scan ID:', headersScan.data.data.id);
      console.log('   - Pentest-Tools ID:', headersScan.data.data.pentest_tools_scan_id || 'Pending');
      console.log('   - Status:', headersScan.data.data.status);
    } catch (error) {
      console.error('❌ Failed:', error.response?.data?.error || error.message);
    }
    
    // Test 4: WordPress scan with custom type
    console.log('\n4. Creating WordPress scan (custom type) for https://www.cobytes.com...');
    try {
      const wpScan = await axios.post(`${BACKEND_URL}/api/scans`, {
        target: 'https://www.cobytes.com',
        type: 'wordpress',
        parameters: {
          scan_type: 'custom',
          enumerate_users: true,
          enumerate_plugins: true,
          enumerate_themes: true,
          check_vulnerabilities: true
        }
      });
      console.log('✅ WordPress scan created:');
      console.log('   - Scan ID:', wpScan.data.data.id);
      console.log('   - Pentest-Tools ID:', wpScan.data.data.pentest_tools_scan_id || 'Pending');
      console.log('   - Status:', wpScan.data.data.status);
    } catch (error) {
      console.error('❌ Failed:', error.response?.data?.error || error.message);
    }
    
    console.log('\n📋 Summary:');
    console.log('All scans have been created. You can check their status at:');
    console.log(`- ${BACKEND_URL}/api/scans/{id}`);
    console.log('\nOr use the check-pentest-scan.js script with the Pentest-Tools ID:');
    console.log('- node check-pentest-scan.js {pentest-tools-id}');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

createScans();