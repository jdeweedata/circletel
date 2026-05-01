# Domain Analysis Output Template

Use this template for `/roadmap [domain]` command output.

---

```markdown
# CircleTel [Domain] Deep Dive

**Date**: YYYY-MM-DD | **Domain**: [billing/customer/network/etc.] | **Duration**: ~10-15 min

---

## Domain Overview

**Current Score**: X/10
**Industry Average**: Y/10
**Gap**: [Above/At/Below] by Z points

### What Exists

| Component | Status | Location |
|-----------|--------|----------|
| [Component 1] | ✅ Complete | `path/to/file` |
| [Component 2] | ⚠️ Partial | `path/to/file` |
| [Component 3] | ❌ Missing | - |

### Coverage by Capability

| Capability | Status | Notes |
|------------|--------|-------|
| [Capability 1] | ✅ | [Brief note] |
| [Capability 2] | ✅ | [Brief note] |
| [Capability 3] | ⚠️ | [What's missing] |
| [Capability 4] | ❌ | Not implemented |

---

## Detailed Gap Analysis

### Gap 1: [Capability Name]

**Current State**:
[Detailed description of what exists - files, tables, routes, components]

**Industry Standard**:
[What competitors/industry typically have]

**Gap Impact**:
- Business: [How this affects revenue/efficiency]
- Customer: [How this affects customer experience]
- Technical: [How this blocks other features]

**Recommendation**:
[Specific recommendation with approach]

**Effort**: [Size] ([X] points, [Y] weeks)

---

### Gap 2: [Next Capability]

[Same format]

---

## Domain Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

### Phase 2: Core Features (Weeks 3-4)
- [ ] [Task 1]
- [ ] [Task 2]

### Phase 3: Enhancement (Weeks 5-6)
- [ ] [Task 1]
- [ ] [Task 2]

---

## Dependencies

```
[Domain-specific dependency diagram]

    [Prereq] ──► [Feature A] ──► [Feature B]
                     │
                     └──► [Feature C]
```

---

## Quick Wins for [Domain]

| Feature | Effort | Impact | Action |
|---------|--------|--------|--------|
| [Feature 1] | XS | Medium | [What to do] |
| [Feature 2] | S | High | [What to do] |

---

## Technical Debt in [Domain]

| Issue | Location | Impact | Fix Effort |
|-------|----------|--------|------------|
| [Issue 1] | `path/file` | [Impact] | [Time] |
| [Issue 2] | `path/file` | [Impact] | [Time] |

---

## Comparison: CircleTel vs Industry

| Capability | CircleTel | Afrihost | WebAfrica | Cool Ideas |
|------------|-----------|----------|-----------|------------|
| [Cap 1] | ✅ | ✅ | ✅ | ✅ |
| [Cap 2] | ⚠️ | ✅ | ✅ | ⚠️ |
| [Cap 3] | ❌ | ✅ | ✅ | ❌ |
| [Cap 4] | ❌ | ✅ | ⚠️ | ❌ |

---

## Recommended Next Steps

1. **Immediate** (This Week):
   - [Action item with specific file/route]

2. **Short Term** (This Sprint):
   - [Action item]
   - [Action item]

3. **Medium Term** (This Quarter):
   - [Action item]

---

**Run `/roadmap full` for cross-domain analysis.**
```
