#!/usr/bin/env node

const axios = require('axios');

async function testAuthentication() {
  console.log('🔐 Testing authentication with real database\n');
  
  const API_URL = 'http://localhost:3001/api';
  
  // Test credentials
  const credentials = {
    email: 'test@cobytes.com',
    password: 'test123'
  };
  
  console.log('📧 Testing login with:', credentials.email);
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    
    console.log('✅ Login successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    const token = response.data.data.token;
    console.log('\n🎫 Token received:', token.substring(0, 50) + '...');
    
    // Test authenticated endpoint
    console.log('\n🔍 Testing authenticated endpoint...');
    const verifyResponse = await axios.get(`${API_URL}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Token verification successful!');
    console.log('👤 User data:', JSON.stringify(verifyResponse.data.data.user, null, 2));
    
    // Test creating a scan with authentication
    console.log('\n📊 Creating authenticated scan...');
    const scanResponse = await axios.post(
      `${API_URL}/scans`,
      {
        target: 'https://www.cobytes.com',
        type: 'wordpress',
        parameters: {}
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Scan created successfully!');
    console.log('🔍 Scan data:', JSON.stringify(scanResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Authentication test failed:');
    console.error('   Status:', error.response?.status);
    console.error('   Error:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('   Details:', error.response.data.message);
    }
  }
}

// Wait a bit for server to start
setTimeout(() => {
  testAuthentication().catch(console.error);
}, 2000);