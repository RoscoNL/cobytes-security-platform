const axios = require('axios');

async function createDemoScanWithResults() {
  console.log('Creating demo scan with proper result structure...');
  
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@cobytes.com',
      password: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Logged in successfully');
    
    // Create a demo scan
    const scanResponse = await axios.post('http://localhost:3001/api/scans', {
      target: 'https://demo.example.com',
      type: 'website'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const scanId = scanResponse.data.data.id;
    console.log(`✅ Created scan with ID: ${scanId}`);
    
    // Add demo results using the new API endpoint
    const demoResults = [
      {
        title: "Missing Security Headers",
        description: "The website is missing important security headers like X-Frame-Options and Content-Security-Policy",
        severity: "medium",
        solution: "Add security headers to prevent clickjacking and XSS attacks",
        category: "HTTP Headers"
      },
      {
        title: "SSL Certificate Issue", 
        description: "SSL certificate is using weak encryption or is about to expire",
        severity: "high",
        solution: "Update SSL certificate with stronger encryption and ensure automatic renewal",
        category: "SSL/TLS"
      },
      {
        title: "Information Disclosure",
        description: "Server version information is exposed in HTTP headers",
        severity: "low",
        solution: "Configure server to hide version information", 
        category: "Information Disclosure"
      },
      {
        title: "Outdated Software Components",
        description: "Some JavaScript libraries or frameworks appear to be outdated",
        severity: "medium",
        solution: "Update all third-party libraries to their latest secure versions",
        category: "Component Vulnerabilities"
      },
      {
        title: "SQL Injection Potential",
        description: "Input validation appears insufficient in some forms", 
        severity: "critical",
        solution: "Implement proper input validation and parameterized queries",
        category: "Code Injection"
      }
    ];
    
    // Update scan with results
    const updateResponse = await axios.put(`http://localhost:3001/api/scans/${scanId}/results`, {
      status: 'completed',
      results: demoResults,
      completed_at: new Date().toISOString()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Updated scan with demo results');
    console.log('📋 Demo results added:');
    demoResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.title} (${result.severity})`);
    });
    
    console.log('\n🎯 ScanDemo page will now show completed scan with results');
    console.log(`📊 Scan ID ${scanId} is ready for demonstration`);
    
    return scanId;
    
  } catch (error) {
    console.error('❌ Failed to create demo scan:', error.response?.data || error.message);
  }
}

createDemoScanWithResults().catch(console.error);