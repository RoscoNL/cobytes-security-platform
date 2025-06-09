const puppeteer = require('puppeteer');

async function testExternalCorsProxy() {
  console.log('🌐 Testing External CORS Proxy for PentestTools API');
  console.log('================================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('Browser:', msg.text());
      }
    });
    
    // Navigate to frontend
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
    
    // Test external CORS proxy
    console.log('📡 Testing external CORS proxy access...');
    
    const proxyTest = await page.evaluate(async () => {
      const apiKey = 'E0Eq4lmxoJeMSd6DIGLiqCW4yGRnJKywjhnXl78r471e4e69';
      const results = {};
      
      // Test 1: allorigins proxy
      try {
        console.log('Testing allorigins proxy...');
        const url1 = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://app.pentest-tools.com/api/v2/tools')}`;
        const response1 = await fetch(url1, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        const text1 = await response1.text();
        results.allorigins = {
          success: response1.ok,
          status: response1.status,
          preview: text1.substring(0, 200)
        };
      } catch (err) {
        results.allorigins = { success: false, error: err.message };
      }
      
      // Test 2: corsproxy.io
      try {
        console.log('Testing corsproxy.io...');
        const url2 = `https://corsproxy.io/?${encodeURIComponent('https://app.pentest-tools.com/api/v2/tools')}`;
        const response2 = await fetch(url2, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        const text2 = await response2.text();
        results.corsproxy = {
          success: response2.ok,
          status: response2.status,
          preview: text2.substring(0, 200)
        };
      } catch (err) {
        results.corsproxy = { success: false, error: err.message };
      }
      
      // Test 3: Direct backend proxy (for comparison)
      try {
        console.log('Testing backend proxy...');
        const response3 = await fetch('http://localhost:3001/api/proxy/pentest-tools/tools');
        const text3 = await response3.text();
        results.backend = {
          success: response3.ok,
          status: response3.status,
          preview: text3.substring(0, 200)
        };
      } catch (err) {
        results.backend = { success: false, error: err.message };
      }
      
      return results;
    });
    
    console.log('\n📊 CORS Proxy Test Results:');
    console.log('===========================\n');
    
    Object.entries(proxyTest).forEach(([proxy, result]) => {
      console.log(`${proxy}:`);
      if (result.success) {
        console.log(`  ✅ Success! Status: ${result.status}`);
        console.log(`  Preview: ${result.preview}`);
      } else {
        console.log(`  ❌ Failed: ${result.error || `Status ${result.status}`}`);
        if (result.preview) {
          console.log(`  Response: ${result.preview}`);
        }
      }
      console.log('');
    });
    
    // Now test creating a real scan with external proxy
    console.log('🚀 Testing real scan creation with external CORS proxy...\n');
    
    // Login first
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle0' });
    await page.type('input[name="email"]', 'test@cobytes.com');
    await page.type('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Test scan creation using the service
    const scanTest = await page.evaluate(async () => {
      try {
        // Import the service (it's already loaded in the app)
        const { securityScannerProxyService } = await import('/src/services/security-scanner-proxy.service.ts');
        
        // Try to get tools list
        console.log('Getting tools list...');
        const tools = await securityScannerProxyService.request('GET', '/tools');
        
        return {
          success: true,
          toolsCount: tools.data?.length || 0,
          tools: tools.data?.slice(0, 3).map(t => ({ id: t.id, name: t.name }))
        };
        
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('📊 Service Test Results:');
    if (scanTest.success) {
      console.log(`✅ Successfully accessed PentestTools API!`);
      console.log(`✅ Found ${scanTest.toolsCount} tools`);
      if (scanTest.tools) {
        console.log('✅ Sample tools:');
        scanTest.tools.forEach(tool => {
          console.log(`   - ${tool.name} (ID: ${tool.id})`);
        });
      }
    } else {
      console.log(`❌ Service test failed: ${scanTest.error}`);
    }
    
    console.log('\n✅ Test completed! Check console for results.');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testExternalCorsProxy().catch(console.error);