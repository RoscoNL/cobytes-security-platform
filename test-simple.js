const axios = require('axios');

async function test() {
  try {
    console.log('Testing health endpoint...');
    const response = await axios({
      method: 'GET',
      url: 'http://localhost:3001/health',
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    if (response.status >= 200 && response.status < 300) {
      console.log('✅ Test passed');
    } else {
      console.log('❌ Test failed with status:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

test();