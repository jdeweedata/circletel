/**
 * MTN Session Validation Script
 *
 * Validates MTN SSO session by making API call (no browser required).
 * Perfect for CI/CD workflows and monitoring.
 *
 * Exit Codes:
 *   0 - Session valid
 *   1 - Session invalid (expired or missing)
 *   2 - Error during validation
 *
 * Output Format (JSON):
 *   {
 *     "valid": boolean,
 *     "sessionId": string,
 *     "trackedExpiry": string,
 *     "minutesUntilTrackedExpiry": number,
 *     "apiResponse": "success" | "unauthorized" | "error",
 *     "message": string,
 *     "timestamp": string
 *   }
 *
 * Usage:
 *   npx tsx scripts/validate-mtn-session.ts              # Pretty output
 *   npx tsx scripts/validate-mtn-session.ts --json       # JSON only (for CI/CD)
 *   npx tsx scripts/validate-mtn-session.ts --verbose    # Detailed logging
 */

import fs from 'fs/promises';
import path from 'path';

interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite?: string;
}

interface CachedSession {
  cookies: Cookie[];
  sessionId: string;
  expiresAt: string;
}

interface ValidationResult {
  valid: boolean;
  sessionId: string;
  trackedExpiry: string;
  minutesUntilTrackedExpiry: number;
  apiResponse: 'success' | 'unauthorized' | 'error';
  message: string;
  timestamp: string;
  apiStatusCode?: number;
  apiError?: string;
}

const CACHE_PATH = path.join(process.cwd(), '.cache', 'mtn-session.json');
const ENV_SESSION_VAR = 'MTN_SESSION';
const MTN_API_BASE = 'https://asp-feasibility.mtnbusiness.co.za';
const MTN_API_KEY = 'bdaacbcae8ab77672e545649df54d0df';

const ARGS = process.argv.slice(2);
const JSON_OUTPUT = ARGS.includes('--json');
const VERBOSE = ARGS.includes('--verbose');

/**
 * Log message (unless JSON-only mode)
 */
function log(...args: any[]) {
  if (!JSON_OUTPUT) {
    console.log(...args);
  }
}

/**
 * Log verbose message
 */
function logVerbose(...args: any[]) {
  if (VERBOSE && !JSON_OUTPUT) {
    console.log('[VERBOSE]', ...args);
  }
}

/**
 * Load session from environment variable (production)
 */
function loadSessionFromEnv(): CachedSession | null {
  try {
    const envSession = process.env[ENV_SESSION_VAR];
    if (!envSession) {
      logVerbose('No MTN_SESSION environment variable found');
      return null;
    }

    const decoded = Buffer.from(envSession, 'base64').toString('utf-8');
    const session = JSON.parse(decoded);
    logVerbose('Loaded session from environment variable');
    return session;
  } catch (error) {
    logVerbose('Failed to parse environment session:', error);
    return null;
  }
}

/**
 * Load session from file cache (development)
 */
async function loadSessionFromFile(): Promise<CachedSession | null> {
  try {
    const data = await fs.readFile(CACHE_PATH, 'utf-8');
    const session = JSON.parse(data);
    logVerbose('Loaded session from file cache');
    return session;
  } catch (error) {
    logVerbose('Failed to load file cache:', error);
    return null;
  }
}

/**
 * Load session (env var takes priority)
 */
async function loadSession(): Promise<CachedSession | null> {
  // Try environment variable first (production)
  const envSession = loadSessionFromEnv();
  if (envSession) {
    return envSession;
  }

  // Fall back to file cache (development)
  return await loadSessionFromFile();
}

/**
 * Generate Cookie header from session cookies
 */
function getCookieHeader(session: CachedSession): string {
  return session.cookies
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
}

/**
 * Calculate minutes until tracked expiry
 */
function getMinutesUntilExpiry(session: CachedSession): number {
  const expiresAt = new Date(session.expiresAt);
  const now = new Date();
  const millisLeft = expiresAt.getTime() - now.getTime();
  return Math.floor(millisLeft / 60000);
}

/**
 * Validate session by calling MTN API
 */
async function validateViaAPI(session: CachedSession): Promise<{
  apiResponse: 'success' | 'unauthorized' | 'error';
  statusCode?: number;
  error?: string;
}> {
  try {
    const cookieHeader = getCookieHeader(session);
    logVerbose('Cookie header length:', cookieHeader.length);

    const response = await fetch(
      `${MTN_API_BASE}/api/v1/feasibility/product/wholesale/mns`,
      {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader,
          'X-API-Key': MTN_API_KEY,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://asp-feasibility.mtnbusiness.co.za/',
        },
      }
    );

    logVerbose('API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      logVerbose('API response:', data);
      return {
        apiResponse: 'success',
        statusCode: response.status,
      };
    } else if (response.status === 401 || response.status === 403) {
      const errorText = await response.text();
      logVerbose('Unauthorized response:', errorText.substring(0, 200));
      return {
        apiResponse: 'unauthorized',
        statusCode: response.status,
        error: errorText.substring(0, 200),
      };
    } else {
      const errorText = await response.text();
      logVerbose('Error response:', errorText.substring(0, 200));
      return {
        apiResponse: 'error',
        statusCode: response.status,
        error: errorText.substring(0, 200),
      };
    }
  } catch (error) {
    logVerbose('API call failed:', error);
    return {
      apiResponse: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main validation logic
 */
async function main() {
  const timestamp = new Date().toISOString();

  if (!JSON_OUTPUT) {
    log('');
    log('='.repeat(70));
    log('MTN Session Validation');
    log('='.repeat(70));
    log('');
  }

  // Load session
  const session = await loadSession();

  if (!session) {
    const result: ValidationResult = {
      valid: false,
      sessionId: '',
      trackedExpiry: '',
      minutesUntilTrackedExpiry: 0,
      apiResponse: 'error',
      message: 'No session found (check MTN_SESSION env var or .cache/mtn-session.json)',
      timestamp,
    };

    if (JSON_OUTPUT) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      log('❌ No session found');
      log('');
      log('Please authenticate first:');
      log('  npx tsx scripts/test-mtn-sso-auth.ts --manual');
      log('');
    }

    process.exit(1);
  }

  // Calculate tracked expiry
  const minutesLeft = getMinutesUntilExpiry(session);

  if (!JSON_OUTPUT) {
    log('📊 Session Info:');
    log(`   Session ID: ${session.sessionId}`);
    log(`   Tracked Expiry: ${session.expiresAt}`);
    log(`   Minutes Until Tracked Expiry: ${minutesLeft}`);
    log(`   Cookies: ${session.cookies.length}`);
    log('');
  }

  // Validate via API
  if (!JSON_OUTPUT) {
    log('🔍 Validating session via API call...');
  }

  const apiResult = await validateViaAPI(session);

  // Build result
  const result: ValidationResult = {
    valid: apiResult.apiResponse === 'success',
    sessionId: session.sessionId,
    trackedExpiry: session.expiresAt,
    minutesUntilTrackedExpiry: minutesLeft,
    apiResponse: apiResult.apiResponse,
    message: '',
    timestamp,
    apiStatusCode: apiResult.statusCode,
    apiError: apiResult.error,
  };

  // Set message based on result
  if (apiResult.apiResponse === 'success') {
    result.message = minutesLeft > 0
      ? `Session valid (API returned 200, ${minutesLeft} minutes until tracked expiry)`
      : `Session valid (API returned 200, tracked expiry passed but cookies still work)`;
  } else if (apiResult.apiResponse === 'unauthorized') {
    result.message = `Session expired (API returned ${apiResult.statusCode})`;
  } else {
    result.message = `Validation error: ${apiResult.error || 'Unknown error'}`;
  }

  // Output result
  if (JSON_OUTPUT) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    log('');
    log('='.repeat(70));
    if (result.valid) {
      log('✅ Result: Session Valid');
      log('='.repeat(70));
      log('');
      log(`Message: ${result.message}`);
      log(`API Status: ${result.apiStatusCode}`);
      log('');
      if (minutesLeft < 0) {
        log('⚠️  Note: Tracked expiry has passed, but session cookies still valid');
        log('   This indicates server-side session lasts longer than our 60-min estimate');
        log('');
      }
    } else if (result.apiResponse === 'unauthorized') {
      log('❌ Result: Session Expired');
      log('='.repeat(70));
      log('');
      log(`Message: ${result.message}`);
      log(`API Status: ${result.apiStatusCode}`);
      log('');
      log('Re-authentication required:');
      log('  npx tsx scripts/test-mtn-sso-auth.ts --manual');
      log('');
    } else {
      log('⚠️  Result: Validation Error');
      log('='.repeat(70));
      log('');
      log(`Message: ${result.message}`);
      log('');
    }
  }

  // Exit code
  process.exit(result.valid ? 0 : 1);
}

main();
