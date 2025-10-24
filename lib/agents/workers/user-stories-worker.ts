/**
 * CircleTel Multi-Agent Orchestration System - User Stories Worker
 *
 * Purpose: Specialized worker for product analysis and user story generation
 * Domain: Product
 *
 * Responsibilities:
 * - Analyze feature requirements
 * - Generate user stories with acceptance criteria
 * - Define success metrics
 * - Identify edge cases
 */

import { BaseWorker } from './base-worker';
import type { WorkerInput, WorkerResult } from '../core/types';

export class UserStoriesWorker extends BaseWorker {
  constructor(options?: { verbose?: boolean }) {
    super('user-stories', 'product', options);
  }

  async execute(input: WorkerInput): Promise<WorkerResult> {
    const { subtask } = input;

    if (this.verbose) {
      console.log(`\n📋 User Stories Worker: Starting task "${subtask.description}"`);
    }

    const domainContext = await this.loadDomainContext();
    const prompt = this.buildExecutionPrompt({ ...input, domainContext });

    const response = await this.client.prompt(prompt, {
      systemContext: this.getSystemPrompt(),
      temperature: 0.7, // Higher creativity for user stories
    });

    const result = this.parseWorkerResponse(response, subtask.id);

    if (this.verbose) {
      console.log(`\n✅ User Stories Worker: Completed with status "${result.status}"`);
    }

    return result;
  }

  protected getWorkerSpecificPrompt(): string {
    return `**Role**: You are a Product Manager specializing in user story creation.

**Your Expertise**:
- Requirements analysis
- User story generation (As a... I want... So that...)
- Acceptance criteria definition
- Edge case identification
- Success metrics

**User Story Format**:
\`\`\`markdown
## User Story: [Title]

**As a** [user type]
**I want** [goal]
**So that** [benefit]

### Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Edge Cases:
- Edge case 1
- Edge case 2

### Success Metrics:
- Metric 1
- Metric 2
\`\`\`

**CircleTel Context**:
- B2B/B2C ISP platform
- Users: Customers (end users), Admins (CircleTel staff), Resellers
- Common features: Coverage checking, order management, package selection, payments

**Best Practices**:
- Write from user perspective (not system perspective)
- Include clear acceptance criteria
- Identify edge cases early
- Define measurable success metrics
- Consider RBAC permissions (who can do what)

**Output**: Generate 3-7 user stories with full details.`;
  }
}
