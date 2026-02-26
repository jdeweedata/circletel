# MCP Large Result Handling Pattern

**Date**: 2026-02-19
**Category**: MCP / Tooling
**Trigger**: Supabase list_tables returned 580K characters

## Problem

When MCP tools return results exceeding token limits (~30K chars), Claude cannot display them directly. This commonly happens with:
- `list_tables` on large databases
- `execute_sql` with many rows
- `get_logs` with verbose output

## Solution

Claude automatically saves large results to a temp file:
```
/root/.claude/projects/-home-circletel/.../tool-results/mcp-{tool-name}-{timestamp}.txt
```

Extract data using `jq`:

```bash
# Extract table names from list_tables result
cat /path/to/result.txt | jq -r '.[0].text' | jq -r '.[] | .name' | sort

# Extract with additional fields
cat /path/to/result.txt | jq -r '.[0].text' | jq -r '.[] | "\(.name) (\(.rls_enabled))"'

# Count tables
cat /path/to/result.txt | jq -r '.[0].text' | jq 'length'
```

## Dual Supabase MCP Pattern

Two MCP interfaces exist for Supabase:

| Interface | Auth | Use Case |
|-----------|------|----------|
| `mcp__supabase__*` | Built-in (settings) | Default project operations |
| `mcp__plugin_supabase_supabase__*` | `/mcp` command | Multi-project, cross-org access |

**Key Difference**: Plugin requires explicit `/mcp` auth each session but supports multiple projects.

## CircleTel Database Stats

As of 2026-02-19:
- **182 total tables** in public schema
- **157 with RLS** enabled
- **25 without RLS** (config/audit tables)

Tables without RLS (intentional):
- `account_number_counter` - Sequence counter
- `coverage_files` - Static coverage data
- `network_providers` - Provider config
- `oauth_tokens` - Token storage
- `provider_configuration` - API settings
- Various `*_audit_log` tables

## When to Use This Pattern

1. Any MCP call that might return large datasets
2. Database exploration on unfamiliar schemas
3. Log analysis requiring filtering
4. Bulk data exports

## Time Saved

~5-10 min per large result handling (vs. re-querying with limits or pagination)
