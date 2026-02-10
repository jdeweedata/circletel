# Pattern: Supabase MCP Setup

## Problem

Need direct database access from Claude Code without setting up API keys in every environment.

## Solution

Configure Supabase MCP server for programmatic database queries.

## Configuration

### Linux/Mac (.mcp.json)

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=YOUR_PROJECT_REF"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_your_personal_access_token"
      }
    }
  }
}
```

### Windows (.mcp.json)

```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=YOUR_PROJECT_REF"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_your_personal_access_token"
      }
    }
  }
}
```

## Token Types

| Token | Format | Purpose | Get From |
|-------|--------|---------|----------|
| Personal Access Token (PAT) | `sbp_...` | MCP server access | https://supabase.com/dashboard/account/tokens |
| Service Role Key | `sb_secret_...` | Direct API/backend access | Project Settings → API |
| Anon Key | `eyJ...` | Client-side access with RLS | Project Settings → API |

**Important**: MCP server requires PAT (`sbp_...`), not Service Role Key.

## Verification

```bash
# Check connection status
claude mcp get supabase
# Expected: "Status: ✓ Connected"

# List all MCP servers
claude mcp list
```

## Usage

### Direct SQL Query

```bash
claude -p "Use supabase MCP to run: SELECT * FROM customers LIMIT 5"
```

### Available Tools

| Tool | Description |
|------|-------------|
| `list_tables` | List all database tables |
| `execute_sql` | Run SQL queries |
| `apply_migration` | Apply database migrations |
| `list_migrations` | View migration history |
| `get_logs` | Fetch project logs |
| `generate_typescript_types` | Generate TS types from schema |
| `get_advisors` | Get performance recommendations |

## Security Warning

**Never connect MCP to production data.** Use development projects with non-sensitive data.

## CircleTel Reference

- **Project Ref**: `agyjovdugmtopasyvlng`
- **Config Location**: `/home/circletel/.mcp.json`

## Common Issues

### "Failed to connect" on VPS

Playwright/shadcn MCPs fail on headless servers - this is expected. Supabase MCP should still work.

### Wrong token type

If you get auth errors, verify you're using a PAT (`sbp_...`) not a Service Role Key (`sb_secret_...`).

### Windows vs Linux

Windows requires `cmd /c npx`, Linux/Mac uses `npx` directly.

## Related

- [Supabase MCP Docs](https://supabase.com/docs/guides/getting-started/mcp)
- [GitHub: supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp)
