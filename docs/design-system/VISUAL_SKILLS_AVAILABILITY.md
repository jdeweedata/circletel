# Visual UI/UX Skills - Availability Report

**Generated**: 2026-03-03
**Purpose**: Document available visual design tools for CircleTel development

---

## ✅ AVAILABLE NOW (Ready to Use)

### 1. `frontend-design`
**Location**: `.claude/skills/frontend-design` → `.agents/skills/frontend-design`
**Invocation**: `/skill frontend-design` or automatic trigger

**Purpose**: Generate distinctive, production-grade UI with bold aesthetics.

**Triggers**:
- Building web components, pages, dashboards
- Styling/beautifying any web UI
- Creating React components, HTML/CSS layouts

**Anti-Slop Rules**:
- ❌ No Inter, Roboto, Arial, system fonts
- ❌ No purple gradients on white backgrounds
- ❌ No predictable layouts
- ✅ Use distinctive fonts (Space Grotesk, Manrope, etc.)
- ✅ Commit to BOLD aesthetic direction

---

### 2. `web-design-guidelines`
**Location**: `.agents/skills/web-design-guidelines`
**Invocation**: `/skill web-design-guidelines components/path/Component.tsx`

**Purpose**: Audit UI code against Vercel's Web Interface Guidelines.

**Workflow**:
1. Fetches latest guidelines from Vercel Labs
2. Reads specified files
3. Outputs findings in `file:line` format

**Example**:
```
/skill web-design-guidelines components/home/NewHero.tsx
```

---

### 3. `compound-learnings`
**Location**: `.claude/skills/compound-learnings`
**Invocation**: Auto-activates or `/skill compound-learnings`

**Purpose**: Capture patterns and corrections for future sessions.

**Current Learnings**: 24 documented patterns
- `2026-03-03_typography-design-system-verification.md`
- `2026-03-01_gemini-wireframe-iteration.md`
- `2026-03-01_ai-image-prompt-patterns.md`
- ... and 21 more

**Storage**: `.claude/skills/compound-learnings/learnings/`

---

### 4. `image-prompt-generator`
**Location**: `.claude/skills/image-prompt-generator` → `.agents/skills/image-prompt-generator`
**Invocation**: `/skill image-prompt-generator`

**Purpose**: Generate effective prompts for AI image generators.

**Formula**:
```
SUBJECT + ACTION/STATE + SETTING + LIGHTING + STYLE + TECHNICAL SPECS
```

**Supported Generators**: Midjourney, DALL-E, Stable Diffusion, Flux, Gemini

---

### 5. `gemini-imagegen`
**Invocation**: `/skill gemini-imagegen`

**Purpose**: Generate and edit images using Gemini API.

**Requirements**: `GEMINI_API_KEY` environment variable

**Example Use**:
```
/skill gemini-imagegen "Professional ISP hero image, fiber optic cables, blue hour lighting"
```

---

## ✅ MCP TOOLS AVAILABLE

### Chrome DevTools MCP + Skill
**Status**: Configured (requires Chrome with remote debugging)
**Skill Installed**: `.claude/skills/chrome-devtools` (2026-03-03)

**Invocation**: `/skill chrome-devtools` for best practices guide

**Setup Required**:
```bash
# Start Chrome with remote debugging
google-chrome --remote-debugging-port=9222

# Or on macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

**Available Tools**:
- `mcp__chrome-devtools__navigate_page` - Open URLs
- `mcp__chrome-devtools__take_snapshot` - Get accessibility tree
- `mcp__chrome-devtools__take_screenshot` - Visual capture
- `mcp__chrome-devtools__click` - Interact with elements
- `mcp__chrome-devtools__list_console_messages` - Check for errors

---

## ⚠️ NEEDS SETUP

### `stitch-loop` & `high-agency-design-architect`
**Status**: Skills present, MCP server not configured

**What's Missing**:
1. StitchMCP server in `.claude/settings.local.json`
2. `design_memory.md` file for pattern persistence

**To Enable**:
```json
// .claude/settings.local.json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["@stitch/mcp-server"]
    }
  }
}
```

---

## Quick Reference

| Task | Skill | Command |
|------|-------|---------|
| Build new UI component | `frontend-design` | `/skill frontend-design` |
| Audit existing UI | `web-design-guidelines` | `/skill web-design-guidelines <file>` |
| Generate image prompt | `image-prompt-generator` | `/skill image-prompt-generator` |
| Generate actual image | `gemini-imagegen` | `/skill gemini-imagegen "<prompt>"` |
| Record winning pattern | `compound-learnings` | Auto-triggered or `/skill compound-learnings` |
| Visual verification | Chrome DevTools | Start Chrome with `--remote-debugging-port=9222` |

---

## CircleTel Brand Assets Reference

When using visual skills, reference these brand elements:

**Colors** (from `tailwind.config.ts`):
- Primary Orange: `#FF6B35` (circleTel-orange)
- Navy: `#1E3A5F` (circleTel-navy)
- Grey 200: `#E5E7EB` (circleTel-grey200)
- Teal: `#2DD4BF`
- Light Orange: `#FDF2E9` (hover states)

**Fonts**:
- Headings: Poppins (font-heading)
- Body: Montserrat (font-body)
- Data/UI: Manrope (font-display, font-data)
- Code: Space Mono (font-mono)

**Typography Scale** (modular 1.32×):
- display-1: 48px/40px (H1)
- display-2: 36px/30px (H2)
- display-3: 28px/24px (H3)
- display-4: 21px/18px (H4)
- body: 16px

---

## Verification Checklist

- [x] `frontend-design` skill file exists and is readable
- [x] `web-design-guidelines` skill file exists and is readable
- [x] `compound-learnings` has 24 learnings documented
- [x] `image-prompt-generator` skill file exists and is readable
- [x] Chrome DevTools MCP is configured (needs Chrome running)
- [ ] StitchMCP not configured (optional enhancement)

**Conclusion**: 75% of visual tools are immediately available. Chrome DevTools requires Chrome with remote debugging enabled.
