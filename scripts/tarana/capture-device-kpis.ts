import { chromium } from 'playwright';

async function captureDeviceKpis() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const kpiRequests: Array<{ url: string; body: unknown }> = [];

  page.on('request', req => {
    const url = req.url();
    if (url.includes('kpi') || url.includes('tmq') || url.includes('nqs')) {
      const body = req.postData();
      if (body) {
        try {
          kpiRequests.push({ url: url.split('.com')[1], body: JSON.parse(body) });
        } catch {}
      }
    }
  });

  // Login
  await page.goto('https://portal.tcs.taranawireless.com/operator-portal/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[name="username"]', 'mmathabo.setoaba@circletel.co.za');
  await page.fill('input[type="password"]', 'rLa!46Tnk3#m84R');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Navigate to operator portal  
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Try navigating to a BN detail page (we know X16453-BN-45 from the screenshot)
  // First find the BN in the network  
  const radiosUrl = 'https://portal.tcs.taranawireless.com/operator-portal/operator/network/device/X16453-BN-45';
  await page.goto(radiosUrl, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  console.log('After nav:', page.url());

  // Try the devices list page
  await page.goto('https://portal.tcs.taranawireless.com/operator-portal/operator/network', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);

  console.log('\n=== KPI Requests captured ===');
  for (const r of kpiRequests) {
    console.log(`\nURL: ${r.url}`);
    console.log(JSON.stringify(r.body, null, 2).substring(0, 800));
  }

  await browser.close();
}

captureDeviceKpis().catch(console.error);
