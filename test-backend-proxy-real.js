const puppeteer = require('puppeteer');

async function testBackendProxyReal() {
  console.log('🔍 Testing REAL PentestTools API via Backend CORS Proxy');
  console.log('====================================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
    timeout: 60000
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the frontend
    console.log('📄 Loading frontend...');
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Test the backend proxy implementation (like production uses)
    console.log('🌐 Testing backend CORS proxy...');
    
    const backendProxyTest = await page.evaluate(async () => {
      try {
        // Use the backend proxy exactly like production
        const response = await fetch('http://localhost:3001/api/proxy/pentest-tools/tools', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Backend proxy response status:', response.status);
        const responseText = await response.text();
        console.log('Backend proxy response:', responseText.substring(0, 300));
        
        if (!response.ok) {
          return {
            success: false,
            error: `Backend Proxy Error ${response.status}: ${responseText}`,
            status: response.status
          };
        }
        
        const data = JSON.parse(responseText);
        return {
          success: true,
          data: data,
          toolCount: data.data ? data.data.length : 0,
          responsePreview: responseText.substring(0, 500)
        };
        
      } catch (error) {
        console.error('Backend proxy test failed:', error);
        return {
          success: false,
          error: error.message,
          type: error.name
        };
      }
    });
    
    console.log('\n📊 BACKEND PROXY TEST RESULTS:');
    console.log('===============================');
    
    if (backendProxyTest.success) {
      console.log('🎉 REAL PENTEST API WORKING VIA BACKEND PROXY!');
      console.log(`✅ Found ${backendProxyTest.toolCount} available tools`);
      console.log('✅ Authentication successful');
      console.log('✅ Backend proxy working correctly');
      console.log('✅ CORS issue resolved');
      console.log('\n📄 Real API Response Preview:');
      console.log(backendProxyTest.responsePreview);
      
      // Now test creating a REAL scan
      console.log('\n🔍 Creating REAL SSL scan via backend proxy...');
      
      const realScanTest = await page.evaluate(async () => {
        try {
          // Start a real SSL scan using backend proxy
          const scanResponse = await fetch('http://localhost:3001/api/proxy/pentest-tools/scans', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tool_id: 110, // SSL Scanner
              target_name: 'cobytes.com',
              tool_params: {
                target: 'cobytes.com'
              }
            })
          });
          
          const scanText = await scanResponse.text();
          console.log('Real scan creation response:', scanText);
          
          if (scanResponse.ok) {
            const scanData = JSON.parse(scanText);
            return {
              success: true,
              scanId: scanData.data?.created_id || scanData.data?.id,
              response: scanText,
              data: scanData
            };
          } else {
            return {
              success: false,
              error: scanText,
              status: scanResponse.status
            };
          }
          
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });
      
      if (realScanTest.success) {
        console.log('🎉 REAL SCAN CREATED SUCCESSFULLY!');
        console.log(`✅ Real Scan ID: ${realScanTest.scanId}`);
        console.log('✅ Using actual PentestTools API');
        console.log('✅ NO MOCK DATA - completely authentic');
        console.log('\n📊 Real scan creation response:');
        console.log(realScanTest.response);
        
        // Poll for real results
        console.log('\n⏱️ Polling for REAL scan results...');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const pollResults = await page.evaluate(async (scanId) => {
          try {
            const statusResponse = await fetch(`http://localhost:3001/api/proxy/pentest-tools/scans/${scanId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            const statusText = await statusResponse.text();
            const statusData = JSON.parse(statusText);
            
            return {
              success: true,
              status: statusData.data?.status || 'unknown',
              progress: statusData.data?.progress || 0,
              response: statusText
            };
            
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }, realScanTest.scanId);
        
        if (pollResults.success) {
          console.log(`✅ Real scan status: ${pollResults.status}`);
          console.log(`✅ Real scan progress: ${pollResults.progress}%`);
          console.log('✅ Backend proxy integration fully functional');
          console.log('✅ Ready to replace mock data with real results');
        }
        
      } else {
        console.log('❌ Real scan creation failed:', realScanTest.error);
        console.log('   This might be due to API key or target validation');
      }
      
    } else {
      console.log('❌ Backend proxy test failed:');
      console.log(`   Error: ${backendProxyTest.error}`);
      console.log(`   Status: ${backendProxyTest.status}`);
      
      if (backendProxyTest.status === 401) {
        console.log('   → API key authentication failed');
        console.log('   → Need correct production API key');
      } else if (backendProxyTest.status === 403) {
        console.log('   → API access forbidden');
      } else {
        console.log('   → Other API issue');
      }
    }
    
    // Keep browser open to inspect
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testBackendProxyReal().catch(console.error);