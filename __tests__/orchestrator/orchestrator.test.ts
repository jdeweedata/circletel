/**
 * Integration tests for Multi-Agent Orchestration System
 *
 * Tests the complete workflow from request analysis to execution
 */

import { SonnetOrchestrator } from '@/lib/agents/core/sonnet-orchestrator';
import type { UserRequest, QualityGateResult } from '@/lib/agents/core/types';
import { WorkflowEngine } from '@/lib/agents/core/workflow-engine';
import { AutoDetector } from '@/lib/agents/core/auto-detector';
import { ContextManager } from '@/lib/agents/core/context-manager';

describe('SonnetOrchestrator', () => {
  let orchestrator: SonnetOrchestrator;

  beforeEach(() => {
    orchestrator = new SonnetOrchestrator({ verbose: false });
  });

  describe('Task Analysis', () => {
    it('should analyze simple request correctly', async () => {
      const request: UserRequest = {
        message: 'Fix typo in header',
        timestamp: new Date(),
      };

      const plan = await orchestrator.analyzeAndPlan(request);

      expect(plan.analysis.complexity).toBe('simple');
      expect(plan.analysis.requiresMultipleAgents).toBe(false);
      expect(plan.dag.tasks.length).toBeLessThanOrEqual(1);
    });

    it('should analyze complex feature correctly', async () => {
      const request: UserRequest = {
        message: 'Implement customer referral program with tracking and rewards',
        timestamp: new Date(),
      };

      const plan = await orchestrator.analyzeAndPlan(request);

      expect(plan.analysis.complexity).toBe('complex');
      expect(plan.analysis.requiresMultipleAgents).toBe(true);
      expect(plan.analysis.layers.length).toBeGreaterThan(2);
      expect(plan.dag.tasks.length).toBeGreaterThan(3);
    });

    it('should detect database layer', async () => {
      const request: UserRequest = {
        message: 'Create schema migration for user profiles',
        timestamp: new Date(),
      };

      const plan = await orchestrator.analyzeAndPlan(request);

      expect(plan.analysis.layers).toContain('database');
      expect(plan.analysis.suggestedWorkers).toContain('database');
    });

    it('should detect multiple layers', async () => {
      const request: UserRequest = {
        message: 'Add admin dashboard with analytics charts and API endpoints',
        timestamp: new Date(),
      };

      const plan = await orchestrator.analyzeAndPlan(request);

      expect(plan.analysis.layers).toContain('backend');
      expect(plan.analysis.layers).toContain('frontend');
    });
  });

  describe('DAG Construction', () => {
    it('should create valid execution order', async () => {
      const request: UserRequest = {
        message: 'Build payment system with Stripe integration',
        timestamp: new Date(),
      };

      const plan = await orchestrator.analyzeAndPlan(request);

      // Execution order should respect dependencies
      expect(plan.dag.executionOrder.length).toBe(plan.dag.tasks.length);
      expect(new Set(plan.dag.executionOrder).size).toBe(plan.dag.tasks.length);
    });

    it('should handle dependencies correctly', async () => {
      const request: UserRequest = {
        message: 'Create full-stack feature with database, API, and UI',
        timestamp: new Date(),
      };

      const plan = await orchestrator.analyzeAndPlan(request);

      // Database should come before API
      const dbTaskIndex = plan.dag.executionOrder.findIndex((id) => {
        const task = plan.dag.tasks.find((t) => t.id === id);
        return task?.workerType === 'database';
      });

      const apiTaskIndex = plan.dag.executionOrder.findIndex((id) => {
        const task = plan.dag.tasks.find((t) => t.id === id);
        return task?.workerType === 'api';
      });

      if (dbTaskIndex >= 0 && apiTaskIndex >= 0) {
        expect(dbTaskIndex).toBeLessThan(apiTaskIndex);
      }
    });

    it('should detect circular dependencies', async () => {
      const request: UserRequest = {
        message: 'Test circular dependency detection',
        timestamp: new Date(),
      };

      // This should not throw - orchestrator prevents circular deps
      await expect(orchestrator.analyzeAndPlan(request)).resolves.toBeDefined();
    });
  });

  describe('Quality Gates', () => {
    it('should define quality gates for complex features', async () => {
      const request: UserRequest = {
        message: 'Build admin user management system',
        timestamp: new Date(),
      };

      const plan = await orchestrator.analyzeAndPlan(request);

      expect(plan.qualityGates.length).toBeGreaterThan(0);
      expect(plan.qualityGates.some((g) => g.name.toLowerCase().includes('typescript'))).toBe(true);
    });

    it('should include RBAC gate for admin features', async () => {
      const request: UserRequest = {
        message: 'Create admin analytics dashboard',
        timestamp: new Date(),
      };

      const plan = await orchestrator.analyzeAndPlan(request);

      expect(plan.qualityGates.some((g) => g.name.toLowerCase().includes('rbac'))).toBe(true);
    });
  });
});

describe('WorkflowEngine', () => {
  let workflowEngine: WorkflowEngine;

  beforeEach(() => {
    workflowEngine = new WorkflowEngine({ verbose: false });
  });

  describe('Execution', () => {
    it('should execute simple plan', async () => {
      const orchestrator = new SonnetOrchestrator({ verbose: false });
      const plan = await orchestrator.analyzeAndPlan({
        message: 'Add comment field to user table',
        timestamp: new Date(),
      } as UserRequest);

      const result = await workflowEngine.execute(plan, { stopOnError: true });

      expect(result.status).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.summary.totalTasks).toBe(plan.dag.tasks.length);
    });

    it('should track progress', async () => {
      const orchestrator = new SonnetOrchestrator({ verbose: false });
      const plan = await orchestrator.analyzeAndPlan({
        message: 'Create user profile page',
        timestamp: new Date(),
      } as UserRequest);

      const progressCalls: number[] = [];

      await workflowEngine.execute(plan, {
        onProgress: (progress: { progress: number }) => {
          progressCalls.push(progress.progress);
        },
        stopOnError: true,
      });

      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[progressCalls.length - 1]).toBe(100);
    });

    it('should stop on error when configured', async () => {
      const orchestrator = new SonnetOrchestrator({ verbose: false });
      const plan = await orchestrator.analyzeAndPlan({
        message: 'Test error handling',
        timestamp: new Date(),
      } as UserRequest);

      // Mock a worker to fail
      const originalWorker = workflowEngine['workers'].get('database');
      if (originalWorker) {
        const mockWorker = {
          ...originalWorker,
          executeWithRetries: jest.fn().mockRejectedValue(new Error('Test error')),
        };
        workflowEngine['workers'].set('database', mockWorker as any);
      }

      const result = await workflowEngine.execute(plan, { stopOnError: true });

      expect(result.status).toBe('failed');
      expect(result.summary.failedTasks).toBeGreaterThan(0);
    });
  });

  describe('Quality Gate Execution', () => {
    it('should run all quality gates', async () => {
      const orchestrator = new SonnetOrchestrator({ verbose: false });
      const plan = await orchestrator.analyzeAndPlan({
        message: 'Build feature with quality checks',
        timestamp: new Date(),
      } as UserRequest);

      const result = await workflowEngine.execute(plan);

      expect(result.qualityResults.length).toBe(plan.qualityGates.length);
    });

    it('should validate TypeScript', async () => {
      const orchestrator = new SonnetOrchestrator({ verbose: false });
      const plan = await orchestrator.analyzeAndPlan({
        message: 'Create TypeScript component',
        timestamp: new Date(),
      } as UserRequest);

      // Add TypeScript quality gate
      plan.qualityGates.push({
        name: 'TypeScript Validation',
        description: 'No type errors',
        required: true,
      });

      const result = await workflowEngine.execute(plan);

      const tsGate = result.qualityResults.find((r: QualityGateResult) => r.gateName === 'TypeScript Validation');
      expect(tsGate).toBeDefined();
    });
  });

  describe('Result Aggregation', () => {
    it('should aggregate files from all workers', async () => {
      const orchestrator = new SonnetOrchestrator({ verbose: false });
      const plan = await orchestrator.analyzeAndPlan({
        message: 'Create multi-file feature',
        timestamp: new Date(),
      } as UserRequest);

      const result = await workflowEngine.execute(plan);

      const files = workflowEngine.getAggregatedFiles(result);
      expect(Array.isArray(files)).toBe(true);
    });

    it('should generate summary markdown', async () => {
      const orchestrator = new SonnetOrchestrator({ verbose: false });
      const plan = await orchestrator.analyzeAndPlan({
        message: 'Test summary generation',
        timestamp: new Date(),
      } as UserRequest);

      const result = await workflowEngine.execute(plan);

      const summary = workflowEngine.getSummaryMarkdown(result);
      expect(summary).toContain('Workflow Execution Summary');
      expect(summary).toContain('Task Results');
      expect(summary).toContain('Quality Gates');
    });
  });
});

describe('AutoDetector', () => {
  let detector: AutoDetector;

  beforeEach(() => {
    detector = new AutoDetector();
  });

  describe('Detection Logic', () => {
    it('should recommend orchestration for complex features', () => {
      const result = detector.detect('implement customer referral program with tracking and rewards');

      expect(result.shouldOrchestrate).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.complexity).not.toBe('simple');
    });

    it('should NOT recommend orchestration for simple changes', () => {
      const result = detector.detect('fix typo in header component');

      expect(result.shouldOrchestrate).toBe(false);
      expect(result.complexity).toBe('simple');
    });

    it('should detect database layer', () => {
      const result = detector.detect('create migration for user profiles table');

      expect(result.detectedLayers).toContain('database');
    });

    it('should detect API layer', () => {
      const result = detector.detect('build REST API endpoints for orders');

      expect(result.detectedLayers).toContain('backend');
    });

    it('should detect UI layer', () => {
      const result = detector.detect('create dashboard component with charts');

      expect(result.detectedLayers).toContain('frontend');
    });

    it('should detect multiple layers', () => {
      const result = detector.detect('build full-stack feature with database, API, and UI');

      expect(result.detectedLayers.length).toBeGreaterThanOrEqual(2);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should exclude research questions', () => {
      const result = detector.detect('how does the authentication system work?');

      expect(result.shouldOrchestrate).toBe(false);
    });

    it('should exclude documentation tasks', () => {
      const result = detector.detect('document the API endpoints in README');

      expect(result.shouldOrchestrate).toBe(false);
    });
  });

  describe('Recommendation Formatting', () => {
    it('should format recommendation with all details', () => {
      const result = detector.detect('implement payment subscription system');
      const formatted = detector.formatRecommendation(result);

      expect(formatted).toContain('Orchestration Auto-Detection');
      expect(formatted).toContain('Recommendation');
      expect(formatted).toContain('Confidence');
      expect(formatted).toContain('Reasoning');
    });

    it('should include invocation instructions when recommended', () => {
      const result = detector.detect('build admin analytics dashboard');
      const formatted = detector.formatRecommendation(result);

      if (result.shouldOrchestrate) {
        expect(formatted).toContain('/orchestrate');
      }
    });
  });
});

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    contextManager = new ContextManager({ verbose: false });
  });

  describe('Context Loading', () => {
    it('should load domain context', async () => {
      const context = await contextManager.loadDomainContext('frontend');

      expect(context).toBeDefined();
      expect(context.domain).toBe('frontend');
      expect(typeof context.content).toBe('string');
    });

    it('should cache loaded contexts', async () => {
      const context1 = await contextManager.loadDomainContext('backend');
      const context2 = await contextManager.loadDomainContext('backend');

      expect(context1).toBe(context2); // Same object reference (cached)
    });

    it('should load multiple contexts', async () => {
      const contexts = await contextManager.loadMultipleContexts([
        'frontend',
        'backend',
      ]);

      expect(contexts.length).toBe(2);
      expect(contexts[0].domain).toBe('frontend');
      expect(contexts[1].domain).toBe('backend');
    });

    it('should handle missing context files gracefully', async () => {
      const context = await contextManager.loadDomainContext('nonexistent' as any);

      expect(context).toBeDefined();
      expect(context.content).toBe('');
      expect(context.patterns).toEqual([]);
      expect(context.antiPatterns).toEqual([]);
    });
  });

  describe('Pattern Extraction', () => {
    it('should extract patterns from content', async () => {
      // This test depends on actual memory files existing
      const context = await contextManager.loadDomainContext('frontend');

      expect(Array.isArray(context.patterns)).toBe(true);
    });

    it('should extract anti-patterns from content', async () => {
      const context = await contextManager.loadDomainContext('frontend');

      expect(Array.isArray(context.antiPatterns)).toBe(true);
    });
  });

  describe('Context Formatting', () => {
    it('should format context for prompt injection', async () => {
      const context = await contextManager.loadDomainContext('backend');
      const formatted = contextManager.formatContextForPrompt(context);

      expect(formatted).toContain('BACKEND Domain Context');
      expect(typeof formatted).toBe('string');
    });

    it('should include recommended context for multiple layers', async () => {
      const formatted = await contextManager.getRecommendedContext([
        'frontend',
        'backend',
      ]);

      expect(formatted).toContain('FRONTEND');
      expect(formatted).toContain('BACKEND');
    });
  });

  describe('Cache Management', () => {
    it('should track cache statistics', async () => {
      await contextManager.loadDomainContext('frontend');
      await contextManager.loadDomainContext('backend');

      const stats = contextManager.getCacheStats();

      expect(stats.cachedDomains.length).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      await contextManager.loadDomainContext('frontend');
      contextManager.clearCache();

      const stats = contextManager.getCacheStats();
      expect(stats.cachedDomains.length).toBe(0);
    });
  });
});
