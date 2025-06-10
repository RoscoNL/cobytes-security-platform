const https = require('https');

async function testAPIRouting() {
  console.log('Testing API Routing Issues...\n');

  const tests = [
    {
      name: 'Health endpoint (no /api prefix)',
      url: 'https://securityscan.cobytes.com/api/health',
      method: 'GET'
    },
    {
      name: 'Root API endpoint',
      url: 'https://securityscan.cobytes.com/api',
      method: 'GET'
    },
    {
      name: 'Auth login (as configured)',
      url: 'https://securityscan.cobytes.com/api/auth/login',
      method: 'POST',
      body: { email: 'test@test.com', password: 'test' }
    },
    {
      name: 'Auth login (without double /api)',
      url: 'https://securityscan.cobytes.com/auth/login',
      method: 'POST',
      body: { email: 'test@test.com', password: 'test' }
    },
    {
      name: 'Products endpoint',
      url: 'https://securityscan.cobytes.com/api/products',
      method: 'GET'
    },
    {
      name: 'Test endpoint',
      url: 'https://securityscan.cobytes.com/api/test',
      method: 'GET'
    }
  ];

  for (const test of tests) {
    console.log(`\nTesting: ${test.name}`);
    console.log(`URL: ${test.url}`);
    
    try {
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }
      
      const response = await fetch(test.url, options);
      const text = await response.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      
      console.log(`Status: ${response.status}`);
      console.log('Response:', data);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }

  console.log('\n\nDIAGNOSIS:');
  console.log('The issue is with the DigitalOcean ingress configuration.');
  console.log('The ingress rule strips the /api prefix when routing to the backend.');
  console.log('So /api/auth/login becomes /auth/login, which doesn\'t match the backend routes.');
  console.log('\nSOLUTION:');
  console.log('Either:');
  console.log('1. Update the backend routes to not include /api prefix');
  console.log('2. Update the ingress configuration to preserve the path prefix');
}

testAPIRouting();