import { chromium } from 'playwright';
import * as fs from 'fs';

async function captureDevicesPage() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  const calls: Array<{ url: string; method: string; body?: unknown; responseStatus?: number; responseBody?: unknown }> = [];

  page.on('request', req => {
    const url = req.url();
    if (url.includes('/api/') && !url.includes('heap-api') && !url.includes('hotjar')) {
      const bodyStr = req.postData();
      let body;
      try { body = bodyStr ? JSON.parse(bodyStr) : undefined; } catch { body = bodyStr; }
      calls.push({ url: url.split('portal.tcs.taranawireless.com')[1] || url, method: req.method(), body });
    }
  });

  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('/api/') && !url.includes('heap-api')) {
      const call = calls.find(c => url.includes(c.url?.replace(/\?.*/,'')));
      if (call && resp.status() === 200 && !call.responseBody) {
        try {
          call.responseStatus = resp.status();
          const body = await resp.json();
          call.responseBody = body;
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

  // Navigate to devices/network page
  await page.goto('https://portal.tcs.taranawireless.com/operator-portal/operator/network/devices', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(5000);

  console.log('Current URL:', page.url());
  console.log('\n=== API Calls from devices page ===');
  const newCalls = calls.filter(c => !c.url?.includes('user-auth') && !c.url?.includes('ffi/') && !c.url?.includes('tns/') && !c.url?.includes('tum/'));
  for (const c of newCalls.slice(-20)) {
    console.log(`\n${c.method} ${c.url}`);
    if (c.body) console.log('  Body:', JSON.stringify(c.body).substring(0, 200));
    if (c.responseBody) {
      const r = c.responseBody as any;
      const d = r?.data || r;
      const keys = Object.keys(d || {});
      console.log('  Response keys:', keys.slice(0, 10));
      if (Array.isArray(d)) console.log('  Response count:', d.length);
    }
  }

  await browser.close();
}
captureDevicesPage().catch(console.error);
