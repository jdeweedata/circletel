const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Testing basic navigation...');

  // Test home page
  await page.goto('http://localhost:8081');
  await page.waitForTimeout(2000);
  console.log('Home page title:', await page.title());

  // Test admin login page
  console.log('Navigating to admin login...');
  await page.goto('http://localhost:8081/admin/login');
  await page.waitForTimeout(3000);

  // Check what's actually rendered
  const pageContent = await page.content();
  console.log('Page contains "Admin Login":', pageContent.includes('Admin Login'));

  // Check for React errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Wait for React to render
  try {
    await page.waitForSelector('h1', { timeout: 10000 });
    const h1Text = await page.locator('h1').textContent();
    console.log('H1 text found:', h1Text);
  } catch (e) {
    console.log('No H1 found, checking for other elements...');

    // Check what elements are actually on the page
    const elements = await page.$$eval('*', els =>
      els.slice(0, 20).map(el => ({ tag: el.tagName, text: el.textContent?.slice(0, 50) }))
    );
    console.log('Page elements:', elements.filter(el => el.text?.trim()));
  }

  if (errors.length > 0) {
    console.log('Console errors:', errors);
  }

  console.log('Manual test complete. Closing browser...');
  await browser.close();
})();