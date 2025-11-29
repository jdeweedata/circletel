# Specification: Agentic AI System for CircleTel

## 1. Executive Summary

### Goal

Build a multi-agent AI system that automates product management, development coordination, and admin operations for CircleTel. The system runs in two modes: **Development Mode** (free via Claude Max subscription in Claude Code terminal) and **Production Mode** (paid API for admin panel access).

### Success Criteria

**Business Metrics (30 days post-launch)**:
- Spec generation time: <10 minutes (down from 2-4 hours manual)
- Codebase analysis accuracy: >95%
- Admin team productivity: +40% (non-technical members can request features)
- Development velocity: +30% via automated spec-to-task breakdown

**Technical Metrics**:
- PM Agent response time: <30 seconds for simple queries, <3 minutes for spec generation
- Multi-agent coordination: <5 seconds handoff between agents
- API uptime: 99.5%
- Token efficiency: Opus for planning, Gemini for execution (cost optimization)

**Cost Analysis**:
- Development/Personal Use: $0 (Claude Max subscription, already owned)
- Production API (optional): $10-20/month at moderate usage
- vs. Hiring PM: ~R60,000/month saved

---

## 2. Architecture Overview

### Dual-Mode Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CIRCLETEL AGENTIC AI SYSTEM                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                DEVELOPMENT MODE (Phase 1)                     │   │
│  │                                                               │   │
│  │   Claude Code Terminal                                        │   │
│  │   ┌─────────────────┐                                        │   │
│  │   │   PM Agent      │  ← Claude Opus 4.5 (Max Plan - FREE)   │   │
│  │   │  ┌───────────┐  │                                        │   │
│  │   │  │ Spec Gen  │  │  → agent-os/specs/                     │   │
│  │   │  │ Codebase  │  │  → .claude/tools/                      │   │
│  │   │  │ Analysis  │  │  → .claude/skills/                     │   │
│  │   │  │ Task Brk  │  │                                        │   │
│  │   │  └───────────┘  │                                        │   │
│  │   └─────────────────┘                                        │   │
│  │                                                               │   │
│  │   User: You (Developer)                                       │   │
│  │   Cost: $0 (uses Max subscription)                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              PRODUCTION MODE (Phase 2 - Optional)             │   │
│  │                                                               │   │
│  │   Admin Panel (/admin/agents)                                 │   │
│  │   ┌─────────────────┐    ┌─────────────────┐                 │   │
│  │   │   Chat UI       │───→│  /api/agents/pm │                 │   │
│  │   │   (React)       │    │                 │                 │   │
│  │   └─────────────────┘    │  Claude Opus 4.5│                 │   │
│  │                          │  (API Credits)  │                 │   │
│  │                          └─────────────────┘                 │   │
│  │                                                               │   │
│  │   Users: Non-technical team (CEO, Sales, Support)            │   │
│  │   Cost: $10-20/month API credits                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              MULTI-AGENT COORDINATOR (Phase 3)                │   │
│  │                                                               │   │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │   │
│  │   │   PM    │  │  Dev    │  │  QA     │  │  Ops    │        │   │
│  │   │  Agent  │──│  Agent  │──│  Agent  │──│  Agent  │        │   │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘        │   │
│  │        │             │            │            │              │   │
│  │        └─────────────┴────────────┴────────────┘              │   │
│  │                          │                                    │   │
│  │                    Coordinator                                │   │
│  │                    (Task Router)                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Model Selection Strategy

| Task Type | Primary Model | Fallback | Reasoning |
|-----------|---------------|----------|-----------|
| Spec Generation | Claude Opus 4.5 | - | Requires deep reasoning, context understanding |
| Codebase Analysis | Claude Opus 4.5 | - | Complex pattern recognition |
| Task Breakdown | Claude Opus 4.5 | Gemini 3 Pro | Structured output |
| Simple Queries | Gemini 3 Pro | Claude Sonnet | Cost optimization |
| Bulk Operations | Gemini 3 Pro | - | High volume, cost-sensitive |
| Code Execution | Gemini 3 Pro | - | Fast, deterministic tasks |

### Integration Points

```
PM Agent
   │
   ├── .claude/tools/
   │   ├── supabase-executor.ts (database queries)
   │   └── [future] coverage-executor.ts
   │
   ├── .claude/skills/
   │   ├── context-manager/ (token optimization)
   │   ├── bug-fixing/ (debugging workflow)
   │   ├── database-migration/ (schema changes)
   │   └── prompt-optimizer/ (query enhancement)
   │
   ├── agent-os/specs/ (output location)
   │   └── [spec-id]/
   │       ├── spec.md
   │       ├── tasks.md
   │       └── README.md
   │
   └── docs/architecture/ (context input)
       ├── SYSTEM_OVERVIEW.md
       └── [domain]_SYSTEM.md
```

---

## 3. User Stories

### Phase 1: PM Agent Development Tool

**US-1: Spec Generation from Natural Language** (13 pts)
- Developer describes feature in plain English
- PM Agent reads codebase context, existing patterns
- Generates structured spec following CircleTel format
- Outputs to `agent-os/specs/[date]-[feature]/spec.md`

**US-2: Codebase Analysis & Recommendations** (8 pts)
- PM Agent can answer questions about codebase structure
- Identifies patterns, suggests best locations for new code
- References existing implementations as examples
- Integrates with `context-manager` skill for token efficiency

**US-3: Task Breakdown with Story Points** (8 pts)
- Takes approved spec, generates task breakdown
- Assigns story points based on complexity analysis
- Groups tasks by implementer role (database-engineer, backend-engineer, etc.)
- Outputs to `tasks.md` with checkboxes for tracking

**US-4: Integration with Existing Tools** (5 pts)
- Reads `.claude/tools/README.md` to understand available tools
- Can invoke Supabase executor for database queries
- Uses context-manager before large operations
- Leverages prompt-optimizer for ambiguous requests

### Phase 2: PM Agent Production API

**US-5: Admin Panel Chat Interface** (8 pts)
- `/admin/agents/pm` page with chat UI
- Non-technical users can describe features in plain language
- Agent responds with clarifying questions, then generates spec
- Spec preview before saving to repository

**US-6: Feature Request Queue** (5 pts)
- Team members submit feature requests
- PM Agent triages, categorizes, estimates effort
- Admin dashboard shows queue with priority ranking
- One-click approval sends to spec generation

**US-7: API Authentication & Rate Limiting** (5 pts)
- Admin users authenticated via existing RBAC
- Rate limit: 20 requests/hour per user
- Token usage tracking, cost allocation per team
- Fallback to Gemini for high-volume periods

### Phase 3: Multi-Agent Coordinator

**US-8: Agent Handoff Protocol** (8 pts)
- PM Agent creates spec → hands off to Dev Agent
- Dev Agent implements → hands off to QA Agent
- QA Agent tests → reports back to PM Agent
- All handoffs logged with context transfer

**US-9: Parallel Task Execution** (8 pts)
- Multiple agents work on independent tasks simultaneously
- Coordinator prevents conflicts (same file edits)
- Dependency graph determines execution order
- Real-time status dashboard

**US-10: Human-in-the-Loop Checkpoints** (5 pts)
- Critical decisions require human approval
- Slack/email notifications for pending approvals
- Timeout escalation (4 hours → auto-notify manager)
- Approval history audit log

### Phase 4: Admin Panel Integration

**US-11: Agent Activity Dashboard** (8 pts)
- Real-time view of all agent activities
- Token usage, cost per task, completion rates
- Drill-down to individual agent conversations
- Export conversation history

**US-12: Model Configuration Panel** (5 pts)
- Admins can adjust model selection rules
- A/B test Opus vs Gemini for specific task types
- Cost threshold alerts (>$50/day warning)
- Usage analytics by agent type

---

## 4. Technical Implementation

### Phase 1: PM Agent Development Tool

#### 4.1 PM Agent Core (`lib/agents/pm/`)

**agent.ts** - Main agent orchestrator
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { readSystemContext } from './context';
import { generateSpec } from './generators/spec';
import { generateTasks } from './generators/tasks';

interface PMAgentConfig {
  model: 'claude-opus-4-5-20250929' | 'gemini-3-pro';
  contextWindow: number;
  outputDir: string;
}

export class PMAgent {
  private anthropic: Anthropic;
  private config: PMAgentConfig;

  constructor(config: PMAgentConfig) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.config = config;
  }

  async generateSpec(request: string): Promise<SpecOutput> {
    // 1. Load codebase context
    const context = await readSystemContext();

    // 2. Generate spec using Opus
    const spec = await generateSpec(this.anthropic, request, context);

    // 3. Save to agent-os/specs/
    await this.saveSpec(spec);

    return spec;
  }

  async analyzeCodebase(query: string): Promise<AnalysisResult> {
    // Use context-manager skill
    const analysis = await this.withContextManagement(async () => {
      return this.anthropic.messages.create({
        model: this.config.model,
        max_tokens: 4096,
        system: this.getSystemPrompt('codebase-analysis'),
        messages: [{ role: 'user', content: query }],
      });
    });

    return this.parseAnalysis(analysis);
  }

  async breakdownTasks(specId: string): Promise<TaskBreakdown> {
    const spec = await this.loadSpec(specId);
    return generateTasks(this.anthropic, spec);
  }
}
```

**context.ts** - Context loading with token optimization
```typescript
import { glob } from 'glob';
import { readFile } from 'fs/promises';

interface SystemContext {
  architecture: string;
  existingPatterns: string[];
  databaseSchema: string;
  recentChanges: string;
}

export async function readSystemContext(): Promise<SystemContext> {
  // Always load these core context files
  const architecture = await readFile('docs/architecture/SYSTEM_OVERVIEW.md', 'utf-8');

  // Load relevant patterns based on current task
  const patterns = await loadRelevantPatterns();

  // Get database schema summary
  const schema = await summarizeDatabaseSchema();

  return {
    architecture,
    existingPatterns: patterns,
    databaseSchema: schema,
    recentChanges: await readFile('docs/RECENT_CHANGES.md', 'utf-8'),
  };
}

async function loadRelevantPatterns(): Promise<string[]> {
  // Load from existing implementations as examples
  const specFiles = await glob('agent-os/specs/*/spec.md');
  return Promise.all(specFiles.slice(-3).map(f => readFile(f, 'utf-8')));
}
```

**generators/spec.ts** - Spec generation
```typescript
import Anthropic from '@anthropic-ai/sdk';

const SPEC_SYSTEM_PROMPT = `You are a Senior Product Manager AI for CircleTel, a South African ISP.

Your role is to generate detailed technical specifications following the established CircleTel format.

SPEC FORMAT RULES:
1. Always include Executive Summary with Goal and Success Criteria
2. User Stories with story points (Fibonacci: 1, 2, 3, 5, 8, 13)
3. System Architecture with ASCII diagrams
4. Database Schema (if applicable)
5. API Endpoints (if applicable)
6. Integration Points
7. Testing Requirements

CONTEXT AWARENESS:
- Reference existing patterns from provided codebase context
- Align with CircleTel brand guidelines (orange #F5831F, dark neutral #1F2937)
- Consider existing database schema when proposing new tables
- Follow Next.js 15 + Supabase patterns already in use

OUTPUT FORMAT:
- Markdown with proper headings
- Code blocks for schemas, API examples
- ASCII diagrams for architecture
- Story points in parentheses after user story titles`;

export async function generateSpec(
  anthropic: Anthropic,
  request: string,
  context: SystemContext
): Promise<SpecOutput> {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5-20250929',
    max_tokens: 16000,
    system: SPEC_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `
CODEBASE CONTEXT:
${context.architecture}

EXISTING SPEC PATTERNS:
${context.existingPatterns.join('\n---\n')}

DATABASE SCHEMA SUMMARY:
${context.databaseSchema}

---

FEATURE REQUEST:
${request}

Generate a complete specification following CircleTel format.
        `,
      },
    ],
  });

  return parseSpecResponse(response);
}
```

#### 4.2 Claude Code Integration

**Custom Command: `/pm`**

Create `.claude/commands/pm.md`:
```markdown
---
description: Invoke PM Agent for spec generation and codebase analysis
arguments:
  - name: action
    description: "generate-spec | analyze | breakdown-tasks"
  - name: input
    description: "Feature description or spec ID"
---

# PM Agent Command

## Actions

### generate-spec
Generate a new specification from natural language description.

### analyze
Analyze codebase and answer questions about structure.

### breakdown-tasks
Break down an approved spec into implementable tasks.

## Usage

```
/pm generate-spec "Add customer loyalty program with points, tiers, and rewards"
/pm analyze "Where is authentication handled in the codebase?"
/pm breakdown-tasks 20251129-loyalty-program
```

## Integration

This command integrates with:
- `.claude/tools/supabase-executor.ts` for database queries
- `.claude/skills/context-manager/` for token optimization
- `agent-os/specs/` for spec storage
```

**Skill: `pm-agent`**

Create `.claude/skills/pm-agent/prompt.md`:
```markdown
---
name: pm-agent
description: AI Product Manager for spec generation and codebase analysis
triggers:
  - "generate spec"
  - "create spec"
  - "pm agent"
  - "analyze codebase"
  - "break down tasks"
---

# PM Agent Skill

You are the PM Agent for CircleTel. Your capabilities:

1. **Spec Generation**: Create detailed technical specifications
2. **Codebase Analysis**: Answer questions about code structure
3. **Task Breakdown**: Convert specs into implementable tasks

## Context Loading

Before any operation, load:
1. `docs/architecture/SYSTEM_OVERVIEW.md`
2. Relevant existing specs from `agent-os/specs/`
3. Database schema via Supabase types

## Output Locations

- Specs: `agent-os/specs/[YYYYMMDD]-[feature-name]/spec.md`
- Tasks: `agent-os/specs/[YYYYMMDD]-[feature-name]/tasks.md`
- README: `agent-os/specs/[YYYYMMDD]-[feature-name]/README.md`

## Quality Standards

- Follow CircleTel spec format exactly
- Include story points (Fibonacci scale)
- Reference existing patterns
- Consider database schema implications
```

---

### Phase 2: PM Agent Production API

#### 4.3 API Endpoint (`app/api/agents/pm/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PMAgent } from '@/lib/agents/pm/agent';
import { validateAdminPermission } from '@/lib/auth/admin-permissions';

export const maxDuration = 120; // 2 minutes for spec generation

interface PMAgentRequest {
  action: 'generate-spec' | 'analyze' | 'breakdown-tasks' | 'chat';
  input: string;
  specId?: string;
  conversationId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate admin user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check permission
    const hasPermission = await validateAdminPermission(user.id, 'agents.pm.use');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // 3. Rate limiting
    const rateLimitResult = await checkRateLimit(user.id, 'pm-agent');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetAt: rateLimitResult.resetAt },
        { status: 429 }
      );
    }

    // 4. Process request
    const body: PMAgentRequest = await request.json();
    const agent = new PMAgent({
      model: 'claude-opus-4-5-20250929',
      contextWindow: 200000,
      outputDir: 'agent-os/specs',
    });

    let result;
    switch (body.action) {
      case 'generate-spec':
        result = await agent.generateSpec(body.input);
        break;
      case 'analyze':
        result = await agent.analyzeCodebase(body.input);
        break;
      case 'breakdown-tasks':
        result = await agent.breakdownTasks(body.specId!);
        break;
      case 'chat':
        result = await agent.chat(body.input, body.conversationId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 5. Log usage
    await logAgentUsage(user.id, body.action, result.tokensUsed);

    return NextResponse.json(result);
  } catch (error) {
    console.error('PM Agent error:', error);
    return NextResponse.json(
      { error: 'Agent processing failed' },
      { status: 500 }
    );
  }
}
```

#### 4.4 Admin Panel UI (`app/admin/agents/pm/page.tsx`)

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Bot, Send, Loader2, FileText, Code, ListTodo } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: string;
  timestamp: Date;
}

export default function PMAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (action: string = 'chat') => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      action,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agents/pm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, input }),
      });

      const result = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.content || result.error,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Agent request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Bot className="w-8 h-8 text-circleTel-orange" />
        <div>
          <h1 className="text-xl font-bold">PM Agent</h1>
          <p className="text-sm text-gray-500">AI Product Manager for CircleTel</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 p-4 border-b bg-gray-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInput('Generate a spec for: ')}
        >
          <FileText className="w-4 h-4 mr-2" />
          New Spec
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInput('Analyze the codebase: ')}
        >
          <Code className="w-4 h-4 mr-2" />
          Analyze Code
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setInput('Break down tasks for spec: ')}
        >
          <ListTodo className="w-4 h-4 mr-2" />
          Task Breakdown
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card
              className={`max-w-[80%] p-4 ${
                message.role === 'user'
                  ? 'bg-circleTel-orange text-white'
                  : 'bg-white'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {message.content}
              </pre>
            </Card>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <Card className="p-4 bg-white">
              <Loader2 className="w-5 h-5 animate-spin" />
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe a feature, ask about the codebase, or request a task breakdown..."
            className="flex-1 resize-none"
            rows={3}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 3: Multi-Agent Coordinator

#### 4.5 Coordinator Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-AGENT COORDINATOR                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────────────────────────────────────────────┐    │
│   │                    TASK ROUTER                         │    │
│   │                                                         │    │
│   │   Input: Spec or Task                                   │    │
│   │   Output: Agent Assignment + Context                    │    │
│   │                                                         │    │
│   │   Rules:                                                │    │
│   │   - Database changes → database-engineer                │    │
│   │   - API endpoints → backend-engineer                    │    │
│   │   - Components → frontend-engineer                      │    │
│   │   - Tests → testing-engineer                            │    │
│   │   - Planning → pm-agent                                 │    │
│   │                                                         │    │
│   └───────────────────────────────────────────────────────┘    │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              │               │               │                   │
│              ▼               ▼               ▼                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │   PM Agent   │  │   Dev Agent  │  │   QA Agent   │         │
│   │              │  │              │  │              │         │
│   │  - Specs     │  │  - Database  │  │  - Unit      │         │
│   │  - Tasks     │  │  - Backend   │  │  - E2E       │         │
│   │  - Analysis  │  │  - Frontend  │  │  - Coverage  │         │
│   │              │  │  - Refactor  │  │  - Perf      │         │
│   └──────────────┘  └──────────────┘  └──────────────┘         │
│          │                   │               │                   │
│          └───────────────────┼───────────────┘                  │
│                              │                                   │
│                              ▼                                   │
│   ┌───────────────────────────────────────────────────────┐    │
│   │                    CONTEXT STORE                        │    │
│   │                                                         │    │
│   │   - Conversation history per agent                      │    │
│   │   - Shared state (current spec, task progress)         │    │
│   │   - File locks (prevent conflicts)                      │    │
│   │   - Handoff queue (agent A → agent B)                  │    │
│   │                                                         │    │
│   │   Storage: Supabase + Redis (real-time)                │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.6 Agent Handoff Protocol

**lib/agents/coordinator/handoff.ts**
```typescript
interface HandoffContext {
  sourceAgent: AgentType;
  targetAgent: AgentType;
  taskId: string;
  context: {
    specId: string;
    currentProgress: string;
    relevantFiles: string[];
    decisions: Decision[];
    blockers: Blocker[];
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class AgentCoordinator {
  private activeAgents: Map<AgentType, AgentInstance> = new Map();
  private handoffQueue: HandoffContext[] = [];
  private contextStore: ContextStore;

  async handoff(context: HandoffContext): Promise<HandoffResult> {
    // 1. Save source agent state
    await this.contextStore.saveAgentState(context.sourceAgent, {
      taskId: context.taskId,
      progress: context.context.currentProgress,
      timestamp: new Date(),
    });

    // 2. Prepare target agent
    const targetAgent = this.activeAgents.get(context.targetAgent);
    if (!targetAgent) {
      await this.spawnAgent(context.targetAgent);
    }

    // 3. Transfer context
    const transferResult = await this.transferContext(context);

    // 4. Notify human if checkpoint required
    if (this.isCheckpointRequired(context)) {
      await this.notifyForApproval(context);
      return { status: 'pending_approval', handoffId: transferResult.id };
    }

    // 5. Execute handoff
    return this.executeHandoff(context, transferResult);
  }

  private isCheckpointRequired(context: HandoffContext): boolean {
    // Human approval required for:
    // - Database schema changes
    // - Production deployments
    // - API breaking changes
    // - High-risk file modifications
    const checkpointTriggers = [
      'database-engineer',
      'production-deploy',
      'breaking-change',
    ];
    return checkpointTriggers.some(t =>
      context.context.decisions.some(d => d.type === t)
    );
  }
}
```

---

### Phase 4: Admin Panel Integration

#### 4.7 Agent Dashboard Schema

```sql
-- agent_sessions: Track all agent conversations
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_type TEXT NOT NULL CHECK (agent_type IN ('pm', 'dev', 'qa', 'ops')),
  user_id UUID REFERENCES admin_users(id),

  -- Conversation
  messages JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',

  -- Metrics
  tokens_used INTEGER DEFAULT 0,
  model_used TEXT,
  cost_cents INTEGER DEFAULT 0,

  -- Status
  status TEXT CHECK (status IN ('active', 'completed', 'failed', 'pending_approval')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- agent_tasks: Track agent task execution
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES agent_sessions(id),

  -- Task details
  task_type TEXT NOT NULL,
  input TEXT NOT NULL,
  output JSONB,

  -- Assignment
  assigned_agent TEXT,
  handoff_from UUID REFERENCES agent_tasks(id),

  -- Status
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'blocked')),

  -- Metrics
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  tokens_used INTEGER DEFAULT 0,

  -- Approval (if required)
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ
);

-- agent_metrics: Aggregated metrics for dashboard
CREATE TABLE agent_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  agent_type TEXT NOT NULL,

  -- Usage
  total_sessions INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,

  -- Performance
  avg_response_time_ms INTEGER,
  success_rate DECIMAL(5,2),

  UNIQUE(date, agent_type)
);
```

---

## 5. Implementation Phases

### Phase 1: PM Agent Development Tool (Week 1)
**Story Points: 34**
- [x] Define architecture and integration points
- [ ] Create PM Agent core (`lib/agents/pm/`)
- [ ] Implement spec generation with Opus 4.5
- [ ] Implement codebase analysis
- [ ] Implement task breakdown
- [ ] Create `/pm` command
- [ ] Create `pm-agent` skill
- [ ] Integration tests

### Phase 2: PM Agent Production API (Week 2)
**Story Points: 18**
- [ ] Create `/api/agents/pm` endpoint
- [ ] Implement rate limiting
- [ ] Create admin chat UI
- [ ] Token usage tracking
- [ ] Cost allocation per user

### Phase 3: Multi-Agent Coordinator (Week 3)
**Story Points: 21**
- [ ] Build coordinator architecture
- [ ] Implement handoff protocol
- [ ] Create context store
- [ ] Parallel task execution
- [ ] Human-in-the-loop checkpoints

### Phase 4: Admin Panel Integration (Week 4)
**Story Points: 13**
- [ ] Database schema for agent tracking
- [ ] Agent activity dashboard
- [ ] Model configuration panel
- [ ] Cost monitoring and alerts

**Total Story Points: 86**

---

## 6. Environment Variables

```env
# Claude API (for Production Mode)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Gemini API (for fallback/high-volume)
GOOGLE_AI_API_KEY=AIza...

# Agent Configuration
AGENT_DEFAULT_MODEL=claude-opus-4-5-20250929
AGENT_FALLBACK_MODEL=gemini-3-pro
AGENT_RATE_LIMIT_PER_HOUR=20
AGENT_TOKEN_BUDGET_DAILY=100000
AGENT_COST_ALERT_THRESHOLD_CENTS=5000
```

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API costs exceed budget | Medium | High | Daily cost caps, fallback to Gemini |
| Token limits hit | Medium | Medium | Context-manager skill, chunking |
| Model hallucinations | Low | High | Human checkpoints, validation |
| Rate limiting issues | Low | Low | Queue system, async processing |
| Context window overflow | Medium | Medium | Progressive loading, summarization |

---

## 8. Success Metrics

### Week 1 (Phase 1)
- PM Agent generates valid specs 90%+ of the time
- Codebase analysis answers are accurate 85%+ of the time
- Task breakdowns match spec complexity 80%+ of the time

### Week 2 (Phase 2)
- Admin users can request features without technical knowledge
- API response time <30s for simple queries
- Cost per spec generation <$0.50

### Week 3 (Phase 3)
- Agent handoffs complete successfully 95%+ of the time
- Parallel execution reduces total time by 40%+
- Human checkpoint response time <4 hours

### Week 4 (Phase 4)
- Dashboard shows real-time agent activity
- Cost tracking accurate to $0.01
- Alert system catches budget overruns

---

## 9. Dependencies

### External
- Anthropic Claude API (Opus 4.5)
- Google AI API (Gemini 3 Pro) - optional fallback
- Claude Max subscription (for development mode)

### Internal
- `.claude/tools/supabase-executor.ts` - database queries
- `.claude/skills/context-manager/` - token optimization
- `docs/architecture/SYSTEM_OVERVIEW.md` - codebase context
- Existing admin RBAC system

---

## 10. Future Enhancements

### Planned (Post-MVP)
- **Voice Interface**: Speech-to-spec via Whisper integration
- **Visual Spec Generation**: Screenshot-to-spec capability
- **Git Integration**: Auto-create branches and PRs
- **Slack Bot**: PM Agent accessible via Slack commands
- **Memory System**: Long-term memory across sessions

### Considered (Evaluation Needed)
- Fine-tuned model for CircleTel domain
- On-premise deployment option
- Multi-tenant support for white-label
