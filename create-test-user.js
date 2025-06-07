const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function createTestUser() {
  try {
    // First try to login as admin
    console.log('🔐 Attempting admin login...');
    let adminToken;
    
    try {
      const adminLogin = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@cobytes.com',
        password: 'admin123'
      });
      adminToken = adminLogin.data.token;
      console.log('✅ Admin login successful');
    } catch (error) {
      console.log('❌ Admin login failed, trying to register...');
    }
    
    // Create a test user
    const testUser = {
      email: 'user@cobytes.com',
      password: 'pass',
      name: 'Test User',
      company: 'Cobytes Security Test'
    };
    
    console.log('\n📝 Creating test user...');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
      console.log('✅ User created successfully!');
      console.log('   Token:', registerResponse.data.token);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  User already exists');
      } else {
        console.log('❌ Registration error:', error.response?.data || error.message);
      }
    }
    
    // Try to login with the test user
    console.log('\n🔑 Testing login with user/pass...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'user@cobytes.com',
        password: 'pass'
      });
      
      console.log('✅ Login successful!');
      console.log('   Token:', loginResponse.data.token);
      console.log('   User:', loginResponse.data.user);
      
      // Save credentials to file for reference
      const fs = require('fs');
      fs.writeFileSync('test-credentials.txt', `
Test User Credentials
====================
Email: user@cobytes.com
Password: pass
Token: ${loginResponse.data.token}

Admin Credentials (if available)
================================
Email: admin@cobytes.com
Password: admin123
`);
      
      console.log('\n✅ Credentials saved to test-credentials.txt');
      
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();