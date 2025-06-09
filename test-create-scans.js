const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: 'admin@cobytes.com',
  password: 'admin123'
};

const SCAN_CONFIGS = [
  {
    name: 'WordPress Scan',
    target: 'https://www.cobytes.com',
    type: 'wordpress',
    description: 'WordPress vulnerability scan for Cobytes website'
  },
  {
    name: 'SSL/TLS Scan', 
    target: 'https://www.google.com',
    type: 'ssl',
    description: 'SSL/TLS configuration analysis'
  },
  {
    name: 'Website Security Scan',
    target: 'https://example.com',
    type: 'website',
    description: 'Comprehensive website security scan'
  }
];

async function createScans() {
  try {
    // Step 1: Login to get token
    console.log('🔑 Logging in...');
    const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Create scans
    const createdScans = [];
    
    for (const scanConfig of SCAN_CONFIGS) {
      console.log(`🔄 Creating ${scanConfig.name}...`);
      
      try {
        const scanResponse = await axios.post(
          `${BACKEND_URL}/scans`,
          {
            target: scanConfig.target,
            type: scanConfig.type
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (scanResponse.data.data) {
          const scan = scanResponse.data.data;
          console.log(`✅ Created - ID: ${scan.id}`);
          console.log(`   Target: ${scan.target}`);
          console.log(`   Type: ${scan.type}`);
          console.log(`   Status: ${scan.status}`);
          console.log(`   Pentest Tools ID: ${scan.pentest_tools_scan_id || 'Not assigned yet'}\n`);
          
          createdScans.push({
            ...scanConfig,
            ...scan
          });
        }
      } catch (error) {
        console.log(`❌ Failed to create: ${error.response?.data?.message || error.message}\n`);
      }
    }

    // Step 3: Check scan status after a few seconds
    if (createdScans.length > 0) {
      console.log('⏳ Waiting 5 seconds before checking status...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('📊 Checking scan status:');
      
      for (const scan of createdScans) {
        try {
          const statusResponse = await axios.get(
            `${BACKEND_URL}/scans/${scan.id}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          const scanData = statusResponse.data.data;
          console.log(`\n${scan.name} (ID: ${scan.id}):`);
          console.log(`   Status: ${scanData.status}`);
          console.log(`   Progress: ${scanData.progress}%`);
          console.log(`   Pentest Tools ID: ${scanData.pentest_tools_scan_id || 'Not assigned'}`);
          console.log(`   Results: ${scanData.results?.length || 0} findings`);
          
        } catch (error) {
          console.log(`❌ ${scan.name}: Error - ${error.message}`);
        }
      }
      
      // Check if they're actually in Pentest-tools
      console.log('\n🔍 Verifying Pentest-tools integration:');
      console.log(`USE_MOCK_SCANNER is: ${process.env.USE_MOCK_SCANNER || 'not set (defaulting to backend config)'}`);
      
      const hasPentestIds = createdScans.some(scan => scan.pentest_tools_scan_id);
      if (hasPentestIds) {
        console.log('✅ Scans are being created in Pentest-tools!');
      } else {
        console.log('⚠️  No Pentest-tools IDs found - scans may be using mock scanner');
        console.log('   Check backend .env file: USE_MOCK_SCANNER should be "false"');
      }
    }

    console.log('\n✨ Test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
console.log('🚀 Testing scan creation...\n');
createScans();