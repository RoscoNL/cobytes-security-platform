const https = require('https');

const API_BASE = 'https://securityscan.cobytes.com/api/api';

// Store cookies between requests
let cookies = [];

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      // Capture cookies
      if (res.headers['set-cookie']) {
        res.headers['set-cookie'].forEach(cookie => {
          const name = cookie.split('=')[0];
          // Replace existing cookie or add new one
          const index = cookies.findIndex(c => c.startsWith(name + '='));
          if (index >= 0) {
            cookies[index] = cookie.split(';')[0];
          } else {
            cookies.push(cookie.split(';')[0]);
          }
        });
      }
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data),
            cookies: cookies
          };
          resolve(result);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            cookies: cookies
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testCartFunctionality() {
  console.log('Testing Cart Functionality on Production\n');
  console.log('========================================\n');
  
  // Test 1: Get initial cart
  console.log('1. Getting initial cart...');
  const getOptions = {
    hostname: 'securityscan.cobytes.com',
    path: '/api/api/cart',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Cookie': cookies.join('; ')
    }
  };
  
  const cart1 = await makeRequest(getOptions);
  console.log(`   Status: ${cart1.status}`);
  console.log(`   Session ID: ${cart1.data?.data?.session_id}`);
  console.log(`   Items: ${cart1.data?.data?.items?.length || 0}`);
  console.log(`   Cookies received: ${cart1.headers['set-cookie'] ? 'Yes' : 'No'}`);
  
  if (cart1.data?.data?.session_id === 'default-session') {
    console.log('   ⚠️  WARNING: Using default session - SESSION_SECRET may be missing!');
  }
  
  const cartId = cart1.data?.data?.id;
  console.log(`   Cart ID: ${cartId}\n`);
  
  // Test 2: Add product to cart
  console.log('2. Adding product to cart...');
  const addOptions = {
    hostname: 'securityscan.cobytes.com',
    path: '/api/api/cart/add',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': cookies.join('; ')
    }
  };
  
  const addData = JSON.stringify({ productId: 1, quantity: 1 });
  const cart2 = await makeRequest(addOptions, addData);
  console.log(`   Status: ${cart2.status}`);
  console.log(`   Items after add: ${cart2.data?.data?.items?.length || 0}`);
  console.log(`   Session ID: ${cart2.data?.data?.session_id}\n`);
  
  // Test 3: Get cart again to check persistence
  console.log('3. Getting cart again to check persistence...');
  getOptions.headers.Cookie = cookies.join('; ');
  const cart3 = await makeRequest(getOptions);
  console.log(`   Status: ${cart3.status}`);
  console.log(`   Session ID: ${cart3.data?.data?.session_id}`);
  console.log(`   Items: ${cart3.data?.data?.items?.length || 0}`);
  
  // Test 4: Try to clear cart
  if (cartId) {
    console.log(`\n4. Clearing cart (ID: ${cartId})...`);
    const clearOptions = {
      hostname: 'securityscan.cobytes.com',
      path: `/api/api/cart/${cartId}/clear`,
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies.join('; ')
      }
    };
    
    const clearResult = await makeRequest(clearOptions);
    console.log(`   Status: ${clearResult.status}`);
    if (clearResult.status === 200) {
      console.log('   Cart cleared successfully');
    } else {
      console.log(`   Error: ${JSON.stringify(clearResult.data)}`);
    }
  }
  
  // Summary
  console.log('\n========================================');
  console.log('SUMMARY:');
  console.log('========================================');
  
  console.log('\nSession Cookies:');
  cookies.forEach(cookie => {
    console.log(`  ${cookie}`);
  });
  
  console.log('\nIssues Found:');
  if (cart1.data?.data?.session_id === 'default-session') {
    console.log('  ❌ SESSION_SECRET appears to be missing - all users share the same cart!');
    console.log('     This means cart data is not persisted per user/session.');
  }
  
  if (!cookies.find(c => c.includes('session') || c.includes('connect.sid'))) {
    console.log('  ❌ No session cookie is being set');
    console.log('     Only Cloudflare cookies (__cf_bm) are present');
  }
  
  console.log('\nCORS Configuration:');
  console.log(`  Access-Control-Allow-Credentials: ${cart1.headers['access-control-allow-credentials']}`);
  console.log(`  Vary: ${cart1.headers['vary']}`);
}

// Run the test
testCartFunctionality().catch(console.error);