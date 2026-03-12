/**
 * Authentication Middleware
 *
 * Validates API key and HMAC signature for incoming requests.
 */

import { createMiddleware } from 'hono/factory';
import { createHmac, timingSafeEqual } from 'crypto';

const API_KEY = process.env.PROXY_API_KEY || '';
const HMAC_SECRET = process.env.PROXY_HMAC_SECRET || '';
const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000; // 5 minutes

export const verifyAuth = createMiddleware(async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  const timestamp = c.req.header('X-Timestamp');
  const signature = c.req.header('X-Signature');

  // Check API key
  if (!apiKey || apiKey !== API_KEY) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  // Check timestamp (prevent replay attacks)
  if (!timestamp) {
    return c.json({ error: 'Missing timestamp' }, 401);
  }

  const timestampMs = parseInt(timestamp, 10);
  const now = Date.now();
  if (Math.abs(now - timestampMs) > MAX_TIMESTAMP_DRIFT_MS) {
    return c.json({ error: 'Timestamp too old' }, 401);
  }

  // Check HMAC signature
  if (!signature) {
    return c.json({ error: 'Missing signature' }, 401);
  }

  const path = new URL(c.req.url).pathname;
  const expectedSignature = createHmac('sha256', HMAC_SECRET)
    .update(`${path}:${timestamp}`)
    .digest('hex');

  try {
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    if (!timingSafeEqual(sigBuffer, expectedBuffer)) {
      return c.json({ error: 'Invalid signature' }, 401);
    }
  } catch {
    return c.json({ error: 'Invalid signature format' }, 401);
  }

  await next();
});
