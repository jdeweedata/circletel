import { chromium } from 'playwright';

async function captureKpi() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  page.on('request', req => {
    const url = req.url();
    if (url.includes('tmq') || url.includes('kpi')) {
      const body = req.postData();
      console.log(`\n=== REQUEST ${req.method()} ${url.split('.com')[1]} ===`);
      if (body) {
        try {
          console.log(JSON.stringify(JSON.parse(body), null, 2));
        } catch { console.log(body); }
      }
    }
  });

  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('tmq') || url.includes('kpi')) {
      console.log(`\n=== RESPONSE ${resp.status()} ${url.split('.com')[1]?.substring(0, 60)} ===`);
      try {
        const body = await resp.json();
        const text = JSON.stringify(body);
        console.log(text.substring(0, 1000));
      } catch {}
    }
  });

  await page.goto('https://portal.tcs.taranawireless.com/operator-portal/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[name="username"]', 'mmathabo.setoaba@circletel.co.za');
  await page.fill('input[type="password"]', 'rLa!46Tnk3#m84R');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000);

  await browser.close();
}

captureKpi().catch(console.error);
