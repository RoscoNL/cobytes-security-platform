#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Direct API test without authentication
async function testDirectScans() {
  console.log('🚀 Testing direct scan creation\n');
  
  const API_URL = 'http://localhost:3001/api';
  const TARGET = 'https://www.cobytes.com';
  
  // Test 1: Create WordPress scan
  console.log('1️⃣ Creating WordPress scan...');
  try {
    const response = await axios.post(`${API_URL}/scans`, {
      target: TARGET,
      type: 'wordpress',
      parameters: {}
    });
    
    console.log('✅ WordPress scan created:', response.data);
  } catch (error) {
    console.error('❌ WordPress scan failed:');
    console.error('   Status:', error.response?.status);
    console.error('   Error:', error.response?.data || error.message);
  }
  
  // Test 2: Check scan endpoint
  console.log('\n2️⃣ Testing GET /scans endpoint...');
  try {
    const response = await axios.get(`${API_URL}/scans`);
    console.log('✅ GET /scans successful:', response.data);
  } catch (error) {
    console.error('❌ GET /scans failed:', error.response?.status, error.response?.data || error.message);
  }
  
  // Test 3: Check if database is working
  console.log('\n3️⃣ Testing system status...');
  try {
    const response = await axios.get(`${API_URL}/system/health`);
    console.log('✅ System health:', response.data);
  } catch (error) {
    console.error('❌ System health check failed:', error.response?.status, error.response?.data || error.message);
  }
}

testDirectScans().catch(console.error);