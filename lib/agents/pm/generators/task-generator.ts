/**
 * Task Generator
 *
 * Generates TASKS.md files with detailed task breakdowns for Agent-OS specs.
 * Organizes tasks by agent type, dependencies, and priority.
 *
 * @module lib/agents/pm/generators/task-generator
 * @see agent-os/specs/20251129-agentic-ai-system/spec.md
 */

import {
  TaskGroup,
  Task,
  SubTask,
  UserStory,
  ImpactAnalysis,
  Complexity,
  STORY_POINT_MAP,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Agent role assignments.
 */
export type AgentRole =
  | 'database-engineer'
  | 'backend-engineer'
  | 'frontend-engineer'
  | 'testing-engineer'
  | 'ops-engineer';

/**
 * Generated tasks output.
 */
export interface GeneratedTasks {
  /** Task groups */
  taskGroups: TaskGroup[];
  /** Total story points */
  totalPoints: number;
  /** Tasks markdown content */
  content: string;
}

/**
 * Task generation options.
 */
export interface TaskGeneratorOptions {
  /** Maximum tasks per group */
  maxTasksPerGroup?: number;
  /** Include subtasks */
  includeSubtasks?: boolean;
  /** Include time estimates */
  includeTimeEstimates?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Task type to agent role mapping.
 */
const TASK_ROLE_MAP: Record<string, AgentRole> = {
  migration: 'database-engineer',
  database: 'database-engineer',
  schema: 'database-engineer',
  rls: 'database-engineer',
  api: 'backend-engineer',
  endpoint: 'backend-engineer',
  service: 'backend-engineer',
  component: 'frontend-engineer',
  page: 'frontend-engineer',
  ui: 'frontend-engineer',
  style: 'frontend-engineer',
  test: 'testing-engineer',
  e2e: 'testing-engineer',
  deploy: 'ops-engineer',
  config: 'ops-engineer',
};

// ============================================================================
// Task Generator Class
// ============================================================================

/**
 * Generates TASKS.md files with structured task breakdowns.
 */
export class TaskGenerator {
  private readonly options: Required<TaskGeneratorOptions>;

  /**
   * Create a new TaskGenerator.
   *
   * @param options - Generation options
   */
  constructor(options: TaskGeneratorOptions = {}) {
    this.options = {
      maxTasksPerGroup: options.maxTasksPerGroup ?? 8,
      includeSubtasks: options.includeSubtasks ?? true,
      includeTimeEstimates: options.includeTimeEstimates ?? false,
    };
  }

  // ==========================================================================
  // Main Generation Method
  // ==========================================================================

  /**
   * Generate tasks from user stories and impact analysis.
   *
   * @param userStories - User stories to break down
   * @param impactAnalysis - Impact analysis for context
   * @param specId - Spec identifier
   * @returns Generated tasks
   */
  generate(
    userStories: UserStory[],
    impactAnalysis: ImpactAnalysis,
    specId: string
  ): GeneratedTasks {
    // Generate task groups
    const taskGroups = this.generateTaskGroups(userStories, impactAnalysis);

    // Calculate total points
    const totalPoints = taskGroups.reduce((sum, g) => sum + g.storyPoints, 0);

    // Build markdown content
    const content = this.buildTasksContent(taskGroups, specId, totalPoints);

    return {
      taskGroups,
      totalPoints,
      content,
    };
  }

  // ==========================================================================
  // Task Group Generation
  // ==========================================================================

  /**
   * Generate task groups from stories and impact.
   */
  private generateTaskGroups(
    userStories: UserStory[],
    impactAnalysis: ImpactAnalysis
  ): TaskGroup[] {
    const groups: TaskGroup[] = [];
    let groupNum = 1;

    // Group 1: Database/Schema (if needed)
    if (impactAnalysis.databaseTables.length > 0) {
      groups.push(this.createDatabaseTaskGroup(groupNum++, impactAnalysis));
    }

    // Group 2: Backend/API (if needed)
    if (impactAnalysis.apiEndpoints.length > 0) {
      const deps = impactAnalysis.databaseTables.length > 0 ? [1] : [];
      groups.push(this.createBackendTaskGroup(groupNum++, impactAnalysis, deps));
    }

    // Group 3: Frontend (if needed)
    const frontendFiles = impactAnalysis.filesToCreate.filter(
      f => f.path.includes('component') || f.path.includes('page')
    );
    if (frontendFiles.length > 0) {
      const deps = impactAnalysis.apiEndpoints.length > 0 ? [groupNum - 1] : [];
      groups.push(this.createFrontendTaskGroup(groupNum++, impactAnalysis, deps));
    }

    // Group 4: Testing
    groups.push(this.createTestingTaskGroup(groupNum++, impactAnalysis, groups.map(g => g.groupNumber)));

    // Group 5: Deployment/Ops (if has dependencies or high risk)
    if (impactAnalysis.dependencies.length > 0 || impactAnalysis.riskLevel === 'high') {
      groups.push(this.createOpsTaskGroup(groupNum++, impactAnalysis, groups.map(g => g.groupNumber)));
    }

    return groups;
  }

  /**
   * Create database task group.
   */
  private createDatabaseTaskGroup(
    groupNum: number,
    impactAnalysis: ImpactAnalysis
  ): TaskGroup {
    const tasks: Task[] = [];
    let taskNum = 1;

    // Task: Create migration
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Create Database Migration',
      description: 'Create Supabase migration file with schema changes',
      status: 'not_started',
      subtasks: this.options.includeSubtasks
        ? [
            { id: `${groupNum}.${taskNum - 1}.1`, description: 'Design table structure', status: 'not_started' },
            { id: `${groupNum}.${taskNum - 1}.2`, description: 'Write migration SQL', status: 'not_started' },
            { id: `${groupNum}.${taskNum - 1}.3`, description: 'Add indexes for performance', status: 'not_started' },
          ]
        : undefined,
    });

    // Task: RLS policies
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Configure RLS Policies',
      description: 'Set up Row Level Security policies for data access control',
      status: 'not_started',
      subtasks: this.options.includeSubtasks
        ? [
            { id: `${groupNum}.${taskNum - 1}.1`, description: 'Define access patterns', status: 'not_started' },
            { id: `${groupNum}.${taskNum - 1}.2`, description: 'Write RLS policies', status: 'not_started' },
            { id: `${groupNum}.${taskNum - 1}.3`, description: 'Test policy enforcement', status: 'not_started' },
          ]
        : undefined,
    });

    // Task: Test migration
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Test Migration',
      description: 'Verify migration applies correctly and rollback works',
      status: 'not_started',
    });

    // Calculate story points
    const points = this.calculateGroupPoints(tasks);

    return {
      groupNumber: groupNum,
      title: 'Database Schema',
      assignedTo: 'database-engineer',
      dependencies: [],
      priority: 'critical',
      storyPoints: points,
      tasks,
      relatedStories: ['US-1'],
      acceptanceCriteria: [
        'Migration applies without errors',
        'RLS policies enforce access control',
        'Indexes improve query performance',
        'Rollback script tested',
      ],
      filesToCreate: impactAnalysis.filesToCreate
        .filter(f => f.path.includes('migration'))
        .map(f => f.path),
    };
  }

  /**
   * Create backend task group.
   */
  private createBackendTaskGroup(
    groupNum: number,
    impactAnalysis: ImpactAnalysis,
    dependencies: number[]
  ): TaskGroup {
    const tasks: Task[] = [];
    let taskNum = 1;

    // Group endpoints by resource
    const endpointsByResource = new Map<string, typeof impactAnalysis.apiEndpoints>();
    for (const endpoint of impactAnalysis.apiEndpoints) {
      const resource = endpoint.path.split('/')[2] || 'resource';
      if (!endpointsByResource.has(resource)) {
        endpointsByResource.set(resource, []);
      }
      endpointsByResource.get(resource)!.push(endpoint);
    }

    // Task per resource
    for (const [resource, endpoints] of endpointsByResource) {
      tasks.push({
        id: `${groupNum}.${taskNum++}`,
        title: `Implement ${resource} API`,
        description: `Create API endpoints for ${resource} operations`,
        status: 'not_started',
        subtasks: this.options.includeSubtasks
          ? endpoints.map((e, i) => ({
              id: `${groupNum}.${taskNum - 1}.${i + 1}`,
              description: `${e.method} ${e.path}`,
              status: 'not_started' as const,
            }))
          : undefined,
      });
    }

    // Task: Add authentication
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Add Authentication',
      description: 'Implement authentication checks for protected endpoints',
      status: 'not_started',
    });

    // Task: Add validation
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Add Input Validation',
      description: 'Validate request bodies and query parameters',
      status: 'not_started',
    });

    // Task: Error handling
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Error Handling',
      description: 'Implement consistent error responses',
      status: 'not_started',
    });

    const points = this.calculateGroupPoints(tasks);

    return {
      groupNumber: groupNum,
      title: 'Backend API',
      assignedTo: 'backend-engineer',
      dependencies,
      priority: 'high',
      storyPoints: points,
      tasks: tasks.slice(0, this.options.maxTasksPerGroup),
      relatedStories: ['US-1'],
      acceptanceCriteria: [
        'All endpoints return correct responses',
        'Authentication enforced on protected routes',
        'Input validation prevents invalid data',
        'Error responses follow consistent format',
      ],
      filesToCreate: impactAnalysis.filesToCreate
        .filter(f => f.path.includes('/api/'))
        .map(f => f.path),
    };
  }

  /**
   * Create frontend task group.
   */
  private createFrontendTaskGroup(
    groupNum: number,
    impactAnalysis: ImpactAnalysis,
    dependencies: number[]
  ): TaskGroup {
    const tasks: Task[] = [];
    let taskNum = 1;

    // Group files by type
    const components = impactAnalysis.filesToCreate.filter(f => f.path.includes('component'));
    const pages = impactAnalysis.filesToCreate.filter(f => f.path.includes('page'));

    // Task: Create components
    if (components.length > 0) {
      tasks.push({
        id: `${groupNum}.${taskNum++}`,
        title: 'Build UI Components',
        description: 'Create reusable UI components',
        status: 'not_started',
        subtasks: this.options.includeSubtasks
          ? components.slice(0, 5).map((c, i) => ({
              id: `${groupNum}.${taskNum - 1}.${i + 1}`,
              description: `Create ${c.path.split('/').pop()}`,
              status: 'not_started' as const,
            }))
          : undefined,
      });
    }

    // Task: Create pages
    if (pages.length > 0) {
      tasks.push({
        id: `${groupNum}.${taskNum++}`,
        title: 'Build Page Components',
        description: 'Create page-level components',
        status: 'not_started',
        subtasks: this.options.includeSubtasks
          ? pages.slice(0, 5).map((p, i) => ({
              id: `${groupNum}.${taskNum - 1}.${i + 1}`,
              description: `Create ${p.path}`,
              status: 'not_started' as const,
            }))
          : undefined,
      });
    }

    // Task: API integration
    if (impactAnalysis.apiEndpoints.length > 0) {
      tasks.push({
        id: `${groupNum}.${taskNum++}`,
        title: 'API Integration',
        description: 'Connect components to backend API',
        status: 'not_started',
      });
    }

    // Task: State management
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'State Management',
      description: 'Implement state management (hooks, context, or store)',
      status: 'not_started',
    });

    // Task: Loading/error states
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Loading & Error States',
      description: 'Add loading indicators and error handling',
      status: 'not_started',
    });

    // Task: Responsive design
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Responsive Design',
      description: 'Ensure components work on all screen sizes',
      status: 'not_started',
    });

    const points = this.calculateGroupPoints(tasks);

    return {
      groupNumber: groupNum,
      title: 'Frontend UI',
      assignedTo: 'frontend-engineer',
      dependencies,
      priority: 'high',
      storyPoints: points,
      tasks: tasks.slice(0, this.options.maxTasksPerGroup),
      relatedStories: ['US-1'],
      acceptanceCriteria: [
        'Components render correctly',
        'API integration works',
        'Loading states shown during async operations',
        'Error states display user-friendly messages',
        'UI is responsive on mobile and desktop',
      ],
      filesToCreate: [...components, ...pages].map(f => f.path),
    };
  }

  /**
   * Create testing task group.
   */
  private createTestingTaskGroup(
    groupNum: number,
    impactAnalysis: ImpactAnalysis,
    dependencies: number[]
  ): TaskGroup {
    const tasks: Task[] = [];
    let taskNum = 1;

    // Task: Unit tests
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Write Unit Tests',
      description: 'Create unit tests for services and utilities',
      status: 'not_started',
      subtasks: this.options.includeSubtasks
        ? [
            { id: `${groupNum}.${taskNum - 1}.1`, description: 'Test business logic', status: 'not_started' },
            { id: `${groupNum}.${taskNum - 1}.2`, description: 'Test utility functions', status: 'not_started' },
            { id: `${groupNum}.${taskNum - 1}.3`, description: 'Test edge cases', status: 'not_started' },
          ]
        : undefined,
    });

    // Task: Integration tests
    if (impactAnalysis.apiEndpoints.length > 0) {
      tasks.push({
        id: `${groupNum}.${taskNum++}`,
        title: 'Write Integration Tests',
        description: 'Test API endpoints and database operations',
        status: 'not_started',
      });
    }

    // Task: E2E tests
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Write E2E Tests',
      description: 'Create end-to-end tests for user flows',
      status: 'not_started',
      subtasks: this.options.includeSubtasks
        ? [
            { id: `${groupNum}.${taskNum - 1}.1`, description: 'Test happy path', status: 'not_started' },
            { id: `${groupNum}.${taskNum - 1}.2`, description: 'Test error scenarios', status: 'not_started' },
            { id: `${groupNum}.${taskNum - 1}.3`, description: 'Test authentication', status: 'not_started' },
          ]
        : undefined,
    });

    // Task: Manual testing
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Manual Testing',
      description: 'Perform manual testing and exploratory testing',
      status: 'not_started',
    });

    const points = this.calculateGroupPoints(tasks);

    return {
      groupNumber: groupNum,
      title: 'Testing & QA',
      assignedTo: 'testing-engineer',
      dependencies,
      priority: 'medium',
      storyPoints: points,
      tasks,
      relatedStories: ['US-1'],
      acceptanceCriteria: [
        'Unit test coverage > 80%',
        'Integration tests pass',
        'E2E tests pass',
        'No critical bugs found in manual testing',
      ],
      filesToCreate: [],
    };
  }

  /**
   * Create ops task group.
   */
  private createOpsTaskGroup(
    groupNum: number,
    impactAnalysis: ImpactAnalysis,
    dependencies: number[]
  ): TaskGroup {
    const tasks: Task[] = [];
    let taskNum = 1;

    // Task: Install dependencies
    if (impactAnalysis.dependencies.length > 0) {
      tasks.push({
        id: `${groupNum}.${taskNum++}`,
        title: 'Install Dependencies',
        description: 'Install and configure new npm packages',
        status: 'not_started',
      });
    }

    // Task: Environment setup
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Environment Configuration',
      description: 'Configure environment variables and settings',
      status: 'not_started',
    });

    // Task: Deploy to staging
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Deploy to Staging',
      description: 'Deploy changes to staging environment',
      status: 'not_started',
    });

    // Task: Production deployment
    tasks.push({
      id: `${groupNum}.${taskNum++}`,
      title: 'Production Deployment',
      description: 'Deploy to production after staging validation',
      status: 'not_started',
    });

    const points = this.calculateGroupPoints(tasks);

    return {
      groupNumber: groupNum,
      title: 'Deployment & Ops',
      assignedTo: 'ops-engineer',
      dependencies,
      priority: 'low',
      storyPoints: points,
      tasks,
      relatedStories: ['US-1'],
      acceptanceCriteria: [
        'Dependencies installed without conflicts',
        'Environment variables configured',
        'Staging deployment successful',
        'Production deployment verified',
      ],
      filesToCreate: [],
    };
  }

  // ==========================================================================
  // Content Generation
  // ==========================================================================

  /**
   * Build the full tasks markdown content.
   */
  private buildTasksContent(
    taskGroups: TaskGroup[],
    specId: string,
    totalPoints: number
  ): string {
    const sections: string[] = [];

    // Header
    sections.push(this.buildHeader(specId, totalPoints, taskGroups));

    // Summary table
    sections.push(this.buildSummaryTable(taskGroups));

    // Dependency diagram
    sections.push(this.buildDependencyDiagram(taskGroups));

    // Task groups
    for (const group of taskGroups) {
      sections.push(this.buildTaskGroupSection(group));
    }

    // Footer
    sections.push(this.buildFooter(specId));

    return sections.join('\n\n');
  }

  /**
   * Build tasks header.
   */
  private buildHeader(specId: string, totalPoints: number, groups: TaskGroup[]): string {
    return `---
spec_id: ${specId}
type: tasks
total_points: ${totalPoints}
task_groups: ${groups.length}
generated: ${new Date().toISOString().split('T')[0]}
---

# Task Breakdown

> **Spec**: \`${specId}\`
> **Total Story Points**: ${totalPoints}
> **Task Groups**: ${groups.length}`;
  }

  /**
   * Build summary table.
   */
  private buildSummaryTable(taskGroups: TaskGroup[]): string {
    return `## Summary

| # | Task Group | Agent | Points | Priority | Dependencies |
|---|------------|-------|--------|----------|--------------|
${taskGroups.map(g => `| ${g.groupNumber} | ${g.title} | \`${g.assignedTo}\` | ${g.storyPoints} | ${g.priority} | ${g.dependencies.length > 0 ? g.dependencies.map(d => `#${d}`).join(', ') : '-'} |`).join('\n')}
| | **Total** | | **${taskGroups.reduce((s, g) => s + g.storyPoints, 0)}** | | |`;
  }

  /**
   * Build dependency diagram.
   */
  private buildDependencyDiagram(taskGroups: TaskGroup[]): string {
    const lines = ['## Dependency Graph', '', '```'];

    for (const group of taskGroups) {
      const deps = group.dependencies.length > 0
        ? ` ← [${group.dependencies.map(d => {
            const depGroup = taskGroups.find(g => g.groupNumber === d);
            return depGroup ? depGroup.title : `Task ${d}`;
          }).join(', ')}]`
        : '';

      lines.push(`[${group.groupNumber}] ${group.title}${deps}`);
    }

    lines.push('```');
    return lines.join('\n');
  }

  /**
   * Build task group section.
   */
  private buildTaskGroupSection(group: TaskGroup): string {
    let content = `## Task Group ${group.groupNumber}: ${group.title}

| Attribute | Value |
|-----------|-------|
| **Agent** | \`${group.assignedTo}\` |
| **Story Points** | ${group.storyPoints} |
| **Priority** | ${group.priority} |
| **Dependencies** | ${group.dependencies.length > 0 ? group.dependencies.map(d => `#${d}`).join(', ') : 'None'} |

### Tasks`;

    for (const task of group.tasks) {
      content += `

#### ${task.id}: ${task.title}

${task.description}

**Status**: ${this.formatStatus(task.status)}`;

      if (task.subtasks && task.subtasks.length > 0) {
        content += `

**Subtasks**:
${task.subtasks.map(st => `- [ ] ${st.id}: ${st.description}`).join('\n')}`;
      }
    }

    content += `

### Acceptance Criteria

${group.acceptanceCriteria.map(ac => `- [ ] ${ac}`).join('\n')}`;

    if (group.filesToCreate.length > 0) {
      content += `

### Files to Create

${group.filesToCreate.map(f => `- \`${f}\``).join('\n')}`;
    }

    return content;
  }

  /**
   * Build tasks footer.
   */
  private buildFooter(specId: string): string {
    return `---

## Progress Tracking

Use this checklist to track overall progress:

- [ ] Task Group 1: Database Schema
- [ ] Task Group 2: Backend API
- [ ] Task Group 3: Frontend UI
- [ ] Task Group 4: Testing & QA
- [ ] Task Group 5: Deployment & Ops

---

*Generated by PM Agent | Spec: ${specId}*`;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Calculate story points for a group.
   */
  private calculateGroupPoints(tasks: Task[]): number {
    // Base points on task count and complexity
    const basePoints = tasks.length;
    const subtaskBonus = tasks.reduce(
      (sum, t) => sum + (t.subtasks?.length || 0) * 0.5,
      0
    );

    const total = Math.ceil(basePoints + subtaskBonus);

    // Map to Fibonacci scale
    if (total <= 1) return STORY_POINT_MAP.trivial;
    if (total <= 2) return STORY_POINT_MAP.simple;
    if (total <= 4) return STORY_POINT_MAP.moderate;
    if (total <= 6) return STORY_POINT_MAP.complex;
    return STORY_POINT_MAP.very_complex;
  }

  /**
   * Format task status for display.
   */
  private formatStatus(status: Task['status']): string {
    const statusMap = {
      not_started: '⬜ Not Started',
      in_progress: '🔄 In Progress',
      complete: '✅ Complete',
      blocked: '🚫 Blocked',
    };
    return statusMap[status];
  }
}

// ============================================================================
// Exports
// ============================================================================

export default TaskGenerator;
