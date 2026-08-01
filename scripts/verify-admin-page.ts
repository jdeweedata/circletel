/**
 * Verify a populated admin page against a real admin session.
 *
 * Why this exists (#691): `ALLOW_DEV_ADMIN_BYPASS` covers `/admin/*` PAGES only.
 * `/api/admin/*` uses `authenticateAdmin()`, which has no bypass — so a bypassed
 * page renders its shell while every data fetch 401s, and the page *looks* fine
 * while showing nothing real. This logs in properly instead, so what you see is
 * what an admin sees.
 *
 * It fails loudly rather than screenshotting an empty page: any 401/403 on an
 * `/api/admin/*` call, a redirect back to the login screen, or a page error all
 * exit non-zero.
 *
 * Usage (dev server must already be running):
 *   set -a && source .env.local && set +a && \
 *     npx tsx scripts/verify-admin-page.ts /admin/network/usage-reports
 *
 * Options:
 *   --base=http://localhost:3002   dev server origin (default)
 *   --out=<dir>                    screenshot directory (default .claude/scratch/verify)
 *   --widths=1440,375              viewport widths to capture (default)
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium, type Browser, type Page } from 'playwright';

interface Options {
  path: string;
  base: string;
  out: string;
  widths: number[];
}

function parseArgs(argv: string[]): Options {
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const flag = (name: string): string | undefined =>
    argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=').slice(1).join('=');

  const path = positional[0];
  if (!path || !path.startsWith('/')) {
    throw new Error('Pass an admin path, e.g. /admin/network/usage-reports');
  }

  return {
    path,
    base: flag('base') ?? 'http://localhost:3002',
    out: flag('out') ?? '.claude/scratch/verify',
    widths: (flag('widths') ?? '1440,375')
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0),
  };
}

function requireCredentials(): { email: string; password: string } {
  const email = process.env.ADMIN_TEST_USERNAME;
  const password = process.env.ADMIN_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'ADMIN_TEST_USERNAME and ADMIN_TEST_PASSWORD must be set — source .env.local first'
    );
  }
  return { email, password };
}

async function signIn(page: Page, base: string): Promise<void> {
  const { email, password } = requireCredentials();
  // Generous: a cold `next dev` compiles the login route on first hit, which
  // routinely exceeds Playwright's 30s default.
  await page.goto(`${base}/admin/login`, {
    waitUntil: 'domcontentloaded',
    timeout: 180_000,
  });
  await page.locator('#email').fill(email, { timeout: 60_000 });
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/admin/login'), {
    timeout: 60_000,
  });
}

interface Findings {
  deniedApiCalls: string[];
  pageErrors: string[];
  consoleErrors: string[];
}

function watch(page: Page, findings: Findings): void {
  page.on('response', (response) => {
    const url = response.url();
    if (!url.includes('/api/admin/')) return;
    if (response.status() === 401 || response.status() === 403) {
      findings.deniedApiCalls.push(`${response.status()} ${new URL(url).pathname}`);
    }
  });
  page.on('pageerror', (error) => {
    findings.pageErrors.push(String(error).slice(0, 200));
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      findings.consoleErrors.push(message.text().slice(0, 200));
    }
  });
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const outDir = resolve(process.cwd(), options.out);
  mkdirSync(outDir, { recursive: true });

  const slug = options.path.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-');
  const findings: Findings = {
    deniedApiCalls: [],
    pageErrors: [],
    consoleErrors: [],
  };

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch();
    // One context — the session cookies are reused across every viewport.
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const loginPage = await context.newPage();
    await signIn(loginPage, options.base);
    await loginPage.close();

    for (const width of options.widths) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: width < 768 ? 900 : 1000 });
      watch(page, findings);

      await page.goto(`${options.base}${options.path}`, {
        waitUntil: 'networkidle',
        timeout: 180_000,
      });

      if (new URL(page.url()).pathname.startsWith('/admin/login')) {
        throw new Error(`Bounced to login at ${width}px — session did not hold`);
      }

      // AdminLayoutClient starts with `sidebarOpen: true`, so below the `lg`
      // breakpoint the nav covers the page and a screenshot shows only the menu.
      // Dismiss it via the backdrop the layout renders for exactly that purpose,
      // otherwise mobile can never be assessed (the trap that blocked #688).
      if (width < 1024) {
        const backdrop = page.locator('div.fixed.inset-0.z-40').first();
        if (await backdrop.isVisible().catch(() => false)) {
          // Click near the right edge: the backdrop spans the viewport but the
          // 256px sidebar sits above it (z-50), so a default centre click lands
          // on the nav instead of dismissing it.
          await backdrop.click({ position: { x: width - 16, y: 300 } });
          // It slides out via `-translate-x-full` rather than unmounting, so it
          // stays "visible" to Playwright — wait for it to actually leave the
          // viewport instead.
          await page.waitForFunction(
            () => {
              const nav = document.querySelector('[data-testid="sidebar"]');
              return !nav || nav.getBoundingClientRect().right <= 1;
            },
            undefined,
            { timeout: 10_000 }
          );
        }
      }

      const file = resolve(outDir, `${slug}-${width}.png`);
      await page.screenshot({ path: file, fullPage: width >= 768 });
      const textLength = (await page.locator('body').innerText()).length;
      console.log(`${width}px → ${file}  (${textLength} chars of text)`);
      await page.close();
    }
  } finally {
    await browser?.close();
  }

  const denied = [...new Set(findings.deniedApiCalls)];
  const errors = [...new Set([...findings.pageErrors, ...findings.consoleErrors])];

  if (errors.length > 0) {
    console.log('\nconsole / page errors:');
    for (const error of errors.slice(0, 10)) console.log(`  ${error}`);
  }

  if (denied.length > 0) {
    console.error('\nFAILED — admin API calls were denied, so the page is not populated:');
    for (const call of denied) console.error(`  ${call}`);
    process.exit(1);
  }

  console.log('\nOK — no admin API call was denied; screenshots show real data.');
}

main().catch((error) => {
  console.error('verify-admin-page failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
