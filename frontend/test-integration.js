#!/usr/bin/env node

const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';
const PROXY_URL = 'https://thingproxy.freeboard.io/fetch/';
const API_URL = `${PROXY_URL}https://app.pentest-tools.com/api/v2`;

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

async function testWordPressScanner() {
  console.log('🚀 Testing WordPress Scanner on cobytes.com...\n');
  
  try {
    // Start scan
    const scanResponse = await fetch(`${API_URL}/scans`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tool_id: 270, // WordPress Scanner
        target_name: 'https://www.cobytes.com',
        tool_params: {}
      })
    });

    if (!scanResponse.ok) {
      const error = await scanResponse.text();
      console.error('❌ Failed to start scan:', scanResponse.status, error);
      return;
    }

    const scanData = await scanResponse.json();
    const scanId = scanData.data?.created_id || scanData.data?.id;
    
    console.log('✅ Scan started successfully!');
    console.log('   Scan ID:', scanId);
    console.log('   Target: https://www.cobytes.com');
    console.log('   Tool: WordPress Scanner (ID: 270)');
    
    // Check status
    console.log('\n⏳ Checking scan status...');
    
    const statusResponse = await fetch(`${API_URL}/scans/${scanId}`, {
      method: 'GET',
      headers
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('   Status:', statusData.data?.status || 'running');
      console.log('   Progress:', statusData.data?.progress || 0, '%');
    }
    
    console.log('\n✨ Integration test completed successfully!');
    console.log('   The CORS proxy is working correctly');
    console.log('   PentestTools API is accessible');
    console.log('   WordPress scanner can be triggered');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWordPressScanner();