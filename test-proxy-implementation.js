const puppeteer = require('puppeteer');

async function testProxyImplementation() {
  console.log('🔍 Testing PentestTools API via PROXY Implementation');
  console.log('==================================================\n');
  
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
    
    // Test the proxy implementation that the platform actually uses
    console.log('🌐 Testing PentestTools API via thingproxy...');
    
    const proxyTest = await page.evaluate(async () => {
      try {
        const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';
        const SCANNER_API_BASE = 'https://app.pentest-tools.com/api/v2';
        
        // Use thingproxy.freeboard.io like the platform does
        const targetUrl = `${SCANNER_API_BASE}/tools`;
        const proxyUrl = `https://thingproxy.freeboard.io/fetch/${targetUrl}`;
        
        console.log('Testing proxy URL:', proxyUrl);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
        });
        
        console.log('Proxy response status:', response.status);
        const responseText = await response.text();
        console.log('Proxy response (first 300 chars):', responseText.substring(0, 300));
        
        if (!response.ok) {
          return {
            success: false,
            error: `Proxy Error ${response.status}: ${responseText}`,
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
        console.error('Proxy test failed:', error);
        return {
          success: false,
          error: error.message,
          type: error.name
        };
      }
    });
    
    console.log('\n📊 PROXY API TEST RESULTS:');
    console.log('=========================');
    
    if (proxyTest.success) {
      console.log('✅ PentestTools API working via PROXY!');
      console.log(`✅ Found ${proxyTest.toolCount} available tools`);
      console.log('✅ Authentication successful');
      console.log('✅ Proxy implementation working');
      console.log('\n📄 API Response Preview:');
      console.log(proxyTest.responsePreview);
      
      // Now test creating a real scan
      console.log('\n🔍 Testing REAL SSL scan creation via proxy...');
      
      const realScanTest = await page.evaluate(async () => {
        try {
          const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';
          const SCANNER_API_BASE = 'https://app.pentest-tools.com/api/v2';
          
          // Start an SSL scan using the proxy
          const scanUrl = `${SCANNER_API_BASE}/scans`;
          const proxyUrl = `https://thingproxy.freeboard.io/fetch/${scanUrl}`;
          
          const scanResponse = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
              tool_id: 450, // SSL Scanner Advanced
              target_name: 'cobytes.com',
              tool_params: {
                target: 'cobytes.com'
              }
            })
          });
          
          const scanText = await scanResponse.text();
          console.log('Real scan response:', scanText);
          
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
        console.log(`✅ Scan ID: ${realScanTest.scanId}`);
        console.log('✅ This is REAL data from PentestTools API');
        console.log('✅ NO MOCK DATA - completely authentic');
        console.log('\n📊 Real scan data:');
        console.log(realScanTest.response);
        
        // Now poll for real results
        console.log('\n⏱️ Polling for REAL scan results...');
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const pollTest = await page.evaluate(async (scanId) => {
          try {
            const API_KEY = '43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7';
            const SCANNER_API_BASE = 'https://app.pentest-tools.com/api/v2';
            
            const statusUrl = `${SCANNER_API_BASE}/scans/${scanId}`;
            const proxyUrl = `https://thingproxy.freeboard.io/fetch/${statusUrl}`;
            
            const response = await fetch(proxyUrl, {
              headers: {
                'Authorization': `Bearer ${API_KEY}`,
              }
            });
            
            const statusText = await response.text();
            const statusData = JSON.parse(statusText);
            
            return {
              success: true,
              status: statusData.data?.status || 'unknown',
              progress: statusData.data?.progress || 0,
              data: statusData
            };
            
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }, realScanTest.scanId);
        
        if (pollTest.success) {
          console.log(`✅ Real scan status: ${pollTest.status}`);
          console.log(`✅ Real scan progress: ${pollTest.progress}%`);
          console.log('✅ API integration fully functional');
        }
        
      } else {
        console.log('❌ Real scan creation failed:', realScanTest.error);
      }
      
    } else {
      console.log('❌ Proxy API test failed:');
      console.log(`   Error: ${proxyTest.error}`);
      console.log(`   Type: ${proxyTest.type}`);
      console.log(`   Status: ${proxyTest.status}`);
    }
    
    // Keep browser open to inspect
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testProxyImplementation().catch(console.error);