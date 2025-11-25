# File Organization Update - 2025-11-24

## Summary

Updated CircleTel project to enforce proper file organization and prevent documentation clutter in the root directory.

## Changes Made

### 1. CLAUDE.md Updates

Added comprehensive **File Organization** section with three subsections:

#### Source Code Structure
- Pages, API routes, Components, Services, Migrations
- Clear location guidelines for all code types

#### Documentation Structure
**⚠️ CRITICAL: Never create documentation files in the project root!**

| Type | Location |
|------|----------|
| Architecture Docs | `docs/architecture/` |
| Feature Specs | `docs/features/YYYY-MM-DD_feature-name/` |
| Implementation Guides | `docs/implementation/` |
| Optimization Guides | `docs/guides/` |
| API Documentation | `docs/api/` |
| Claude-Specific | `.claude/docs/` |
| Agent Specs | `agent-os/specs/[spec-id]/` |

#### MCP/Claude Code Tools
- Executors: `.claude/tools/`
- Skills: `.claude/skills/`
- Custom Commands: `.claude/commands/`

### 2. Directory Structure Created

```
docs/
├── implementation/     # Implementation guides (NEW)
├── guides/            # Optimization and how-to guides (NEW)
└── api/               # API documentation (PLANNED)

.claude/
└── docs/              # Claude-specific documentation (NEW)
```

### 3. Files Reorganized

**Moved from root to appropriate locations:**

- ✅ `MCP_CODE_EXECUTION_IMPLEMENTATION.md` → `docs/implementation/`
- ✅ `MCP_OPTIMIZATION_GUIDE.md` → `docs/guides/`
- ✅ `API_KEY_QUICK_REFERENCE.md` → `docs/guides/`

**Created:**
- ✅ `.claude/docs/README.md` - Documentation index for Claude-specific docs

### 4. Naming Conventions Documented

**Code:**
- Components: PascalCase
- Hooks: use-name.ts
- Services: name-service.ts

**Documentation:**
- SCREAMING_SNAKE.md
- Feature Folders: YYYY-MM-DD_feature-name

### 5. Examples Added

**✅ Correct:**
```
docs/implementation/MCP_CODE_EXECUTION_IMPLEMENTATION.md
docs/guides/MCP_OPTIMIZATION_GUIDE.md
docs/features/2025-11-24_mcp-code-execution/PHASE1_COMPLETE.md
.claude/docs/EXECUTOR_PATTERNS.md
```

**❌ Incorrect:**
```
MCP_CODE_EXECUTION_IMPLEMENTATION.md (root)
MCP_OPTIMIZATION_GUIDE.md (root)
IMPLEMENTATION_NOTES.md (root)
```

## Decision Guidelines

**When creating new documentation:**

1. **Architecture changes** → `docs/architecture/`
2. **New features** → `docs/features/YYYY-MM-DD_feature-name/`
3. **Implementation guides** → `docs/implementation/`
4. **Optimization/how-to guides** → `docs/guides/`
5. **MCP/Claude-specific** → `.claude/docs/`
6. **API documentation** → `docs/api/`

**Before creating files:**
- Check if appropriate folder exists
- If not, create the folder first
- Use descriptive folder names
- Follow naming conventions

## Benefits

### For Development
- ✅ Cleaner root directory
- ✅ Easier to find documentation
- ✅ Logical organization by type
- ✅ Consistent structure across project

### For Claude Code
- ✅ Clear instructions on where to place files
- ✅ Prevents root folder clutter
- ✅ Maintains organized documentation
- ✅ Easy to reference and update

### For Team
- ✅ Professional project structure
- ✅ Easy onboarding for new developers
- ✅ Clear separation of concerns
- ✅ Scalable documentation strategy

## Root-Level Files (Approved)

These are the ONLY markdown files that should remain in the project root:

1. **README.md** - Project overview and setup
2. **CLAUDE.md** - Claude Code guidance (this file)
3. **ROADMAP.md** - Project roadmap
4. **AGENTS.md** - Agent system documentation

All other documentation MUST be organized into appropriate subdirectories.

## Implementation Status

- [x] Update CLAUDE.md with file organization guidelines
- [x] Create new directory structure (docs/implementation, docs/guides, .claude/docs)
- [x] Move existing files to appropriate locations
- [x] Create README for .claude/docs
- [x] Document naming conventions
- [x] Add examples of correct/incorrect placement

## Next Steps

1. **Team Communication**: Share these guidelines with the development team
2. **Review Existing Docs**: Audit `docs/implementation/` for files that should be moved
3. **CI/CD Check**: Consider adding a check to prevent root-level .md creation
4. **Template Creation**: Create templates for common documentation types

## Migration Notes

If you find documentation in the root folder, move it according to these rules:

```bash
# Implementation guides
mv ROOT_FILE.md docs/implementation/

# Optimization/how-to guides
mv GUIDE_FILE.md docs/guides/

# Feature-specific docs
mkdir -p docs/features/YYYY-MM-DD_feature-name/
mv FEATURE_DOCS.md docs/features/YYYY-MM-DD_feature-name/

# Claude/MCP specific
mv CLAUDE_TOOL_DOCS.md .claude/docs/
```

---

**Updated**: 2025-11-24
**Implemented by**: Claude Code
**Status**: Complete ✅
