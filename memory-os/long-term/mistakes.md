# Mistakes & Pitfalls — Never Repeat These

> Long-term memory: Every mistake costs time. Log them here so future sessions don't repeat them.

## Format
[YYYY-MM-DD] Mistake Title
What happened: Description
Root cause: Why it happened
Fix: How it was resolved
Prevention: How to avoid this forever

---

### [2025-10-24] Queried `invoices` table instead of `customer_invoices`
**What happened**: Billing queries failed silently — returned empty results
**Root cause**: Assumed standard naming. Didn't verify schema first.
**Fix**: Changed all references to `customer_invoices`
**Prevention**: ALWAYS run verify-schema-first check before writing any DB query.

### [2025-10-24] Multiple Supabase client instances
**What happened**: Console flooded with "Multiple GoTrueClient instances" warnings
**Root cause**: Several components created their own Supabase clients
**Fix**: Planned — Roadmap item 2.4
**Prevention**: Always use the shared Supabase context provider. Never instantiate a new client in a component.

### [2025-10-24] Product table drift
**What happened**: Admin-edited products didn't reflect on customer-facing pages
**Root cause**: Two tables (`products` + `service_packages`) with no sync mechanism
**Fix**: Planned — Roadmap item 2.2
**Prevention**: Until sync is built, manually update BOTH tables when changing product data.

### [2025-10-24] OOM crashes during dev/build
**What happened**: `npm run dev` and `npm run build` crashed with out-of-memory errors
**Root cause**: Default Node.js heap too small for the codebase size
**Fix**: Use memory-allocated commands: `dev:memory`, `build:memory`, `type-check:memory`
**Prevention**: NEVER use plain `npm run dev` or `npm run build`.

### [2025-10-24] Hallucinated file paths and function names
**What happened**: Referenced functions and files that didn't exist
**Root cause**: Assumed existence without checking
**Fix**: Verified actual codebase structure
**Prevention**: NEVER invent file paths or function names. Use `code-review-graph get_symbols` to verify.

### [2025-10-24] Changes outside task scope
**What happened**: A simple fix snowballed into touching 10+ files
**Root cause**: Didn't scope the change before starting
**Fix**: Reverted extra changes, isolated the fix
**Prevention**: Karpathy Principle #3 (Surgical Changes). Ask before modifying more than 3 files. Use `get_blast_radius`.

---

> **Rule**: Every correction from the user goes here immediately. This is the most important file in Memory OS.
