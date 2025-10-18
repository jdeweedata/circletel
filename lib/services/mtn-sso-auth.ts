/**
 * MTN SSO Authentication Service
 *
 * Handles authentication with MTN Business SSO portal using Playwright
 * to obtain session cookies for API access.
 */

import { chromium, Browser, Page, Cookie } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

interface AuthCredentials {
  username: string;
  password: string;
}

interface AuthSession {
  cookies: Cookie[];
  expiresAt: Date;
  sessionId: string;
}

interface AuthResult {
  success: boolean;
  cookies?: Cookie[];
  sessionId?: string;
  error?: string;
  expiresAt?: Date;
}

export class MTNSSOAuthService {
  private static instance: MTNSSOAuthService;
  private browser: Browser | null = null;
  private currentSession: AuthSession | null = null;
  private readonly sessionCachePath: string;
  private readonly SSO_URL = 'https://sso.mtnbusiness.co.za/login?service=https%3A%2F%2Fasp-feasibility.mtnbusiness.co.za%2Flogin%2Fcas';

  private constructor() {
    this.sessionCachePath = path.join(process.cwd(), '.cache', 'mtn-session.json');
  }

  public static getInstance(): MTNSSOAuthService {
    if (!MTNSSOAuthService.instance) {
      MTNSSOAuthService.instance = new MTNSSOAuthService();
    }
    return MTNSSOAuthService.instance;
  }

  /**
   * Load session from environment variable (for Vercel deployment)
   */
  private async loadSessionFromEnv(): Promise<AuthSession | null> {
    try {
      const sessionBase64 = process.env.MTN_SESSION;

      if (!sessionBase64) {
        return null;
      }

      console.log('[MTN SSO] Found MTN_SESSION environment variable');

      const sessionJson = Buffer.from(sessionBase64, 'base64').toString('utf-8');
      const session = JSON.parse(sessionJson);

      return {
        ...session,
        expiresAt: new Date(session.expiresAt)
      };
    } catch (error) {
      console.error('[MTN SSO] Error loading session from env:', error);
      return null;
    }
  }

  /**
   * Get valid authentication session, refreshing if necessary
   */
  public async getAuthSession(): Promise<AuthResult> {
    try {
      // Priority 1: Check environment variable (for Vercel)
      if (process.env.VERCEL || process.env.MTN_SESSION) {
        const envSession = await this.loadSessionFromEnv();
        if (envSession && this.isSessionValid(envSession)) {
          console.log('[MTN SSO] Using session from environment variable');
          this.currentSession = envSession;
          return {
            success: true,
            cookies: envSession.cookies,
            sessionId: envSession.sessionId,
            expiresAt: envSession.expiresAt
          };
        } else if (envSession) {
          console.warn('[MTN SSO] Environment session expired or invalid');
        }
      }

      // Priority 2: Check in-memory cache
      if (this.currentSession && this.isSessionValid(this.currentSession)) {
        console.log('[MTN SSO] Using in-memory cached session');
        return {
          success: true,
          cookies: this.currentSession.cookies,
          sessionId: this.currentSession.sessionId,
          expiresAt: this.currentSession.expiresAt
        };
      }

      // Priority 3: Try to load session from file cache (local development)
      const cachedSession = await this.loadCachedSession();
      if (cachedSession && this.isSessionValid(cachedSession)) {
        console.log('[MTN SSO] Using file-cached session');
        this.currentSession = cachedSession;
        return {
          success: true,
          cookies: cachedSession.cookies,
          sessionId: cachedSession.sessionId,
          expiresAt: cachedSession.expiresAt
        };
      }

      // No valid session found
      if (process.env.VERCEL) {
        // In Vercel, we can't authenticate with Playwright - return error
        console.error('[MTN SSO] No valid session in Vercel environment');
        return {
          success: false,
          error: 'No valid MTN session. Please update MTN_SESSION environment variable in Vercel dashboard.'
        };
      }

      // Local development - authenticate with Playwright
      console.log('[MTN SSO] No valid session, authenticating...');
      return await this.authenticate();
    } catch (error) {
      console.error('[MTN SSO] Error getting auth session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Authenticate with MTN SSO portal
   */
  private async authenticate(): Promise<AuthResult> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      const credentials = this.getCredentials();

      console.log('[MTN SSO] Launching browser...');
      browser = await chromium.launch({
        headless: true, // Set to false for debugging
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

      page = await context.newPage();

      console.log('[MTN SSO] Navigating to SSO login page...');
      await page.goto(this.SSO_URL, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for login form
      console.log('[MTN SSO] Waiting for login form...');
      await page.waitForSelector('#dummyUser', { timeout: 10000 });

      // Fill username
      console.log('[MTN SSO] Filling username...');
      await page.fill('#dummyUser', credentials.username);

      // Fill password
      console.log('[MTN SSO] Filling password...');
      await page.fill('#password', credentials.password);

      // Check if reCAPTCHA is present
      const recaptchaElement = await page.locator('.g-recaptcha').count();
      if (recaptchaElement > 0) {
        console.log('[MTN SSO] ⚠️  reCAPTCHA detected - this may require manual intervention');

        // Wait for reCAPTCHA to be solved (either manually or via service)
        // For now, we'll wait up to 60 seconds for the submit button to appear
        console.log('[MTN SSO] Waiting for reCAPTCHA validation (60s timeout)...');

        try {
          await page.waitForSelector('#submit-button:visible', { timeout: 60000 });
          console.log('[MTN SSO] reCAPTCHA appears to be validated');
        } catch (error) {
          console.error('[MTN SSO] reCAPTCHA validation timeout');
          throw new Error('reCAPTCHA validation failed - submit button did not appear');
        }
      }

      // Click submit button
      console.log('[MTN SSO] Submitting login form...');

      // Wait for navigation after login
      const [response] = await Promise.all([
        page.waitForNavigation({ timeout: 30000 }),
        page.click('#submit-button')
      ]);

      console.log('[MTN SSO] Login submitted, response status:', response?.status());

      // Check if login was successful
      const currentUrl = page.url();
      console.log('[MTN SSO] Current URL:', currentUrl);

      if (currentUrl.includes('login')) {
        // Still on login page - check for error messages
        const errorElement = await page.locator('.error, .alert-danger, .login-error').count();
        if (errorElement > 0) {
          const errorText = await page.locator('.error, .alert-danger, .login-error').first().textContent();
          throw new Error(`Login failed: ${errorText}`);
        }
        throw new Error('Login failed: Still on login page');
      }

      // Wait for the target service page to load
      console.log('[MTN SSO] Waiting for service page...');
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Extract cookies
      const cookies = await context.cookies();
      console.log('[MTN SSO] Extracted cookies:', cookies.length);

      // Find session cookie
      const sessionCookie = cookies.find(c =>
        c.name.includes('SESSION') ||
        c.name.includes('JSESSIONID') ||
        c.name === 'TS015f82aa'
      );

      const sessionId = sessionCookie?.value || `mtn_${Date.now()}`;

      // Calculate expiration (use shortest cookie expiry or 1 hour default)
      const minExpiry = cookies
        .filter(c => c.expires && c.expires > 0)
        .reduce((min, c) => Math.min(min, c.expires!), Date.now() / 1000 + 3600);

      const expiresAt = new Date(minExpiry * 1000);

      // Create session object
      const session: AuthSession = {
        cookies,
        sessionId,
        expiresAt
      };

      // Cache session
      this.currentSession = session;
      await this.saveSession(session);

      console.log('[MTN SSO] ✅ Authentication successful');
      console.log('[MTN SSO] Session ID:', sessionId);
      console.log('[MTN SSO] Expires at:', expiresAt.toISOString());

      return {
        success: true,
        cookies,
        sessionId,
        expiresAt
      };

    } catch (error) {
      console.error('[MTN SSO] Authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  /**
   * Get authentication cookies for API requests
   */
  public async getCookieHeader(): Promise<string | null> {
    const session = await this.getAuthSession();

    if (!session.success || !session.cookies) {
      return null;
    }

    return session.cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
  }

  /**
   * Get credentials from environment variables
   */
  private getCredentials(): AuthCredentials {
    const username = process.env.MTN_USERNAME || 'Lindokuhle.mdake@circletel.co.za';
    const password = process.env.MTN_PASSWORD || 'Lwandle@1992*';

    if (!username || !password) {
      throw new Error('MTN credentials not configured');
    }

    return { username, password };
  }

  /**
   * Check if session is still valid
   */
  private isSessionValid(session: AuthSession): boolean {
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    // Consider session valid if it expires more than 5 minutes from now
    const bufferMs = 5 * 60 * 1000;
    return expiresAt.getTime() - now.getTime() > bufferMs;
  }

  /**
   * Save session to file cache
   */
  private async saveSession(session: AuthSession): Promise<void> {
    try {
      const cacheDir = path.dirname(this.sessionCachePath);
      await fs.mkdir(cacheDir, { recursive: true });

      await fs.writeFile(
        this.sessionCachePath,
        JSON.stringify({
          ...session,
          expiresAt: session.expiresAt.toISOString()
        }, null, 2)
      );

      console.log('[MTN SSO] Session cached to file');
    } catch (error) {
      console.error('[MTN SSO] Error saving session cache:', error);
    }
  }

  /**
   * Load session from file cache
   */
  private async loadCachedSession(): Promise<AuthSession | null> {
    try {
      const data = await fs.readFile(this.sessionCachePath, 'utf-8');
      const parsed = JSON.parse(data);

      return {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt)
      };
    } catch (error) {
      // Cache file doesn't exist or is invalid
      return null;
    }
  }

  /**
   * Clear cached session (force re-authentication)
   */
  public async clearSession(): Promise<void> {
    this.currentSession = null;
    try {
      await fs.unlink(this.sessionCachePath);
      console.log('[MTN SSO] Session cache cleared');
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Manual authentication with visual browser (for debugging/setup)
   */
  public async authenticateManual(): Promise<AuthResult> {
    let browser: Browser | null = null;

    try {
      console.log('[MTN SSO] Launching browser in manual mode...');
      browser = await chromium.launch({
        headless: false, // Visible browser for manual intervention
        slowMo: 100
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      const page = await context.newPage();

      console.log('[MTN SSO] Navigate to:', this.SSO_URL);
      await page.goto(this.SSO_URL);

      console.log('[MTN SSO] Fill credentials...');
      const credentials = this.getCredentials();
      await page.fill('#dummyUser', credentials.username);
      await page.fill('#password', credentials.password);

      console.log('[MTN SSO] ⏳ Please solve reCAPTCHA manually and click LOGIN');
      console.log('[MTN SSO] Waiting up to 5 minutes...');

      // Wait for user to complete login (up to 5 minutes)
      await page.waitForURL((url) => {
        const urlString = typeof url === 'string' ? url : url.toString();
        return !urlString.includes('login');
      }, { timeout: 300000 });

      const cookies = await context.cookies();
      const sessionId = cookies.find(c => c.name.includes('SESSION'))?.value || `mtn_${Date.now()}`;

      const session: AuthSession = {
        cookies,
        sessionId,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      };

      this.currentSession = session;
      await this.saveSession(session);

      console.log('[MTN SSO] ✅ Manual authentication successful');

      return {
        success: true,
        cookies,
        sessionId,
        expiresAt: session.expiresAt
      };

    } catch (error) {
      console.error('[MTN SSO] Manual authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Manual authentication failed'
      };
    } finally {
      if (browser) {
        console.log('[MTN SSO] Closing browser in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await browser.close();
      }
    }
  }
}

// Export singleton instance
export const mtnSSOAuth = MTNSSOAuthService.getInstance();
