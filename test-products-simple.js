const puppeteer = require('puppeteer');

async function testProductsSimple() {
  console.log('🚀 Testing Products Page...\n');
  
  // First test the API directly
  console.log('1️⃣ Testing API directly:');
  try {
    const response = await fetch('http://localhost:3000/api/products');
    const data = await response.json();
    console.log(`✅ API Status: ${response.status}`);
    console.log(`✅ Products found: ${data.data ? data.data.length : 0}`);
  } catch (error) {
    console.log('❌ API Error:', error.message);
  }
  
  console.log('\n2️⃣ Waiting for frontend to start...');
  await new Promise(resolve => setTimeout(resolve, 20000)); // Wait 20 seconds
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('\n3️⃣ Loading products page...');
    await page.goto('http://localhost:3002/products', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for any loading to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check page content
    const pageContent = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="MuiCard"]');
      const buttons = Array.from(document.querySelectorAll('button'))
        .filter(btn => btn.textContent.includes('Add to Cart'));
      const tabs = document.querySelectorAll('[role="tab"]');
      
      // Get any error messages
      const errorElements = Array.from(document.querySelectorAll('*'))
        .filter(el => el.textContent.includes('Error') || el.textContent.includes('error'))
        .map(el => el.textContent);
      
      return {
        cardCount: cards.length,
        addToCartButtons: buttons.length,
        tabCount: tabs.length,
        errors: errorElements.slice(0, 3), // First 3 errors
        pageText: document.body.innerText.substring(0, 500)
      };
    });
    
    console.log('\n4️⃣ Page Analysis:');
    console.log(`Product cards: ${pageContent.cardCount}`);
    console.log(`Add to Cart buttons: ${pageContent.addToCartButtons}`);
    console.log(`Category tabs: ${pageContent.tabCount}`);
    
    if (pageContent.errors.length > 0) {
      console.log('\n❌ Errors found:');
      pageContent.errors.forEach(err => console.log(`  - ${err}`));
    }
    
    if (pageContent.cardCount === 0) {
      console.log('\n📄 Page content preview:');
      console.log(pageContent.pageText);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/products-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as products-test.png');
    
    console.log('\n✅ Test completed!');
    console.log('⏸️  Browser will close in 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'screenshots/products-error.png' });
  } finally {
    await browser.close();
  }
}

testProductsSimple().catch(console.error);