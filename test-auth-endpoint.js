const axios = require('axios');

async function testAuthEndpoint() {
    console.log('Testing authentication endpoint...\n');
    
    const baseUrl = 'http://localhost:3001';
    const credentials = {
        email: 'user@cobytes.com',
        password: 'pass'
    };
    
    // Test different endpoint combinations
    const endpoints = [
        '/auth/login',
        '/api/auth/login',
        '/login',
        '/api/login'
    ];
    
    for (const endpoint of endpoints) {
        console.log(`Testing ${baseUrl}${endpoint}...`);
        try {
            const response = await axios.post(`${baseUrl}${endpoint}`, credentials, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ SUCCESS: ${endpoint}`);
            console.log('Response:', response.data);
            console.log('---');
            return; // Exit on first success
        } catch (error) {
            console.log(`❌ FAILED: ${endpoint}`);
            console.log(`Status: ${error.response?.status || 'No response'}`);
            console.log(`Error: ${error.response?.data?.message || error.message}`);
            console.log('---');
        }
    }
    
    // If we get here, none of the endpoints worked
    console.log('\n⚠️  None of the authentication endpoints worked.');
    console.log('The backend might not be properly configured or the user might not exist.');
}

testAuthEndpoint();