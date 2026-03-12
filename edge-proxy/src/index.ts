/**
 * MikroTik Edge Proxy Server
 *
 * Deployed on L2TP tunnel server (34.35.85.28) to proxy
 * requests from CircleTel to MikroTik routers on 10.125.x.x network.
 *
 * Features:
 * - API key + HMAC signature authentication
 * - RouterOS version detection (6.x Native API, 7.x+ REST API)
 * - Rate limiting per router
 * - Request logging
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { verifyAuth } from './middleware/auth';
import { routerRoutes } from './routes/routers';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://www.circletel.co.za', 'https://circletel-staging.vercel.app'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'X-API-Key', 'X-Timestamp', 'X-Signature'],
}));
app.use('/routers/*', verifyAuth);

// Routes
app.get('/health', (c) => {
  return c.json({
    healthy: true,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.route('/routers', routerRoutes);

// Error handler
app.onError((err, c) => {
  console.error('[Proxy Error]', err);
  return c.json(
    { error: err.message || 'Internal server error' },
    500
  );
});

// Start server
const port = parseInt(process.env.PORT || '8443', 10);

console.log(`[MikroTik Proxy] Starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`[MikroTik Proxy] Running at http://localhost:${port}`);
