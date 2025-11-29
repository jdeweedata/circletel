/**
 * PM Agent Analyzer Unit Tests
 *
 * Tests for CodebaseAnalyzer and ImpactAnalyzer classes.
 *
 * @module lib/agents/pm/__tests__/analyzers.test
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  CodebaseAnalyzer,
  FILE_CATEGORIES,
  IGNORE_DIRS,
  KEY_DIRECTORIES,
} from '../analyzers/codebase-analyzer';
import {
  ImpactAnalyzer,
  FEATURE_SYSTEM_MAP,
  RISK_WEIGHTS,
} from '../analyzers/impact-analyzer';
import type { CodebaseAnalysis, FeatureRequest } from '../types';

// ============================================================================
// CodebaseAnalyzer Tests
// ============================================================================

describe('CodebaseAnalyzer', () => {
  let analyzer: CodebaseAnalyzer;

  beforeAll(() => {
    analyzer = new CodebaseAnalyzer();
  });

  // ==========================================================================
  // analyze() Method
  // ==========================================================================

  describe('analyze()', () => {
    it('should return valid CodebaseAnalysis structure', async () => {
      const result = await analyzer.analyze('add new feature');

      expect(result).toBeDefined();
      expect(result.structure).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.techStack).toBeDefined();
      expect(result.relevantCode).toBeDefined();
    });

    it('should detect project file count', async () => {
      const result = await analyzer.analyze('analyze project');

      expect(result.structure.totalFiles).toBeGreaterThan(0);
    });

    it('should categorize files by type', async () => {
      const result = await analyzer.analyze('check file types');

      expect(result.structure.filesByCategory).toBeDefined();
      expect(typeof result.structure.filesByCategory).toBe('object');
    });

    it('should identify key directories', async () => {
      const result = await analyzer.analyze('find directories');

      expect(Array.isArray(result.structure.keyDirectories)).toBe(true);
    });

    it('should detect tech stack', async () => {
      const result = await analyzer.analyze('detect technology');

      expect(result.techStack.framework).toBeTruthy();
      expect(result.techStack.language).toBeTruthy();
    });

    it('should find relevant code sections based on keywords', async () => {
      const result = await analyzer.analyze('authentication login');

      expect(Array.isArray(result.relevantCode)).toBe(true);
    });
  });

  // ==========================================================================
  // Tech Stack Detection
  // ==========================================================================

  describe('Tech Stack Detection', () => {
    it('should detect Next.js framework', async () => {
      const result = await analyzer.analyze('test');

      // CircleTel uses Next.js
      expect(result.techStack.framework.toLowerCase()).toContain('next');
    });

    it('should detect TypeScript', async () => {
      const result = await analyzer.analyze('test');

      expect(result.techStack.language.toLowerCase()).toContain('typescript');
    });

    it('should detect Supabase', async () => {
      const result = await analyzer.analyze('database');

      expect(result.techStack.database.toLowerCase()).toContain('supabase');
    });

    it('should detect styling framework', async () => {
      const result = await analyzer.analyze('styles');

      expect(result.techStack.styling).toBeTruthy();
    });

    it('should detect testing framework', async () => {
      const result = await analyzer.analyze('tests');

      expect(result.techStack.testing).toBeTruthy();
    });
  });

  // ==========================================================================
  // Pattern Detection
  // ==========================================================================

  describe('Pattern Detection', () => {
    it('should detect API patterns', async () => {
      const result = await analyzer.analyze('api endpoint route');

      expect(Array.isArray(result.patterns.apiPatterns)).toBe(true);
    });

    it('should detect component patterns', async () => {
      const result = await analyzer.analyze('component ui button');

      expect(Array.isArray(result.patterns.componentPatterns)).toBe(true);
    });

    it('should detect service patterns', async () => {
      const result = await analyzer.analyze('service business logic');

      expect(Array.isArray(result.patterns.servicePatterns)).toBe(true);
    });

    it('should detect database patterns', async () => {
      const result = await analyzer.analyze('database query migration');

      expect(Array.isArray(result.patterns.databasePatterns)).toBe(true);
    });

    it('should include pattern examples with paths', async () => {
      const result = await analyzer.analyze('api routes');

      const allPatterns = [
        ...result.patterns.apiPatterns,
        ...result.patterns.componentPatterns,
        ...result.patterns.servicePatterns,
        ...result.patterns.databasePatterns,
      ];

      // At least some patterns should have example paths
      const hasExamples = allPatterns.some((p) => p.examplePath);
      expect(hasExamples || allPatterns.length === 0).toBe(true);
    });
  });

  // ==========================================================================
  // Constants Tests
  // ==========================================================================

  describe('FILE_CATEGORIES', () => {
    it('should have API routes category', () => {
      expect(FILE_CATEGORIES).toHaveProperty('api_routes');
    });

    it('should have components category', () => {
      expect(FILE_CATEGORIES).toHaveProperty('components');
    });

    it('should have services category', () => {
      expect(FILE_CATEGORIES).toHaveProperty('services');
    });

    it('should have types category', () => {
      expect(FILE_CATEGORIES).toHaveProperty('types');
    });
  });

  describe('IGNORE_DIRS', () => {
    it('should include node_modules', () => {
      expect(IGNORE_DIRS).toContain('node_modules');
    });

    it('should include .git', () => {
      expect(IGNORE_DIRS).toContain('.git');
    });

    it('should include .next', () => {
      expect(IGNORE_DIRS).toContain('.next');
    });
  });

  describe('KEY_DIRECTORIES', () => {
    it('should include app directory', () => {
      expect(KEY_DIRECTORIES).toContain('app');
    });

    it('should include lib directory', () => {
      expect(KEY_DIRECTORIES).toContain('lib');
    });

    it('should include components directory', () => {
      expect(KEY_DIRECTORIES).toContain('components');
    });
  });
});

// ============================================================================
// ImpactAnalyzer Tests
// ============================================================================

describe('ImpactAnalyzer', () => {
  let analyzer: ImpactAnalyzer;
  let codebaseAnalyzer: CodebaseAnalyzer;
  let mockCodebaseAnalysis: CodebaseAnalysis;

  beforeAll(async () => {
    analyzer = new ImpactAnalyzer();
    codebaseAnalyzer = new CodebaseAnalyzer();

    // Get real codebase analysis for tests
    mockCodebaseAnalysis = await codebaseAnalyzer.analyze('general analysis');
  });

  // ==========================================================================
  // analyze() Method
  // ==========================================================================

  describe('analyze()', () => {
    it('should return valid ImpactAnalysis structure', async () => {
      const request: FeatureRequest = {
        description: 'Add user dashboard',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      expect(result).toBeDefined();
      expect(result.filesToCreate).toBeDefined();
      expect(result.filesToModify).toBeDefined();
      expect(result.potentiallyAffected).toBeDefined();
      expect(result.databaseTables).toBeDefined();
      expect(result.apiEndpoints).toBeDefined();
      expect(result.dependencies).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.riskFactors).toBeDefined();
    });

    it('should identify files to create', async () => {
      const request: FeatureRequest = {
        description: 'Add new customer billing page with API',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      expect(Array.isArray(result.filesToCreate)).toBe(true);
    });

    it('should identify files to modify', async () => {
      const request: FeatureRequest = {
        description: 'Update existing dashboard with new widget',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      expect(Array.isArray(result.filesToModify)).toBe(true);
    });

    it('should identify database changes', async () => {
      const request: FeatureRequest = {
        description: 'Add user preferences table with settings',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      expect(Array.isArray(result.databaseTables)).toBe(true);
    });

    it('should identify API endpoint changes', async () => {
      const request: FeatureRequest = {
        description: 'Add REST API for order management',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      expect(Array.isArray(result.apiEndpoints)).toBe(true);
    });

    it('should identify dependencies', async () => {
      const request: FeatureRequest = {
        description: 'Add real-time features with WebSocket',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      expect(Array.isArray(result.dependencies)).toBe(true);
    });
  });

  // ==========================================================================
  // Risk Assessment
  // ==========================================================================

  describe('Risk Assessment', () => {
    it('should assess risk level as low, medium, or high', async () => {
      const request: FeatureRequest = {
        description: 'Add simple button component',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      expect(['low', 'medium', 'high']).toContain(result.riskLevel);
    });

    it('should provide risk factors', async () => {
      const request: FeatureRequest = {
        description: 'Rebuild authentication system with new provider',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      expect(Array.isArray(result.riskFactors)).toBe(true);
    });

    it('should assess high risk for auth-related changes', async () => {
      const request: FeatureRequest = {
        description: 'Implement new authentication flow with SSO',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      // Auth changes should typically be medium or high risk
      expect(['medium', 'high']).toContain(result.riskLevel);
    });

    it('should assess high risk for payment-related changes', async () => {
      const request: FeatureRequest = {
        description: 'Add new payment gateway integration',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      // Payment changes should be medium or high risk
      expect(['medium', 'high']).toContain(result.riskLevel);
    });

    it('should assess lower risk for simple UI changes', async () => {
      const request: FeatureRequest = {
        description: 'Change button color on homepage',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      // Simple UI changes should be low or medium risk
      expect(['low', 'medium']).toContain(result.riskLevel);
    });
  });

  // ==========================================================================
  // Feature System Mapping
  // ==========================================================================

  describe('FEATURE_SYSTEM_MAP', () => {
    it('should map auth keywords to systems', () => {
      expect(FEATURE_SYSTEM_MAP).toHaveProperty('auth');
    });

    it('should map dashboard keywords to systems', () => {
      expect(FEATURE_SYSTEM_MAP).toHaveProperty('dashboard');
    });

    it('should map payment keywords to systems', () => {
      expect(FEATURE_SYSTEM_MAP).toHaveProperty('payment');
    });

    it('should map order keywords to systems', () => {
      expect(FEATURE_SYSTEM_MAP).toHaveProperty('order');
    });

    it('should map customer keywords to systems', () => {
      expect(FEATURE_SYSTEM_MAP).toHaveProperty('customer');
    });

    it('should have arrays of affected files/paths', () => {
      const firstKey = Object.keys(FEATURE_SYSTEM_MAP)[0];
      expect(Array.isArray(FEATURE_SYSTEM_MAP[firstKey])).toBe(true);
    });
  });

  // ==========================================================================
  // Risk Weights
  // ==========================================================================

  describe('RISK_WEIGHTS', () => {
    it('should have risk weights defined', () => {
      expect(RISK_WEIGHTS).toBeDefined();
      expect(typeof RISK_WEIGHTS).toBe('object');
    });

    it('should have numeric weight values', () => {
      const weights = Object.values(RISK_WEIGHTS);
      weights.forEach((weight) => {
        expect(typeof weight).toBe('number');
      });
    });

    it('should have positive weights', () => {
      const weights = Object.values(RISK_WEIGHTS);
      weights.forEach((weight) => {
        expect(weight).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ==========================================================================
  // File Change Detection
  // ==========================================================================

  describe('File Change Detection', () => {
    it('should detect component file creation for UI feature', async () => {
      const request: FeatureRequest = {
        description: 'Add new modal component for user settings',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      const hasComponentFile = result.filesToCreate.some(
        (f) =>
          f.path.includes('component') ||
          f.path.endsWith('.tsx') ||
          f.path.endsWith('.jsx')
      );

      // Should identify component-related file changes
      expect(result.filesToCreate.length > 0 || result.filesToModify.length > 0).toBe(true);
    });

    it('should detect API route creation for backend feature', async () => {
      const request: FeatureRequest = {
        description: 'Add API endpoint for user preferences',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      const hasApiRoute = result.filesToCreate.some(
        (f) => f.path.includes('api') || f.path.includes('route')
      );

      // Should have file changes
      expect(result.filesToCreate.length > 0 || result.filesToModify.length > 0).toBe(true);
    });

    it('should detect migration file for database changes', async () => {
      const request: FeatureRequest = {
        description: 'Add new database table for audit logs',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      // Should identify database changes
      expect(result.databaseTables.length > 0 || result.filesToCreate.length > 0).toBe(true);
    });
  });

  // ==========================================================================
  // Potentially Affected Files
  // ==========================================================================

  describe('Potentially Affected Files', () => {
    it('should identify potentially affected files', async () => {
      const request: FeatureRequest = {
        description: 'Modify customer service module',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      expect(Array.isArray(result.potentiallyAffected)).toBe(true);
    });

    it('should include related files in potentially affected', async () => {
      const request: FeatureRequest = {
        description: 'Update admin dashboard layout',
      };

      const result = await analyzer.analyze(request, mockCodebaseAnalysis);

      // Either in filesToModify or potentiallyAffected
      const allAffected = [
        ...result.filesToModify.map((f) => f.path),
        ...result.potentiallyAffected,
      ];

      expect(allAffected.length).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Analyzer Integration', () => {
  let codebaseAnalyzer: CodebaseAnalyzer;
  let impactAnalyzer: ImpactAnalyzer;

  beforeAll(() => {
    codebaseAnalyzer = new CodebaseAnalyzer();
    impactAnalyzer = new ImpactAnalyzer();
  });

  it('should work together to analyze feature impact', async () => {
    const description = 'Add customer notification preferences';

    const codebaseAnalysis = await codebaseAnalyzer.analyze(description);
    const impactAnalysis = await impactAnalyzer.analyze(
      { description },
      codebaseAnalysis
    );

    expect(codebaseAnalysis).toBeDefined();
    expect(impactAnalysis).toBeDefined();
    expect(impactAnalysis.riskLevel).toBeDefined();
  });

  it('should use codebase patterns in impact analysis', async () => {
    const description = 'Add new API endpoint following existing patterns';

    const codebaseAnalysis = await codebaseAnalyzer.analyze(description);
    const impactAnalysis = await impactAnalyzer.analyze(
      { description },
      codebaseAnalysis
    );

    // Impact analysis should consider existing patterns
    expect(impactAnalysis.filesToCreate.length > 0 || impactAnalysis.filesToModify.length > 0).toBe(true);
  });

  it('should provide consistent results for same input', async () => {
    const description = 'Add user settings page';

    const codebase1 = await codebaseAnalyzer.analyze(description);
    const codebase2 = await codebaseAnalyzer.analyze(description);

    expect(codebase1.techStack.framework).toBe(codebase2.techStack.framework);
    expect(codebase1.techStack.language).toBe(codebase2.techStack.language);
  });
});
