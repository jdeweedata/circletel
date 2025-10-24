# VS Code Extension Quick Start

**CircleTel Next.js** - Reduce VS Code memory from 3.8GB to 2.0GB in 5 minutes

---

## 🚀 Quick Setup (Copy & Paste)

### Step 1: Remove Unnecessary Extensions (~250 MB freed)

```powershell
code --uninstall-extension cweijan.vscode-office
code --uninstall-extension tomoki1207.pdf
code --uninstall-extension ms-azuretools.vscode-containers
code --uninstall-extension ms-vscode.makefile-tools
```

### Step 2: Install Essential Extensions (REQUIRED for CircleTel)

```powershell
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension christian-kohler.path-intellisense
code --install-extension formulahendry.auto-rename-tag
code --install-extension usernamehw.errorlens
```

### Step 3: Apply Optimized Settings

```powershell
npm run optimize:vscode:apply
```

This will:
- Set TypeScript memory limit to 4GB
- Exclude large directories from file watching
- Optimize search performance
- Configure Prettier and ESLint
- Disable unnecessary features (minimap, code lens, telemetry)

### Step 4: Close Extra Workspaces (~1.4 GB freed)

You currently have **15 VS Code processes** - likely multiple workspaces open!

1. **Close all VS Code windows** (File → Close Window, or Alt+F4)
2. **Reopen ONLY CircleTel workspace**
   - File → Open Recent → `C:\Projects\circletel-nextjs`

**Expected savings**: ~1.4 GB

### Step 5: Restart VS Code

1. Close all VS Code windows
2. Reopen CircleTel workspace
3. Press `Ctrl+Shift+P` → "Developer: Reload Window"

---

## 📊 Verify Results

```bash
npm run memory:detail
```

**Before**:
```
VS Code: 3843.9 MB (15 processes)
```

**After**:
```
VS Code: ~2000 MB (5-7 processes)
```

**Total Savings**: ~1.8 GB

---

## ✅ What Changed?

### Removed Extensions
| Extension | Memory | Reason |
|-----------|--------|--------|
| **Office Viewer** | ~75 MB | Not needed for dev work |
| **PDF Viewer** | ~35 MB | Use external reader |
| **Docker Containers** | ~125 MB | CircleTel uses Vercel/Netlify |
| **Makefile Tools** | ~15 MB | CircleTel uses npm scripts |

### Added Essential Extensions
| Extension | Purpose | Why Critical? |
|-----------|---------|---------------|
| **ESLint** | Code linting | CircleTel requires this |
| **Prettier** | Code formatting | CircleTel requires this |
| **Tailwind CSS IntelliSense** | CSS autocomplete | CircleTel uses Tailwind |
| **Path Intellisense** | File path autocomplete | Developer productivity |
| **Auto Rename Tag** | JSX tag pairing | React development |
| **Error Lens** | Inline errors | Faster debugging |

### Kept Existing Extensions
- ✅ **Claude Code** - AI assistant (you're using it now!)
- ✅ **GitHub Copilot** - AI code completion
- ✅ **PowerShell** - CircleTel scripts require this
- ✅ **GitHub Actions** - CI/CD workflow management

---

## Troubleshooting

### Extensions Keep Re-enabling?

**Solution**: Uninstall instead of disable (already done if you used the commands above)

### Still Using High Memory?

**Check**:
1. How many workspaces are open? (Should be 1)
   ```bash
   Get-Process Code | Measure-Object WorkingSet64 -Sum
   ```

2. Close large files (>10MB)

3. Apply memory-optimized settings:
   ```bash
   npm run optimize:all -- -ApplySettings
   ```

### Can't Find `code` Command?

**Solution**: Add VS Code to PATH
1. Open VS Code
2. Press `Ctrl+Shift+P`
3. Type: `Shell Command: Install 'code' command in PATH`
4. Restart terminal

---

## Re-enable Extensions (If Needed)

To re-enable an extension:

```bash
code --install-extension ms-python.python
```

Or in VS Code:
1. Press `Ctrl+Shift+X` (Extensions)
2. Search for extension
3. Click "Install"

---

## Complete Guide

For detailed information, see:
- **Full Guide**: `docs/guides/VSCODE_EXTENSION_OPTIMIZATION.md`
- **Optimization Summary**: `npm run optimize:all`

---

## Quick Commands

```bash
# Analyze extensions
npm run extensions:analyze

# Check memory usage
npm run memory:detail

# Optimize everything
npm run optimize:all

# Apply VS Code memory settings
npm run optimize:all -- -ApplySettings
```

---

**Expected Total Savings**: ~1.3GB
- Extensions: ~700 MB
- Workspaces: ~600 MB

**Result**: VS Code drops from 2.8GB → 1.5GB
