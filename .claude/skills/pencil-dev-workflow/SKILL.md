---
name: pencil-dev-workflow
description: Use when building websites with Pencil.dev and Claude Code, setting up design-to-code sync, automating file watching for .pen files, running parallel agents for multi-page design, or adding GSAP/Lenis animations
---

# AI Design-to-Code Workflow — Pencil.dev + Claude Code

## Overview

Build multi-page, WCAG-compliant, animated Next.js websites by connecting Pencil.dev to Claude Code with automated design-to-code sync, parallel agents, and programmatic UX audits.

**Estimated Time**: 4–8 hours for a full 5-page site

## Prerequisites

- [ ] Pencil.dev desktop app installed (free at pencil.dev)
- [ ] Claude Code CLI authenticated
- [ ] Next.js project scaffolded and running
- [ ] PRD and UI Guide docs stored in project folder
- [ ] Design system defined: fonts, colors, component tokens

## Phase 1: Tool Setup & Connection

| Step | Action | Output |
|------|--------|--------|
| 1.1 | Download Pencil.dev desktop app | App installed |
| 1.2 | On launch, select Claude Code from AI platform options | Connection initiated |
| 1.3 | Verify MCP auto-configures — Pencil tools should appear in Claude Code | MCP tools visible |
| 1.4 | Select **Opus 4.6** model in Claude Code | Model set |
| 1.5 | Confirm `.pen` file is in project root (JSON-based, Git-trackable) | File location verified |

## Phase 2: Manual Sync Test

| Step | Action |
|------|--------|
| 2.1 | Design a test element in Pencil.dev |
| 2.2 | Prompt Claude: *"Sync the latest Pencil design to the Next.js project"* |
| 2.3 | Verify rendered output matches Pencil canvas |

> **Key Discovery**: Sync is **not automatic**. You must manually prompt every time — proceed to Phase 3 to automate.

## Phase 3: Auto-Sync File Watcher

| Step | Action | Details |
|------|--------|---------|
| 3.1 | Pre-configure permissions | Edit `~/.claude/settings.json` — add read, write, MCP tool permissions. **Without this, Claude blocks indefinitely.** |
| 3.2 | Create `watch-pencil.js` | Use `chokidar` to watch `.pen` file |
| 3.3 | Add Claude CLI trigger | On change, spawn child process: `claude "Sync the updated Pencil design to Next.js"` |
| 3.4 | Add debounce (1500-2000ms) | Prevent duplicate triggers on rapid saves |
| 3.5 | Add to package.json | `"sync": "node watch-pencil.js"` |
| 3.6 | Run `npm run sync` | Keep running in dedicated terminal tab |

**Test**: Modify element in Pencil → Cmd+S → Claude should fire automatically.

> **⚠️ Security**: Limit write permissions to project directory only — never grant global filesystem access.

## Phase 4: Multi-Agent Parallel Pages

| Step | Action |
|------|--------|
| 4.1 | Ensure PRD + UI Guide are in project folder |
| 4.2 | List all pages: Home, About, Services, Portfolio, Contact |
| 4.3 | Prompt Claude: *"Use multi-agent system. Assign one agent per page. Each agent designs its page in Pencil.dev using the UI Guide design system."* |
| 4.4 | Let agents complete (5 agents work in parallel) |
| 4.5 | Save to trigger auto-sync → all pages implemented |
| 4.6 | Verify cross-page consistency in browser |

## Phase 5: GSAP Scroll Animations

**Use XML-structured prompts** — Claude parses XML more reliably than prose.

```xml
<task>Add GSAP scroll animations</task>
<dependencies>gsap, @gsap/react</dependencies>
<elements>
  <section id="hero">fade-in on load</section>
  <section id="features">stagger children on scroll</section>
</elements>
<behavior>ScrollTrigger, start: "top 80%"</behavior>
<notes>Install GSAP if not present</notes>
```

Pass to Claude → GSAP installed, animations added across all pages.

## Phase 6: Lenis Smooth Scrolling

```xml
<task>Add Lenis smooth scrolling</task>
<dependencies>lenis</dependencies>
<setup>Initialize in _app.tsx with requestAnimationFrame loop</setup>
<integration>Connect to GSAP ScrollTrigger via scrollerProxy</integration>
<behavior>smooth: 0.1, lerp: 0.1</behavior>
```

> **Note**: GSAP controls *what* animates on scroll; Lenis controls *how* scroll feels. They're complementary.

## Phase 7: UX Audit & WCAG Compliance

| Step | Action |
|------|--------|
| 7.1 | Build UX Audit skill with: Context Gathering, 9-Point Checklist, Scoring |
| 7.2 | Run audit against site → get grade + issues list |
| 7.3 | Fix critical issues first (color contrast, etc.) |
| 7.4 | Prompt Claude: *"Implement all fixes from this audit report"* |
| 7.5 | Re-run audit → target grade B or above |

## Exception Handling

| Problem | Solution |
|---------|----------|
| Claude blocks on permission prompt | Verify `settings.json` has read/write/MCP permissions |
| Auto-sync fires repeatedly | Increase debounce to 2000ms |
| Inconsistent fonts across pages | Run: *"Audit all pages against UI Guide, standardize design tokens"* |
| GSAP + Lenis jitter | Ensure Lenis uses `ScrollTrigger.scrollerProxy()` |
| `.pen` file not detected | Check absolute path in watch script |

## Quality Checklist

- [ ] Pencil MCP tools visible in Claude Code
- [ ] `npm run sync` triggers on every `.pen` save
- [ ] No duplicate triggers (debounce working)
- [ ] All pages render without console errors
- [ ] Fonts/colors uniform across pages
- [ ] GSAP animations trigger at correct scroll positions
- [ ] Lenis scroll is smooth, no jitter
- [ ] UX Audit grade B or above
- [ ] `npm run build` passes

## Open Questions

1. **Bidirectionality**: Does code → design sync exist, or only design → code?
2. **UX Audit portability**: Is the skill project-agnostic or needs per-project config?
3. **Session limits**: Has the debounce period been tuned to your Claude plan's token cap?
