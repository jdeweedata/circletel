/**
 * Mint a Desk-scoped access token from ZOHO_DESK_REFRESH_TOKEN.
 * Do not use the shared zoho_tokens CRM cache — it gets overwritten with a
 * CRM-only token and Desk creates then 401/403.
 */

const REGION_HOST: Record<string, string> = {
  US: 'accounts.zoho.com',
  EU: 'accounts.zoho.eu',
  IN: 'accounts.zoho.in',
  AU: 'accounts.zoho.com.au',
  CN: 'accounts.zoho.com.cn',
};

export async function mintDeskAccessToken(): Promise<string> {
  const region = process.env.ZOHO_REGION || 'US';
  const host = REGION_HOST[region] || REGION_HOST.US;
  const clientId = process.env.ZOHO_DESK_CLIENT_ID || process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_DESK_CLIENT_SECRET || process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_DESK_REFRESH_TOKEN || process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Zoho Desk OAuth credentials (ZOHO_DESK_REFRESH_TOKEN / ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET)'
    );
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const res = await fetch(`https://${host}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };

  if (!data.access_token) {
    throw new Error(`Desk token refresh failed: ${data.error || res.status}`);
  }

  return data.access_token;
}
