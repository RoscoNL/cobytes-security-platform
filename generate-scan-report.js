const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function generateReport(scanId) {
  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@cobytes.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // Step 2: Get scan details
    console.log(`\n2. Getting scan ${scanId} details...`);
    const scanResponse = await axios.get(
      `http://localhost:3001/api/scans/${scanId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const scan = scanResponse.data.data;
    console.log('Scan details:', {
      id: scan.id,
      target: scan.target,
      type: scan.type,
      status: scan.status,
      created_at: scan.created_at,
      completed_at: scan.completed_at,
      resultsCount: scan.results?.length || 0
    });

    // Step 3: Generate PDF report
    console.log('\n3. Generating PDF report...');
    try {
      const reportResponse = await axios.post(
        `http://localhost:3001/api/scans/${scanId}/report`,
        { format: 'pdf' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );
      
      // Save the PDF
      const downloadsDir = path.join(__dirname, 'downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      
      const pdfPath = path.join(downloadsDir, `cobytes-wordpress-scan-${scanId}.pdf`);
      fs.writeFileSync(pdfPath, reportResponse.data);
      console.log(`✅ PDF report saved to: ${pdfPath}`);
      
      // Also save as the requested filename
      const finalPdfPath = path.join(downloadsDir, 'cobytes-wordpress-scan-findings.pdf');
      fs.copyFileSync(pdfPath, finalPdfPath);
      console.log(`✅ PDF report also saved as: ${finalPdfPath}`);
      
    } catch (reportError) {
      // If PDF generation fails, try JSON format
      console.log('PDF generation failed, trying JSON format...');
      const jsonResponse = await axios.get(
        `http://localhost:3001/api/scans/${scanId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Save as JSON
      const jsonPath = path.join(__dirname, 'downloads', `cobytes-wordpress-scan-${scanId}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(jsonResponse.data.data, null, 2));
      console.log(`✅ JSON report saved to: ${jsonPath}`);
      
      // Create a simple text report
      const report = jsonResponse.data.data;
      let textContent = `COBYTES WORDPRESS SECURITY SCAN REPORT
======================================

Target: ${report.target}
Scan Type: ${report.type}
Status: ${report.status}
Created: ${new Date(report.created_at).toLocaleString()}
Completed: ${report.completed_at ? new Date(report.completed_at).toLocaleString() : 'N/A'}

FINDINGS
--------
`;

      if (report.results && report.results.length > 0) {
        report.results.forEach((result, index) => {
          textContent += `
${index + 1}. ${result.title || 'Finding'}
   Severity: ${result.severity || 'Unknown'}
   Description: ${result.description || 'No description'}
   ${result.recommendation ? `Recommendation: ${result.recommendation}` : ''}
`;
        });
      } else {
        textContent += '\nNo vulnerabilities found. The WordPress site appears to be secure.\n';
      }

      textContent += `
SUMMARY
-------
Total Findings: ${report.results?.length || 0}
Scan Duration: ${report.completed_at && report.created_at ? 
  Math.round((new Date(report.completed_at) - new Date(report.created_at)) / 1000) + ' seconds' : 
  'Unknown'}

Generated on: ${new Date().toLocaleString()}
`;

      // Save text report
      const textPath = path.join(__dirname, 'downloads', 'cobytes-wordpress-scan-findings.txt');
      fs.writeFileSync(textPath, textContent);
      console.log(`✅ Text report saved to: ${textPath}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Get scan ID from command line or use the most recent one
const scanId = process.argv[2] || 7;
generateReport(scanId);