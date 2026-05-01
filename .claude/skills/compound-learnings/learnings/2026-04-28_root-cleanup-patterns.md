# Root Cleanup Session Learnings

**Date**: 2026-04-28
**Task**: Moved misplaced files from project root to correct subdirectories per file-organization rules
**Duration**: ~20 min

---

## What Was Accomplished

Cleared 22 misplaced files from project root:
- 5 `.md` docs → `docs/` subdirs, `.claude/docs/`
- 4 images → `public/images/`
- 11 Python scripts → `scripts/python/`
- 1 API reference file → `docs/api/`
- 5 log/scratch files → deleted
- Added `circletel-drive-*.json` to `.gitignore` (security fix)

---

## Patterns Identified

### 1. Two-Pass Root Scan
A single `ls` of a large root directory misses stragglers after bulk moves. Always re-scan after the first batch.

```bash
# Pass 1: audit before moves
ls /home/circletel/ | grep -v "^\." | sort

# ... do moves ...

# Pass 2: verify nothing left
ls /home/circletel/ | grep -v "^\." | sort
```

**Saves**: Avoids discovering missed files only on next session start.

### 2. Check Code References Before Moving Files
Before moving any file, grep for imports/references in code. Images and docs that look "unused" may be hardcoded paths in scripts.

```bash
grep -r "filename" /home/circletel --include="*.ts" --include="*.tsx" --include="*.py" --include="*.js" -l
```

**Saves**: Prevents broken script references after move.

---

## Friction Points Resolved

### Hardcoded Absolute Paths Block File Moves
`circletel-drive-9afdd33bd927.json` could not be moved because 4 scripts hardcode `/home/circletel/circletel-drive-9afdd33bd927.json` as an absolute string.

**Files affected**:
- `scripts/extract_contracts.py`
- `scripts/test_ocr_10.py`
- `scripts/dump_ocr_samples.py`
- `scripts/python/patch_addresses_vision.py`

**Prevention**: External credential paths must always use env vars, not hardcoded strings:

```python
# ❌ WRONG — blocks file moves, breaks on different machines
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/circletel/circletel-drive-9afdd33bd927.json'

# ✅ CORRECT — configurable, moveable
import os
creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
if not creds_path:
    raise EnvironmentError('GOOGLE_APPLICATION_CREDENTIALS not set in .env.local')
```

Then in `.env.local`:
```
GOOGLE_APPLICATION_CREDENTIALS=/home/circletel/circletel-drive-9afdd33bd927.json
```

---

## Security Finding

### Google Service Account Key Unprotected in Root
`circletel-drive-9afdd33bd927.json` was sitting in project root with no `.gitignore` entry — live GCP credentials would have been committed on the next `git add .`.

**Fix applied**: Added to `.gitignore`:
```
circletel-drive-*.json
```

**Rule**: Any `*-[hash].json` file in the root is almost certainly a service account key. Add to `.gitignore` immediately and verify with `git check-ignore -v <filename>`.

---

## Recommended Follow-Up

- [ ] Refactor the 4 Python scripts to use `os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')` instead of hardcoded path
- [ ] Add `GOOGLE_APPLICATION_CREDENTIALS` to `.env.example` with a placeholder path
- [ ] Consider moving `circletel-drive-9afdd33bd927.json` to a `.secrets/` directory once the scripts are updated
