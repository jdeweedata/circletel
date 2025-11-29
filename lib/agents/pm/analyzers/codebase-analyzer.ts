/**
 * Codebase Analyzer
 *
 * Analyzes the project structure, patterns, and tech stack to inform
 * spec generation. Uses file system tools to scan and categorize code.
 *
 * @module lib/agents/pm/analyzers/codebase-analyzer
 * @see agent-os/specs/20251129-agentic-ai-system/spec.md
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  CodebaseAnalysis,
  PatternInfo,
  RelevantCodeSection,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

/**
 * File categories for classification.
 */
const FILE_CATEGORIES: Record<string, RegExp[]> = {
  'api-routes': [/^app\/api\/.*\/route\.(ts|tsx)$/],
  'pages': [/^app\/.*\/page\.(ts|tsx)$/],
  'components': [/^components\/.*\.(ts|tsx)$/],
  'hooks': [/^hooks\/.*\.(ts|tsx)$/, /use.*\.(ts|tsx)$/],
  'lib-services': [/^lib\/.*\.(ts|tsx)$/],
  'types': [/types?\.(ts|tsx)$/, /\.d\.ts$/],
  'config': [/config\.(ts|tsx|js|mjs)$/, /\.config\.(ts|tsx|js|mjs)$/],
  'migrations': [/^supabase\/migrations\/.*\.sql$/],
  'tests': [/\.(test|spec)\.(ts|tsx|js)$/, /__tests__\//],
  'styles': [/\.(css|scss|sass)$/],
  'documentation': [/\.(md|mdx)$/],
};

/**
 * Directories to always ignore during analysis.
 */
const IGNORE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '.vercel',
  '.turbo',
  'coverage',
];

/**
 * Key directories to identify in structure analysis.
 */
const KEY_DIRECTORIES = [
  'app',
  'components',
  'lib',
  'hooks',
  'types',
  'public',
  'supabase',
  'docs',
  'scripts',
  '.claude',
  'agent-os',
];

// ============================================================================
// Codebase Analyzer Class
// ============================================================================

/**
 * Analyzes codebase structure, patterns, and relevant code sections.
 */
export class CodebaseAnalyzer {
  private readonly workingDirectory: string;
  private fileCache: Map<string, string[]> = new Map();

  /**
   * Create a new CodebaseAnalyzer.
   *
   * @param workingDirectory - Root directory to analyze (defaults to cwd)
   */
  constructor(workingDirectory?: string) {
    this.workingDirectory = workingDirectory || process.cwd();
  }

  // ==========================================================================
  // Main Analysis Method
  // ==========================================================================

  /**
   * Perform full codebase analysis.
   *
   * @param featureDescription - Description of the feature to help find relevant code
   * @returns Complete codebase analysis
   */
  async analyze(featureDescription?: string): Promise<CodebaseAnalysis> {
    // Get all project files
    const allFiles = await this.getAllFiles();

    // Analyze structure
    const structure = await this.analyzeStructure(allFiles);

    // Detect patterns
    const patterns = await this.analyzePatterns(allFiles);

    // Detect tech stack
    const techStack = await this.detectTechStack();

    // Find relevant code (if feature description provided)
    const relevantCode = featureDescription
      ? await this.findRelevantCode(allFiles, featureDescription)
      : [];

    return {
      structure,
      patterns,
      techStack,
      relevantCode,
    };
  }

  // ==========================================================================
  // File Discovery
  // ==========================================================================

  /**
   * Get all files in the project.
   *
   * @returns Array of relative file paths
   */
  private async getAllFiles(): Promise<string[]> {
    const cacheKey = 'all-files';
    if (this.fileCache.has(cacheKey)) {
      return this.fileCache.get(cacheKey)!;
    }

    const files: string[] = [];
    await this.walkDirectory(this.workingDirectory, files);

    // Convert to relative paths
    const relativePaths = files.map(f =>
      path.relative(this.workingDirectory, f).replace(/\\/g, '/')
    );

    this.fileCache.set(cacheKey, relativePaths);
    return relativePaths;
  }

  /**
   * Recursively walk a directory.
   *
   * @param dir - Directory to walk
   * @param files - Array to collect file paths
   */
  private async walkDirectory(dir: string, files: string[]): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip ignored directories
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.includes(entry.name)) continue;
        await this.walkDirectory(fullPath, files);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  // ==========================================================================
  // Structure Analysis
  // ==========================================================================

  /**
   * Analyze project structure.
   *
   * @param files - All project files
   * @returns Structure analysis
   */
  private async analyzeStructure(files: string[]): Promise<CodebaseAnalysis['structure']> {
    // Categorize files
    const filesByCategory: Record<string, number> = {};

    for (const file of files) {
      const category = this.categorizeFile(file);
      filesByCategory[category] = (filesByCategory[category] || 0) + 1;
    }

    // Find key directories that exist
    const keyDirectories = KEY_DIRECTORIES.filter(dir =>
      fs.existsSync(path.join(this.workingDirectory, dir))
    );

    return {
      totalFiles: files.length,
      filesByCategory,
      keyDirectories,
    };
  }

  /**
   * Categorize a file based on its path.
   *
   * @param filePath - Relative file path
   * @returns Category name
   */
  private categorizeFile(filePath: string): string {
    for (const [category, patterns] of Object.entries(FILE_CATEGORIES)) {
      for (const pattern of patterns) {
        if (pattern.test(filePath)) {
          return category;
        }
      }
    }
    return 'other';
  }

  // ==========================================================================
  // Pattern Analysis
  // ==========================================================================

  /**
   * Analyze code patterns in the project.
   *
   * @param files - All project files
   * @returns Pattern analysis
   */
  private async analyzePatterns(files: string[]): Promise<CodebaseAnalysis['patterns']> {
    return {
      apiPatterns: await this.analyzeAPIPatterns(files),
      componentPatterns: await this.analyzeComponentPatterns(files),
      servicePatterns: await this.analyzeServicePatterns(files),
      databasePatterns: await this.analyzeDatabasePatterns(files),
    };
  }

  /**
   * Analyze API route patterns.
   */
  private async analyzeAPIPatterns(files: string[]): Promise<PatternInfo[]> {
    const apiFiles = files.filter(f => /^app\/api\/.*\/route\.(ts|tsx)$/.test(f));
    const patterns: PatternInfo[] = [];

    if (apiFiles.length === 0) return patterns;

    // Find common patterns
    const hasAuthRoutes = apiFiles.some(f => f.includes('/auth/'));
    const hasDashboardRoutes = apiFiles.some(f => f.includes('/dashboard/'));
    const hasAdminRoutes = apiFiles.some(f => f.includes('/admin/'));
    const hasPublicRoutes = apiFiles.some(f => f.includes('/public/'));

    if (hasAuthRoutes) {
      patterns.push({
        name: 'Auth Routes',
        examplePath: apiFiles.find(f => f.includes('/auth/')) || '',
        description: 'Authentication endpoints (login, register, OAuth)',
        usageCount: apiFiles.filter(f => f.includes('/auth/')).length,
      });
    }

    if (hasDashboardRoutes) {
      patterns.push({
        name: 'Dashboard Routes',
        examplePath: apiFiles.find(f => f.includes('/dashboard/')) || '',
        description: 'Protected dashboard API endpoints',
        usageCount: apiFiles.filter(f => f.includes('/dashboard/')).length,
      });
    }

    if (hasAdminRoutes) {
      patterns.push({
        name: 'Admin Routes',
        examplePath: apiFiles.find(f => f.includes('/admin/')) || '',
        description: 'Admin panel API endpoints',
        usageCount: apiFiles.filter(f => f.includes('/admin/')).length,
      });
    }

    if (hasPublicRoutes) {
      patterns.push({
        name: 'Public Routes',
        examplePath: apiFiles.find(f => f.includes('/public/')) || '',
        description: 'Unauthenticated public API endpoints',
        usageCount: apiFiles.filter(f => f.includes('/public/')).length,
      });
    }

    // General API pattern
    patterns.push({
      name: 'Next.js App Router API',
      examplePath: apiFiles[0],
      description: 'API routes using Next.js 15 App Router pattern (route.ts)',
      usageCount: apiFiles.length,
    });

    return patterns;
  }

  /**
   * Analyze component patterns.
   */
  private async analyzeComponentPatterns(files: string[]): Promise<PatternInfo[]> {
    const componentFiles = files.filter(f => f.startsWith('components/'));
    const patterns: PatternInfo[] = [];

    if (componentFiles.length === 0) return patterns;

    // Check for domain-based organization
    const domains = new Set<string>();
    for (const file of componentFiles) {
      const match = file.match(/^components\/([^/]+)\//);
      if (match) domains.add(match[1]);
    }

    if (domains.size > 0) {
      patterns.push({
        name: 'Domain-Based Components',
        examplePath: componentFiles[0],
        description: `Components organized by domain: ${Array.from(domains).slice(0, 5).join(', ')}`,
        usageCount: componentFiles.length,
      });
    }

    // Check for UI components
    const hasUIDir = files.some(f => f.startsWith('components/ui/'));
    if (hasUIDir) {
      const uiFiles = componentFiles.filter(f => f.startsWith('components/ui/'));
      patterns.push({
        name: 'UI Component Library',
        examplePath: uiFiles[0],
        description: 'Reusable UI primitives (buttons, inputs, cards, etc.)',
        usageCount: uiFiles.length,
      });
    }

    return patterns;
  }

  /**
   * Analyze service patterns.
   */
  private async analyzeServicePatterns(files: string[]): Promise<PatternInfo[]> {
    const libFiles = files.filter(f => f.startsWith('lib/'));
    const patterns: PatternInfo[] = [];

    if (libFiles.length === 0) return patterns;

    // Check for service files
    const serviceFiles = libFiles.filter(f => f.includes('-service') || f.includes('service'));
    if (serviceFiles.length > 0) {
      patterns.push({
        name: 'Service Pattern',
        examplePath: serviceFiles[0],
        description: 'Business logic encapsulated in service files',
        usageCount: serviceFiles.length,
      });
    }

    // Check for Supabase client
    const hasSupabaseClient = libFiles.some(f => f.includes('supabase'));
    if (hasSupabaseClient) {
      patterns.push({
        name: 'Supabase Client',
        examplePath: libFiles.find(f => f.includes('supabase')) || '',
        description: 'Supabase client configuration (server/client)',
        usageCount: libFiles.filter(f => f.includes('supabase')).length,
      });
    }

    return patterns;
  }

  /**
   * Analyze database patterns.
   */
  private async analyzeDatabasePatterns(files: string[]): Promise<PatternInfo[]> {
    const patterns: PatternInfo[] = [];

    // Check for Supabase migrations
    const migrationFiles = files.filter(f => f.startsWith('supabase/migrations/'));
    if (migrationFiles.length > 0) {
      patterns.push({
        name: 'Supabase Migrations',
        examplePath: migrationFiles[migrationFiles.length - 1], // Latest
        description: 'Database migrations using Supabase CLI',
        usageCount: migrationFiles.length,
      });
    }

    // Check for RLS patterns in migrations
    const hasRLS = await this.checkForRLS(migrationFiles);
    if (hasRLS) {
      patterns.push({
        name: 'Row-Level Security',
        examplePath: migrationFiles[0],
        description: 'RLS policies for data access control',
        usageCount: migrationFiles.length,
      });
    }

    return patterns;
  }

  /**
   * Check if migrations contain RLS policies.
   */
  private async checkForRLS(migrationFiles: string[]): Promise<boolean> {
    // Check first few migrations for RLS patterns
    for (const file of migrationFiles.slice(0, 5)) {
      try {
        const content = await fs.promises.readFile(
          path.join(this.workingDirectory, file),
          'utf-8'
        );
        if (
          content.includes('CREATE POLICY') ||
          content.includes('ROW LEVEL SECURITY')
        ) {
          return true;
        }
      } catch {
        // Skip files that can't be read
      }
    }
    return false;
  }

  // ==========================================================================
  // Tech Stack Detection
  // ==========================================================================

  /**
   * Detect the technology stack.
   */
  private async detectTechStack(): Promise<CodebaseAnalysis['techStack']> {
    let framework = 'unknown';
    let language = 'unknown';
    let database = 'unknown';
    let styling = 'unknown';
    let testing = 'unknown';

    // Read package.json
    try {
      const packageJson = JSON.parse(
        await fs.promises.readFile(
          path.join(this.workingDirectory, 'package.json'),
          'utf-8'
        )
      );

      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Framework detection
      if (deps['next']) framework = `Next.js ${deps['next'].replace('^', '')}`;
      else if (deps['nuxt']) framework = 'Nuxt';
      else if (deps['react']) framework = 'React';

      // Language
      if (deps['typescript']) language = 'TypeScript';
      else language = 'JavaScript';

      // Database
      if (deps['@supabase/supabase-js']) database = 'Supabase (PostgreSQL)';
      else if (deps['prisma']) database = 'Prisma';
      else if (deps['mongoose']) database = 'MongoDB';

      // Styling
      if (deps['tailwindcss']) styling = 'Tailwind CSS';
      else if (deps['styled-components']) styling = 'Styled Components';
      else if (deps['@emotion/react']) styling = 'Emotion';
      else styling = 'CSS';

      // Testing
      if (deps['@playwright/test']) testing = 'Playwright';
      else if (deps['jest']) testing = 'Jest';
      else if (deps['vitest']) testing = 'Vitest';
      else testing = 'None detected';
    } catch {
      // package.json not found or invalid
    }

    return {
      framework,
      language,
      database,
      styling,
      testing,
    };
  }

  // ==========================================================================
  // Relevant Code Discovery
  // ==========================================================================

  /**
   * Find code sections relevant to a feature description.
   *
   * @param files - All project files
   * @param description - Feature description
   * @returns Relevant code sections
   */
  private async findRelevantCode(
    files: string[],
    description: string
  ): Promise<RelevantCodeSection[]> {
    const relevantSections: RelevantCodeSection[] = [];
    const keywords = this.extractKeywords(description);

    // Search for relevant files
    for (const file of files) {
      // Skip non-code files
      if (!this.isCodeFile(file)) continue;

      // Check filename for keywords
      const fileNameRelevance = this.scoreFileRelevance(file, keywords);
      if (fileNameRelevance > 0) {
        try {
          const content = await fs.promises.readFile(
            path.join(this.workingDirectory, file),
            'utf-8'
          );

          // Find relevant lines
          const lines = content.split('\n');
          const relevantLines = this.findRelevantLines(lines, keywords);

          if (relevantLines.length > 0) {
            relevantSections.push({
              path: file,
              startLine: relevantLines[0].lineNumber,
              endLine: relevantLines[relevantLines.length - 1].lineNumber,
              relevance: `Contains keywords: ${relevantLines
                .slice(0, 3)
                .map(l => l.keyword)
                .join(', ')}`,
              snippet: relevantLines
                .slice(0, 5)
                .map(l => lines[l.lineNumber - 1])
                .join('\n'),
            });
          }
        } catch {
          // Skip files that can't be read
        }
      }

      // Limit to 20 sections
      if (relevantSections.length >= 20) break;
    }

    return relevantSections;
  }

  /**
   * Extract keywords from a feature description.
   */
  private extractKeywords(description: string): string[] {
    // Remove common words
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'can', 'need',
      'want', 'to', 'from', 'in', 'on', 'at', 'by', 'for', 'with',
      'about', 'as', 'of', 'that', 'this', 'it', 'its', 'and', 'or',
    ]);

    return description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 20);
  }

  /**
   * Score how relevant a file is based on keywords.
   */
  private scoreFileRelevance(filePath: string, keywords: string[]): number {
    const lowerPath = filePath.toLowerCase();
    return keywords.filter(k => lowerPath.includes(k)).length;
  }

  /**
   * Find lines containing keywords.
   */
  private findRelevantLines(
    lines: string[],
    keywords: string[]
  ): Array<{ lineNumber: number; keyword: string }> {
    const results: Array<{ lineNumber: number; keyword: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      for (const keyword of keywords) {
        if (lowerLine.includes(keyword)) {
          results.push({ lineNumber: i + 1, keyword });
          break; // Only count each line once
        }
      }
    }

    return results;
  }

  /**
   * Check if a file is a code file.
   */
  private isCodeFile(filePath: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.sql', '.py'];
    return codeExtensions.some(ext => filePath.endsWith(ext));
  }

  // ==========================================================================
  // Quick Analysis Methods
  // ==========================================================================

  /**
   * Quick analysis for a specific directory.
   *
   * @param directory - Directory to analyze
   * @returns File count and categories
   */
  async analyzeDirectory(directory: string): Promise<{
    totalFiles: number;
    categories: Record<string, number>;
  }> {
    const dirPath = path.join(this.workingDirectory, directory);
    if (!fs.existsSync(dirPath)) {
      return { totalFiles: 0, categories: {} };
    }

    const files: string[] = [];
    await this.walkDirectory(dirPath, files);

    const relativePaths = files.map(f =>
      path.relative(this.workingDirectory, f).replace(/\\/g, '/')
    );

    const categories: Record<string, number> = {};
    for (const file of relativePaths) {
      const category = this.categorizeFile(file);
      categories[category] = (categories[category] || 0) + 1;
    }

    return { totalFiles: relativePaths.length, categories };
  }

  /**
   * Search for files matching a pattern.
   *
   * @param pattern - Glob-like pattern (simple matching)
   * @returns Matching file paths
   */
  async searchFiles(pattern: string): Promise<string[]> {
    const allFiles = await this.getAllFiles();
    const regex = this.patternToRegex(pattern);
    return allFiles.filter(f => regex.test(f));
  }

  /**
   * Convert a simple glob pattern to regex.
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '<<DOUBLE>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<DOUBLE>>/g, '.*');

    return new RegExp(`^${escaped}$`);
  }
}

// ============================================================================
// Exports
// ============================================================================

export { FILE_CATEGORIES, IGNORE_DIRS, KEY_DIRECTORIES };
