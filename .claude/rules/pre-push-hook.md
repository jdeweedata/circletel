# Pre-Push Hook

**Trigger**: Pushing a branch, "my push was blocked", editing `.githooks/`
**Scope**: Shared client-side pre-push validation

---

## What it is

A tracked, shared hook at **`.githooks/pre-push`** (NOT `.git/hooks/` — that's local-only).
Enabled via `core.hooksPath`, auto-applied on `npm install` / `npm ci` by the
`package.json` `prepare` script: `git config core.hooksPath .githooks`.

## What it checks (in order)

1. **Build config** — heap ≥6144 in `vercel.json`, and the `cpus` setting in `next.config.js`.
   `cpus` is now env-driven (`BUILD_CPUS`, default 1 — only the VPS deploy sets it to 4), so the
   hook recognizes that form as Vercel-safe; a bare `cpus: N>1` literal still fails.
   Catches OOM-risk config before it reaches the self-hosted runner.
2. **Scoped type-check** — runs `npm run type-check:memory` once, blocks **only if a
   `.ts/.tsx` file in this push has an error**. Pushes with no TS changes skip it.

### Why scoped, not full-blocking
The repo carries ~295 pre-existing type errors, so CI runs `tsc` with
`continue-on-error`. A full blocking type-check would block every push. The hook
ignores errors in files you didn't touch — only your own new breakage blocks.

## Escape hatches

| Command | Effect |
|---------|--------|
| `git push --no-verify` | Skip the hook entirely |
| `SKIP_TYPECHECK=1 git push` | Keep build-config check, skip type-check |

## Gotchas

- **Existing clones / the runner** only pick up `core.hooksPath` after their next
  `npm install`/`npm ci`, or run `git config core.hooksPath .githooks` manually.
- Harmless in CI — setting `core.hooksPath` there has no effect since CI never pushes.
- Adds ~50s to pushes that touch TS files; ~0s otherwise.
