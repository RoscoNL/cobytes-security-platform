const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:3002';

async function testPlatform() {
    console.log('\n🚀 Cobytes Security Platform Manual Test\n');
    
    const results = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    try {
        // Test 1: Frontend is accessible
        console.log('1️⃣ Testing Frontend Access...');
        try {
            const response = await axios.get(FRONTEND_URL);
            if (response.status === 200) {
                console.log('   ✅ Frontend is accessible at', FRONTEND_URL);
                results.tests.push({ name: 'Frontend Access', status: 'success' });
            }
        } catch (error) {
            console.log('   ❌ Frontend not accessible:', error.message);
            results.tests.push({ name: 'Frontend Access', status: 'failed', error: error.message });
        }

        // Test 2: Backend API is accessible
        console.log('\n2️⃣ Testing Backend API...');
        try {
            const response = await axios.get(`${API_URL}/products`);
            if (response.status === 200) {
                console.log('   ✅ Backend API is accessible at', API_URL);
                results.tests.push({ name: 'Backend API Access', status: 'success' });
            }
        } catch (error) {
            console.log('   ❌ Backend API not accessible:', error.message);
            results.tests.push({ name: 'Backend API Access', status: 'failed', error: error.message });
        }

        // Test 3: Login functionality
        console.log('\n3️⃣ Testing Login...');
        try {
            const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                email: 'user@cobytes.com',
                password: 'pass'
            });

            if (loginResponse.data.success && loginResponse.data.data.token) {
                const token = loginResponse.data.data.token;
                console.log('   ✅ Login successful');
                console.log('   📝 User:', loginResponse.data.data.user.email);
                results.tests.push({ name: 'Login', status: 'success' });

                // Test 4: Create a scan
                console.log('\n4️⃣ Testing Scan Creation...');
                try {
                    const scanResponse = await axios.post(`${API_URL}/scans`, {
                        target: 'https://www.cobytes.com',
                        type: 'wordpress'
                    }, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (scanResponse.data.data && scanResponse.data.data.id) {
                        const scanId = scanResponse.data.data.id;
                        console.log('   ✅ Scan created successfully');
                        console.log('   📝 Scan ID:', scanId);
                        console.log('   📝 Status:', scanResponse.data.data.status);
                        results.tests.push({ name: 'Scan Creation', status: 'success', scanId });

                        // Wait and check scan status
                        console.log('\n5️⃣ Checking Scan Progress...');
                        await new Promise(resolve => setTimeout(resolve, 5000));

                        const statusResponse = await axios.get(`${API_URL}/scans/${scanId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        console.log('   📝 Current Status:', statusResponse.data.data.status);
                        console.log('   📝 Progress:', statusResponse.data.data.progress + '%');
                        if (statusResponse.data.data.pentest_tools_scan_id) {
                            console.log('   📝 PentestTools Scan ID:', statusResponse.data.data.pentest_tools_scan_id);
                        }
                        results.tests.push({ name: 'Scan Progress Check', status: 'success' });
                    }
                } catch (error) {
                    console.log('   ❌ Scan creation failed:', error.response?.data || error.message);
                    results.tests.push({ name: 'Scan Creation', status: 'failed', error: error.message });
                }
            }
        } catch (error) {
            console.log('   ❌ Login failed:', error.response?.data || error.message);
            results.tests.push({ name: 'Login', status: 'failed', error: error.message });
        }

        // Test 6: Free scan endpoint
        console.log('\n6️⃣ Testing Free Scan Feature...');
        try {
            // Check if free scan page exists
            const response = await axios.get(`${FRONTEND_URL}/free-scan`);
            if (response.status === 200) {
                console.log('   ✅ Free scan page is accessible');
                results.tests.push({ name: 'Free Scan Page', status: 'success' });
            }
        } catch (error) {
            console.log('   ⚠️  Free scan page may not be accessible directly');
            results.tests.push({ name: 'Free Scan Page', status: 'warning' });
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        results.error = error.message;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const successCount = results.tests.filter(t => t.status === 'success').length;
    const failedCount = results.tests.filter(t => t.status === 'failed').length;
    const warningCount = results.tests.filter(t => t.status === 'warning').length;

    console.log(`✅ Passed: ${successCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`📝 Total Tests: ${results.tests.length}`);

    console.log('\n📌 IMPORTANT NOTES:');
    console.log('   - Frontend is running at:', FRONTEND_URL);
    console.log('   - Backend API is running at:', API_URL);
    console.log('   - Login credentials: user@cobytes.com / pass');
    console.log('   - The "Use test credentials" button on login page fills these in automatically');
    
    if (failedCount > 0) {
        console.log('\n⚠️  Some tests failed. Please check:');
        console.log('   1. Both frontend and backend servers are running');
        console.log('   2. Database is properly initialized');
        console.log('   3. No port conflicts on 3001 (backend) and 3002 (frontend)');
    } else {
        console.log('\n✅ All core functionality is working properly!');
    }

    // Save results
    require('fs').writeFileSync('test-manual-results.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Detailed results saved to: test-manual-results.json');
}

// Run the test
testPlatform().catch(console.error);