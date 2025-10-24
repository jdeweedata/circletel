# Windsurf Codemaps Integration for CircleTel

## Overview

This directory contains comprehensive documentation for integrating **Windsurf Codemaps** (Beta) into the CircleTel development workflow.

## What's Included

### 1. CODEMAP_README.md
**Complete user guide** for using Codemaps in CircleTel:
- Accessing Codemaps in Windsurf IDE
- Creating CircleTel-specific Codemaps
- Pre-defined Codemap library
- Best practices and workflows
- Example prompts for each system

**Use this for**: Learning how to create and use Codemaps

### 2. CODEMAP_AGENT_INTEGRATION.md
**Agent-specific integration guide** showing how all 14 CircleTel agents leverage Codemaps:
- Individual agent workflows
- Codemap types per agent
- Orchestrator coordination
- Naming conventions
- Lifecycle management

**Use this for**: Understanding how agents use Codemaps in their workflows

### 3. AGENTS.md Integration
The main `AGENTS.md` file has been updated with a **Windsurf Codemaps Integration** section that provides:
- Quick reference for all agents
- Pre-defined Codemap library
- Best practices summary
- Links to detailed documentation

## Quick Start

### For Developers

1. **Access Codemaps**
   - Activity Bar: Click Codemaps icon
   - Command Palette: `Ctrl+Shift+P` → "Focus on Codemaps View"

2. **Create Your First Codemap**
   ```
   Prompt: "Map the multi-provider coverage checking flow from user input to provider API calls"
   ```

3. **Use in Cascade**
   ```
   @coverage-flow-map How do I add a new provider?
   ```

### For AI Agents

All agents should:
1. Check for relevant Codemaps before starting work
2. Reference Codemaps during implementation
3. Update Codemaps after making changes
4. Create new Codemaps for complex features

## Pre-Defined CircleTel Codemaps

### Coverage System
- `coverage-multi-provider-flow`
- `mtn-integration-architecture`
- `dfa-coverage-processing`

### Authentication & Security
- `auth-rbac-enforcement`
- `admin-access-control`

### Order & Checkout
- `order-complete-journey`
- `payment-netcash-webhook`

### Admin Dashboard
- `admin-dashboard-structure`
- `admin-api-routes`

### MCP Integrations
- `mcp-server-connections`
- `zoho-crm-integration`

## Benefits

### For Development
- **Faster navigation** - Click through code visually
- **Better understanding** - See how systems connect
- **Fewer bugs** - Understand dependencies before changes
- **Easier onboarding** - Visual codebase introduction

### For Agents
- **Enhanced context** - Full architectural understanding
- **Better decisions** - See impact of changes
- **Improved handoffs** - Shared visual reference
- **Quality assurance** - Verify changes don't break flows

## Documentation Structure

```
docs/claude-skills/Codemap Navigator/
├── README.md (this file)
├── CODEMAP_README.md (complete user guide)
└── CODEMAP_AGENT_INTEGRATION.md (agent workflows)
```

## Integration Status

✅ **Completed**:
- Documentation created
- AGENTS.md updated
- Pre-defined Codemap library documented
- Agent workflows defined
- Best practices established

🔄 **Next Steps**:
- Create actual Codemaps in Windsurf
- Test @-mention functionality in Cascade
- Gather team feedback
- Refine naming conventions
- Add to onboarding materials

## Usage Examples

### Creating a Codemap

```
1. Open Codemaps panel (Activity Bar or Ctrl+Shift+P)
2. Click "Create new Codemap"
3. Enter prompt: "Map the authentication flow from login to protected route access"
4. Review generated map
5. Click nodes to navigate code
```

### Using with Cascade

```
Developer: "@auth-flow-map I need to add 2FA support"
Cascade: [Has full context of auth architecture]
         "Based on the auth flow, you'll need to modify:
          1. app/api/auth/login/route.ts
          2. lib/auth/session.ts
          3. components/auth/LoginForm.tsx"
```

### Agent Workflow

```
Bug Hunter Agent:
1. Bug reported: "Users logged out randomly"
2. Creates: "session-management-flow" Codemap
3. Traces: Login → Session creation → Token refresh → Logout
4. Identifies: Token refresh failing silently
5. Fixes: Adds error handling to refresh logic
6. Updates: Codemap with fix documentation
```

## Best Practices

### Naming Convention
```
{system}-{aspect}-{type}

Examples:
- coverage-multi-provider-flow
- auth-rbac-enforcement-map
- payment-webhook-processing
```

### When to Create
- ✅ Complex multi-file flows
- ✅ New feature development
- ✅ Integration planning
- ✅ Bug investigation
- ❌ Simple single-file changes
- ❌ Utility functions
- ❌ Configuration files

### Update Triggers
- Architecture changes
- New integrations
- Major refactoring
- Bug fixes that change flow

## Support

For questions or issues:
1. Review documentation in this directory
2. Check AGENTS.md for quick reference
3. Consult with Architect Agent for complex cases
4. Update documentation with learnings

## Contributing

When adding new Codemaps:
1. Follow naming conventions
2. Document in CODEMAP_README.md
3. Add to pre-defined library
4. Update AGENTS.md if needed
5. Share with team

---

**Ready to visualize your codebase?** Start with the coverage flow Codemap and experience the power of visual architecture understanding! 🗺️

Made for CircleTel by the AI Agent Team
