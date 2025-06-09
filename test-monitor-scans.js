const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: 'admin@cobytes.com',
  password: 'admin123'
};

// IDs of scans created in previous test
const SCAN_IDS = [27, 29]; // WordPress and Website scans (SSL failed)

async function monitorScans() {
  try {
    // Login first
    console.log('🔑 Logging in...');
    const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful\n');

    console.log('📊 Monitoring scan progress...\n');
    
    let allCompleted = false;
    let checkCount = 0;
    const maxChecks = 60; // Monitor for up to 10 minutes
    
    while (!allCompleted && checkCount < maxChecks) {
      checkCount++;
      console.log(`[Check ${checkCount}/${maxChecks}] - ${new Date().toLocaleTimeString()}`);
      
      const scanStatuses = [];
      
      for (const scanId of SCAN_IDS) {
        try {
          const response = await axios.get(
            `${BACKEND_URL}/scans/${scanId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          const scan = response.data.data;
          scanStatuses.push(scan.status);
          
          console.log(`Scan ${scan.id} (${scan.type}): ${scan.target}`);
          console.log(`   Status: ${scan.status}`);
          console.log(`   Progress: ${scan.progress}%`);
          console.log(`   Pentest Tools ID: ${scan.pentest_tools_scan_id || 'Not assigned'}`);
          console.log(`   Results: ${scan.results?.length || 0} findings`);
          
          if (scan.status === 'completed') {
            console.log('   ✅ COMPLETED!');
            
            // Show results summary
            if (scan.results && scan.results.length > 0) {
              const severityCounts = {
                critical: scan.results.filter(r => r.severity === 'critical').length,
                high: scan.results.filter(r => r.severity === 'high').length,
                medium: scan.results.filter(r => r.severity === 'medium').length,
                low: scan.results.filter(r => r.severity === 'low').length,
                info: scan.results.filter(r => r.severity === 'info').length
              };
              
              console.log(`   Findings: Critical: ${severityCounts.critical}, High: ${severityCounts.high}, Medium: ${severityCounts.medium}, Low: ${severityCounts.low}, Info: ${severityCounts.info}`);
            }
          }
          
          console.log('');
        } catch (error) {
          console.log(`❌ Error checking scan ${scanId}: ${error.message}\n`);
        }
      }
      
      // Check if all scans are completed
      allCompleted = scanStatuses.every(status => 
        status === 'completed' || status === 'failed' || status === 'cancelled'
      );
      
      if (!allCompleted) {
        // Wait 10 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    if (allCompleted) {
      console.log('\n✅ All scans have finished!');
      
      // Try to generate PDF reports for completed scans
      console.log('\n📄 Generating PDF reports...\n');
      
      for (const scanId of SCAN_IDS) {
        try {
          const scanResponse = await axios.get(
            `${BACKEND_URL}/scans/${scanId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          const scan = scanResponse.data.data;
          
          if (scan.status === 'completed' && scan.results?.length > 0) {
            console.log(`Generating PDF for scan ${scanId}...`);
            
            try {
              const pdfResponse = await axios.get(
                `${BACKEND_URL}/reports/scan/${scanId}/pdf`,
                {
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/pdf'
                  },
                  responseType: 'arraybuffer'
                }
              );
              
              // Save PDF
              const fs = require('fs');
              const filename = `scan-report-${scanId}-${scan.type}.pdf`;
              fs.writeFileSync(filename, pdfResponse.data);
              
              console.log(`✅ PDF saved as ${filename}`);
            } catch (pdfError) {
              console.log(`❌ Failed to generate PDF: ${pdfError.message}`);
            }
          }
        } catch (error) {
          console.log(`❌ Error processing scan ${scanId}: ${error.message}`);
        }
      }
    } else {
      console.log('\n⏱️  Timeout reached. Some scans are still running.');
    }
    
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the monitor
console.log('🔍 Monitoring Pentest-tools scan progress...\n');
monitorScans();