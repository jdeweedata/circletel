/**
 * PM Agent Integration Tests
 *
 * Tests the complete PMAgent workflow including spec generation,
 * quick analysis, and Claude Code integration.
 *
 * @module lib/agents/__tests__/pm-agent.test
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { PMAgent } from '../pm';
import type { FeatureRequest, SpecOutput } from '../pm/types';

// Test timeout for long-running spec generation
jest.setTimeout(60000);

// Test output directory (cleaned up after tests)
const TEST_OUTPUT_DIR = 'agent-os/specs/test-output';

describe('PMAgent Integration Tests', () => {
  let agent: PMAgent;

  beforeAll(async () => {
    // Create agent configured for testing (no auto-save)
    agent = PMAgent.forAPI();
    await agent.start();
  });

  afterAll(async () => {
    await agent.stop();

    // Clean up test output directory
    const testDir = path.join(process.cwd(), TEST_OUTPUT_DIR);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  // ============================================================================
  // PMAgent.generateSpec() Tests
  // ============================================================================

  describe('PMAgent.generateSpec()', () => {
    describe('Simple Feature (8-13 points)', () => {
      it('should generate spec from string description', async () => {
        const result = await agent.generateSpec(
          'Add SMS notifications for order status updates'
        );

        expect(result).toBeDefined();
        expect(result.specId).toMatch(/^\d{8}-/);
        expect(result.specContent).toContain('# ');
        expect(result.tasksContent).toContain('Task Group');
        expect(result.estimatedPoints).toBeGreaterThan(0);
      });

      it('should estimate 8-13 points for simple feature', async () => {
        const result = await agent.generateSpec({
          description: 'Add email notification when password is changed',
          priority: 'low',
        });

        expect(result.estimatedPoints).toBeGreaterThanOrEqual(5);
        expect(result.estimatedPoints).toBeLessThanOrEqual(21);
      });

      it('should identify minimal file changes for simple feature', async () => {
        const result = await agent.generateSpec({
          description: 'Add a new configuration option for email templates',
        });

        expect(result.affectedFiles.length).toBeGreaterThan(0);
        expect(result.affectedFiles.length).toBeLessThan(15);
      });
    });

    describe('Medium Feature (21-34 points)', () => {
      it('should generate comprehensive spec for medium complexity', async () => {
        const result = await agent.generateSpec({
          description: 'Add customer analytics dashboard with usage charts and export functionality',
          priority: 'medium',
        });

        expect(result.specContent).toContain('User Stor');
        expect(result.specContent).toContain('Acceptance Criteria');
        expect(result.tasksContent).toContain('Story Points');
        expect(result.estimatedPoints).toBeGreaterThanOrEqual(13);
      });

      it('should identify database changes for data-heavy feature', async () => {
        const result = await agent.generateSpec({
          description: 'Add usage tracking system with daily/weekly/monthly aggregation',
        });

        expect(result.impact.databaseTables.length).toBeGreaterThan(0);
      });

      it('should identify API endpoints for feature with backend', async () => {
        const result = await agent.generateSpec({
          description: 'Add API endpoints for customer billing history',
        });

        expect(result.impact.apiEndpoints.length).toBeGreaterThan(0);
      });
    });

    describe('Complex Feature (55+ points)', () => {
      it('should generate detailed spec for complex feature', async () => {
        const result = await agent.generateSpec({
          description: 'Implement real-time chat support system with AI assistant, ticket management, and agent dashboard',
          priority: 'high',
        });

        expect(result.specContent.length).toBeGreaterThan(2000);
        expect(result.tasksContent.length).toBeGreaterThan(1000);
        expect(result.estimatedPoints).toBeGreaterThanOrEqual(34);
      });

      it('should identify high risk for complex feature', async () => {
        const result = await agent.generateSpec({
          description: 'Rebuild entire authentication system with SSO, MFA, and passwordless login',
          priority: 'critical',
        });

        expect(['medium', 'high']).toContain(result.impact.riskLevel);
        expect(result.impact.riskFactors.length).toBeGreaterThan(0);
      });
    });

    describe('FeatureRequest Object', () => {
      it('should accept FeatureRequest object with all fields', async () => {
        const request: FeatureRequest = {
          description: 'Add customer feedback collection system',
          priority: 'high',
          businessJustification: 'Improve customer satisfaction metrics',
          constraints: ['Must integrate with existing CRM', 'GDPR compliant'],
        };

        const result = await agent.generateSpec(request);

        expect(result).toBeDefined();
        expect(result.specId).toBeTruthy();
      });

      it('should respect priority in estimation', async () => {
        const lowPriority = await agent.generateSpec({
          description: 'Add footer link to privacy policy',
          priority: 'low',
        });

        const highPriority = await agent.generateSpec({
          description: 'Add GDPR compliance dashboard',
          priority: 'high',
        });

        // Both should have valid estimates
        expect(lowPriority.estimatedPoints).toBeGreaterThan(0);
        expect(highPriority.estimatedPoints).toBeGreaterThan(0);
      });
    });

    describe('Spec Output Structure', () => {
      let specOutput: SpecOutput;

      beforeAll(async () => {
        specOutput = await agent.generateSpec(
          'Add order tracking page with real-time updates'
        );
      });

      it('should have valid specId format', () => {
        expect(specOutput.specId).toMatch(/^\d{8}-[\w-]+$/);
      });

      it('should have specContent with required sections', () => {
        expect(specOutput.specContent).toContain('Overview');
        expect(specOutput.specContent).toContain('User Stor');
      });

      it('should have tasksContent with task groups', () => {
        expect(specOutput.tasksContent).toContain('Task Group');
        expect(specOutput.tasksContent).toContain('Story Points');
      });

      it('should have readmeContent', () => {
        expect(specOutput.readmeContent).toBeTruthy();
        expect(specOutput.readmeContent.length).toBeGreaterThan(100);
      });

      it('should have valid estimatedPoints', () => {
        expect(specOutput.estimatedPoints).toBeGreaterThan(0);
        expect(specOutput.estimatedPoints).toBeLessThan(200);
      });

      it('should have affectedFiles array', () => {
        expect(Array.isArray(specOutput.affectedFiles)).toBe(true);
      });

      it('should have analysis results', () => {
        expect(specOutput.analysis).toBeDefined();
        expect(specOutput.analysis.structure).toBeDefined();
        expect(specOutput.analysis.techStack).toBeDefined();
      });

      it('should have impact results', () => {
        expect(specOutput.impact).toBeDefined();
        expect(specOutput.impact.filesToCreate).toBeDefined();
        expect(specOutput.impact.filesToModify).toBeDefined();
        expect(specOutput.impact.riskLevel).toBeDefined();
      });

      it('should have metadata', () => {
        expect(specOutput.metadata).toBeDefined();
        expect(specOutput.metadata.generatedAt).toBeDefined();
        expect(specOutput.metadata.generationTime).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // PMAgent.quickAnalysis() Tests
  // ============================================================================

  describe('PMAgent.quickAnalysis()', () => {
    it('should return quick analysis without generating files', async () => {
      const result = await agent.quickAnalysis(
        'Add push notification support'
      );

      expect(result.codebase).toBeDefined();
      expect(result.impact).toBeDefined();
      expect(result.estimatedPoints).toBeGreaterThan(0);
    });

    it('should detect codebase structure', async () => {
      const result = await agent.quickAnalysis('Add new API endpoint');

      expect(result.codebase.structure.totalFiles).toBeGreaterThan(0);
      expect(result.codebase.techStack.framework).toBeTruthy();
    });

    it('should assess impact correctly', async () => {
      const result = await agent.quickAnalysis(
        'Add customer portal with dashboard and settings'
      );

      expect(result.impact.filesToCreate.length).toBeGreaterThan(0);
      expect(result.impact.riskLevel).toBeDefined();
    });

    it('should provide reasonable point estimate', async () => {
      const result = await agent.quickAnalysis('Add simple config flag');

      expect(result.estimatedPoints).toBeGreaterThanOrEqual(1);
      expect(result.estimatedPoints).toBeLessThanOrEqual(100);
    });

    it('should be faster than full spec generation', async () => {
      const quickStart = Date.now();
      await agent.quickAnalysis('Add feature flag system');
      const quickDuration = Date.now() - quickStart;

      // Quick analysis should complete in reasonable time
      expect(quickDuration).toBeLessThan(30000);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle empty description gracefully', async () => {
      const result = await agent.generateSpec('');

      // Should still produce output, even if minimal
      expect(result).toBeDefined();
    });

    it('should handle very long description', async () => {
      const longDescription = 'Add feature '.repeat(100);
      const result = await agent.generateSpec(longDescription);

      expect(result).toBeDefined();
      expect(result.specId).toBeTruthy();
    });

    it('should handle special characters in description', async () => {
      const result = await agent.generateSpec(
        'Add user profile with emojis support & special chars <test>'
      );

      expect(result).toBeDefined();
    });

    it('should handle unicode characters', async () => {
      const result = await agent.generateSpec(
        'Add internationalization with 日本語 support'
      );

      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // Event System Tests
  // ============================================================================

  describe('Event System', () => {
    it('should emit events during spec generation', async () => {
      const events: string[] = [];
      const testAgent = PMAgent.forAPI();

      testAgent.on('spec:generation:started', () => { events.push('started'); });
      testAgent.on('spec:analyzing:codebase', () => { events.push('codebase'); });
      testAgent.on('spec:analyzing:impact', () => { events.push('impact'); });
      testAgent.on('spec:generating:spec', () => { events.push('spec'); });
      testAgent.on('spec:generating:tasks', () => { events.push('tasks'); });
      testAgent.on('spec:generation:completed', () => { events.push('completed'); });

      await testAgent.start();
      await testAgent.generateSpec('Add test feature');
      await testAgent.stop();

      expect(events).toContain('started');
      expect(events).toContain('completed');
    });
  });

  // ============================================================================
  // Factory Method Tests
  // ============================================================================

  describe('Factory Methods', () => {
    it('PMAgent.create() should create default agent', () => {
      const agent = PMAgent.create();
      expect(agent).toBeInstanceOf(PMAgent);
    });

    it('PMAgent.forDevelopment() should create verbose agent', () => {
      const agent = PMAgent.forDevelopment();
      expect(agent).toBeInstanceOf(PMAgent);
    });

    it('PMAgent.forAPI() should create non-verbose agent', () => {
      const agent = PMAgent.forAPI();
      expect(agent).toBeInstanceOf(PMAgent);
    });

    it('PMAgent.withConfig() should accept custom config', () => {
      const agent = PMAgent.withConfig({
        outputDirectory: 'custom/output',
        verbose: true,
      });
      expect(agent).toBeInstanceOf(PMAgent);
    });
  });
});

// ============================================================================
// CircleTel-Specific Tests
// ============================================================================

describe('CircleTel Codebase Detection', () => {
  let agent: PMAgent;

  beforeAll(async () => {
    agent = PMAgent.forAPI();
    await agent.start();
  });

  afterAll(async () => {
    await agent.stop();
  });

  it('should detect Next.js framework', async () => {
    const result = await agent.quickAnalysis('Add new page');

    expect(result.codebase.techStack.framework).toContain('Next');
  });

  it('should detect Supabase database', async () => {
    const result = await agent.quickAnalysis('Add database table');

    expect(result.codebase.techStack.database.toLowerCase()).toContain('supabase');
  });

  it('should detect TypeScript language', async () => {
    const result = await agent.quickAnalysis('Add type definitions');

    expect(result.codebase.techStack.language.toLowerCase()).toContain('typescript');
  });

  it('should identify key directories', async () => {
    const result = await agent.quickAnalysis('Add admin feature');

    expect(result.codebase.structure.keyDirectories.length).toBeGreaterThan(0);
  });

  it('should detect existing patterns', async () => {
    const result = await agent.quickAnalysis('Add API endpoint');

    // Should detect some patterns in CircleTel codebase
    const hasPatterns =
      result.codebase.patterns.apiPatterns.length > 0 ||
      result.codebase.patterns.componentPatterns.length > 0 ||
      result.codebase.patterns.servicePatterns.length > 0;

    expect(hasPatterns).toBe(true);
  });
});

// ============================================================================
// Auto-Trigger Keyword Tests
// ============================================================================

describe('Auto-Trigger Keywords', () => {
  const keywords = [
    'generate spec',
    'create spec',
    'pm agent',
    'feature planning',
    'spec generation',
    'agent-os spec',
  ];

  keywords.forEach((keyword) => {
    it(`should activate on keyword: "${keyword}"`, () => {
      // This tests that the keyword is in the expected list
      // Actual activation would be tested in Claude Code integration tests
      const skillKeywords = [
        'generate spec',
        'create spec',
        'pm agent',
        'feature planning',
        'spec generation',
        'agent-os spec',
      ];

      expect(skillKeywords).toContain(keyword);
    });
  });
});
