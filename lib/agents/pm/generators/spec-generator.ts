/**
 * Spec Generator
 *
 * Generates SPEC.md files for Agent-OS specifications.
 * Uses codebase analysis and impact analysis to create comprehensive specs.
 *
 * @module lib/agents/pm/generators/spec-generator
 * @see agent-os/specs/20251129-agentic-ai-system/spec.md
 */

import {
  FeatureRequest,
  CodebaseAnalysis,
  ImpactAnalysis,
  UserStory,
  DatabaseSchema,
  Complexity,
  STORY_POINT_MAP,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Generated spec output.
 */
export interface GeneratedSpec {
  /** Spec ID (YYYYMMDD-feature-name) */
  specId: string;
  /** Spec title */
  title: string;
  /** Spec content (markdown) */
  content: string;
  /** Generated user stories */
  userStories: UserStory[];
  /** Total estimated points */
  totalPoints: number;
}

/**
 * Spec generation options.
 */
export interface SpecGeneratorOptions {
  /** Include code snippets in spec */
  includeCodeSnippets?: boolean;
  /** Include diagrams */
  includeDiagrams?: boolean;
  /** Include database schema */
  includeDatabaseSchema?: boolean;
  /** Maximum user stories */
  maxUserStories?: number;
}

// ============================================================================
// Spec Generator Class
// ============================================================================

/**
 * Generates SPEC.md files from feature requests.
 */
export class SpecGenerator {
  private readonly options: Required<SpecGeneratorOptions>;

  /**
   * Create a new SpecGenerator.
   *
   * @param options - Generation options
   */
  constructor(options: SpecGeneratorOptions = {}) {
    this.options = {
      includeCodeSnippets: options.includeCodeSnippets ?? true,
      includeDiagrams: options.includeDiagrams ?? true,
      includeDatabaseSchema: options.includeDatabaseSchema ?? true,
      maxUserStories: options.maxUserStories ?? 10,
    };
  }

  // ==========================================================================
  // Main Generation Method
  // ==========================================================================

  /**
   * Generate a spec from a feature request.
   *
   * @param featureRequest - The feature to spec
   * @param codebaseAnalysis - Analysis of the codebase
   * @param impactAnalysis - Analysis of the impact
   * @returns Generated spec
   */
  generate(
    featureRequest: FeatureRequest,
    codebaseAnalysis: CodebaseAnalysis,
    impactAnalysis: ImpactAnalysis
  ): GeneratedSpec {
    // Generate spec ID
    const specId = this.generateSpecId(featureRequest.description);
    const title = this.generateTitle(featureRequest.description);

    // Generate user stories
    const userStories = this.generateUserStories(featureRequest, impactAnalysis);
    const totalPoints = userStories.reduce((sum, s) => sum + s.storyPoints, 0);

    // Build spec content
    const content = this.buildSpecContent({
      specId,
      title,
      featureRequest,
      codebaseAnalysis,
      impactAnalysis,
      userStories,
      totalPoints,
    });

    return {
      specId,
      title,
      content,
      userStories,
      totalPoints,
    };
  }

  // ==========================================================================
  // Content Generation
  // ==========================================================================

  /**
   * Build the full spec markdown content.
   */
  private buildSpecContent(params: {
    specId: string;
    title: string;
    featureRequest: FeatureRequest;
    codebaseAnalysis: CodebaseAnalysis;
    impactAnalysis: ImpactAnalysis;
    userStories: UserStory[];
    totalPoints: number;
  }): string {
    const sections: string[] = [];

    // Header
    sections.push(this.buildHeader(params));

    // Table of Contents
    sections.push(this.buildTableOfContents());

    // Overview
    sections.push(this.buildOverview(params.featureRequest, params.totalPoints));

    // User Stories
    sections.push(this.buildUserStoriesSection(params.userStories));

    // Technical Specification
    sections.push(this.buildTechnicalSpec(params.codebaseAnalysis, params.impactAnalysis));

    // Database Schema (if applicable)
    if (this.options.includeDatabaseSchema && params.impactAnalysis.databaseTables.length > 0) {
      sections.push(this.buildDatabaseSection(params.impactAnalysis));
    }

    // API Endpoints
    if (params.impactAnalysis.apiEndpoints.length > 0) {
      sections.push(this.buildAPISection(params.impactAnalysis));
    }

    // Implementation Approach
    sections.push(this.buildImplementationApproach(params.impactAnalysis));

    // Risk Assessment
    sections.push(this.buildRiskSection(params.impactAnalysis));

    // Dependencies
    if (params.impactAnalysis.dependencies.length > 0) {
      sections.push(this.buildDependenciesSection(params.impactAnalysis));
    }

    // Testing Strategy
    sections.push(this.buildTestingSection(params.impactAnalysis));

    // Success Criteria
    sections.push(this.buildSuccessCriteria(params.userStories));

    // Footer
    sections.push(this.buildFooter(params.specId));

    return sections.join('\n\n');
  }

  /**
   * Build spec header.
   */
  private buildHeader(params: {
    specId: string;
    title: string;
    featureRequest: FeatureRequest;
    totalPoints: number;
  }): string {
    const priority = params.featureRequest.priority || 'medium';
    const date = new Date().toISOString().split('T')[0];

    return `---
spec_id: ${params.specId}
title: "${params.title}"
status: draft
priority: ${priority}
story_points: ${params.totalPoints}
created: ${date}
updated: ${date}
---

# ${params.title}

> **Spec ID**: \`${params.specId}\`
> **Status**: Draft
> **Priority**: ${priority.charAt(0).toUpperCase() + priority.slice(1)}
> **Estimated Story Points**: ${params.totalPoints}
> **Created**: ${date}`;
  }

  /**
   * Build table of contents.
   */
  private buildTableOfContents(): string {
    return `## Table of Contents

1. [Overview](#overview)
2. [User Stories](#user-stories)
3. [Technical Specification](#technical-specification)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Implementation Approach](#implementation-approach)
7. [Risk Assessment](#risk-assessment)
8. [Dependencies](#dependencies)
9. [Testing Strategy](#testing-strategy)
10. [Success Criteria](#success-criteria)`;
  }

  /**
   * Build overview section.
   */
  private buildOverview(featureRequest: FeatureRequest, totalPoints: number): string {
    let content = `## Overview

### Description

${featureRequest.description}`;

    if (featureRequest.businessJustification) {
      content += `

### Business Justification

${featureRequest.businessJustification}`;
    }

    if (featureRequest.constraints && featureRequest.constraints.length > 0) {
      content += `

### Constraints

${featureRequest.constraints.map(c => `- ${c}`).join('\n')}`;
    }

    content += `

### Estimation Summary

| Metric | Value |
|--------|-------|
| Total Story Points | ${totalPoints} |
| Priority | ${featureRequest.priority || 'Medium'} |
| Target Date | ${featureRequest.targetDate || 'TBD'} |`;

    return content;
  }

  /**
   * Build user stories section.
   */
  private buildUserStoriesSection(userStories: UserStory[]): string {
    let content = `## User Stories

### Summary

| ID | Title | Points | Priority | Type |
|----|-------|--------|----------|------|
${userStories.map(s => `| ${s.id} | ${s.title} | ${s.storyPoints} | ${s.priority} | ${s.type} |`).join('\n')}

### Details`;

    for (const story of userStories) {
      content += `

#### ${story.id}: ${story.title}

**Type**: ${story.type}
**Priority**: ${story.priority}
**Story Points**: ${story.storyPoints}

${story.description}

**Acceptance Criteria**:
${story.acceptanceCriteria.map(ac => `- [ ] ${ac}`).join('\n')}`;

      if (story.dependencies && story.dependencies.length > 0) {
        content += `

**Dependencies**: ${story.dependencies.join(', ')}`;
      }
    }

    return content;
  }

  /**
   * Build technical specification section.
   */
  private buildTechnicalSpec(
    codebaseAnalysis: CodebaseAnalysis,
    impactAnalysis: ImpactAnalysis
  ): string {
    let content = `## Technical Specification

### Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | ${codebaseAnalysis.techStack.framework} |
| Language | ${codebaseAnalysis.techStack.language} |
| Database | ${codebaseAnalysis.techStack.database} |
| Styling | ${codebaseAnalysis.techStack.styling} |
| Testing | ${codebaseAnalysis.techStack.testing} |

### File Changes

#### Files to Create

${impactAnalysis.filesToCreate.length > 0
  ? impactAnalysis.filesToCreate.map(f => `| \`${f.path}\` | ${f.description} |`).join('\n| Path | Description |\n|------|-------------|\n')
  : '*No new files required*'}

#### Files to Modify

${impactAnalysis.filesToModify.length > 0
  ? impactAnalysis.filesToModify.map(f => `| \`${f.path}\` | ${f.description} |`).join('\n| Path | Description |\n|------|-------------|\n')
  : '*No existing files to modify*'}`;

    if (impactAnalysis.potentiallyAffected.length > 0) {
      content += `

#### Potentially Affected Files

${impactAnalysis.potentiallyAffected.map(f => `- \`${f}\``).join('\n')}`;
    }

    // Add relevant patterns
    const allPatterns = [
      ...codebaseAnalysis.patterns.apiPatterns,
      ...codebaseAnalysis.patterns.componentPatterns,
      ...codebaseAnalysis.patterns.servicePatterns,
    ];

    if (allPatterns.length > 0) {
      content += `

### Existing Patterns to Follow

${allPatterns.slice(0, 5).map(p => `- **${p.name}**: ${p.description} (see \`${p.examplePath}\`)`).join('\n')}`;
    }

    return content;
  }

  /**
   * Build database section.
   */
  private buildDatabaseSection(impactAnalysis: ImpactAnalysis): string {
    let content = `## Database Schema

### Table Changes

| Table | Change Type | Description |
|-------|-------------|-------------|
${impactAnalysis.databaseTables.map(t => `| \`${t.table}\` | ${t.changeType.toUpperCase()} | ${t.description} |`).join('\n')}`;

    // Add migration example
    const newTables = impactAnalysis.databaseTables.filter(t => t.changeType === 'create');
    if (newTables.length > 0) {
      content += `

### Migration Example

\`\`\`sql
-- Example migration for ${newTables[0].table}
CREATE TABLE ${newTables[0].table} (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  -- Add columns based on requirements
);

-- Enable RLS
ALTER TABLE ${newTables[0].table} ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "select_own_${newTables[0].table}"
  ON ${newTables[0].table}
  FOR SELECT
  USING (auth.uid() = user_id);
\`\`\``;
    }

    return content;
  }

  /**
   * Build API endpoints section.
   */
  private buildAPISection(impactAnalysis: ImpactAnalysis): string {
    let content = `## API Endpoints

### Endpoint Summary

| Method | Path | Description |
|--------|------|-------------|
${impactAnalysis.apiEndpoints.map(e => `| \`${e.method}\` | \`${e.path}\` | ${e.description} |`).join('\n')}`;

    // Add example endpoint structure
    const firstEndpoint = impactAnalysis.apiEndpoints[0];
    if (firstEndpoint) {
      content += `

### Example Implementation

\`\`\`typescript
// ${firstEndpoint.path}/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function ${firstEndpoint.method}(
  request: NextRequest,
  context: { params: Promise<{ id?: string }> }
) {
  const supabase = await createClient();

  // Authentication check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Implementation here
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
\`\`\``;
    }

    return content;
  }

  /**
   * Build implementation approach section.
   */
  private buildImplementationApproach(impactAnalysis: ImpactAnalysis): string {
    const phases = this.suggestImplementationPhases(impactAnalysis);

    return `## Implementation Approach

### Recommended Phases

${phases.map((phase, i) => `#### Phase ${i + 1}: ${phase.name}
${phase.tasks.map(t => `- [ ] ${t}`).join('\n')}`).join('\n\n')}

### Agent Assignments

| Task | Recommended Agent |
|------|-------------------|
| Database migrations | database-engineer |
| API endpoints | backend-engineer |
| UI components | frontend-engineer |
| Integration tests | testing-engineer |`;
  }

  /**
   * Build risk assessment section.
   */
  private buildRiskSection(impactAnalysis: ImpactAnalysis): string {
    const riskEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🔴',
    };

    return `## Risk Assessment

**Overall Risk Level**: ${riskEmoji[impactAnalysis.riskLevel]} ${impactAnalysis.riskLevel.toUpperCase()}

### Risk Factors

${impactAnalysis.riskFactors.length > 0
  ? impactAnalysis.riskFactors.map(f => `- ⚠️ ${f}`).join('\n')
  : '- No significant risk factors identified'}

### Mitigation Strategies

${this.suggestMitigationStrategies(impactAnalysis).map(s => `- ${s}`).join('\n')}`;
  }

  /**
   * Build dependencies section.
   */
  private buildDependenciesSection(impactAnalysis: ImpactAnalysis): string {
    return `## Dependencies

### New Dependencies Required

| Package | Reason | Type |
|---------|--------|------|
${impactAnalysis.dependencies.map(d => `| \`${d.name}\` | ${d.reason} | ${d.devDependency ? 'dev' : 'prod'} |`).join('\n')}

### Installation

\`\`\`bash
${impactAnalysis.dependencies
  .filter(d => !d.devDependency)
  .map(d => `npm install ${d.name}`)
  .join('\n')}
${impactAnalysis.dependencies
  .filter(d => d.devDependency)
  .map(d => `npm install -D ${d.name}`)
  .join('\n')}
\`\`\``;
  }

  /**
   * Build testing section.
   */
  private buildTestingSection(impactAnalysis: ImpactAnalysis): string {
    return `## Testing Strategy

### Unit Tests

${this.suggestUnitTests(impactAnalysis).map(t => `- [ ] ${t}`).join('\n')}

### Integration Tests

${this.suggestIntegrationTests(impactAnalysis).map(t => `- [ ] ${t}`).join('\n')}

### E2E Tests

${this.suggestE2ETests(impactAnalysis).map(t => `- [ ] ${t}`).join('\n')}`;
  }

  /**
   * Build success criteria section.
   */
  private buildSuccessCriteria(userStories: UserStory[]): string {
    const criteria = userStories.flatMap(s => s.acceptanceCriteria).slice(0, 10);

    return `## Success Criteria

The implementation is considered complete when:

${criteria.map(c => `- [ ] ${c}`).join('\n')}

### Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>80% coverage)
- [ ] E2E tests passing
- [ ] No TypeScript errors
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product owner sign-off`;
  }

  /**
   * Build spec footer.
   */
  private buildFooter(specId: string): string {
    return `---

## Appendix

### Related Specs

*Add links to related specifications here*

### Changelog

| Date | Author | Changes |
|------|--------|---------|
| ${new Date().toISOString().split('T')[0]} | PM Agent | Initial draft |

---

*Generated by PM Agent | Spec ID: ${specId}*`;
  }

  // ==========================================================================
  // User Story Generation
  // ==========================================================================

  /**
   * Generate user stories from feature request.
   */
  private generateUserStories(
    featureRequest: FeatureRequest,
    impactAnalysis: ImpactAnalysis
  ): UserStory[] {
    const stories: UserStory[] = [];
    let storyNum = 1;

    // Primary user story
    stories.push({
      id: `US-${storyNum++}`,
      title: this.generateStoryTitle(featureRequest.description),
      description: `As a user, I want to ${featureRequest.description.toLowerCase()}, so that I can achieve my goal.`,
      acceptanceCriteria: this.generateAcceptanceCriteria(featureRequest, impactAnalysis),
      storyPoints: this.estimateStoryPoints(impactAnalysis),
      type: 'primary',
      priority: 'must_have',
    });

    // Database story if needed
    if (impactAnalysis.databaseTables.length > 0) {
      stories.push({
        id: `US-${storyNum++}`,
        title: 'Database Schema Implementation',
        description: 'As a developer, I need the database schema in place to support the feature.',
        acceptanceCriteria: [
          'Tables created with proper columns',
          'RLS policies configured',
          'Indexes added for performance',
          'Migration tested successfully',
        ],
        storyPoints: this.estimateComplexity('moderate'),
        type: 'technical',
        priority: 'must_have',
        dependencies: ['US-1'],
      });
    }

    // API story if needed
    if (impactAnalysis.apiEndpoints.length > 0) {
      stories.push({
        id: `US-${storyNum++}`,
        title: 'API Endpoints Implementation',
        description: 'As a frontend, I need API endpoints to interact with the feature.',
        acceptanceCriteria: [
          'All endpoints return correct responses',
          'Authentication/authorization verified',
          'Error handling implemented',
          'API documentation updated',
        ],
        storyPoints: this.estimateComplexity(
          impactAnalysis.apiEndpoints.length > 3 ? 'complex' : 'moderate'
        ),
        type: 'technical',
        priority: 'must_have',
        dependencies: impactAnalysis.databaseTables.length > 0 ? ['US-2'] : [],
      });
    }

    // UI story if files include components
    if (impactAnalysis.filesToCreate.some(f => f.path.includes('component'))) {
      stories.push({
        id: `US-${storyNum++}`,
        title: 'UI Components Implementation',
        description: 'As a user, I need a user interface to interact with the feature.',
        acceptanceCriteria: [
          'Components render correctly',
          'Responsive design implemented',
          'Accessibility requirements met',
          'Loading and error states handled',
        ],
        storyPoints: this.estimateComplexity('moderate'),
        type: 'primary',
        priority: 'must_have',
        dependencies: impactAnalysis.apiEndpoints.length > 0 ? [`US-${storyNum - 1}`] : [],
      });
    }

    // Testing story
    stories.push({
      id: `US-${storyNum++}`,
      title: 'Testing and Validation',
      description: 'As a QA, I need comprehensive tests to ensure quality.',
      acceptanceCriteria: [
        'Unit tests written (>80% coverage)',
        'Integration tests passing',
        'E2E tests for critical paths',
        'Manual testing completed',
      ],
      storyPoints: this.estimateComplexity('moderate'),
      type: 'technical',
      priority: 'should_have',
      dependencies: stories.map(s => s.id),
    });

    return stories.slice(0, this.options.maxUserStories);
  }

  /**
   * Generate acceptance criteria.
   */
  private generateAcceptanceCriteria(
    featureRequest: FeatureRequest,
    impactAnalysis: ImpactAnalysis
  ): string[] {
    const criteria: string[] = [
      'Feature works as described',
      'No regression in existing functionality',
    ];

    if (impactAnalysis.databaseTables.length > 0) {
      criteria.push('Data persists correctly');
    }

    if (impactAnalysis.apiEndpoints.length > 0) {
      criteria.push('API responses are correct');
    }

    if (impactAnalysis.riskLevel !== 'low') {
      criteria.push('Security requirements met');
    }

    return criteria;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Generate spec ID.
   */
  private generateSpecId(description: string): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const slug = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .slice(0, 4)
      .join('-');

    return `${date}-${slug}`;
  }

  /**
   * Generate spec title.
   */
  private generateTitle(description: string): string {
    // Capitalize first letter of each word
    return description
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .slice(0, 8)
      .join(' ');
  }

  /**
   * Generate user story title.
   */
  private generateStoryTitle(description: string): string {
    return description
      .split(' ')
      .slice(0, 6)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Estimate story points based on impact.
   */
  private estimateStoryPoints(impactAnalysis: ImpactAnalysis): number {
    let complexity: Complexity = 'simple';

    const fileCount = impactAnalysis.filesToCreate.length + impactAnalysis.filesToModify.length;

    if (fileCount > 10 || impactAnalysis.riskLevel === 'high') {
      complexity = 'very_complex';
    } else if (fileCount > 5 || impactAnalysis.riskLevel === 'medium') {
      complexity = 'complex';
    } else if (fileCount > 2) {
      complexity = 'moderate';
    }

    return STORY_POINT_MAP[complexity];
  }

  /**
   * Estimate complexity to story points.
   */
  private estimateComplexity(complexity: Complexity): number {
    return STORY_POINT_MAP[complexity];
  }

  /**
   * Suggest implementation phases.
   */
  private suggestImplementationPhases(
    impactAnalysis: ImpactAnalysis
  ): Array<{ name: string; tasks: string[] }> {
    const phases: Array<{ name: string; tasks: string[] }> = [];

    // Phase 1: Foundation
    const foundationTasks: string[] = [];
    if (impactAnalysis.dependencies.length > 0) {
      foundationTasks.push('Install required dependencies');
    }
    if (impactAnalysis.databaseTables.length > 0) {
      foundationTasks.push('Create database migrations');
      foundationTasks.push('Configure RLS policies');
    }
    if (foundationTasks.length > 0) {
      phases.push({ name: 'Foundation', tasks: foundationTasks });
    }

    // Phase 2: Backend
    if (impactAnalysis.apiEndpoints.length > 0) {
      phases.push({
        name: 'Backend',
        tasks: [
          'Implement API endpoints',
          'Add authentication/authorization',
          'Write unit tests for endpoints',
        ],
      });
    }

    // Phase 3: Frontend
    const frontendFiles = impactAnalysis.filesToCreate.filter(
      f => f.path.includes('component') || f.path.includes('page')
    );
    if (frontendFiles.length > 0) {
      phases.push({
        name: 'Frontend',
        tasks: [
          'Build UI components',
          'Integrate with API',
          'Add loading and error states',
          'Implement responsive design',
        ],
      });
    }

    // Phase 4: Testing & Polish
    phases.push({
      name: 'Testing & Polish',
      tasks: [
        'Write E2E tests',
        'Perform manual testing',
        'Fix bugs and issues',
        'Documentation',
      ],
    });

    return phases;
  }

  /**
   * Suggest mitigation strategies.
   */
  private suggestMitigationStrategies(impactAnalysis: ImpactAnalysis): string[] {
    const strategies: string[] = [];

    if (impactAnalysis.riskFactors.some(f => f.includes('Database'))) {
      strategies.push('Test migrations on staging before production');
      strategies.push('Create rollback migration script');
    }

    if (impactAnalysis.riskFactors.some(f => f.includes('Authentication'))) {
      strategies.push('Extensive auth flow testing');
      strategies.push('Security review before deployment');
    }

    if (impactAnalysis.riskFactors.some(f => f.includes('Payment'))) {
      strategies.push('Test with sandbox/test mode first');
      strategies.push('Implement comprehensive logging');
    }

    if (impactAnalysis.riskFactors.some(f => f.includes('file count'))) {
      strategies.push('Incremental implementation with code reviews');
      strategies.push('Feature flag for gradual rollout');
    }

    if (strategies.length === 0) {
      strategies.push('Standard code review process');
      strategies.push('Staging environment validation');
    }

    return strategies;
  }

  /**
   * Suggest unit tests.
   */
  private suggestUnitTests(impactAnalysis: ImpactAnalysis): string[] {
    const tests: string[] = [];

    for (const file of impactAnalysis.filesToCreate) {
      if (file.path.includes('service')) {
        tests.push(`Test ${file.path.split('/').pop()?.replace('.ts', '')} functions`);
      }
    }

    for (const endpoint of impactAnalysis.apiEndpoints) {
      tests.push(`Test ${endpoint.method} ${endpoint.path} handler`);
    }

    return tests.length > 0 ? tests : ['Test core business logic', 'Test utility functions'];
  }

  /**
   * Suggest integration tests.
   */
  private suggestIntegrationTests(impactAnalysis: ImpactAnalysis): string[] {
    const tests: string[] = [];

    if (impactAnalysis.databaseTables.length > 0) {
      tests.push('Test database operations');
      tests.push('Test RLS policies');
    }

    if (impactAnalysis.apiEndpoints.length > 0) {
      tests.push('Test API endpoint responses');
      tests.push('Test authentication flow');
    }

    return tests.length > 0 ? tests : ['Test system integration points'];
  }

  /**
   * Suggest E2E tests.
   */
  private suggestE2ETests(impactAnalysis: ImpactAnalysis): string[] {
    const tests: string[] = ['Test complete user flow'];

    if (impactAnalysis.apiEndpoints.some(e => e.method === 'POST')) {
      tests.push('Test form submission flow');
    }

    if (impactAnalysis.databaseTables.length > 0) {
      tests.push('Verify data persistence');
    }

    tests.push('Test error scenarios');

    return tests;
  }
}

// ============================================================================
// Exports
// ============================================================================

export default SpecGenerator;
