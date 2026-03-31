import { chromium } from 'playwright';

async function captureAuth() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  let loginReqBody: string | null = null;
  let loginReqHeaders: Record<string, string> = {};
  let loginToken: string | null = null;

  // Intercept requests to capture login payload and response
  page.on('request', req => {
    if (req.url().includes('user-auth/login')) {
      loginReqBody = req.postData();
      loginReqHeaders = req.headers();
      console.log('LOGIN REQUEST BODY:', req.postData());
      console.log('LOGIN REQUEST HEADERS:', JSON.stringify(req.headers(), null, 2));
    }
  });

  page.on('response', async resp => {
    if (resp.url().includes('user-auth/login') && resp.status() === 200) {
      try {
        const body = await resp.json();
        loginToken = body.accessToken || body.access_token || body.token;
        console.log('LOGIN RESPONSE:', JSON.stringify(body).substring(0, 500));
      } catch {}
    }
  });

  await page.goto('https://portal.tcs.taranawireless.com/operator-portal/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[name="username"]', 'mmathabo.setoaba@circletel.co.za');
  await page.fill('input[type="password"]', 'rLa!46Tnk3#m84R');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await browser.close();

  if (!loginToken) console.log('No token captured');
}

captureAuth().catch(console.error);
