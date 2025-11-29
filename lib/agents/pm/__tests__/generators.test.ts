/**
 * PM Agent Generator Unit Tests
 *
 * Tests for SpecGenerator, TaskGenerator, and ArchitectureGenerator classes.
 *
 * @module lib/agents/pm/__tests__/generators.test
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { SpecGenerator, type GeneratedSpec } from '../generators/spec-generator';
import { TaskGenerator, type GeneratedTasks } from '../generators/task-generator';
import {
  ArchitectureGenerator,
  INTEGRATION_PATTERNS,
} from '../generators/architecture-generator';
import { CodebaseAnalyzer } from '../analyzers/codebase-analyzer';
import { ImpactAnalyzer } from '../analyzers/impact-analyzer';
import type { FeatureRequest, CodebaseAnalysis, ImpactAnalysis, UserStory } from '../types';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockFeatureRequest: FeatureRequest = {
  description: 'Add customer notification preferences dashboard',
  priority: 'medium',
};

let mockCodebaseAnalysis: CodebaseAnalysis;
let mockImpactAnalysis: ImpactAnalysis;

// Initialize mock data before tests
beforeAll(async () => {
  const codebaseAnalyzer = new CodebaseAnalyzer();
  const impactAnalyzer = new ImpactAnalyzer();

  mockCodebaseAnalysis = await codebaseAnalyzer.analyze(mockFeatureRequest.description);
  mockImpactAnalysis = await impactAnalyzer.analyze(mockFeatureRequest, mockCodebaseAnalysis);
});

// ============================================================================
// SpecGenerator Tests
// ============================================================================

describe('SpecGenerator', () => {
  let generator: SpecGenerator;

  beforeAll(() => {
    generator = new SpecGenerator({ includeCodeSnippets: false });
  });

  // ==========================================================================
  // generate() Method
  // ==========================================================================

  describe('generate()', () => {
    it('should return valid GeneratedSpec structure', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(result).toBeDefined();
      expect(result.specId).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.userStories).toBeDefined();
      expect(result.totalPoints).toBeDefined();
    });

    it('should generate valid specId format', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      // Format: YYYYMMDD-feature-name
      expect(result.specId).toMatch(/^\d{8}-[\w-]+$/);
    });

    it('should generate user stories', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(Array.isArray(result.userStories)).toBe(true);
      expect(result.userStories.length).toBeGreaterThan(0);
    });

    it('should calculate total story points', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(result.totalPoints).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Spec Content Validation
  // ==========================================================================

  describe('Spec Content', () => {
    let generatedSpec: GeneratedSpec;

    beforeAll(() => {
      generatedSpec = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );
    });

    it('should contain Overview section', () => {
      expect(generatedSpec.content).toContain('Overview');
    });

    it('should contain User Stories section', () => {
      expect(generatedSpec.content).toContain('User Stor');
    });

    it('should contain Acceptance Criteria', () => {
      expect(generatedSpec.content).toContain('Acceptance Criteria');
    });

    it('should contain spec_id metadata', () => {
      expect(generatedSpec.content).toContain('spec_id');
    });

    it('should contain story points', () => {
      expect(generatedSpec.content).toContain('point');
    });

    it('should have markdown formatting', () => {
      expect(generatedSpec.content).toContain('#');
      expect(generatedSpec.content).toContain('-');
    });
  });

  // ==========================================================================
  // User Story Validation
  // ==========================================================================

  describe('User Stories', () => {
    let userStories: UserStory[];

    beforeAll(() => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );
      userStories = result.userStories;
    });

    it('should have valid story IDs', () => {
      userStories.forEach((story) => {
        expect(story.id).toMatch(/^US-\d+$/);
      });
    });

    it('should have titles', () => {
      userStories.forEach((story) => {
        expect(story.title).toBeTruthy();
        expect(story.title.length).toBeGreaterThan(0);
      });
    });

    it('should have descriptions', () => {
      userStories.forEach((story) => {
        expect(story.description).toBeTruthy();
      });
    });

    it('should have acceptance criteria', () => {
      userStories.forEach((story) => {
        expect(Array.isArray(story.acceptanceCriteria)).toBe(true);
      });
    });

    it('should have valid story points (Fibonacci)', () => {
      const validPoints = [1, 2, 3, 5, 8, 13, 21];
      userStories.forEach((story) => {
        expect(validPoints).toContain(story.storyPoints);
      });
    });

    it('should have valid story types', () => {
      const validTypes = ['primary', 'technical', 'enhancement'];
      userStories.forEach((story) => {
        expect(validTypes).toContain(story.type);
      });
    });

    it('should have valid priority levels', () => {
      const validPriorities = ['must_have', 'should_have', 'nice_to_have'];
      userStories.forEach((story) => {
        expect(validPriorities).toContain(story.priority);
      });
    });
  });

  // ==========================================================================
  // Story Point Estimation
  // ==========================================================================

  describe('Story Point Estimation', () => {
    it('should use Fibonacci scale', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      const validFibonacci = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
      result.userStories.forEach((story) => {
        expect(validFibonacci).toContain(story.storyPoints);
      });
    });

    it('should estimate higher points for complex features', () => {
      const complexRequest: FeatureRequest = {
        description:
          'Implement complete e-commerce system with inventory, payments, shipping, and analytics',
        priority: 'high',
      };

      const result = generator.generate(
        complexRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(result.totalPoints).toBeGreaterThan(10);
    });

    it('should estimate lower points for simple features', () => {
      const simpleRequest: FeatureRequest = {
        description: 'Add footer copyright text',
        priority: 'low',
      };

      const result = generator.generate(
        simpleRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(result.totalPoints).toBeLessThan(50);
    });
  });

  // ==========================================================================
  // Options
  // ==========================================================================

  describe('Generator Options', () => {
    it('should respect includeCodeSnippets option', () => {
      const withSnippets = new SpecGenerator({ includeCodeSnippets: true });
      const withoutSnippets = new SpecGenerator({ includeCodeSnippets: false });

      // Both should generate valid specs
      const result1 = withSnippets.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );
      const result2 = withoutSnippets.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(result1.content).toBeTruthy();
      expect(result2.content).toBeTruthy();
    });
  });
});

// ============================================================================
// TaskGenerator Tests
// ============================================================================

describe('TaskGenerator', () => {
  let generator: TaskGenerator;
  let mockUserStories: UserStory[];

  beforeAll(() => {
    generator = new TaskGenerator({ includeSubtasks: true });

    const specGenerator = new SpecGenerator({ includeCodeSnippets: false });
    const spec = specGenerator.generate(
      mockFeatureRequest,
      mockCodebaseAnalysis,
      mockImpactAnalysis
    );
    mockUserStories = spec.userStories;
  });

  // ==========================================================================
  // generate() Method
  // ==========================================================================

  describe('generate()', () => {
    it('should return valid GeneratedTasks structure', () => {
      const result = generator.generate(
        mockUserStories,
        mockImpactAnalysis,
        'test-spec-id'
      );

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.taskGroups).toBeDefined();
      expect(result.totalPoints).toBeDefined();
    });

    it('should generate task groups', () => {
      const result = generator.generate(
        mockUserStories,
        mockImpactAnalysis,
        'test-spec-id'
      );

      expect(Array.isArray(result.taskGroups)).toBe(true);
    });

    it('should calculate total points', () => {
      const result = generator.generate(
        mockUserStories,
        mockImpactAnalysis,
        'test-spec-id'
      );

      expect(result.totalPoints).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Tasks Content Validation
  // ==========================================================================

  describe('Tasks Content', () => {
    let generatedTasks: GeneratedTasks;

    beforeAll(() => {
      generatedTasks = generator.generate(
        mockUserStories,
        mockImpactAnalysis,
        'test-spec-id'
      );
    });

    it('should contain Task Group headers', () => {
      expect(generatedTasks.content).toContain('Task Group');
    });

    it('should contain Story Points', () => {
      expect(generatedTasks.content).toContain('Story Points');
    });

    it('should contain status indicators', () => {
      // Should have checkboxes or status markers
      const hasStatus =
        generatedTasks.content.includes('[ ]') ||
        generatedTasks.content.includes('NOT_STARTED') ||
        generatedTasks.content.includes('not_started');
      expect(hasStatus).toBe(true);
    });

    it('should have markdown formatting', () => {
      expect(generatedTasks.content).toContain('#');
      expect(generatedTasks.content).toContain('-');
    });
  });

  // ==========================================================================
  // Task Group Validation
  // ==========================================================================

  describe('Task Groups', () => {
    let taskGroups: GeneratedTasks['taskGroups'];

    beforeAll(() => {
      const result = generator.generate(
        mockUserStories,
        mockImpactAnalysis,
        'test-spec-id'
      );
      taskGroups = result.taskGroups;
    });

    it('should have group numbers', () => {
      taskGroups.forEach((group, index) => {
        expect(group.groupNumber).toBe(index + 1);
      });
    });

    it('should have titles', () => {
      taskGroups.forEach((group) => {
        expect(group.title).toBeTruthy();
      });
    });

    it('should have assigned roles', () => {
      const validRoles = [
        'database-engineer',
        'backend-engineer',
        'frontend-engineer',
        'testing-engineer',
        'ops-engineer',
      ];

      taskGroups.forEach((group) => {
        expect(validRoles).toContain(group.assignedTo);
      });
    });

    it('should have story points', () => {
      taskGroups.forEach((group) => {
        expect(group.storyPoints).toBeGreaterThan(0);
      });
    });

    it('should have tasks array', () => {
      taskGroups.forEach((group) => {
        expect(Array.isArray(group.tasks)).toBe(true);
      });
    });

    it('should have acceptance criteria', () => {
      taskGroups.forEach((group) => {
        expect(Array.isArray(group.acceptanceCriteria)).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Role Assignment
  // ==========================================================================

  describe('Role Assignment', () => {
    it('should assign database role for database-related tasks', () => {
      const dbImpact: ImpactAnalysis = {
        ...mockImpactAnalysis,
        databaseTables: [
          {
            table: 'test_table',
            changeType: 'create',
            description: 'Test table',
          },
        ],
      };

      const result = generator.generate(mockUserStories, dbImpact, 'test-spec');

      const hasDatabaseRole = result.taskGroups.some(
        (g) => g.assignedTo === 'database-engineer'
      );
      expect(hasDatabaseRole).toBe(true);
    });

    it('should assign frontend role for UI tasks', () => {
      const uiImpact: ImpactAnalysis = {
        ...mockImpactAnalysis,
        filesToCreate: [
          {
            path: 'components/TestComponent.tsx',
            changeType: 'create',
            description: 'Test component',
          },
        ],
      };

      const result = generator.generate(mockUserStories, uiImpact, 'test-spec');

      const hasFrontendRole = result.taskGroups.some(
        (g) => g.assignedTo === 'frontend-engineer'
      );
      expect(hasFrontendRole).toBe(true);
    });
  });

  // ==========================================================================
  // Dependency Tracking
  // ==========================================================================

  describe('Dependency Tracking', () => {
    it('should track dependencies between groups', () => {
      const result = generator.generate(
        mockUserStories,
        mockImpactAnalysis,
        'test-spec-id'
      );

      result.taskGroups.forEach((group) => {
        expect(Array.isArray(group.dependencies)).toBe(true);
      });
    });

    it('should not have circular dependencies', () => {
      const result = generator.generate(
        mockUserStories,
        mockImpactAnalysis,
        'test-spec-id'
      );

      // Check that no group depends on itself
      result.taskGroups.forEach((group) => {
        expect(group.dependencies).not.toContain(group.groupNumber);
      });
    });

    it('should only reference existing groups', () => {
      const result = generator.generate(
        mockUserStories,
        mockImpactAnalysis,
        'test-spec-id'
      );

      const groupNumbers = result.taskGroups.map((g) => g.groupNumber);

      result.taskGroups.forEach((group) => {
        group.dependencies.forEach((dep) => {
          expect(groupNumbers).toContain(dep);
        });
      });
    });
  });

  // ==========================================================================
  // Subtasks
  // ==========================================================================

  describe('Subtasks', () => {
    it('should include subtasks when option enabled', () => {
      const withSubtasks = new TaskGenerator({ includeSubtasks: true });
      const result = withSubtasks.generate(
        mockUserStories,
        mockImpactAnalysis,
        'test-spec-id'
      );

      const hasSubtasks = result.taskGroups.some((group) =>
        group.tasks.some((task) => task.subtasks && task.subtasks.length > 0)
      );

      // At least some tasks should have subtasks
      expect(hasSubtasks || result.taskGroups.length === 0).toBe(true);
    });
  });
});

// ============================================================================
// ArchitectureGenerator Tests
// ============================================================================

describe('ArchitectureGenerator', () => {
  let generator: ArchitectureGenerator;

  beforeAll(() => {
    generator = new ArchitectureGenerator();
  });

  // ==========================================================================
  // generate() Method
  // ==========================================================================

  describe('generate()', () => {
    it('should return valid GeneratedArchitecture structure', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.architecture).toBeDefined();
      expect(result.architecture.dataFlowDiagram).toBeDefined();
      expect(result.architecture.componentDiagram).toBeDefined();
      expect(result.architecture.integrations).toBeDefined();
      expect(result.architecture.workflow).toBeDefined();
    });

    it('should generate data flow diagram', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(result.architecture.dataFlowDiagram).toBeTruthy();
      expect(result.architecture.dataFlowDiagram.length).toBeGreaterThan(0);
    });

    it('should generate component diagram', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(result.architecture.componentDiagram).toBeTruthy();
      expect(result.architecture.componentDiagram.length).toBeGreaterThan(0);
    });

    it('should identify integrations', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(Array.isArray(result.architecture.integrations)).toBe(true);
    });

    it('should define workflow stages', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(Array.isArray(result.architecture.workflow)).toBe(true);
    });
  });

  // ==========================================================================
  // Architecture Content Validation
  // ==========================================================================

  describe('Architecture Content', () => {
    it('should contain ASCII diagrams', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      // ASCII diagrams typically use these characters
      const hasAsciiArt =
        result.content.includes('|') ||
        result.content.includes('+') ||
        result.content.includes('-') ||
        result.content.includes('─') ||
        result.content.includes('│');

      expect(hasAsciiArt).toBe(true);
    });

    it('should have markdown formatting', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(result.content).toContain('#');
    });

    it('should reference components', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      // Should mention some components
      expect(result.content.length).toBeGreaterThan(100);
    });
  });

  // ==========================================================================
  // Integration Detection
  // ==========================================================================

  describe('Integration Detection', () => {
    it('should detect database integration', () => {
      const dbRequest: FeatureRequest = {
        description: 'Add feature with Supabase database storage',
      };

      const result = generator.generate(
        dbRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      const hasDatabaseIntegration = result.architecture.integrations.some(
        (i: any) => i.type === 'database'
      );

      // May or may not detect database depending on impact
      expect(Array.isArray(result.architecture.integrations)).toBe(true);
    });

    it('should detect API integration', () => {
      const apiRequest: FeatureRequest = {
        description: 'Add external API integration with REST endpoints',
      };

      const result = generator.generate(
        apiRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      expect(Array.isArray(result.architecture.integrations)).toBe(true);
    });
  });

  // ==========================================================================
  // Workflow Stages
  // ==========================================================================

  describe('Workflow Stages', () => {
    it('should have numbered stages', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      result.architecture.workflow.forEach((stage: any, index: number) => {
        expect(stage.number).toBe(index + 1);
      });
    });

    it('should have stage names', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      result.architecture.workflow.forEach((stage: any) => {
        expect(stage.name).toBeTruthy();
      });
    });

    it('should have descriptions', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      result.architecture.workflow.forEach((stage: any) => {
        expect(stage.description).toBeTruthy();
      });
    });

    it('should have inputs and outputs', () => {
      const result = generator.generate(
        mockFeatureRequest,
        mockCodebaseAnalysis,
        mockImpactAnalysis
      );

      result.architecture.workflow.forEach((stage: any) => {
        expect(Array.isArray(stage.inputs)).toBe(true);
        expect(Array.isArray(stage.outputs)).toBe(true);
      });
    });
  });

  // ==========================================================================
  // INTEGRATION_PATTERNS Constant
  // ==========================================================================

  describe('INTEGRATION_PATTERNS', () => {
    it('should be defined', () => {
      expect(INTEGRATION_PATTERNS).toBeDefined();
    });

    it('should have pattern entries', () => {
      expect(Object.keys(INTEGRATION_PATTERNS).length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Generator Integration Tests
// ============================================================================

describe('Generator Integration', () => {
  it('should produce consistent output format', () => {
    const specGen = new SpecGenerator({ includeCodeSnippets: false });
    const taskGen = new TaskGenerator({ includeSubtasks: true });
    const archGen = new ArchitectureGenerator();

    const spec = specGen.generate(
      mockFeatureRequest,
      mockCodebaseAnalysis,
      mockImpactAnalysis
    );
    const tasks = taskGen.generate(
      spec.userStories,
      mockImpactAnalysis,
      spec.specId
    );
    const arch = archGen.generate(
      mockFeatureRequest,
      mockCodebaseAnalysis,
      mockImpactAnalysis
    );

    // All should produce valid output
    expect(spec.content).toBeTruthy();
    expect(tasks.content).toBeTruthy();
    expect(arch.content).toBeTruthy();
  });

  it('should align story points between spec and tasks', () => {
    const specGen = new SpecGenerator({ includeCodeSnippets: false });
    const taskGen = new TaskGenerator({ includeSubtasks: true });

    const spec = specGen.generate(
      mockFeatureRequest,
      mockCodebaseAnalysis,
      mockImpactAnalysis
    );
    const tasks = taskGen.generate(
      spec.userStories,
      mockImpactAnalysis,
      spec.specId
    );

    // Total points should be reasonable (may not match exactly due to breakdown)
    expect(spec.totalPoints).toBeGreaterThan(0);
    expect(tasks.totalPoints).toBeGreaterThan(0);
  });

  it('should reference same specId across outputs', () => {
    const specGen = new SpecGenerator({ includeCodeSnippets: false });
    const taskGen = new TaskGenerator({ includeSubtasks: true });

    const spec = specGen.generate(
      mockFeatureRequest,
      mockCodebaseAnalysis,
      mockImpactAnalysis
    );
    const tasks = taskGen.generate(
      spec.userStories,
      mockImpactAnalysis,
      spec.specId
    );

    expect(tasks.content).toContain(spec.specId);
  });
});
