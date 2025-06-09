const puppeteer = require('puppeteer');

async function debugPage() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to landing page...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
    
    console.log('\nSearching for buttons...');
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < buttons.length; i++) {
      try {
        const buttonInfo = await buttons[i].evaluate(el => ({
          text: el.textContent?.trim() || '',
          disabled: el.disabled,
          visible: window.getComputedStyle(el).display !== 'none',
          className: el.className,
          type: el.type
        }));
        console.log(`Button ${i + 1}:`, buttonInfo);
      } catch (e) {
        console.log(`Button ${i + 1}: Could not evaluate`);
      }
    }
    
    console.log('\nSearching for links...');
    const links = await page.$$('a');
    console.log(`Found ${links.length} links`);
    
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      try {
        const linkInfo = await links[i].evaluate(el => ({
          text: el.textContent?.trim() || '',
          href: el.href,
          visible: window.getComputedStyle(el).display !== 'none'
        }));
        console.log(`Link ${i + 1}:`, linkInfo);
      } catch (e) {
        console.log(`Link ${i + 1}: Could not evaluate`);
      }
    }
    
    // Try finding the View Products button or link
    console.log('\nLooking for "View Products" element...');
    
    // Check if it's a link instead
    const viewProductsLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const link = links.find(a => a.textContent?.includes('View Products'));
      return link ? { found: true, href: link.href, tagName: 'a' } : null;
    });
    
    if (viewProductsLink) {
      console.log('Found View Products as a link:', viewProductsLink);
    }
    
    // Check Material-UI buttons
    const muiButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.MuiButton-root'));
      return buttons.map(btn => ({
        text: btn.textContent?.trim() || '',
        href: btn.getAttribute('href'),
        tagName: btn.tagName.toLowerCase()
      }));
    });
    console.log('\nMaterial-UI buttons:', muiButtons);
    
    await page.screenshot({ path: 'debug-page.png' });
    console.log('\nScreenshot saved as debug-page.png');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  await browser.close();
}

debugPage().catch(console.error);