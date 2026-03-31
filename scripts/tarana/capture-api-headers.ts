import { chromium } from 'playwright';

async function captureHeaders() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const apiCalls: Record<string, { headers: Record<string, string>; status: number }> = {};

  page.on('request', req => {
    const url = req.url();
    if (url.includes('/api/')) {
      apiCalls[url] = { headers: req.headers(), status: 0 };
    }
  });
  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('/api/') && apiCalls[url]) {
      apiCalls[url].status = resp.status();
    }
  });

  await page.goto('https://portal.tcs.taranawireless.com/operator-portal/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[name="username"]', 'mmathabo.setoaba@circletel.co.za');
  await page.fill('input[type="password"]', 'rLa!46Tnk3#m84R');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Print headers for key API endpoints
  for (const [url, info] of Object.entries(apiCalls)) {
    const path = url.replace('https://portal.tcs.taranawireless.com', '');
    if (!url.includes('heap-api') && !url.includes('user-auth/login')) {
      console.log(`\n=== ${info.status} ${path} ===`);
      // Only print non-standard headers
      for (const [k, v] of Object.entries(info.headers)) {
        if (!['sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform'].includes(k)) {
          const val = k === 'authorization' ? v.substring(0, 40) + '...' : v;
          console.log(`  ${k}: ${val}`);
        }
      }
    }
  }

  await browser.close();
}

captureHeaders().catch(console.error);
