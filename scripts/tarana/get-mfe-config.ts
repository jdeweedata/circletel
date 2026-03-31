import { chromium } from 'playwright';

async function getMfeConfig() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const apiCalls: string[] = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/api/') && !url.includes('heap-api')) {
      const body = req.postData();
      apiCalls.push(`${req.method()} ${url.split('.com')[1]?.substring(0, 80)}${body ? ' BODY:' + body.substring(0, 100) : ''}`);
    }
  });

  await page.goto('https://portal.tcs.taranawireless.com/operator-portal/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[name="username"]', 'mmathabo.setoaba@circletel.co.za');
  await page.fill('input[type="password"]', 'rLa!46Tnk3#m84R');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});

  // Get window._env_
  const env = await page.evaluate(() => (window as any)._env_);
  console.log('=== window._env_ ===');
  console.log(JSON.stringify(env, null, 2));

  // Navigate to network page  
  await page.click('text=Network').catch(() => {});
  await page.waitForTimeout(3000);
  console.log('\n=== URL after clicking Network ===');
  console.log(page.url());

  // Get page links
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href'))
  );
  console.log('\n=== Page links ===');
  links.slice(0, 20).forEach(l => console.log(l));

  console.log('\n=== API calls ===');
  apiCalls.forEach(c => console.log(c));

  await browser.close();
}

getMfeConfig().catch(console.error);
