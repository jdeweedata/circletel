/**
 * Automated MTN Session Refresh with 2Captcha
 *
 * This script uses 2Captcha service to automatically solve reCAPTCHA
 * and refresh the MTN session without manual intervention.
 *
 * Requirements:
 * - 2Captcha API key (https://2captcha.com)
 * - Cost: ~$2.99 per 1000 captchas solved
 * - Average cost per refresh: $0.003
 *
 * Usage:
 *   npx tsx scripts/automated-mtn-refresh.ts
 *
 * Environment Variables:
 *   TWOCAPTCHA_API_KEY - Your 2Captcha API key
 *   MTN_USERNAME - MTN SSO username
 *   MTN_PASSWORD - MTN SSO password
 */

import { chromium, Browser, Page } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

interface TwoCaptchaResponse {
  status: number;
  request: string;
}

class AutomatedMTNRefresh {
  private readonly SSO_URL = 'https://sso.mtnbusiness.co.za/login?service=https%3A%2F%2Fasp-feasibility.mtnbusiness.co.za%2Flogin%2Fcas';
  private readonly TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY || '';
  private readonly sessionCachePath = path.join(process.cwd(), '.cache', 'mtn-session.json');

  /**
   * Solve reCAPTCHA using 2Captcha service
   */
  private async solveRecaptcha(page: Page): Promise<string> {
    console.log('[2Captcha] Getting reCAPTCHA site key...');

    // Get reCAPTCHA site key from page
    const siteKey = await page.evaluate(() => {
      const recaptchaElement = document.querySelector('.g-recaptcha');
      return recaptchaElement?.getAttribute('data-sitekey') || '';
    });

    if (!siteKey) {
      throw new Error('Could not find reCAPTCHA site key');
    }

    console.log('[2Captcha] Site key:', siteKey);
    console.log('[2Captcha] Submitting captcha task...');

    // Submit captcha to 2Captcha
    const submitUrl = `https://2captcha.com/in.php?key=${this.TWOCAPTCHA_API_KEY}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${this.SSO_URL}&json=1`;

    const submitResponse = await fetch(submitUrl);
    const submitData = await submitResponse.json() as TwoCaptchaResponse;

    if (submitData.status !== 1) {
      throw new Error(`2Captcha submission failed: ${submitData.request}`);
    }

    const taskId = submitData.request;
    console.log('[2Captcha] Task ID:', taskId);
    console.log('[2Captcha] Waiting for solution (30-60 seconds)...');

    // Poll for result
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const resultUrl = `https://2captcha.com/res.php?key=${this.TWOCAPTCHA_API_KEY}&action=get&id=${taskId}&json=1`;
      const resultResponse = await fetch(resultUrl);
      const resultData = await resultResponse.json() as TwoCaptchaResponse;

      if (resultData.status === 1) {
        console.log('[2Captcha] ✅ Captcha solved!');
        return resultData.request;
      }

      if (resultData.request !== 'CAPCHA_NOT_READY') {
        throw new Error(`2Captcha error: ${resultData.request}`);
      }

      attempts++;
      console.log(`[2Captcha] Still processing... (${attempts}/${maxAttempts})`);
    }

    throw new Error('2Captcha timeout - captcha not solved in time');
  }

  /**
   * Authenticate with MTN SSO using automated captcha solving
   */
  async authenticate(): Promise<void> {
    if (!this.TWOCAPTCHA_API_KEY) {
      throw new Error('TWOCAPTCHA_API_KEY environment variable not set');
    }

    const username = process.env.MTN_USERNAME;
    const password = process.env.MTN_PASSWORD;

    if (!username || !password) {
      throw new Error('MTN_USERNAME and MTN_PASSWORD environment variables required');
    }

    let browser: Browser | null = null;

    try {
      console.log('[MTN SSO] Launching browser...');
      browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-sandbox'
        ]
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'Africa/Johannesburg'
      });

      const page = await context.newPage();

      console.log('[MTN SSO] Navigating to login page...');
      await page.goto(this.SSO_URL, { waitUntil: 'networkidle', timeout: 30000 });

      // Fill credentials
      console.log('[MTN SSO] Filling credentials...');
      await page.fill('#dummyUser', username);
      await page.fill('#password', password);

      // Solve reCAPTCHA automatically
      const recaptchaToken = await this.solveRecaptcha(page);

      // Inject reCAPTCHA response
      console.log('[MTN SSO] Injecting reCAPTCHA solution...');
      await page.evaluate((token) => {
        const textarea = document.getElementById('g-recaptcha-response') as HTMLTextAreaElement;
        if (textarea) {
          textarea.value = token;
          textarea.style.display = 'block'; // Make it visible
        }
      }, recaptchaToken);

      // Submit form
      console.log('[MTN SSO] Submitting login form...');
      const [response] = await Promise.all([
        page.waitForNavigation({ timeout: 30000 }),
        page.click('#submit-button')
      ]);

      console.log('[MTN SSO] Login response status:', response?.status());

      // Check if login was successful
      const currentUrl = page.url();
      if (currentUrl.includes('login')) {
        throw new Error('Login failed - still on login page');
      }

      // Wait for service page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Extract cookies
      const cookies = await context.cookies();
      console.log('[MTN SSO] Extracted cookies:', cookies.length);

      const sessionCookie = cookies.find(c =>
        c.name.includes('SESSION') || c.name.includes('JSESSIONID')
      );

      const sessionId = sessionCookie?.value || `mtn_${Date.now()}`;

      // Calculate expiration (24 hours from now for safety)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Save session
      const session = {
        cookies,
        sessionId,
        expiresAt: expiresAt.toISOString()
      };

      const cacheDir = path.dirname(this.sessionCachePath);
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(this.sessionCachePath, JSON.stringify(session, null, 2));

      console.log('[MTN SSO] ✅ Authentication successful!');
      console.log('[MTN SSO] Session ID:', sessionId);
      console.log('[MTN SSO] Expires at:', expiresAt.toISOString());
      console.log('[MTN SSO] Session saved to:', this.sessionCachePath);

    } catch (error) {
      console.error('[MTN SSO] Authentication error:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Export session to base64 for environment variables
   */
  async exportSessionToBase64(): Promise<string> {
    const sessionData = await fs.readFile(this.sessionCachePath, 'utf-8');
    return Buffer.from(sessionData).toString('base64');
  }
}

// Main execution
async function main() {
  console.log('======================================================================');
  console.log('Automated MTN Session Refresh');
  console.log('======================================================================');
  console.log('');

  const refresher = new AutomatedMTNRefresh();

  try {
    // Step 1: Authenticate
    await refresher.authenticate();

    // Step 2: Export to base64
    console.log('');
    console.log('[Export] Converting session to base64...');
    const base64Session = await refresher.exportSessionToBase64();

    console.log('');
    console.log('======================================================================');
    console.log('✅ Session Refresh Complete!');
    console.log('======================================================================');
    console.log('');
    console.log('Base64 session (for environment variables):');
    console.log('');
    console.log(base64Session);
    console.log('');
    console.log('Next steps:');
    console.log('1. Update Vercel: echo "..." | vercel env rm MTN_SESSION production --yes && echo "..." | vercel env add MTN_SESSION production');
    console.log('2. Update GitHub: echo "..." | gh secret set MTN_SESSION');
    console.log('3. Deploy: vercel --prod --yes');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Session refresh failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { AutomatedMTNRefresh };
