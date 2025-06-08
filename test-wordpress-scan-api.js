const axios = require('axios');

async function testWordPressScanAPI() {
  console.log('🔍 Testing WordPress scan via API for https://www.cobytes.com\n');
  
  const API_URL = 'http://localhost:3001';
  
  try {
    // 1. First check available scan types
    console.log('📍 Step 1: Checking available scan types...');
    try {
      const typesResponse = await axios.get(`${API_URL}/api/scans/types`);
      console.log('Available scan types:');
      typesResponse.data.data?.forEach(type => {
        if (type.name.toLowerCase().includes('wordpress') || 
            type.name.toLowerCase().includes('cms') ||
            type.scanner_name?.toLowerCase().includes('wordpress')) {
          console.log(`  ✅ ${type.name} (${type.scanner_name}) - ${type.description}`);
        }
      });
    } catch (error) {
      console.log('Could not fetch scan types:', error.response?.status);
    }
    
    // 2. Login to get token
    console.log('\n📍 Step 2: Logging in...');
    let token;
    try {
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: 'admin@cobytes.com',
        password: 'adminpass'
      });
      token = loginResponse.data.data?.token || loginResponse.data.token;
      console.log('✅ Logged in successfully');
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data);
      return;
    }
    
    // 3. Create WordPress scan
    console.log('\n📍 Step 3: Creating WordPress scan...');
    const scanData = {
      target: 'https://www.cobytes.com',
      scan_type: 'wordpress_scan', // May need to adjust based on available types
      name: 'WordPress Security Scan - Cobytes.com',
      description: 'Testing WordPress vulnerabilities on cobytes.com'
    };
    
    try {
      const scanResponse = await axios.post(
        `${API_URL}/api/scans`,
        scanData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const scan = scanResponse.data.data;
      console.log('✅ Scan created successfully');
      console.log(`   ID: ${scan.id}`);
      console.log(`   Status: ${scan.status}`);
      console.log(`   Type: ${scan.scan_type}`);
      
      // 4. Monitor scan progress
      console.log('\n📍 Step 4: Monitoring scan progress...');
      let scanComplete = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5 second intervals
      
      while (!scanComplete && attempts < maxAttempts) {
        attempts++;
        
        try {
          const statusResponse = await axios.get(
            `${API_URL}/api/scans/${scan.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const currentScan = statusResponse.data.data;
          console.log(`   [${new Date().toLocaleTimeString()}] Status: ${currentScan.status}, Progress: ${currentScan.progress}%`);
          
          if (currentScan.status === 'completed' || currentScan.status === 'failed') {
            scanComplete = true;
            
            if (currentScan.status === 'completed') {
              console.log('\n✅ Scan completed successfully!');
              
              // Display results
              console.log('\n📊 Scan Results:');
              console.log(`Total vulnerabilities: ${currentScan.results?.length || 0}`);
              
              if (currentScan.results && currentScan.results.length > 0) {
                // Group by severity
                const bySeverity = currentScan.results.reduce((acc, result) => {
                  acc[result.severity] = (acc[result.severity] || 0) + 1;
                  return acc;
                }, {});
                
                console.log('\nVulnerabilities by severity:');
                Object.entries(bySeverity).forEach(([severity, count]) => {
                  console.log(`  ${severity}: ${count}`);
                });
                
                console.log('\nTop findings:');
                currentScan.results.slice(0, 10).forEach((result, i) => {
                  console.log(`\n${i + 1}. ${result.title || result.vulnerability_type}`);
                  console.log(`   Severity: ${result.severity}`);
                  console.log(`   Category: ${result.category || 'N/A'}`);
                  if (result.description) {
                    console.log(`   Description: ${result.description.substring(0, 100)}...`);
                  }
                  if (result.affected_resource) {
                    console.log(`   Affected: ${result.affected_resource}`);
                  }
                });
                
                // WordPress specific findings
                const wpFindings = currentScan.results.filter(r => 
                  r.vulnerability_type?.toLowerCase().includes('wordpress') ||
                  r.category?.toLowerCase().includes('wordpress') ||
                  r.title?.toLowerCase().includes('wordpress') ||
                  r.description?.toLowerCase().includes('wordpress')
                );
                
                if (wpFindings.length > 0) {
                  console.log(`\n🔍 WordPress-specific findings: ${wpFindings.length}`);
                  wpFindings.slice(0, 5).forEach((finding, i) => {
                    console.log(`${i + 1}. ${finding.title} (${finding.severity})`);
                  });
                }
              }
              
              // Check for scan metadata
              if (currentScan.metadata) {
                console.log('\n📋 Scan Metadata:');
                if (currentScan.metadata.wordpress_version) {
                  console.log(`  WordPress Version: ${currentScan.metadata.wordpress_version}`);
                }
                if (currentScan.metadata.plugins) {
                  console.log(`  Plugins found: ${currentScan.metadata.plugins.length || 0}`);
                }
                if (currentScan.metadata.themes) {
                  console.log(`  Themes found: ${currentScan.metadata.themes.length || 0}`);
                }
              }
              
            } else {
              console.log(`\n❌ Scan failed: ${currentScan.error || 'Unknown error'}`);
            }
          }
          
        } catch (error) {
          console.log('Error checking scan status:', error.message);
        }
        
        if (!scanComplete) {
          await new Promise(r => setTimeout(r, 5000));
        }
      }
      
      if (!scanComplete) {
        console.log('\n⏱️  Scan timed out after 5 minutes');
      }
      
    } catch (error) {
      console.log('❌ Failed to create scan:', error.response?.data);
      
      // If WordPress scan type doesn't exist, try alternatives
      if (error.response?.status === 400) {
        console.log('\nTrying alternative scan types...');
        const alternativeTypes = ['cms_scan', 'website_scan', 'vulnerability_scan'];
        
        for (const altType of alternativeTypes) {
          console.log(`Trying ${altType}...`);
          try {
            const altResponse = await axios.post(
              `${API_URL}/api/scans`,
              { ...scanData, scan_type: altType },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`✅ Successfully created scan with type: ${altType}`);
            break;
          } catch (altError) {
            console.log(`❌ ${altType} failed`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run test
testWordPressScanAPI();