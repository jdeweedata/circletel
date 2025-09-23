# Local Development & Validation Scripts

This directory contains scripts to improve development workflow and reduce CI time.

## 🚀 Local Validation

### Quick Commands

```bash
# Smart validation - only checks changed files (⚡ FASTEST)
npm run validate

# Full validation without tests (🚀 FAST)
npm run validate:full

# Complete validation with all tests (🐌 SLOW)
npm run validate:all

# Individual checks
npm run lint          # ESLint check
npm run lint:fix      # Fix linting issues automatically
npm run type-check    # TypeScript type checking
npm run build         # Production build test
npm run test          # Run Playwright tests
```

### Pre-commit Hooks

**Automatic validation before each commit:**
- Pre-commit hooks are set up via Husky
- Runs `npm run validate` before every commit
- Prevents pushing broken code to GitHub
- Saves CI time by catching issues early

### How It Works

1. **Local Development**: Make your changes
2. **Pre-commit Check**: Git automatically runs validation
3. **Fix Issues**: If validation fails, fix issues locally
4. **Push**: Only clean code gets pushed to GitHub
5. **Faster CI**: CI runs optimized checks since validation already passed

## 📊 CI Optimization

The GitHub Actions workflow is now optimized:

### Before (Slow) 🐌
- Single job running everything sequentially
- ~7+ minutes for dependencies + tests
- All tests run on every push
- No early failure detection

### After (Fast) ⚡
- **Parallel Jobs**: Validation and build run simultaneously
- **Conditional Tests**: Only run on PRs or when `[run-tests]` in commit message
- **Early Termination**: Fails fast on lint/type errors
- **Timeouts**: Prevent stuck jobs from wasting resources

### Performance Comparison:

| Validation Type | Time | Files Checked | When to Use |
|-----------------|------|---------------|-------------|
| **Smart** (`npm run validate`) | ~5s | Only changed files | Regular development |
| **Full** (`npm run validate:full`) | ~22s | All files, no tests | Before important commits |
| **Complete** (`npm run validate:all`) | ~7min | All files + tests | Before releases |
| **CI** (GitHub Actions) | ~2-3min | Optimized parallel jobs | Automatic on push |

## 🛠 Manual Usage

### Run Full Validation
```bash
npm run validate
```

### Run Individual Checks
```bash
npm run lint          # Check code style
npm run lint:fix      # Auto-fix style issues
npm run type-check    # TypeScript errors
npm run build         # Production build
npm run test          # Playwright tests
```

### Force CI Tests
Add `[run-tests]` to your commit message:
```bash
git commit -m "Add new feature [run-tests]"
```

## 📁 Scripts

- `validate.js` - Main validation script that runs all checks
- `design-system-validation.js` - Design system specific validation
- `.husky/pre-commit` - Git pre-commit hook configuration

## 🎯 Benefits

1. **Faster Feedback**: Catch issues locally in seconds vs minutes in CI
2. **Reduced CI Costs**: Less compute time on GitHub Actions
3. **Better DX**: Know immediately if code will pass CI
4. **Consistent Quality**: Same validation locally and in CI
5. **Selective Testing**: Tests only run when needed

## 🚨 Troubleshooting

**Pre-commit hook not working?**
```bash
npm run prepare  # Reinstall husky hooks
```

**Validation failing locally?**
```bash
npm run lint:fix  # Auto-fix style issues
npm run validate  # See detailed error output
```

**Need to skip pre-commit validation?** (Not recommended)
```bash
git commit --no-verify -m "Emergency fix"
```