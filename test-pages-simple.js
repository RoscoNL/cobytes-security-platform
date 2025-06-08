const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3002';
const API_URL = 'http://localhost:3000';

async function testPages() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // List of pages to test
  const pages = [
    { name: 'Homepage', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Cart', path: '/cart' },
    { name: 'Login', path: '/login' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Free Scan', path: '/free-scan' },
    { name: 'Security Dashboard', path: '/security-dashboard' },
    { name: 'All Scanners', path: '/all-scanners-new' },
  ];

  console.log('🚀 Testing all pages...\n');
  const results = [];

  // Test each page
  for (const pageInfo of pages) {
    console.log(`📄 Testing ${pageInfo.name}...`);
    
    try {
      const response = await page.goto(`${FRONTEND_URL}${pageInfo.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      
      const status = response.status();
      const url = page.url();
      const title = await page.title();
      
      // Take screenshot
      await page.screenshot({ 
        path: `screenshots/${pageInfo.name.toLowerCase().replace(/ /g, '-')}.png` 
      });
      
      results.push({
        page: pageInfo.name,
        path: pageInfo.path,
        status: status,
        finalUrl: url,
        title: title,
        success: status === 200
      });
      
      console.log(`  ✅ Status: ${status}`);
      console.log(`  📍 URL: ${url}`);
      console.log(`  📝 Title: ${title}\n`);
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
      results.push({
        page: pageInfo.name,
        path: pageInfo.path,
        error: error.message,
        success: false
      });
    }
  }

  // Test API endpoints
  console.log('🔌 Testing API endpoints...\n');
  
  const apiEndpoints = [
    { name: 'Health', path: '/health' },
    { name: 'Products', path: '/api/products' },
  ];

  for (const endpoint of apiEndpoints) {
    console.log(`📡 Testing ${endpoint.name}...`);
    
    try {
      const response = await fetch(`${API_URL}${endpoint.path}`);
      const data = await response.json();
      
      console.log(`  ✅ Status: ${response.status}`);
      console.log(`  📦 Response: ${JSON.stringify(data).substring(0, 100)}...\n`);
      
      results.push({
        page: `API: ${endpoint.name}`,
        path: endpoint.path,
        status: response.status,
        success: response.ok
      });
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
      results.push({
        page: `API: ${endpoint.name}`,
        path: endpoint.path,
        error: error.message,
        success: false
      });
    }
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================\n');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const status = result.status || 'Error';
    console.log(`${icon} ${result.page} - ${status}`);
  });
  
  console.log(`\n✨ Total: ${successful} passed, ${failed} failed`);
  
  // Wait before closing
  console.log('\n⏸️  Browser will close in 10 seconds...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  await browser.close();
}

testPages().catch(console.error);