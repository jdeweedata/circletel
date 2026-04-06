# Currency Check Definitions

Each check detects drift between the codebase and the rules. Run from project root.
Severity: 🔴 stale | 🟡 missing | 🟢 minor

---

## U1 — Stale Vercel references in rules
**Check:** Rules reference Vercel but project now deploys via Coolify.
**Command:**
```bash
grep -rn "vercel" /home/circletel/.claude/rules/ --include="*.md" -i | grep -v "vercel-deployment.md" | grep -iv "vercel token\|vercel env"
```
**Also check:** Does `vercel-deployment.md` need updating to reflect Coolify as primary?
```bash
grep -c "Coolify" /home/circletel/.claude/rules/vercel-deployment.md
```
If output is `0`, the file is stale.
**Severity:** 🔴 stale

---

## U2 — New lib/ directories with no rule coverage
**Check:** A directory exists in `lib/` or `components/` that no rule file mentions.
**Command:**
```bash
ls /home/circletel/lib/ 2>/dev/null
```
For each directory, check if any rule file references it:
```bash
grep -rl "<dirname>" /home/circletel/.claude/rules/ --include="*.md"
```
**Violation:** Directory with no rule coverage and 3+ files inside
**Severity:** 🟡 missing

---

## U3 — Rule table in CLAUDE.md vs actual rule files
**Check:** Every file in `.claude/rules/` should be listed in the CLAUDE.md rules table.
**Command:**
```bash
ls /home/circletel/.claude/rules/*.md | xargs -I{} basename {} .md | sort > /tmp/actual-rules.txt
grep "\.md" /home/circletel/CLAUDE.md | grep -oE "[a-z-]+\.md" | sed 's/\.md//' | sort > /tmp/listed-rules.txt
diff /tmp/actual-rules.txt /tmp/listed-rules.txt
```
**Violation:** Files in diff output (in actual but not listed, or listed but not present)
**Severity:** 🟢 minor (missing from table) or 🔴 stale (listed but file deleted)

---

## U4 — Uncaptured corrections in compound-learnings
**Check:** Corrections older than 7 days with no matching rule file.
**Command:**
```bash
find /home/circletel/.claude/skills/compound-learnings/corrections/ -name "*.md" -mtime +7 2>/dev/null
```
For each file found, check if a rule was extracted:
```bash
# Look for rule file created after the correction date
ls -lt /home/circletel/.claude/rules/*.md | head -5
```
**Violation:** Correction file exists with no corresponding new rule
**Severity:** 🟡 missing

---

## U5 — CLAUDE.md "Updated" date staleness
**Check:** The "Updated" date in CLAUDE.md footer vs the most recently modified rule file.
**Command:**
```bash
grep "Updated" /home/circletel/CLAUDE.md
ls -lt /home/circletel/.claude/rules/*.md | head -1
```
If the most recent rule file is newer than the CLAUDE.md updated date, flag it.
**Severity:** 🟢 minor

---

## U6 — Self-check: guardian assertions vs current rules
**Check:** Every compliance check (C1–C8) should reference a rule file that still exists.
**Command:**
```bash
grep "Rule:\*\*" /home/circletel/.claude/skills/claude-md-guardian/checks/compliance.md | grep -oE "\`[a-z-]+\.md\`" | tr -d '`' | while read rule; do
  [ -f "/home/circletel/.claude/rules/$rule" ] || echo "MISSING: $rule"
done
```
**Violation:** Any "MISSING" output = compliance check references a deleted rule file
**Severity:** 🔴 stale
