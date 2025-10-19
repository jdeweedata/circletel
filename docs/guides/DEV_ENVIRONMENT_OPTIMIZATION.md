# Dev Environment Optimization Guide

> **Complete guide to optimizing your development environment**
> **Dell Vostro 16 5640 (16GB RAM)**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [VS Code Optimization](#vs-code-optimization)
4. [Windows Optimization](#windows-optimization)
5. [Browser Optimization](#browser-optimization)
6. [Command Reference](#command-reference)
7. [Expected Results](#expected-results)

---

## Overview

### What This System Does

Optimizes three critical areas of your dev environment:
1. **VS Code** - Reduce memory from 3GB+ to ~1.5GB
2. **Windows** - Free up background app memory and improve performance
3. **Browser** - Manage Chrome/Edge tab memory usage

### Goal

**Achieve 4-6GB free RAM** (MODERATE status) by optimizing all development tools.

---

## Quick Start

### Run Complete Optimization (Recommended)

```bash
# Analysis only (no changes)
npm run optimize:all

# Apply optimizations automatically
npm run optimize:all:apply
```

### Or Use Claude Code

```
> /optimize-dev
```

### Individual Optimizations

```bash
# VS Code only
npm run optimize:vscode

# Windows only
npm run optimize:windows

# Browser only
npm run optimize:browser
```

---

## VS Code Optimization

### Current Problem

**VS Code using 3.3GB** (your last measurement):
- 16 processes running
- Multiple workspace windows
- Heavy extensions loaded
- No memory limits configured

### Solution

**Automated optimizer** reduces usage to ~1.5GB:

```bash
# Analyze VS Code memory
npm run optimize:vscode

# Apply optimizations automatically
npm run optimize:vscode:apply
```

### What It Does

1. **Analyzes current usage**
   - Shows memory per process
   - Counts open workspaces
   - Lists installed extensions

2. **Creates optimized settings**
   - TypeScript server: 2GB limit (down from 3GB default)
   - File watching: Excludes node_modules, .next, dist
   - Search: Limits results to 10k (down from unlimited)
   - IntelliSense: Reduces suggestions shown
   - Extensions: Disables auto-updates
   - Terminal: Limits scrollback to 1000 lines

3. **Generates `.vscode/settings.memory.json`**
   - Ready-to-use optimized configuration
   - Can be merged into your settings
   - Backs up existing settings

### Manual Optimization Steps

If you prefer manual control:

#### 1. Close Extra Workspaces

```
Keep only: CircleTel workspace
Close: Any other open workspaces
Savings: ~300-500 MB per workspace
```

#### 2. Disable Heavy Extensions

Open Extensions (`Ctrl+Shift+X`) and disable (workspace only):

| Extension | Memory Impact | When to Disable |
|-----------|---------------|-----------------|
| GitLens | 200-400 MB | When not using Git features |
| Live Share | 100-200 MB | When not collaborating |
| Docker | 100-200 MB | For JS-only projects |
| Python | 300-500 MB | For JS-only projects |

#### 3. Apply Memory Settings

```bash
# Copy optimized settings
copy .vscode\settings.memory.json .vscode\settings.json

# Or merge manually
# Open .vscode/settings.memory.json
# Copy relevant settings to your settings.json
```

#### 4. Restart VS Code

```
Close all windows → Reopen CircleTel only
```

### Expected Results

**Before:**
- Memory: 3.3 GB
- Processes: 16
- Workspaces: Multiple

**After:**
- Memory: ~1.5 GB ✅
- Processes: 8-10
- Workspaces: 1 (CircleTel only)

**Savings: ~1.8 GB**

---

## Windows Optimization

### Current Issues

Based on your system analysis:
- OneDrive: 835 MB (background sync)
- Outlook: 318 MB (if running)
- Windows Search: Indexing dev folders
- No Defender exclusions for dev folders

### Solution

```bash
# Analyze Windows optimization opportunities
npm run optimize:windows

# Apply optimizations (requires admin)
# Run PowerShell as Administrator, then:
powershell -File scripts/optimize-windows.ps1 -ApplyOptimizations
```

### What It Does

1. **Analyzes Background Apps**
   - OneDrive (pause during dev)
   - Outlook (close if not using)
   - Excel/Office apps
   - Windows Search Indexer

2. **Checks Windows Defender**
   - Recommends exclusions for:
     - Project root
     - node_modules
     - .next
     - build/dist folders

3. **Verifies Power Plan**
   - Checks if High Performance enabled
   - Can switch automatically (with admin)

4. **Analyzes Startup Programs**
   - Finds heavy startup apps (Teams, Discord)
   - Recommends disabling

5. **Reviews Windows Services**
   - Superfetch (disable to save ~200MB)
   - Diagnostics Tracking (disable for privacy)

### Manual Optimization Steps

#### 1. Pause OneDrive (Immediate - 835MB)

```
Right-click OneDrive icon in system tray
→ Pause syncing → 2 hours
```

**Savings: ~835 MB**

#### 2. Add Defender Exclusions (Faster Builds)

```
Windows Security
→ Virus & threat protection
→ Manage settings
→ Exclusions → Add folder

Add these folders:
- C:\Projects\circletel-nextjs
- C:\Projects\circletel-nextjs\node_modules
- C:\Projects\circletel-nextjs\.next
```

**Result: 20-30% faster builds**

#### 3. Switch to High Performance Power Plan

```
Control Panel → Power Options
→ High Performance (create if needed)
```

**Result: Better CPU performance**

#### 4. Disable Startup Programs

```
Task Manager (Ctrl+Shift+Esc)
→ Startup tab
→ Disable:
  - Microsoft Teams (if not using)
  - Discord (launch manually when needed)
  - Any game launchers
```

**Savings: Faster boot + more free RAM**

### Expected Results

**Potential Savings:**
- OneDrive paused: 835 MB
- Outlook closed: 318 MB
- Excel closed: 196 MB
- Startup apps disabled: 200-500 MB on boot

**Total: ~1.5-2 GB**

---

## Browser Optimization

### Current Issues

Chrome can consume **1-3GB** depending on tab count:
- Each tab: ~50-200 MB
- Extensions: 50-200 MB each
- Background processes: 200-500 MB

### Solution

```bash
# Analyze browser memory usage
npm run optimize:browser
```

### What It Does

1. **Analyzes Chrome Usage**
   - Total memory consumed
   - Number of processes (tabs + extensions)
   - Average memory per tab

2. **Analyzes Edge Usage**
   - If running, shows memory usage

3. **Provides Recommendations**
   - Extensions to disable
   - Settings to enable (Memory Saver)
   - Tab management strategies

### Manual Optimization Steps

#### 1. Enable Chrome Memory Saver

```
chrome://settings/performance
→ Memory Saver: Enable
```

**Effect: Auto-suspends inactive tabs**

#### 2. Disable Heavy Extensions

```
chrome://extensions
Disable or remove:
- Grammarly (100-300 MB)
- Honey/Shopping extensions (50-150 MB each)
- Multiple AdBlockers (keep uBlock Origin only)
- Video downloaders (100-200 MB)
```

#### 3. Manage Tabs

**Target: <15 active tabs**

**Strategies:**
- Install OneTab extension (collapse tabs to list)
- Install The Great Suspender (auto-suspend inactive)
- Bookmark reading lists instead of keeping tabs open

#### 4. Clear Cache Weekly

```
chrome://settings/clearBrowserData
→ Cached images and files → Clear
```

#### 5. Disable Background Apps

```
chrome://settings/system
→ Continue running background apps: Disable
```

### Expected Results

**Before:**
- Chrome: 2-3 GB (50+ tabs)
- Extensions: 10+ active

**After:**
- Chrome: <1 GB ✅ (15 tabs)
- Extensions: 5-7 active

**Savings: 1-2 GB**

---

## Command Reference

### Optimization Commands

| Command | Purpose | Changes Made |
|---------|---------|--------------|
| `npm run optimize:all` | Analyze all | None (analysis only) |
| `npm run optimize:all:apply` | Apply all | Automatic |
| `npm run optimize:vscode` | Analyze VS Code | None |
| `npm run optimize:vscode:apply` | Apply VS Code | Automatic |
| `npm run optimize:windows` | Analyze Windows | None |
| `npm run optimize:browser` | Analyze Browser | None |

### Workflow Integration

| Command | Purpose |
|---------|---------|
| `npm run workflow:start` | Morning routine (includes memory check) |
| `npm run optimize:all` | Weekly optimization |
| `npm run workflow:cleanup` | End-of-day cleanup |

### Claude Code Commands

```
> /optimize-dev    # Comprehensive optimization analysis
> /memory-start    # Morning workflow
> /memory-cleanup  # End-of-day workflow
```

---

## Expected Results

### Memory Savings Breakdown

| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| **VS Code** | 3.3 GB | 1.5 GB | 1.8 GB ✅ |
| **OneDrive** | 835 MB | 0 MB (paused) | 835 MB ✅ |
| **Outlook** | 318 MB | 0 MB (closed) | 318 MB ✅ |
| **Chrome** | 2.0 GB | 1.0 GB | 1.0 GB ✅ |
| **Excel** | 196 MB | 0 MB (closed) | 196 MB ✅ |
| **Total** | ~6.6 GB | ~2.5 GB | **4.1 GB** ✅ |

### System State Projection

**Before Optimization:**
```
Total RAM:  15.69 GB
Used:       13.16 GB (84%)
Free:       2.53 GB (HIGH status ⚠️)
```

**After Optimization:**
```
Total RAM:  15.69 GB
Used:       9.06 GB (58%)
Free:       6.63 GB (HEALTHY status ✅)
```

**Improvement: +4.1 GB free RAM**

---

## Weekly Optimization Routine

### Monday Morning (Full Optimization)

```bash
# 1. Run complete optimization
npm run optimize:all

# 2. Review recommendations
# Follow high-impact suggestions

# 3. Start fresh
npm run workflow:start
npm run dev:memory
```

### Daily Maintenance

**Morning:**
```bash
npm run workflow:start  # Includes memory check
```

**During Day:**
- Close tabs when done reading (target: <15 tabs)
- Don't open extra VS Code windows

**Evening:**
```bash
npm run workflow:cleanup  # Clean up Node processes
```

### Friday End-of-Week

```bash
# 1. Full cleanup
npm run workflow:cleanup

# 2. Close all apps
# - VS Code
# - Chrome
# - OneDrive (resume after weekend)

# 3. Optional: Restart Windows
# (Clears memory fragmentation)
```

---

## Troubleshooting

### VS Code Still Using >2GB

**Solution:**
1. Check number of workspace windows:
   ```
   File → Close Workspace
   Keep only CircleTel
   ```

2. Disable more extensions:
   ```
   Extensions → Show Running Extensions
   Disable heavy ones
   ```

3. Restart VS Code:
   ```
   Close all windows
   Reopen only CircleTel
   ```

### Defender Exclusions Not Working

**Check if applied:**
```powershell
Get-MpPreference | Select-Object -ExpandProperty ExclusionPath
```

**Re-add if missing:**
```powershell
# Run PowerShell as Administrator
Add-MpPreference -ExclusionPath "C:\Projects\circletel-nextjs"
Add-MpPreference -ExclusionPath "C:\Projects\circletel-nextjs\node_modules"
```

### Browser Memory Keeps Increasing

**Symptoms:**
- Chrome starts at 1GB
- Grows to 3GB+ during session

**Solutions:**
1. Enable Memory Saver (see Browser Optimization)
2. Install tab suspender extension
3. Close tabs more aggressively (target <10)
4. Consider switching to Firefox (30% less memory)

---

## Advanced Optimizations

### For Extreme Memory Constraints

If you frequently hit <2GB free:

**1. Use Lightweight Alternatives:**
- VS Code → VS Code Insiders (lighter)
- Chrome → Firefox (30% less memory)
- Outlook → Web version (0 MB local)

**2. Disable More VS Code Features:**
```json
{
  "editor.minimap.enabled": false,
  "editor.semanticHighlighting.enabled": false,
  "breadcrumbs.enabled": false,
  "problems.maxNumberOfProblems": 50
}
```

**3. Use Edge Instead of Chrome:**
- 20-30% less memory
- Same Chromium base
- Better Windows integration

---

## Related Documentation

| Guide | Purpose |
|-------|---------|
| **`DEV_ENVIRONMENT_OPTIMIZATION.md`** | This file (optimization guide) |
| `MEMORY_WORKFLOW_QUICK_START.md` | Daily workflow guide |
| `MEMORY_16GB_SYSTEM.md` | 16GB system-specific tips |
| `MEMORY_MANAGEMENT_GUIDE.md` | Complete memory guide |

---

**Last Updated**: 2025-10-19
**Version**: 1.0
**For**: Dell Vostro 16 5640 (16GB RAM)
**Maintained By**: Jeffrey DeWee
