# Memory Workflow - Quick Start

> **One-page guide to automated memory management**

---

## 🚀 Daily Routine

### Morning (Start of Day)

```bash
# Option 1: Interactive (Recommended)
npm run workflow:start

# Option 2: Automatic cleanup
npm run workflow:start:auto

# Option 3: Claude Code
> /memory-start
```

**What it does:**
- ✅ Checks memory status
- ✅ Cleans up Node processes (if >6 or >800MB)
- ✅ Analyzes VS Code memory
- ✅ Suggests closing heavy apps
- ✅ Optionally clears cache

**Target:** 4-6GB free RAM

---

### End of Day

```bash
# Option 1: npm script
npm run workflow:cleanup

# Option 2: Claude Code
> /memory-cleanup
```

**What it does:**
- ✅ Kills all Node processes
- ✅ Optionally clears cache
- ✅ Shows memory freed
- ✅ Recommends closing VS Code

---

## 📊 Quick Commands

| Task | Command | When |
|------|---------|------|
| **Morning startup** | `npm run workflow:start` | Start of day |
| **Quick check** | `npm run memory:check` | Anytime |
| **Detailed analysis** | `npm run memory:detail` | Troubleshooting |
| **End-of-day cleanup** | `npm run workflow:cleanup` | End of day |
| **Clear cache** | `npm run clean` | Weekly |
| **Start development** | `npm run dev:memory` | After startup |

---

## ⚡ Workflow Execution

### Morning Workflow Steps

```
[1/6] Check memory          → Shows current state
[2/6] Node cleanup          → Kills if >6 processes
[3/6] VS Code check         → Warns if >2GB
[4/6] Other apps            → Suggests closing heavy apps
[5/6] Cache check           → Clear if >500MB
[6/6] Final status          → Ready to start!
```

**Output:**
```
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
========================================
```

---

### Cleanup Workflow Steps

```
[1/4] Current state         → Shows baseline
[2/4] Kill Node             → Always executes
[3/4] Cache check           → Optional cleanup
[4/4] Final summary         → Shows total freed
```

**Output:**
```
========================================
Cleanup Complete
========================================

Total freed: +0.9 GB ✅

Next Steps:
  1. Close VS Code (will free ~2.4 GB)
  2. System ready for tomorrow

Tomorrow Morning:
  Run: npm run workflow:start
========================================
```

---

## 🎯 Memory Status Guide

| Free RAM | Status | Action |
|----------|--------|--------|
| **>6 GB** | HEALTHY ✅ | Ready for anything |
| **4-6 GB** | MODERATE ⚠️ | Use `:memory` scripts |
| **2-4 GB** | HIGH ⚠️ | Close apps, then start |
| **<2 GB** | CRITICAL 🔴 | Close apps immediately! |

---

## 🛠️ Common Scenarios

### Scenario 1: Normal Morning

```bash
# 1. Run workflow
npm run workflow:start
# Output: FREE RAM: 2.8 GB → 4.6 GB

# 2. Start development
npm run dev:memory

# ✅ Done!
```

---

### Scenario 2: Low Memory Warning

```bash
# 1. Run workflow
npm run workflow:start
# Output: FREE RAM: 1.5 GB → 3.2 GB (HIGH)

# 2. Close apps as recommended
# - Close Chrome tabs
# - Pause OneDrive
# - Close Outlook

# 3. Verify
npm run memory:check
# Output: FREE RAM: 4.5 GB ✅

# 4. Start development
npm run dev:memory
```

---

### Scenario 3: End of Day

```bash
# 1. Run cleanup
npm run workflow:cleanup
# Output: Freed +0.9 GB

# 2. Close VS Code
# (save all work first!)

# 3. Done! Ready for tomorrow
```

---

### Scenario 4: Memory Error During Development

```bash
# Error: "heap out of memory"

# 1. Stop dev server
# (Ctrl+C)

# 2. Run workflow
npm run workflow:start

# 3. Restart
npm run dev:memory

# ✅ Fixed!
```

---

## 📋 Slash Commands (Claude Code)

### `/memory-start`

**Full command:**
```
> /memory-start
```

**What happens:**
1. Executes morning workflow
2. Interactive prompts
3. Shows recommendations
4. Displays final status

**Use when:** Starting your work day

---

### `/memory-cleanup`

**Full command:**
```
> /memory-cleanup
```

**What happens:**
1. Executes cleanup workflow
2. Kills Node processes
3. Optional cache cleanup
4. Shows summary

**Use when:** End of work day

---

## 🔧 Advanced Options

### Auto-Cleanup Mode

```bash
npm run workflow:start:auto
```

**Differences from standard:**
- ❌ No prompts (kills Node automatically)
- ❌ No cache prompt (clears automatically if >500MB)
- ✅ Fastest execution
- ✅ Use when in a hurry

---

### Manual Steps (If Needed)

```bash
# Kill Node processes
taskkill /F /IM node.exe

# Clear cache
npm run clean

# Check memory
npm run memory:check

# Start development
npm run dev:memory
```

---

## 🎓 Best Practices

### Daily Checklist

**Morning:**
- [ ] Run `npm run workflow:start`
- [ ] Close recommended apps
- [ ] Verify >4GB free
- [ ] Start with `npm run dev:memory`

**During Day:**
- [ ] Check memory every 2-3 hours: `npm run memory:check`
- [ ] If slow, re-run workflow

**Evening:**
- [ ] Run `npm run workflow:cleanup`
- [ ] Close VS Code
- [ ] Close other dev tools

---

### Weekly Maintenance

**Monday Morning:**
```bash
npm run workflow:start:auto  # Full auto cleanup
npm run clean                # Clear all caches
```

**Friday Evening:**
```bash
npm run workflow:cleanup
# Clear cache: Yes
# Close all apps
# Optional: Restart Windows
```

---

## 📖 Full Documentation

| Guide | Purpose | Read Time |
|-------|---------|-----------|
| **MEMORY_WORKFLOW_QUICK_START.md** | **This file** (quick ref) | 2 min |
| `MEMORY_WORKFLOW_GUIDE.md` | Complete workflow guide | 15 min |
| `MEMORY_16GB_SYSTEM.md` | 16GB system optimizations | 10 min |
| `MEMORY_QUICK_REFERENCE.md` | Command cheat sheet | 5 min |
| `MEMORY_MANAGEMENT_GUIDE.md` | Technical deep dive | 20 min |

---

## ✅ Success Checklist

**You're ready when:**
- [ ] Morning workflow runs successfully
- [ ] Free RAM reaches >4GB
- [ ] Node processes cleaned up (0-2 processes)
- [ ] VS Code using <2GB
- [ ] Development server starts without errors
- [ ] No "heap out of memory" errors

---

## 🆘 Quick Help

**Workflow won't start?**
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**Node processes won't die?**
```powershell
# Run as Administrator
taskkill /F /IM node.exe /T
```

**VS Code using too much memory?**
```bash
# Apply memory settings
copy .vscode\settings.memory.json .vscode\settings.json
# Restart VS Code
```

**Need more help?**
- Read: `docs/guides/MEMORY_WORKFLOW_GUIDE.md`
- Run: `npm run memory:detail` (detailed diagnosis)

---

**Last Updated**: 2025-10-19
**Version**: 1.0
**For**: Dell Vostro 16 5640 (16GB RAM)
