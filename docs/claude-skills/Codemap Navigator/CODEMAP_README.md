# Codemap Navigator Skill

> Master codebase architecture understanding with Windsurf Codemaps integration for CircleTel platform development.

## Quick Start

### 1. Add to Claude/Windsurf
This skill is designed for use with Windsurf IDE's Codemaps feature (Beta)

### 2. Access Codemaps
- **Activity Bar**: Click Codemaps icon in left panel
- **Command Palette**: `Ctrl+Shift+P` → "Focus on Codemaps View"

### 3. Create Your First Codemap
Just say: *"Create a codemap for the coverage checking flow"*

## What's Included

### 🗺️ Pre-Defined Codemaps for CircleTel

**Coverage System Maps**
- Multi-provider coverage flow (MTN, DFA, Supersonic)
- Provider integration architecture
- Coverage aggregation service

**Authentication & Security**
- Auth flow and session management
- RBAC system (17 roles, 100+ permissions)
- Admin access control

**Order & Checkout**
- Complete customer journey
- Payment processing (Netcash)
- Order confirmation workflow

**Admin Dashboard**
- Admin module architecture
- CMS integration (Strapi)
- Analytics and reporting

**MCP Integrations**
- Zoho CRM/Billing integration
- Supabase operations
- GitHub workflows

### 🎯 Key Features
- ✅ Visual codebase navigation
- ✅ Execution flow mapping
- ✅ Component relationship visualization
- ✅ Direct code navigation (click nodes)
- ✅ Shareable with team members
- ✅ @-mention in Cascade conversations

## CircleTel-Specific Codemaps

### 1. Coverage Checking Flow
**Prompt**: *"Map the multi-provider coverage checking flow from user input to provider API calls"*

**What it shows:**
```
User Input (CoverageChecker.tsx)
    ↓
API Gateway (app/api/coverage/aggregate/route.ts)
    ↓
Service Layer (lib/coverage/aggregation-service.ts)
    ↓
Provider Clients (MTN WMS, DFA, etc.)
    ↓
External APIs
```

**Use for:**
- Adding new coverage providers
- Debugging coverage issues
- Understanding caching strategy
- Optimizing API calls

### 2. Authentication Architecture
**Prompt**: *"Map the authentication flow from login to protected route access"*

**What it shows:**
```
Login Form (app/auth/login/page.tsx)
    ↓
Auth API (app/api/auth/)
    ↓
Supabase Auth (lib/auth/)
    ↓
Session Management
    ↓
RBAC Enforcement
```

**Use for:**
- Debugging auth issues
- Understanding session flow
- Adding new protected routes
- RBAC policy implementation

### 3. Order & Checkout Flow
**Prompt**: *"Map the complete customer order journey from bundle selection to payment"*

**What it shows:**
```
Bundle Selection (app/bundles/)
    ↓
Coverage Check (components/coverage/)
    ↓
Checkout (components/checkout/SinglePageCheckout.tsx)
    ↓
Order Context (contexts/OrderContext.tsx)
    ↓
Payment API (app/api/payment/)
    ↓
Netcash Integration
```

**Use for:**
- Optimizing conversion funnel
- Adding payment methods
- Debugging order issues
- Understanding state management

### 4. Admin Dashboard Structure
**Prompt**: *"Map the admin dashboard architecture and component hierarchy"*

**What it shows:**
```
Admin Layout (app/admin/layout.tsx)
    ↓
Sidebar Navigation (components/admin/layout/Sidebar.tsx)
    ↓
Module Pages (app/admin/*)
    ↓
Admin Components (components/admin/*)
    ↓
API Routes (app/api/admin/*)
    ↓
Database Operations (Supabase)
```

**Use for:**
- Adding new admin features
- Understanding RBAC enforcement
- Navigation structure
- Component reuse

### 5. MCP Integration Map
**Prompt**: *"Map the MCP server integrations and their connection points"*

**What it shows:**
```
.mcp.json Configuration
    ↓
MCP Servers (Zoho, Supabase, GitHub, etc.)
    ↓
Integration Points in Code
    ↓
Data Flow and Transformations
```

**Use for:**
- Adding new MCP servers
- Debugging integration issues
- Understanding data flow
- API optimization

## Using Codemaps with Cascade

### @-Mention in Conversations

Once you create a Codemap, reference it in Cascade:

```
You: "@coverage-flow-map How do I add a new provider?"
Cascade: [Has full context of coverage architecture]
```

### Generate from Cascade

At the bottom of any Cascade conversation, you can:
1. Click "Create Codemap"
2. Codemap agent analyzes conversation context
3. Generates relevant architecture map

## Workflow Integration

### For New Features

1. **Before Implementation**
   ```
   Create Codemap → Understand architecture → Plan changes
   ```

2. **During Development**
   ```
   Reference Codemap → Navigate to files → Make changes
   ```

3. **After Implementation**
   ```
   Update Codemap → Document changes → Share with team
   ```

### For Debugging

1. **Identify Issue**
   ```
   Create Codemap of affected system
   ```

2. **Trace Execution**
   ```
   Follow flow in Codemap → Find bug location
   ```

3. **Fix & Verify**
   ```
   Make fix → Verify in Codemap → Update documentation
   ```

### For Onboarding

1. **New Developer Joins**
   ```
   Share pre-made Codemaps
   ```

2. **Explore Codebase**
   ```
   Click through nodes → Read code → Ask questions
   ```

3. **Start Contributing**
   ```
   Create own Codemaps → Deepen understanding
   ```

## Best Practices

### Creating Effective Codemaps

✅ **Do:**
- Focus on specific flows (not entire codebase)
- Use descriptive prompts
- Create for complex systems first
- Update when architecture changes
- Share with team members

❌ **Avoid:**
- Overly broad prompts
- Creating for simple components
- Letting Codemaps become stale
- Keeping them private (share knowledge!)

### Naming Conventions

Use clear, descriptive names:
- `coverage-multi-provider-flow`
- `auth-rbac-enforcement`
- `order-checkout-journey`
- `admin-dashboard-structure`
- `mcp-zoho-integration`

### When to Create Codemaps

**High Value:**
- Complex multi-file flows
- Integration points
- State management patterns
- Authentication/authorization
- Payment processing

**Low Value:**
- Single components
- Simple utilities
- Static content
- Configuration files

## CircleTel Agent Integration

### Architect Agent
Uses Codemaps for:
- System design decisions
- Integration planning
- Performance optimization
- Scalability assessment

### Developer Agent
Uses Codemaps for:
- Feature implementation
- Code navigation
- Understanding dependencies
- Refactoring safely

### Bug Hunter Agent
Uses Codemaps for:
- Tracing execution flow
- Identifying failure points
- Understanding side effects
- Root cause analysis

### Integration Specialist Agent
Uses Codemaps for:
- API integration planning
- Data flow understanding
- Error handling paths
- Testing strategy

## Sharing Codemaps

### Team Sharing
- Codemaps are shareable as links
- Viewable in browser
- Requires authentication (team-only by default)
- Enterprise: Opt-in required (stored on Windsurf servers)

### Documentation
- Include Codemap links in feature docs
- Reference in AGENTS.md workflows
- Add to onboarding materials
- Update with architecture changes

## Troubleshooting

### Codemap Not Generating
- Check prompt clarity
- Ensure files exist in workspace
- Try more specific prompt
- Verify Windsurf version supports Codemaps

### Incomplete Maps
- Prompt may be too broad
- Refine to specific flow
- Break into smaller maps
- Check file permissions

### Navigation Issues
- Ensure files haven't moved
- Update Codemap if architecture changed
- Verify workspace is open
- Check file paths

## Example Prompts Library

### Coverage System
```
"Map the MTN WMS API integration flow"
"Show how DFA coverage data is processed"
"Map the coverage caching strategy"
"Show provider registry pattern implementation"
```

### Authentication
```
"Map the login to dashboard flow"
"Show RBAC permission checking"
"Map session management and refresh"
"Show admin authentication enforcement"
```

### Orders
```
"Map the bundle selection to order creation"
"Show payment webhook processing"
"Map order status update flow"
"Show customer notification triggers"
```

### Admin
```
"Map the product management CRUD operations"
"Show analytics data aggregation"
"Map the CMS content sync flow"
"Show user management and permissions"
```

## Integration with AGENTS.md

All 14 CircleTel agents can leverage Codemaps:

1. **Analyst Agent** - Understand business flow implementation
2. **Architect Agent** - Design with full system context
3. **Scrum Master Agent** - Break down features with architecture knowledge
4. **Developer Agent** - Navigate code efficiently
5. **Frontend Specialist** - Understand component hierarchy
6. **Backend Specialist** - Map API and service layers
7. **Integration Specialist** - Visualize third-party integrations
8. **Bug Hunter Agent** - Trace execution paths
9. **Testing Agent** - Identify test coverage gaps
10. **Refactoring Agent** - Understand dependencies before changes
11. **Performance Optimizer** - Find bottlenecks in flow
12. **Documentation Agent** - Create accurate architecture docs
13. **Product Manager Agent** - Understand technical implementation
14. **MCP Manager Agent** - Visualize MCP server connections

## Why Use Codemaps in CircleTel?

### Complex Architecture
- Multi-provider integrations (MTN, DFA, Supersonic)
- 17 RBAC role templates
- Multiple MCP servers
- Next.js 15 App Router structure

### Team Collaboration
- 25 customer target by October 2025
- Multiple developers working simultaneously
- Knowledge sharing critical
- Onboarding efficiency

### Quality Assurance
- Understand impact of changes
- Prevent breaking changes
- Maintain architectural consistency
- Document decisions visually

---

**Ready to master your codebase?** Start creating Codemaps today and transform how you understand and navigate CircleTel's architecture! 🗺️

Made for CircleTel by the AI Agent Team
