# VS Code Extension Optimization Guide

**CircleTel Next.js Development** - Optimized extension setup for 16GB RAM systems

## Current Status (2025-10-20)

**Total Extensions**: 10
**Memory Impact**: Low (no heavy extensions detected)
**Main Issue**: Missing essential TypeScript/Next.js extensions

---

## Recommended Actions

### 1. Remove Unnecessary Extensions (Free ~300-400 MB)

```powershell
# Office file viewer (not needed for development)
code --uninstall-extension cweijan.vscode-office

# PDF viewer (use external reader instead)
code --uninstall-extension tomoki1207.pdf

# Docker containers (CircleTel doesn't use Docker)
code --uninstall-extension ms-azuretools.vscode-containers

# Makefile tools (CircleTel uses npm scripts)
code --uninstall-extension ms-vscode.makefile-tools
```

**After uninstalling**: Restart VS Code to apply changes.

---

### 2. Install Essential Extensions (REQUIRED)

CircleTel is a TypeScript/Next.js project and requires these extensions:

```powershell
# ESLint (CRITICAL - required for linting)
code --install-extension dbaeumer.vscode-eslint

# Prettier (CRITICAL - code formatting)
code --install-extension esbenp.prettier-vscode

# Tailwind CSS IntelliSense (CRITICAL - CSS autocomplete)
code --install-extension bradlc.vscode-tailwindcss

# TypeScript & JavaScript (CRITICAL - already included in VS Code, but ensure enabled)
# No install needed, but verify it's enabled

# Path Intellisense (RECOMMENDED - autocomplete file paths)
code --install-extension christian-kohler.path-intellisense

# Auto Rename Tag (RECOMMENDED - auto-rename paired HTML/JSX tags)
code --install-extension formulahendry.auto-rename-tag

# Error Lens (RECOMMENDED - inline error highlighting)
code --install-extension usernamehw.errorlens
```

**Install all at once**:
```powershell
code --install-extension dbaeumer.vscode-eslint `
     --install-extension esbenp.prettier-vscode `
     --install-extension bradlc.vscode-tailwindcss `
     --install-extension christian-kohler.path-intellisense `
     --install-extension formulahendry.auto-rename-tag `
     --install-extension usernamehw.errorlens
```

---

### 3. Optional Extensions (Based on Workflow)

#### AI Assistance (You Already Have)
- ✅ **GitHub Copilot** (github.copilot) - Installed
- ✅ **Claude Code** (anthropic.claude-code) - Installed

#### Git Enhancement
```powershell
# GitLens (powerful Git features, but HEAVY - 200-400 MB)
# Only install if you need advanced Git history visualization
code --install-extension eamodio.gitlens
```

⚠️ **Warning**: GitLens uses 200-400 MB RAM. Only install if you need it.

#### Remote Development
- ✅ **WSL Remote** (anysphere.remote-wsl) - Keep if using WSL, otherwise remove

---

## VS Code Settings Optimization

### Apply Memory-Efficient Settings

Create or update `.vscode/settings.json` in your workspace:

```json
{
  // TypeScript & JavaScript
  "typescript.tsserver.maxTsServerMemory": 4096,
  "typescript.disableAutomaticTypeAcquisition": true,
  "javascript.updateImportsOnFileMove.enabled": "always",
  "typescript.updateImportsOnFileMove.enabled": "always",

  // File watching (reduce CPU/memory usage)
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/uploads/**": true
  },

  // Search optimization
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/build": true,
    "**/.git": true,
    "**/package-lock.json": true
  },

  // ESLint
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],

  // Prettier
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // Tailwind CSS
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],

  // Editor performance
  "editor.codeLens": false,
  "editor.minimap.enabled": false,
  "editor.renderWhitespace": "selection",
  "editor.suggestSelection": "first",
  "editor.quickSuggestionsDelay": 50,

  // Git performance
  "git.autofetch": false,
  "git.enableSmartCommit": false,

  // Disable telemetry
  "telemetry.telemetryLevel": "off"
}
```

### Apply Settings Automatically

Run this command to create/update workspace settings:

```powershell
# Create .vscode directory if it doesn't exist
New-Item -ItemType Directory -Force -Path .vscode

# Copy optimized settings (script will be created)
npm run optimize:vscode
```

---

## Workspace Optimization

### Close Unnecessary Workspaces

**You currently have 15 VS Code processes** - this suggests multiple workspace windows open.

1. Press `Ctrl+K` then `W` to close current workspace
2. Or: File → Close Workspace
3. Keep only CircleTel workspace open during development

### Reload Window to Clear Memory Leaks

VS Code can accumulate memory leaks over time. Reload periodically:

1. Press `Ctrl+Shift+P`
2. Type: "Developer: Reload Window"
3. Press Enter

Do this after:
- Installing/uninstalling extensions
- Long coding sessions (4+ hours)
- Before running memory-intensive builds

---

## Automated Optimization Command

Add this to `package.json` scripts:

```json
{
  "scripts": {
    "optimize:vscode": "powershell -File scripts/optimize-vscode.ps1",
    "optimize:all": "npm run optimize:vscode && npm run clean"
  }
}
```

Then run:
```bash
npm run optimize:all
```

---

## Expected Memory Savings

| Action | Memory Saved | Cumulative |
|--------|--------------|------------|
| Remove Office extension | ~75 MB | 75 MB |
| Remove PDF extension | ~35 MB | 110 MB |
| Remove Docker extension | ~125 MB | 235 MB |
| Remove Makefile extension | ~15 MB | 250 MB |
| Close extra workspaces (14 windows) | ~1400 MB | 1650 MB |
| Apply VS Code settings | ~200 MB | **~1850 MB** |

**Total Expected Savings**: ~1.8 GB of RAM

---

## Recommended Extension Profile

### Tier 1: Critical (Always Enabled)
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript & JavaScript Language Features (built-in)
- Claude Code
- PowerShell

### Tier 2: Recommended (Enable if Needed)
- Path Intellisense
- Auto Rename Tag
- Error Lens
- GitHub Copilot
- GitHub Actions

### Tier 3: Optional (Disable if Low on RAM)
- GitLens (heavy, but powerful)
- Remote WSL (if not using WSL)
- Markdown extensions (if not writing docs)

---

## Troubleshooting

### VS Code Still Using Too Much Memory?

1. **Check for language server crashes**:
   - Open: View → Output → Select "TypeScript" from dropdown
   - Look for errors or crashes

2. **Increase TypeScript memory limit**:
   ```json
   "typescript.tsserver.maxTsServerMemory": 6144
   ```

3. **Disable IntelliSense on large files**:
   ```json
   "typescript.disableAutomaticTypeAcquisition": true
   ```

4. **Clear VS Code cache**:
   ```powershell
   # Close VS Code first
   Remove-Item -Recurse -Force "$env:APPDATA\Code\Cache"
   Remove-Item -Recurse -Force "$env:APPDATA\Code\CachedData"
   ```

---

## Quick Reference

### Daily Workflow
```bash
# Morning: Check memory
npm run memory:check

# Start optimized dev server
npm run dev:memory

# If memory issues arise, reload window:
# Ctrl+Shift+P → "Developer: Reload Window"
```

### Before Major Builds
```bash
# Clean everything
npm run clean

# Apply all optimizations
npm run optimize:all

# Check memory again
npm run memory:detail
```

---

## Related Documentation

- **Memory Workflow**: `docs/guides/MEMORY_WORKFLOW_QUICK_START.md`
- **VS Code Quick Start**: `docs/guides/VSCODE_EXTENSION_QUICK_START.md`
- **Project Commands**: See `CLAUDE.md` → Development Commands

---

**Last Updated**: 2025-10-20
**Maintained By**: Development Team
