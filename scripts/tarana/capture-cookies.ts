import { chromium } from 'playwright';

async function captureCookies() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  let cookieHeader = '';

  // Intercept the TMQ aggregate call to see cookie header
  page.on('request', req => {
    if (req.url().includes('tmq') || req.url().includes('tni/v2/config')) {
      const headers = req.headers();
      if (headers.cookie) {
        cookieHeader = headers.cookie;
        console.log('COOKIE HEADER:', headers.cookie.substring(0, 200));
      }
      console.log(`Headers for ${req.url().split('.com')[1]?.substring(0, 60)}:`);
      for (const [k, v] of Object.entries(headers)) {
        if (['authorization', 'cookie', 'x-caller-name'].includes(k)) {
          console.log(`  ${k}: ${v.substring(0, 100)}`);
        }
      }
    }
  });

  await page.goto('https://portal.tcs.taranawireless.com/operator-portal/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[name="username"]', 'mmathabo.setoaba@circletel.co.za');
  await page.fill('input[type="password"]', 'rLa!46Tnk3#m84R');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Get all cookies
  const cookies = await context.cookies('https://portal.tcs.taranawireless.com');
  console.log('\n=== All cookies ===');
  for (const c of cookies) {
    const val = c.name.includes('CognitoIdentity') || c.name.includes('token') || c.name.includes('access')
      ? c.value.substring(0, 60) + '...'
      : c.value;
    console.log(`  ${c.name}: ${val} [domain=${c.domain}, httpOnly=${c.httpOnly}]`);
  }

  // Also check localStorage
  const localStorage = await page.evaluate(() => {
    const items: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)!;
      items[key] = window.localStorage.getItem(key)!.substring(0, 80);
    }
    return items;
  });
  console.log('\n=== localStorage keys ===');
  for (const [k, v] of Object.entries(localStorage)) {
    console.log(`  ${k}: ${v}`);
  }

  await browser.close();
}

captureCookies().catch(console.error);
