/**
 * Impact Analyzer
 *
 * Analyzes the potential impact of implementing a feature, including
 * affected files, database changes, API endpoints, and dependencies.
 *
 * @module lib/agents/pm/analyzers/impact-analyzer
 * @see agent-os/specs/20251129-agentic-ai-system/spec.md
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ImpactAnalysis,
  FileChange,
  DatabaseChange,
  APIChange,
  DependencyChange,
  CodebaseAnalysis,
  FeatureRequest,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Feature keywords mapped to affected systems.
 */
const FEATURE_SYSTEM_MAP: Record<string, string[]> = {
  // Authentication features
  'auth': ['lib/supabase', 'app/api/auth', 'components/auth', 'middleware'],
  'login': ['lib/supabase', 'app/api/auth', 'components/auth'],
  'logout': ['lib/supabase', 'app/api/auth'],
  'register': ['lib/supabase', 'app/api/auth', 'components/auth'],
  'oauth': ['lib/supabase', 'app/api/auth', 'app/api/callback'],
  'password': ['lib/supabase', 'app/api/auth'],

  // Dashboard features
  'dashboard': ['app/dashboard', 'components/dashboard', 'app/api/dashboard'],
  'admin': ['app/admin', 'components/admin', 'app/api/admin'],
  'profile': ['app/dashboard/profile', 'components/profile', 'app/api/profile'],

  // Payment features
  'payment': ['lib/payment', 'app/api/payment', 'components/checkout'],
  'checkout': ['components/checkout', 'app/api/orders', 'lib/payment'],
  'invoice': ['app/api/invoices', 'components/billing', 'lib/invoices'],
  'billing': ['app/api/billing', 'components/billing', 'lib/billing'],

  // Coverage features
  'coverage': ['lib/coverage', 'app/api/coverage', 'components/coverage'],
  'packages': ['app/packages', 'app/api/packages', 'components/packages'],

  // Order features
  'order': ['app/api/orders', 'components/orders', 'lib/orders'],
  'cart': ['components/cart', 'lib/cart', 'app/api/cart'],

  // Customer features
  'customer': ['app/dashboard', 'app/api/customers', 'components/customer'],
  'service': ['app/api/services', 'components/services', 'lib/services'],

  // Partner features
  'partner': ['app/partners', 'app/api/partners', 'components/partners'],
  'kyc': ['app/api/kyc', 'lib/kyc', 'components/kyc'],
  'compliance': ['lib/partners/compliance', 'components/compliance'],

  // B2B features
  'quote': ['app/api/quotes', 'components/quotes', 'lib/quotes'],
  'contract': ['app/api/contracts', 'components/contracts', 'lib/contracts'],

  // Notification features
  'email': ['lib/email', 'app/api/notifications/email'],
  'sms': ['lib/sms', 'app/api/notifications/sms'],
  'notification': ['lib/notifications', 'app/api/notifications'],

  // Database features
  'database': ['supabase/migrations', 'lib/supabase'],
  'migration': ['supabase/migrations'],
  'rls': ['supabase/migrations'],
};

/**
 * Risk factors and their weights.
 */
const RISK_WEIGHTS: Record<string, number> = {
  'database-schema-change': 3,
  'authentication-change': 3,
  'payment-integration': 3,
  'rls-policy-change': 2,
  'api-breaking-change': 2,
  'new-dependency': 1,
  'high-file-count': 1,
  'touches-core-lib': 2,
};

// ============================================================================
// Impact Analyzer Class
// ============================================================================

/**
 * Analyzes the impact of implementing a feature.
 */
export class ImpactAnalyzer {
  private readonly workingDirectory: string;

  /**
   * Create a new ImpactAnalyzer.
   *
   * @param workingDirectory - Root directory (defaults to cwd)
   */
  constructor(workingDirectory?: string) {
    this.workingDirectory = workingDirectory || process.cwd();
  }

  // ==========================================================================
  // Main Analysis Method
  // ==========================================================================

  /**
   * Perform full impact analysis for a feature.
   *
   * @param featureRequest - The feature being analyzed
   * @param codebaseAnalysis - Pre-computed codebase analysis
   * @returns Impact analysis results
   */
  async analyze(
    featureRequest: FeatureRequest,
    codebaseAnalysis?: CodebaseAnalysis
  ): Promise<ImpactAnalysis> {
    const description = featureRequest.description.toLowerCase();

    // Identify affected systems
    const affectedSystems = this.identifyAffectedSystems(description);

    // Determine file changes
    const { filesToCreate, filesToModify, potentiallyAffected } =
      await this.analyzeFileChanges(description, affectedSystems, codebaseAnalysis);

    // Determine database changes
    const databaseTables = await this.analyzeDatabaseChanges(description);

    // Determine API changes
    const apiEndpoints = await this.analyzeAPIChanges(description, affectedSystems);

    // Determine dependencies
    const dependencies = this.analyzeDependencies(description);

    // Calculate risk
    const { riskLevel, riskFactors } = this.calculateRisk({
      filesToCreate,
      filesToModify,
      databaseTables,
      dependencies,
      description,
    });

    return {
      filesToCreate,
      filesToModify,
      potentiallyAffected,
      databaseTables,
      apiEndpoints,
      dependencies,
      riskLevel,
      riskFactors,
    };
  }

  // ==========================================================================
  // System Identification
  // ==========================================================================

  /**
   * Identify systems affected by a feature.
   *
   * @param description - Feature description (lowercase)
   * @returns List of affected system paths
   */
  private identifyAffectedSystems(description: string): string[] {
    const systems = new Set<string>();

    for (const [keyword, paths] of Object.entries(FEATURE_SYSTEM_MAP)) {
      if (description.includes(keyword)) {
        paths.forEach(p => systems.add(p));
      }
    }

    return Array.from(systems);
  }

  // ==========================================================================
  // File Change Analysis
  // ==========================================================================

  /**
   * Analyze file changes required for a feature.
   */
  private async analyzeFileChanges(
    description: string,
    affectedSystems: string[],
    codebaseAnalysis?: CodebaseAnalysis
  ): Promise<{
    filesToCreate: FileChange[];
    filesToModify: FileChange[];
    potentiallyAffected: string[];
  }> {
    const filesToCreate: FileChange[] = [];
    const filesToModify: FileChange[] = [];
    const potentiallyAffected: string[] = [];

    // Analyze based on keywords
    const keywords = this.extractFeatureKeywords(description);

    // Check for API route needs
    if (this.needsNewAPIRoute(description)) {
      const routeName = this.suggestRouteName(description);
      filesToCreate.push({
        path: `app/api/${routeName}/route.ts`,
        changeType: 'create',
        description: `New API endpoint for ${routeName}`,
        estimatedLines: 50,
      });
    }

    // Check for page needs
    if (this.needsNewPage(description)) {
      const pageName = this.suggestPageName(description);
      filesToCreate.push({
        path: `app/${pageName}/page.tsx`,
        changeType: 'create',
        description: `New page component for ${pageName}`,
        estimatedLines: 100,
      });
    }

    // Check for component needs
    if (this.needsNewComponents(description)) {
      const componentNames = this.suggestComponentNames(description);
      for (const name of componentNames) {
        filesToCreate.push({
          path: `components/${name}.tsx`,
          changeType: 'create',
          description: `New component: ${name}`,
          estimatedLines: 80,
        });
      }
    }

    // Check for service needs
    if (this.needsNewService(description)) {
      const serviceName = this.suggestServiceName(description);
      filesToCreate.push({
        path: `lib/${serviceName}-service.ts`,
        changeType: 'create',
        description: `New service for ${serviceName} business logic`,
        estimatedLines: 150,
      });
    }

    // Check for database migration needs
    if (this.needsDatabaseChanges(description)) {
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      filesToCreate.push({
        path: `supabase/migrations/${timestamp}_${this.suggestMigrationName(description)}.sql`,
        changeType: 'create',
        description: 'Database migration for schema changes',
        estimatedLines: 50,
      });
    }

    // Identify files to modify based on affected systems
    for (const system of affectedSystems) {
      const existingFiles = await this.findExistingFiles(system);
      for (const file of existingFiles) {
        filesToModify.push({
          path: file,
          changeType: 'modify',
          description: `Update for ${this.extractMainFeature(description)} integration`,
        });
      }
    }

    // Add potentially affected files from related code sections
    if (codebaseAnalysis?.relevantCode) {
      for (const section of codebaseAnalysis.relevantCode) {
        if (
          !filesToCreate.some(f => f.path === section.path) &&
          !filesToModify.some(f => f.path === section.path)
        ) {
          potentiallyAffected.push(section.path);
        }
      }
    }

    return { filesToCreate, filesToModify, potentiallyAffected };
  }

  /**
   * Find existing files in a system path.
   */
  private async findExistingFiles(systemPath: string): Promise<string[]> {
    const fullPath = path.join(this.workingDirectory, systemPath);
    const files: string[] = [];

    try {
      const stat = await fs.promises.stat(fullPath);
      if (stat.isDirectory()) {
        const entries = await fs.promises.readdir(fullPath, { recursive: true });
        for (const entry of entries) {
          if (typeof entry === 'string' && this.isCodeFile(entry)) {
            files.push(path.join(systemPath, entry).replace(/\\/g, '/'));
          }
        }
      } else if (stat.isFile() && this.isCodeFile(fullPath)) {
        files.push(systemPath);
      }
    } catch {
      // Path doesn't exist, that's fine
    }

    return files.slice(0, 5); // Limit to 5 files per system
  }

  // ==========================================================================
  // Database Change Analysis
  // ==========================================================================

  /**
   * Analyze database changes required.
   */
  private async analyzeDatabaseChanges(description: string): Promise<DatabaseChange[]> {
    const changes: DatabaseChange[] = [];

    // Check for common data models mentioned
    const modelKeywords: Record<string, { table: string; description: string }> = {
      'user': { table: 'users', description: 'User account data' },
      'customer': { table: 'customers', description: 'Customer information' },
      'order': { table: 'orders', description: 'Order transactions' },
      'payment': { table: 'payments', description: 'Payment records' },
      'service': { table: 'services', description: 'Service subscriptions' },
      'product': { table: 'products', description: 'Product catalog' },
      'package': { table: 'packages', description: 'Service packages' },
      'invoice': { table: 'invoices', description: 'Invoice records' },
      'notification': { table: 'notifications', description: 'Notification history' },
      'session': { table: 'sessions', description: 'User sessions' },
      'audit': { table: 'audit_logs', description: 'Audit trail' },
      'quote': { table: 'quotes', description: 'Business quotes' },
      'contract': { table: 'contracts', description: 'Contracts' },
      'kyc': { table: 'kyc_sessions', description: 'KYC verification' },
      'partner': { table: 'partners', description: 'Partner accounts' },
      'usage': { table: 'usage_history', description: 'Service usage' },
      'billing': { table: 'billing', description: 'Billing information' },
    };

    for (const [keyword, info] of Object.entries(modelKeywords)) {
      if (description.includes(keyword)) {
        // Check if table exists
        const tableExists = await this.checkTableExists(info.table);

        changes.push({
          table: info.table,
          changeType: tableExists ? 'alter' : 'create',
          description: tableExists
            ? `Modify ${info.description}`
            : `Create new table for ${info.description}`,
        });
      }
    }

    // Check for specific column additions
    if (description.includes('status')) {
      changes.forEach(c => {
        if (!c.columns) c.columns = [];
        c.columns.push('status');
      });
    }

    if (description.includes('timestamp') || description.includes('date')) {
      changes.forEach(c => {
        if (!c.columns) c.columns = [];
        c.columns.push('created_at', 'updated_at');
      });
    }

    return changes;
  }

  /**
   * Check if a table exists (simplified check via migrations).
   */
  private async checkTableExists(tableName: string): Promise<boolean> {
    const migrationsDir = path.join(this.workingDirectory, 'supabase/migrations');

    try {
      const files = await fs.promises.readdir(migrationsDir);
      for (const file of files) {
        if (file.endsWith('.sql')) {
          const content = await fs.promises.readFile(
            path.join(migrationsDir, file),
            'utf-8'
          );
          if (content.toLowerCase().includes(`create table ${tableName}`)) {
            return true;
          }
        }
      }
    } catch {
      // Migrations dir doesn't exist
    }

    return false;
  }

  // ==========================================================================
  // API Change Analysis
  // ==========================================================================

  /**
   * Analyze API endpoint changes.
   */
  private async analyzeAPIChanges(
    description: string,
    affectedSystems: string[]
  ): Promise<APIChange[]> {
    const changes: APIChange[] = [];

    // Determine required operations
    const operations = {
      hasCreate: /\b(create|add|new|register|submit)\b/i.test(description),
      hasRead: /\b(get|fetch|list|view|show|display)\b/i.test(description),
      hasUpdate: /\b(update|edit|modify|change)\b/i.test(description),
      hasDelete: /\b(delete|remove|cancel)\b/i.test(description),
    };

    // Suggest endpoint path
    const resourceName = this.suggestRouteName(description);

    if (operations.hasCreate) {
      changes.push({
        method: 'POST',
        path: `/api/${resourceName}`,
        changeType: 'create',
        description: `Create new ${resourceName}`,
      });
    }

    if (operations.hasRead) {
      changes.push({
        method: 'GET',
        path: `/api/${resourceName}`,
        changeType: 'create',
        description: `List/get ${resourceName}`,
      });

      changes.push({
        method: 'GET',
        path: `/api/${resourceName}/[id]`,
        changeType: 'create',
        description: `Get single ${resourceName} by ID`,
      });
    }

    if (operations.hasUpdate) {
      changes.push({
        method: 'PUT',
        path: `/api/${resourceName}/[id]`,
        changeType: 'create',
        description: `Update ${resourceName}`,
      });
    }

    if (operations.hasDelete) {
      changes.push({
        method: 'DELETE',
        path: `/api/${resourceName}/[id]`,
        changeType: 'create',
        description: `Delete ${resourceName}`,
      });
    }

    return changes;
  }

  // ==========================================================================
  // Dependency Analysis
  // ==========================================================================

  /**
   * Analyze dependencies that may be needed.
   */
  private analyzeDependencies(description: string): DependencyChange[] {
    const dependencies: DependencyChange[] = [];

    // Check for common dependency triggers
    const dependencyTriggers: Record<string, DependencyChange> = {
      'pdf': {
        name: '@react-pdf/renderer',
        reason: 'PDF generation',
        devDependency: false,
      },
      'excel': {
        name: 'xlsx',
        reason: 'Excel file handling',
        devDependency: false,
      },
      'csv': {
        name: 'papaparse',
        reason: 'CSV parsing',
        devDependency: false,
      },
      'chart': {
        name: 'recharts',
        reason: 'Data visualization',
        devDependency: false,
      },
      'graph': {
        name: 'recharts',
        reason: 'Data visualization',
        devDependency: false,
      },
      'map': {
        name: '@googlemaps/react-wrapper',
        reason: 'Google Maps integration',
        devDependency: false,
      },
      'date': {
        name: 'date-fns',
        reason: 'Date manipulation',
        devDependency: false,
      },
      'calendar': {
        name: 'react-day-picker',
        reason: 'Calendar component',
        devDependency: false,
      },
      'drag': {
        name: '@hello-pangea/dnd',
        reason: 'Drag and drop',
        devDependency: false,
      },
      'upload': {
        name: 'react-dropzone',
        reason: 'File uploads',
        devDependency: false,
      },
      'editor': {
        name: '@tiptap/react',
        reason: 'Rich text editor',
        devDependency: false,
      },
      'markdown': {
        name: 'react-markdown',
        reason: 'Markdown rendering',
        devDependency: false,
      },
      'qr': {
        name: 'qrcode.react',
        reason: 'QR code generation',
        devDependency: false,
      },
      'barcode': {
        name: 'react-barcode',
        reason: 'Barcode generation',
        devDependency: false,
      },
      'signature': {
        name: 'react-signature-canvas',
        reason: 'Digital signatures',
        devDependency: false,
      },
      'animation': {
        name: 'framer-motion',
        reason: 'Animations',
        devDependency: false,
      },
      'test': {
        name: '@playwright/test',
        reason: 'E2E testing',
        devDependency: true,
      },
    };

    for (const [keyword, dep] of Object.entries(dependencyTriggers)) {
      if (description.includes(keyword)) {
        // Check if already installed
        if (!dependencies.some(d => d.name === dep.name)) {
          dependencies.push(dep);
        }
      }
    }

    return dependencies;
  }

  // ==========================================================================
  // Risk Calculation
  // ==========================================================================

  /**
   * Calculate risk level and factors.
   */
  private calculateRisk(params: {
    filesToCreate: FileChange[];
    filesToModify: FileChange[];
    databaseTables: DatabaseChange[];
    dependencies: DependencyChange[];
    description: string;
  }): { riskLevel: 'low' | 'medium' | 'high'; riskFactors: string[] } {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Check for database schema changes
    const hasSchemaChange = params.databaseTables.some(
      t => t.changeType === 'create' || t.changeType === 'alter'
    );
    if (hasSchemaChange) {
      riskFactors.push('Database schema changes required');
      riskScore += RISK_WEIGHTS['database-schema-change'];
    }

    // Check for authentication changes
    if (params.description.includes('auth') || params.description.includes('login')) {
      riskFactors.push('Authentication system changes');
      riskScore += RISK_WEIGHTS['authentication-change'];
    }

    // Check for payment changes
    if (params.description.includes('payment') || params.description.includes('billing')) {
      riskFactors.push('Payment/billing integration');
      riskScore += RISK_WEIGHTS['payment-integration'];
    }

    // Check for new dependencies
    if (params.dependencies.length > 0) {
      riskFactors.push(`${params.dependencies.length} new dependencies required`);
      riskScore += RISK_WEIGHTS['new-dependency'] * params.dependencies.length;
    }

    // Check file count
    const totalFiles = params.filesToCreate.length + params.filesToModify.length;
    if (totalFiles > 10) {
      riskFactors.push(`High file count: ${totalFiles} files affected`);
      riskScore += RISK_WEIGHTS['high-file-count'];
    }

    // Check for core lib changes
    const touchesCore = params.filesToModify.some(
      f =>
        f.path.startsWith('lib/supabase') ||
        f.path.includes('middleware') ||
        f.path.startsWith('lib/auth')
    );
    if (touchesCore) {
      riskFactors.push('Changes to core infrastructure');
      riskScore += RISK_WEIGHTS['touches-core-lib'];
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore >= 6) riskLevel = 'high';
    else if (riskScore >= 3) riskLevel = 'medium';

    return { riskLevel, riskFactors };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Extract feature keywords from description.
   */
  private extractFeatureKeywords(description: string): string[] {
    return description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
  }

  /**
   * Extract main feature name from description.
   */
  private extractMainFeature(description: string): string {
    const keywords = this.extractFeatureKeywords(description);
    return keywords[0] || 'feature';
  }

  /**
   * Check if a new API route is needed.
   */
  private needsNewAPIRoute(description: string): boolean {
    return /\b(api|endpoint|crud|fetch|post|get|submit)\b/i.test(description);
  }

  /**
   * Check if a new page is needed.
   */
  private needsNewPage(description: string): boolean {
    return /\b(page|view|screen|dashboard|panel|portal)\b/i.test(description);
  }

  /**
   * Check if new components are needed.
   */
  private needsNewComponents(description: string): boolean {
    return /\b(form|button|card|list|table|modal|dialog|component)\b/i.test(description);
  }

  /**
   * Check if a new service is needed.
   */
  private needsNewService(description: string): boolean {
    return /\b(service|logic|calculate|process|validate|business)\b/i.test(description);
  }

  /**
   * Check if database changes are needed.
   */
  private needsDatabaseChanges(description: string): boolean {
    return /\b(store|save|database|table|record|persist|data)\b/i.test(description);
  }

  /**
   * Suggest API route name.
   */
  private suggestRouteName(description: string): string {
    const keywords = this.extractFeatureKeywords(description);
    // Find the most meaningful noun
    const nouns = keywords.filter(k =>
      !['new', 'add', 'create', 'update', 'delete', 'get', 'list'].includes(k)
    );
    return nouns[0] || 'resource';
  }

  /**
   * Suggest page name.
   */
  private suggestPageName(description: string): string {
    const route = this.suggestRouteName(description);
    // Check if it should be under a section
    if (description.includes('admin')) return `admin/${route}`;
    if (description.includes('dashboard')) return `dashboard/${route}`;
    if (description.includes('partner')) return `partners/${route}`;
    return route;
  }

  /**
   * Suggest component names.
   */
  private suggestComponentNames(description: string): string[] {
    const names: string[] = [];
    const feature = this.extractMainFeature(description);
    const capitalized = feature.charAt(0).toUpperCase() + feature.slice(1);

    if (description.includes('form')) names.push(`${capitalized}Form`);
    if (description.includes('list')) names.push(`${capitalized}List`);
    if (description.includes('card')) names.push(`${capitalized}Card`);
    if (description.includes('table')) names.push(`${capitalized}Table`);
    if (description.includes('modal')) names.push(`${capitalized}Modal`);

    // Default if nothing specific
    if (names.length === 0) names.push(capitalized);

    return names;
  }

  /**
   * Suggest service name.
   */
  private suggestServiceName(description: string): string {
    return this.suggestRouteName(description);
  }

  /**
   * Suggest migration name.
   */
  private suggestMigrationName(description: string): string {
    const feature = this.extractMainFeature(description);
    return `add_${feature}_support`;
  }

  /**
   * Check if path is a code file.
   */
  private isCodeFile(filePath: string): boolean {
    return ['.ts', '.tsx', '.js', '.jsx'].some(ext => filePath.endsWith(ext));
  }
}

// ============================================================================
// Exports
// ============================================================================

export { FEATURE_SYSTEM_MAP, RISK_WEIGHTS };
