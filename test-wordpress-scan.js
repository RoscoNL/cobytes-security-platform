const axios = require('axios');
const WebSocket = require('ws');

const API_URL = 'http://localhost:3001/api/v1';
let authToken = null;
let userId = null;

// Step 1: Register/Login
async function authenticate() {
  try {
    // Try to register first
    const registerData = {
      email: 'test@cobytes.com',
      password: 'TestPassword123!',
      name: 'Test User'
    };
    
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, registerData);
      console.log('✅ User registered successfully');
      authToken = registerResponse.data.data.tokens.accessToken;
      userId = registerResponse.data.data.user.id;
    } catch (err) {
      // If registration fails, try login
      if (err.response && err.response.status === 409) {
        console.log('📝 User exists, logging in...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: registerData.email,
          password: registerData.password
        });
        authToken = loginResponse.data.data.tokens.accessToken;
        userId = loginResponse.data.data.user.id;
        console.log('✅ Logged in successfully');
      } else {
        throw err;
      }
    }
    
    return authToken;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

// Step 2: Start WordPress scan
async function startWordPressScan() {
  try {
    const scanData = {
      target: 'https://www.cobytes.com',
      type: 'wordpress',
      parameters: {
        scan_type: 'light',
        enumerate: {
          users: true,
          plugins: true,
          themes: true,
          timthumbs: true,
          config_backups: true,
          db_exports: true,
          medias: false
        }
      }
    };
    
    console.log('\n🔍 Starting WordPress scan for:', scanData.target);
    
    const response = await axios.post(`${API_URL}/scans`, scanData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const scan = response.data.data;
    console.log('✅ Scan started successfully');
    console.log('📊 Scan ID:', scan.id);
    console.log('🔗 External scan ID:', scan.externalScanId);
    
    return scan;
  } catch (error) {
    console.error('❌ Failed to start scan:', error.response?.data || error.message);
    throw error;
  }
}

// Step 3: Monitor scan progress with WebSocket
function monitorScanProgress(scanId) {
  return new Promise((resolve, reject) => {
    console.log('\n📡 Connecting to WebSocket for real-time updates...');
    
    const ws = new WebSocket('ws://localhost:3001', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      
      // Subscribe to scan updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: `scan:${scanId}`
      }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'scan:update') {
        const scan = message.data;
        console.log(`\n📊 Scan Progress: ${scan.progress}%`);
        console.log(`   Status: ${scan.status}`);
        console.log(`   Stage: ${scan.stage || 'Processing'}`);
        
        if (scan.status === 'completed') {
          console.log('\n✅ Scan completed!');
          ws.close();
          resolve(scan);
        } else if (scan.status === 'failed') {
          console.log('\n❌ Scan failed!');
          ws.close();
          reject(new Error('Scan failed'));
        }
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      reject(error);
    });
    
    // Also poll API for updates as backup
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/scans/${scanId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const scan = response.data.data;
        console.log(`📊 API Poll - Progress: ${scan.progress}%, Status: ${scan.status}`);
        
        if (scan.status === 'completed' || scan.status === 'failed') {
          clearInterval(pollInterval);
          if (!ws.readyState === WebSocket.CLOSED) {
            ws.close();
          }
          if (scan.status === 'completed') {
            resolve(scan);
          } else {
            reject(new Error('Scan failed'));
          }
        }
      } catch (error) {
        console.error('❌ Poll error:', error.message);
      }
    }, 5000);
  });
}

// Step 4: Generate PDF report
async function generatePDFReport(scanId) {
  try {
    console.log('\n📄 Generating PDF report...');
    
    const response = await axios.get(`${API_URL}/reports/${scanId}/pdf`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      responseType: 'arraybuffer'
    });
    
    const fs = require('fs');
    const filename = `wordpress-scan-report-${scanId}.pdf`;
    fs.writeFileSync(filename, response.data);
    
    console.log(`✅ PDF report saved as: ${filename}`);
    return filename;
  } catch (error) {
    console.error('❌ Failed to generate PDF report:', error.response?.data || error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting WordPress Security Scan Demo\n');
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Start scan
    const scan = await startWordPressScan();
    
    // Step 3: Monitor progress
    const completedScan = await monitorScanProgress(scan.id);
    
    // Step 4: Generate report
    const reportFile = await generatePDFReport(scan.id);
    
    console.log('\n✨ Scan completed successfully!');
    console.log(`📊 Results: ${completedScan.resultSummary?.total_findings || 0} findings`);
    console.log(`📄 Report: ${reportFile}`);
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
main();