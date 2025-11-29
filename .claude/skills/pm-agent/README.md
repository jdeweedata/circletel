# PM Agent Skill

Autonomous spec generation from natural language feature requests using the PM Agent.

## What This Skill Does

The PM Agent skill automatically generates comprehensive Agent-OS specifications when you describe features you want to build. It:

1. **Analyzes the codebase** - Scans project structure, detects patterns, identifies tech stack
2. **Assesses impact** - Predicts files to create/modify, database changes, API endpoints
3. **Generates specs** - Creates complete SPEC.md with user stories, acceptance criteria
4. **Breaks down tasks** - Produces TASKS.md with Fibonacci point estimation by agent role
5. **Documents architecture** - Generates ASCII diagrams and integration points

## Auto-Trigger Keywords

This skill activates when you mention:
- `generate spec`
- `create spec`
- `pm agent`
- `feature planning`
- `spec generation`
- `agent-os spec`

## Quick Start

### Option 1: Use Custom Commands (Recommended)

```bash
# Generate a full spec
/generate-spec Add user dashboard with usage tracking and billing integration

# Quick impact analysis (no files created)
/quick-analysis Add SMS notification system for order updates
```

### Option 2: Run PowerShell Script

```powershell
# Full spec generation
powershell -File .claude/skills/pm-agent/run-pm-agent.ps1 -Action generate -Description "Add user dashboard with usage tracking"

# Quick analysis only
powershell -File .claude/skills/pm-agent/run-pm-agent.ps1 -Action analyze -Description "Add SMS notifications"

# With priority
powershell -File .claude/skills/pm-agent/run-pm-agent.ps1 -Action generate -Description "Critical security fix" -Priority critical
```

### Option 3: Direct TypeScript CLI

```bash
npx ts-node scripts/agents/pm-cli.ts generate "Add user dashboard with usage tracking"
npx ts-node scripts/agents/pm-cli.ts analyze "Add SMS notifications"
```

## What's Included

```
.claude/skills/pm-agent/
├── README.md              # This file
├── run-pm-agent.ps1       # PowerShell wrapper script
└── scripts/
    └── pm-agent-runner.ts # TypeScript execution helper
```

## Output Structure

When you generate a spec, the PM Agent creates:

```
agent-os/specs/YYYYMMDD-feature-name/
├── README.md           # Quick overview
├── SPEC.md             # Full specification
├── TASKS.md            # Task breakdown by agent
├── PROGRESS.md         # Progress tracking template
└── architecture.md     # Technical architecture
```

## Example Usage

### 1. Generate Spec for New Feature

```
User: I need to add a customer referral system where existing customers can refer friends and earn credits

PM Agent Output:
✅ Codebase analyzed (1,234 files, Next.js 15 + Supabase)
✅ Impact assessed (12 files to create, 5 to modify, 3 tables)
✅ Spec generated: agent-os/specs/20251129-customer-referral-system/
   - Total points: 34
   - Risk level: medium
   - Estimated duration: 2 weeks
```

### 2. Quick Analysis Before Committing

```
User: /quick-analysis Add real-time notifications using WebSockets

PM Agent Output:
📊 Quick Impact Analysis
   Files to create: 8
   Files to modify: 4
   Database tables: 2
   API endpoints: 3
   Risk level: high
   Estimated points: 21

⚠️ Risk factors:
   - New technology (WebSockets) not in current stack
   - Affects authentication flow
   - Requires infrastructure changes
```

## Configuration

The PM Agent uses these defaults (configurable in `lib/agents/pm/types.ts`):

| Option | Default | Description |
|--------|---------|-------------|
| `outputDirectory` | `agent-os/specs` | Where specs are saved |
| `model` | `claude-opus-4-5` | AI model for analysis |
| `maxContextTokens` | `150000` | Context window limit |
| `includeCodeSnippets` | `true` | Include code in specs |
| `autoSave` | `true` | Auto-save generated files |

## Integration with Agent-OS

Generated specs follow the Agent-OS format:

1. **Spec ID**: `YYYYMMDD-feature-name` format
2. **Task Groups**: Organized by agent role (database, backend, frontend, testing, ops)
3. **Story Points**: Fibonacci scale (1, 2, 3, 5, 8, 13)
4. **Dependencies**: Cross-group dependency tracking
5. **Progress Tracking**: Status updates in PROGRESS.md

## When to Use This Skill

| Scenario | Action |
|----------|--------|
| New feature request | `/generate-spec <description>` |
| Quick feasibility check | `/quick-analysis <description>` |
| Understanding scope | `/quick-analysis <description>` |
| Sprint planning | Generate specs for all features |
| Technical documentation | Review generated architecture.md |

## Tips

1. **Be specific**: Include user roles, integrations, and constraints in your description
2. **Include context**: Mention related existing features for better impact analysis
3. **Review before implementing**: Generated specs are starting points, review and adjust
4. **Update PROGRESS.md**: Track actual progress as you implement

## Troubleshooting

### Spec generation fails
- Ensure `lib/agents/pm/` files exist and type-check passes
- Check Node.js version (18+)
- Run `npm run type-check:memory` to verify compilation

### PowerShell script errors
- Run from project root directory
- Check execution policy: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### Missing output files
- Check `autoSave` is enabled in config
- Verify write permissions to `agent-os/specs/`

## Related Documentation

- [Agent-OS Spec](agent-os/specs/20251129-agentic-ai-system/SPEC.md)
- [PM Agent Implementation](lib/agents/pm/agent.ts)
- [Task Generator](lib/agents/pm/generators/task-generator.ts)

---

**Skill Version**: 1.0.0 | **Agent Version**: lib/agents/pm v1.0.0
