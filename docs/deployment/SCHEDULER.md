# Platform Scheduler (portable crons)

**Since**: Phase 0 (2026-07) | **Spec**: whitelabel design §12

## How scheduled jobs run

`vercel.json` `.crons[]` is the single source of truth (path + schedule,
UTC). Jobs are HTTP routes under `app/api/cron/*` authenticated by
`Authorization: Bearer $CRON_SECRET`. The host fires them via curl from
its crontab. Inngest crons are DORMANT in this deployment — never add a
scheduled job as an Inngest cron (see .claude rules / project memory).

## Adding a cron

1. Create `app/api/cron/<name>/route.ts` with the CRON_SECRET check
   (copy the pattern from `app/api/cron/generate-invoices/route.ts`).
2. Add `{ "path": "/api/cron/<name>", "schedule": "<cron expr>" }` to
   `vercel.json` `.crons[]`.
3. On the host: `ops/scheduler/generate-crontab.sh | crontab -`
   (backup first: `crontab -l > /root/crontab.backup.$(date +%Y%m%d)`).
4. Verify: `ops/scheduler/check-drift.sh` → OK.

## Host requirements (VPS today, tenant bundle later)

- `/root/.cron-env` exporting `CRON_SECRET` and `APP_URL`
- `curl`, `jq`, and a cron daemon
- In the tenant-bundle container (spec §12), the same generated file
  feeds the container's crond — no host-specific scheduler dependency.

## Drift check

`ops/scheduler/check-drift.sh` compares the live crontab to vercel.json
and exits 1 on mismatch. Run it after every deploy that touched crons.
