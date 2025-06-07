const axios = require('axios');

async function testProxy() {
  console.log('Testing direct PentestTools API call...');
  
  try {
    // Test direct call first
    const directResponse = await axios({
      method: 'GET',
      url: 'https://app.pentest-tools.com/api/v2/targets',
      headers: {
        'Authorization': 'Bearer 43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      validateStatus: () => true
    });
    
    console.log('Direct API Response:', {
      status: directResponse.status,
      statusText: directResponse.statusText,
      dataType: typeof directResponse.data,
      hasData: !!directResponse.data,
      dataLength: JSON.stringify(directResponse.data).length
    });

    // Test proxy call
    console.log('\nTesting proxy call...');
    const proxyResponse = await axios({
      method: 'GET',
      url: 'http://localhost:3001/api/proxy/pentest-tools/targets',
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true
    });
    
    console.log('Proxy Response:', {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      dataType: typeof proxyResponse.data,
      hasData: !!proxyResponse.data,
      dataLength: JSON.stringify(proxyResponse.data).length,
      data: proxyResponse.data
    });

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testProxy();