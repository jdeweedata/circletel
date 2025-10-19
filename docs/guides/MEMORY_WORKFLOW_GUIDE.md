# Memory Management Workflow Guide

> **Automated daily routines for 16GB systems**
> **Dell Vostro 16 5640 optimization**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Morning Workflow](#morning-workflow)
4. [End-of-Day Workflow](#end-of-day-workflow)
5. [Command Reference](#command-reference)
6. [Automation Options](#automation-options)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This workflow system automates your daily memory management routine, ensuring optimal performance for CircleTel development on 16GB systems.

### What's Included

| Component | Purpose | Type |
|-----------|---------|------|
| **Slash Commands** | Quick workflow execution in Claude Code | `/memory-start`, `/memory-cleanup` |
| **PowerShell Scripts** | Automated workflow execution | `workflow-morning.ps1`, `workflow-cleanup.ps1` |
| **npm Scripts** | Convenient CLI access | `npm run workflow:start` |

### Goals

- ✅ **Achieve 4-6GB free RAM** (MODERATE status) before development
- ✅ **Clean up resources** at end of day
- ✅ **Automate repetitive tasks** (Node cleanup, cache management)
- ✅ **Prevent memory errors** before they occur

---

## Quick Start

### Morning Routine (3 Methods)

**Method 1: Claude Code Slash Command** (Recommended)
```
> /memory-start
```

**Method 2: npm Script**
```bash
npm run workflow:start
```

**Method 3: Direct PowerShell**
```bash
powershell -File scripts/workflow-morning.ps1
```

### End-of-Day Cleanup (3 Methods)

**Method 1: Claude Code Slash Command** (Recommended)
```
> /memory-cleanup
```

**Method 2: npm Script**
```bash
npm run workflow:cleanup
```

**Method 3: Direct PowerShell**
```bash
powershell -File scripts/workflow-cleanup.ps1
```

---

## Morning Workflow

### What It Does

The morning workflow performs 6 automated checks:

```
[1/6] Check current memory state
[2/6] Clean up Node.js processes (if >6 or >800MB)
[3/6] Analyze VS Code memory usage
[4/6] Check other heavy applications
[5/6] Optionally clear Next.js cache
[6/6] Display final status and recommendations
```

### Step-by-Step Execution

#### 1. Check Current Memory State

```
[1/6] Checking current memory state...
   Free RAM: 2.8 GB
   Node processes: 16 (1351 MB)
```

**What it does:**
- Runs `npm run memory:check`
- Parses output for free RAM and Node.js usage
- Stores baseline for comparison

#### 2. Node.js Cleanup

```
[2/6] Checking Node.js processes...
   ⚠️  Found 16 Node processes using 1351 MB
   Recommendation: Clean up Node processes
   Kill all Node processes? (y/n):
```

**Triggers when:**
- Node processes > 6 OR
- Total Node memory > 800MB

**Actions:**
- Prompts to kill all Node processes
- Executes `taskkill /F /IM node.exe`
- Waits 2 seconds
- Confirms cleanup

**Auto mode:**
```bash
npm run workflow:start:auto
# Automatically kills Node processes without prompting
```

#### 3. VS Code Analysis

```
[3/6] Checking VS Code memory...
   VS Code memory: 3301 MB (16 processes)
   ⚠️  VS Code using >2GB RAM!
   Recommendation: Close extra VS Code windows and restart
   - Keep only CircleTel workspace
   - Apply: .vscode/settings.memory.json
```

**Triggers when:**
- VS Code memory > 2GB (warning)
- VS Code memory > 1.5GB (notice)

**Does NOT auto-close** (preserves your work)

**Recommendations shown:**
- Close extra workspace windows
- Apply memory optimization settings
- Restart VS Code if memory very high (>3GB)

#### 4. Other Application Checks

```
[4/6] Checking other applications...
   OneDrive: 835 MB
   Outlook: 318 MB
   Excel: 196 MB
```

**Scans for:**
- OneDrive (>500MB) → Suggest pausing sync
- Outlook (>200MB) → Suggest closing if not needed
- Excel/Word (>200MB) → Suggest closing if not needed

**Provides recommendations only** (no automatic actions)

#### 5. Cache Management

```
[5/6] Checking Next.js cache...
   Next.js cache: 827 MB (LARGE)
   Clear cache? (y/n):
```

**Triggers when:**
- Next.js cache > 500MB

**Actions:**
- Prompts to clear cache
- Executes `npm run clean` if confirmed
- Frees up cache space

**Auto mode:**
```bash
npm run workflow:start:auto
# Automatically clears cache >500MB without prompting
```

#### 6. Final Status Report

```
[6/6] Final memory status...

========================================
Startup Complete
========================================

Before:
  Free RAM:       2.8 GB
  Node processes: 16

After:
  Free RAM:       4.6 GB
  Node processes: 0

Memory freed: +1.8 GB ✅

Status: MODERATE ⚠️
Ready to start: npm run dev:memory

Recommendations:
  - Close extra VS Code windows (will free ~1.5 GB)
  - Pause OneDrive sync

========================================
```

**Exit codes:**
- `0` = Success (>4GB free)
- `1` = Warning (2-4GB free)
- `2` = Critical (<2GB free)

---

## End-of-Day Workflow

### What It Does

The cleanup workflow performs 4 steps:

```
[1/4] Check current memory state
[2/4] Stop all Node.js processes
[3/4] Optionally clear cache
[4/4] Display final status
```

### Step-by-Step Execution

#### 1. Current State Check

```
[1/4] Current memory state...
   Free RAM:   4.2 GB
   Node.js:    8 processes (892 MB)
   VS Code:    2456 MB
```

**Captures baseline** before cleanup

#### 2. Node.js Cleanup

```
[2/4] Stopping Node.js processes...
   ✅ All Node processes stopped
   Freed: ~892 MB
```

**Always executes** (no prompt)

**Actions:**
- Kills all Node processes
- Waits 2 seconds
- Confirms cleanup
- Shows memory freed

#### 3. Cache Cleanup (Optional)

```
[3/4] Checking cache...
   Next.js cache: 623 MB
   Clear cache? (y/n):
```

**Optional cleanup** (user decides)

#### 4. Final Summary

```
========================================
Cleanup Complete
========================================

Before Cleanup:
  Free RAM:   4.2 GB
  Node.js:    8 processes (892 MB)
  VS Code:    2456 MB

After Cleanup:
  Free RAM:   5.1 GB
  Node.js:    0 processes ✅
  VS Code:    Still running (close to free ~2.4 GB)

Total freed: +0.9 GB ✅

Next Steps:
  1. Close VS Code (will free ~2.4 GB)
  2. Close other development tools
  3. System ready for tomorrow

Tomorrow Morning:
  Run: powershell -File scripts/workflow-morning.ps1
  Or:  /memory-start (in Claude Code)
  Or:  npm run workflow:start

========================================
```

---

## Command Reference

### npm Scripts

| Command | Purpose | Interactive | Auto-cleanup |
|---------|---------|-------------|--------------|
| `npm run workflow:start` | Morning startup | ✅ Yes | ❌ No |
| `npm run workflow:start:auto` | Morning startup | ❌ No | ✅ Yes |
| `npm run workflow:cleanup` | End-of-day cleanup | ✅ Yes | Partial |

### PowerShell Scripts

| Script | Parameters | Example |
|--------|-----------|---------|
| `workflow-morning.ps1` | `-AutoCleanup`, `-Verbose` | `powershell -File scripts/workflow-morning.ps1 -AutoCleanup` |
| `workflow-cleanup.ps1` | None | `powershell -File scripts/workflow-cleanup.ps1` |

### Claude Code Slash Commands

| Command | Equivalent | When to Use |
|---------|-----------|-------------|
| `/memory-start` | `npm run workflow:start` | Morning routine (interactive) |
| `/memory-cleanup` | `npm run workflow:cleanup` | End-of-day cleanup |

---

## Automation Options

### Option 1: Manual Execution (Recommended)

**When:** You control when workflows run

**How:**
```bash
# Morning
npm run workflow:start

# End of day
npm run workflow:cleanup
```

**Pros:**
- Full control
- Can skip if not needed
- Review recommendations before acting

**Cons:**
- Must remember to run

---

### Option 2: Auto-Cleanup Mode

**When:** You want minimal interaction

**How:**
```bash
# Morning (auto-cleanup)
npm run workflow:start:auto
```

**Behavior:**
- Automatically kills Node processes (no prompt)
- Automatically clears cache >500MB (no prompt)
- Shows summary only

**Pros:**
- Fastest execution
- No decisions required

**Cons:**
- Less control
- Might clear cache unnecessarily

---

### Option 3: Windows Task Scheduler (Advanced)

**When:** You want fully automated daily execution

**Setup:**

1. **Create morning task:**
   - Open Task Scheduler
   - Create Basic Task → "CircleTel Morning Startup"
   - Trigger: Daily at 8:00 AM
   - Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-File C:\Projects\circletel-nextjs\scripts\workflow-morning.ps1 -AutoCleanup`

2. **Create evening task:**
   - Create Basic Task → "CircleTel Evening Cleanup"
   - Trigger: Daily at 6:00 PM
   - Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-File C:\Projects\circletel-nextjs\scripts\workflow-cleanup.ps1`

**Pros:**
- Fully automated
- Runs even if you forget

**Cons:**
- Might run when not needed
- Less flexibility

---

### Option 4: VS Code Tasks (Integration)

**When:** You want integration with VS Code

**Setup:**

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Memory: Morning Startup",
      "type": "shell",
      "command": "npm run workflow:start",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Memory: End-of-Day Cleanup",
      "type": "shell",
      "command": "npm run workflow:cleanup",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

**Usage:**
- Press `Ctrl+Shift+P`
- Type "Run Task"
- Select "Memory: Morning Startup" or "Memory: End-of-Day Cleanup"

---

## Troubleshooting

### Workflow Fails to Start

**Symptoms:**
```
npm run workflow:start
Error: Cannot find path...
```

**Solutions:**
1. Verify scripts exist:
   ```bash
   dir scripts\workflow-*.ps1
   ```

2. Check execution policy:
   ```powershell
   Get-ExecutionPolicy
   # Should be: RemoteSigned or Unrestricted
   ```

3. Set execution policy (if needed):
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   ```

---

### Node Processes Won't Die

**Symptoms:**
```
⚠️  Some Node processes still running
Remaining: 2 processes
```

**Solutions:**

1. **Try again with admin privileges:**
   ```powershell
   # Run PowerShell as Administrator
   taskkill /F /IM node.exe /T
   ```

2. **Manual cleanup:**
   - Open Task Manager (`Ctrl+Shift+Esc`)
   - Find `Node.js JavaScript Runtime`
   - Right-click → End Task (for each)

3. **Restart if persistent:**
   - Restart Windows (clears all processes)

---

### VS Code Memory Keeps Increasing

**Symptoms:**
- VS Code starts at 1.5GB
- Grows to 3GB+ during session
- Workflow warns every morning

**Solutions:**

1. **Apply memory optimization settings:**
   ```bash
   # Copy memory settings
   copy .vscode\settings.memory.json .vscode\settings.json
   # Restart VS Code
   ```

2. **Disable heavy extensions:**
   - Open Extensions (`Ctrl+Shift+X`)
   - Disable (workspace only):
     - GitLens
     - ESLint (keep for editing only)
     - Live Share (if not using)

3. **Restart VS Code daily:**
   - Close all windows at end of day
   - Fresh start next morning
   - Prevents memory fragmentation

---

### Workflow Shows Wrong Memory

**Symptoms:**
```
Free RAM: 15.69 GB
(Obviously wrong)
```

**Causes:**
- PowerShell parsing error
- System reporting issue

**Solutions:**

1. **Run manual check:**
   ```bash
   npm run memory:detail
   ```

2. **Check Task Manager:**
   - Press `Ctrl+Shift+Esc`
   - Go to Performance → Memory
   - Verify actual free RAM

3. **Restart workflow:**
   ```bash
   npm run workflow:start
   ```

---

## Best Practices

### Daily Routine (Recommended)

**Morning (9:00 AM):**
```bash
# 1. Start workflow
npm run workflow:start

# 2. Review recommendations
# Close apps as suggested

# 3. Start development
npm run dev:memory
```

**During Day:**
```bash
# Periodic check (every 2-3 hours)
npm run memory:check

# If issues:
npm run workflow:start
```

**End of Day (6:00 PM):**
```bash
# 1. Run cleanup
npm run workflow:cleanup

# 2. Close VS Code
# (saves work first!)

# 3. Close other apps
```

---

### Weekly Maintenance

**Monday Morning:**
```bash
# Full cleanup + cache clear
npm run workflow:start:auto
npm run clean
```

**Friday End-of-Day:**
```bash
# Extra thorough cleanup
npm run workflow:cleanup
# Clear cache: Yes
# Close all dev tools
# Restart Windows (optional)
```

---

### When to Use Each Command

| Situation | Command | Why |
|-----------|---------|-----|
| **Start of work day** | `/memory-start` | Interactive, shows recommendations |
| **Quick startup** | `npm run workflow:start:auto` | Auto-cleanup, fastest |
| **End of day** | `/memory-cleanup` | Guided cleanup |
| **System slow** | `npm run memory:detail` | Detailed diagnosis |
| **Quick check** | `npm run memory:check` | Fast status |
| **Emergency** | `taskkill /F /IM node.exe` | Immediate Node cleanup |

---

## Integration with Development Workflow

### Pre-Development Checklist

```bash
# 1. Memory workflow
npm run workflow:start

# 2. Verify status
# Target: >4GB free

# 3. Start development
npm run dev:memory

# 4. Optional: Type check
npm run type-check:memory
```

### Pre-Commit Checklist

```bash
# 1. Type check
npm run type-check:memory

# 2. If memory errors:
npm run workflow:start

# 3. Retry type check
npm run type-check:memory

# 4. Commit
git commit -m "..."
```

### Pre-Deployment Checklist

```bash
# 1. Memory cleanup
npm run workflow:start:auto

# 2. Build
npm run build:memory

# 3. Verify success
# 4. Deploy
```

---

## Related Documentation

| Guide | Purpose |
|-------|---------|
| **`MEMORY_WORKFLOW_GUIDE.md`** | This file (workflow automation) |
| `MEMORY_16GB_SYSTEM.md` | 16GB system-specific optimizations |
| `MEMORY_QUICK_REFERENCE.md` | One-page command cheat sheet |
| `MEMORY_MANAGEMENT_GUIDE.md` | Complete technical guide |
| `README_MEMORY.md` | System overview |

---

## Changelog

**v1.0 (2025-10-19)**
- Initial workflow system
- Morning startup automation
- End-of-day cleanup automation
- Claude Code slash commands
- PowerShell scripts with interactive/auto modes

---

**Last Updated**: 2025-10-19
**Version**: 1.0
**For**: Dell Vostro 16 5640 (16GB RAM)
**Maintained By**: Jeffrey DeWee
