# Composio Browser Tool

Use Composio's **browser_tool** toolkit when you need a **cloud AI browser agent** (navigate, click, fill, extract, multi-step flows). Prefer this over inventing Puppeteer/Playwright scripts for one-off exploration or authenticated multi-step UI tasks.

## Availability

| Item | Value |
|------|--------|
| Workspace | `jdewee_workspace` |
| Dashboard | `https://dashboard.composio.dev/jdewee_workspace/~/connect/apps/browser_tool` |
| CLI | `/root/.composio/composio` (add `export PATH="$HOME/.composio:$PATH"`) |
| Login | `composio login` (session already used on Contabo VPS) |
| Toolkit slug | `browser_tool` |

Search:

```bash
export PATH="$HOME/.composio:$PATH"
composio search browser --toolkits browser_tool
composio tools list browser_tool
```

## Tools (slugs)

| Slug | Purpose |
|------|---------|
| `BROWSER_TOOL_CREATE_TASK` | Start a cloud browser task (natural language `task`, optional `startUrl`, optional `sessionId`) |
| `BROWSER_TOOL_GET_SESSION` | Live viewer — input `sessionId` → `liveUrl` (share with user) |
| `BROWSER_TOOL_WATCH_TASK` | Poll progress — input `taskId` → `status`, `isSuccess`, `output`, `current_url`, `steps` |
| `BROWSER_TOOL_STOP_TASK` | Abort stuck/wrong-direction runs (also stops the session) |
| `BROWSER_TOOL_GET_OUTPUT_FILE` | Download artifacts listed in WatchTask `outputFiles` |

## Standard flow

1. **CREATE_TASK** — clear goal, HTTPS `startUrl` when possible, stop condition in the prompt.
2. **GET_SESSION** with `sessionId` from create response (`browser_session_id` in create data maps to `sessionId` on get).
3. **WATCH_TASK** with `taskId` from create (`watch_task_id` → `taskId`) until `status` is terminal (`finished` / failed).
4. Validate `isSuccess` + `output` + `current_url` (watch for unexpected login redirects).
5. **STOP_TASK** if looping or stuck; then CREATE_TASK with a smaller scope.
6. **GET_OUTPUT_FILE** for any files in `outputFiles`.

### Example (VPS)

```bash
export PATH="$HOME/.composio:$PATH"

# Write payload to avoid shell quoting issues
python3 - <<'PY'
import json
from pathlib import Path
Path("/tmp/browser-task.json").write_text(json.dumps({
  "task": "Go to https://example.com and return the page title and main heading. Stop when done.",
  "startUrl": "https://example.com",
}))
PY

composio execute BROWSER_TOOL_CREATE_TASK -d @/tmp/browser-task.json
# → data.browser_session_id, data.watch_task_id

composio execute BROWSER_TOOL_GET_SESSION -d '{"sessionId":"<browser_session_id>"}'
composio execute BROWSER_TOOL_WATCH_TASK -d '{"taskId":"<watch_task_id>"}'
```

Schema note: create response uses snake_case IDs; get/watch CLI inputs use **camelCase** (`sessionId`, `taskId`).

## Permissions (Enhanced Controls)

Org has enhanced controls. Default policy is often `ask_every_call`.

- On **headless VPS**, interactive approval fails → error: `Tool execution denied by user: BROWSER_TOOL_*`.
- Dry-run can still succeed (`--dry-run`).
- Session allows can be cached under `~/.composio/tool-permissions-cache.json` → `allowEntries` with keys:

  `orgId:projectId:consumerUserId:TOOL_SLUG:__none__`

  and `{ "expiresAt": <epoch_ms> }`.

- Prefer approving tools in the Composio dashboard permission settings for permanent always_allow when appropriate.
- Never commit API keys or permission cache contents with secrets.

## When to use vs other browsers

| Need | Prefer |
|------|--------|
| Cloud AI agent for public HTTPS multi-step UI | **Composio browser_tool** |
| Local Browser Use Cloud / CDP | `browser-use` / `browser-use-python` (see root AGENTS.md) |
| App-owned E2E tests in repo | Playwright in CircleTel (`npm run test:mobile`, etc.) |
| DevTools inspection in IDE | chrome-devtools / Playwright MCP if available |

## Safety

- Only public HTTPS or explicitly authorized systems. Cloud browser cannot reach private LAN/VPC.
- Do not perform irreversible destructive actions without explicit user confirmation.
- Pause and report when login, 2FA, CAPTCHA, or payment confirmation is required.
- Do not put passwords in chat; use `secrets` map on CREATE_TASK only when the user provided credentials for that domain.
- Redact secrets from logs and AGENTS notes.
