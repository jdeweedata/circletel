# Report Format

Output this exact structure. Replace [placeholders] with actual values.

---

## Claude.md Guardian — Audit Report
Generated: [YYYY-MM-DD] | Commits scanned: last 5 | Rules checked: [N]

### Compliance Audit
[One line per check. Format:]
[icon] [check-id] [rule-name]: [finding]
[  → file:line  (only for ❌ violations with a specific location)]

Icons:
- ✅ = no violations found
- ⚠️  = warning (pipeline gate, no specific file location)
- ❌ = violation (specific file + line)

### Currency Check
[One line per check. Format:]
[icon] [check-id]: [description]

Icons:
- 🔴 = stale (rule contradicts current reality)
- 🟡 = missing (pattern exists, no rule covers it)
- 🟢 = minor (metadata out of date)

### Summary
[N] violations | [N] warnings | [N] gaps ([N] stale, [N] missing) | [N] minor

[If all clean:]
✅ All checks passed. No violations or gaps found.
