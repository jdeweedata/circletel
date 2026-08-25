# Verifying a Populated Admin Page

**Trigger**: About to claim an `/admin/*` page works, renders data, or looks right; screenshotting an admin page; "verify the dashboard"
**Scope**: Seeing admin UI with real data before calling it done
**Source**: Wayfinder #691 (Usage Reports dashboard, 2026-08-01)

---

## The trap

`ALLOW_DEV_ADMIN_BYPASS` covers `/admin/*` **pages only**. Every `/api/admin/*` route uses
`authenticateAdmin()` (`lib/auth/admin-api-auth.ts`), which has **no bypass**.

So with the bypass on and no session, the page shell renders, every data fetch 401s, and the
screenshot looks like a working page displaying nothing. Silent, and easy to mistake for success.

**A rendered admin page is not evidence its data works.** Check the network calls.

---

## The path

`authenticateAdmin()` accepts a Bearer token *or* a cookie session — so no bypass and no
service-role impersonation is needed. Log in as a real admin.

`.env.local` already carries `ADMIN_TEST_USERNAME` / `ADMIN_TEST_PASSWORD` (an active
`super_admin`).

```bash
# dev server first, on a port that is open in ufw (3002 = "circletel dev preview")
ALLOW_DEV_ADMIN_BYPASS=true node --max-old-space-size=8192 \
  ./node_modules/next/dist/bin/next dev -p 3002 &

set -a && source .env.local && set +a && \
  npx tsx scripts/verify-admin-page.ts /admin/network/usage-reports
```

`scripts/verify-admin-page.ts` logs in through `/admin/login`, captures the page at 1440px and
375px, and **exits non-zero if any `/api/admin/*` call returned 401/403** — so an unpopulated page
fails instead of quietly screenshotting an empty shell.

Options: `--base=`, `--out=` (default `.claude/scratch/verify`, gitignored), `--widths=1440,375`.

---

## Gotchas this encodes

| Gotcha | Why it bites |
|---|---|
| Cold `next dev` compiles a route on first hit | Blows Playwright's 30s default; the script uses 180s |
| Sidebar covers the page below `lg` | `AdminLayoutClient` starts `sidebarOpen: true`, so a 375px screenshot shows only the nav. The script clicks the backdrop — near the **right edge**, since the 256px sidebar (z-50) sits above the z-40 backdrop and eats a centre click |
| Sidebar "closes" but stays visible | It slides out via `-translate-x-full`, so Playwright still calls it visible. Wait for its bounding box to leave the viewport, not for `state: 'hidden'` |
| Public IP won't work for the bypass | `handleAdminAuth` requires a `localhost` / `127.0.0.1` Host header. Use an SSH tunnel (`ssh -L 3002:localhost:3002`) to browse from your own machine — do not weaken the check |

---

## Don't

- Don't add a dev bypass to `authenticateAdmin()` — the page-level guard is deliberately narrow.
- Don't send admin credentials over plain HTTP to the public IP; tunnel instead.
- Don't claim a page renders correctly from a screenshot alone — confirm no admin API call was denied.
