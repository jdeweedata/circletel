# Owned RADIUS Integration

CircleTel can provision home-line subscribers through an owned RADIUS API (hosted on Coolify) instead of Interstellio. The production app talks to that API through `lib/radius`; per-site routing lives in `lib/provisioning`.

## Environment variables

Set these in Coolify for the production app. Do not commit live values.

| Variable | Purpose |
| --- | --- |
| `RADIUS_API_URL` | Base URL of the owned RADIUS API |
| `RADIUS_API_TOKEN` | Bearer token for admin API calls |

Placeholders are in `.env.example` immediately after the Interstellio block.

If either variable is missing, `getRadiusClient()` throws `RADIUS_NOT_CONFIGURED` and admin RADIUS routes return 500.

## Admin surface

**Path:** `/admin/integrations/radius`

Registered in the admin feature registry as **Owned RADIUS**. The page has two tabs:

- **Voucher Issuance** — batch issue prepaid voucher codes via `POST /api/admin/integrations/radius/vouchers`
- **Home Lines** — list, provision, enable/disable, change profile, and disconnect subscribers for a selected corporate site via `/api/admin/integrations/radius/subscribers/*`

All admin routes require an authenticated admin session and call the owned API through `RadiusClient`.

## Per-site provider selection

Each corporate site has a `radius_provider` field (`interstellio` or `radius`, default `interstellio`). `getProviderForSite(siteId)` in `lib/provisioning/resolve.ts` reads that value and returns either `InterstellioSubscriberProvider` or `RadiusSubscriberProvider`.

Flip a site to owned RADIUS by updating `radius_provider` to `radius` for that site in Supabase (or through your usual site admin workflow). Subscriber operations for that site then use the owned API; other sites keep using Interstellio unless changed.

## What is not in this repo

- RADIUS database schema, table names, or SQL
- Live API URLs, tokens, or wholesale rate tables
- The Coolify-hosted RADIUS API itself (see the separate FWA/portal plan)

For Interstellio-specific API details, see `docs/api/INTERSTELLIO_API.md`.
