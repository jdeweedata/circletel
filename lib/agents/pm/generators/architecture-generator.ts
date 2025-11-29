/**
 * Architecture Generator
 *
 * Generates architecture documentation including workflow diagrams,
 * component diagrams, and data flow documentation.
 *
 * @module lib/agents/pm/generators/architecture-generator
 * @see agent-os/specs/20251129-agentic-ai-system/spec.md
 */

import {
  ArchitectureSection,
  WorkflowStage,
  Integration,
  ImpactAnalysis,
  CodebaseAnalysis,
  FeatureRequest,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Generated architecture output.
 */
export interface GeneratedArchitecture {
  /** Architecture section data */
  architecture: ArchitectureSection;
  /** Markdown content */
  content: string;
}

/**
 * Architecture generation options.
 */
export interface ArchitectureGeneratorOptions {
  /** Include ASCII diagrams */
  includeASCIIDiagrams?: boolean;
  /** Include integration details */
  includeIntegrations?: boolean;
  /** Include data flow */
  includeDataFlow?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Common integration patterns.
 */
const INTEGRATION_PATTERNS: Record<string, Integration> = {
  supabase: {
    name: 'Supabase',
    type: 'database',
    description: 'PostgreSQL database with RLS and real-time subscriptions',
    envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  },
  netcash: {
    name: 'NetCash Pay Now',
    type: 'payment',
    description: 'Payment processing with 20+ payment methods',
    envVars: ['NETCASH_SERVICE_KEY', 'NETCASH_MERCHANT_ID'],
  },
  zoho: {
    name: 'Zoho CRM',
    type: 'api',
    description: 'CRM and billing integration',
    envVars: ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN'],
  },
  clickatell: {
    name: 'Clickatell',
    type: 'sms',
    description: 'SMS notifications',
    envVars: ['CLICKATELL_API_KEY'],
  },
  didit: {
    name: 'Didit KYC',
    type: 'api',
    description: 'KYC verification service',
    envVars: ['DIDIT_API_KEY', 'DIDIT_WEBHOOK_SECRET'],
  },
  sendgrid: {
    name: 'SendGrid',
    type: 'email',
    description: 'Email delivery service',
    envVars: ['SENDGRID_API_KEY'],
  },
  google_maps: {
    name: 'Google Maps',
    type: 'api',
    description: 'Address validation and geocoding',
    envVars: ['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'],
  },
};

// ============================================================================
// Architecture Generator Class
// ============================================================================

/**
 * Generates architecture documentation.
 */
export class ArchitectureGenerator {
  private readonly options: Required<ArchitectureGeneratorOptions>;

  /**
   * Create a new ArchitectureGenerator.
   *
   * @param options - Generation options
   */
  constructor(options: ArchitectureGeneratorOptions = {}) {
    this.options = {
      includeASCIIDiagrams: options.includeASCIIDiagrams ?? true,
      includeIntegrations: options.includeIntegrations ?? true,
      includeDataFlow: options.includeDataFlow ?? true,
    };
  }

  // ==========================================================================
  // Main Generation Method
  // ==========================================================================

  /**
   * Generate architecture documentation.
   *
   * @param featureRequest - Feature being documented
   * @param codebaseAnalysis - Analysis of the codebase
   * @param impactAnalysis - Impact analysis
   * @returns Generated architecture
   */
  generate(
    featureRequest: FeatureRequest,
    codebaseAnalysis: CodebaseAnalysis,
    impactAnalysis: ImpactAnalysis
  ): GeneratedArchitecture {
    // Generate workflow stages
    const workflow = this.generateWorkflow(featureRequest, impactAnalysis);

    // Identify integrations
    const integrations = this.identifyIntegrations(featureRequest.description);

    // Generate diagrams
    const dataFlowDiagram = this.options.includeASCIIDiagrams
      ? this.generateDataFlowDiagram(workflow, integrations)
      : '';

    const componentDiagram = this.options.includeASCIIDiagrams
      ? this.generateComponentDiagram(impactAnalysis)
      : '';

    const architecture: ArchitectureSection = {
      workflow,
      integrations,
      dataFlowDiagram,
      componentDiagram,
    };

    // Build markdown content
    const content = this.buildArchitectureContent(
      architecture,
      featureRequest,
      codebaseAnalysis,
      impactAnalysis
    );

    return {
      architecture,
      content,
    };
  }

  // ==========================================================================
  // Workflow Generation
  // ==========================================================================

  /**
   * Generate workflow stages.
   */
  private generateWorkflow(
    featureRequest: FeatureRequest,
    impactAnalysis: ImpactAnalysis
  ): WorkflowStage[] {
    const stages: WorkflowStage[] = [];
    const description = featureRequest.description.toLowerCase();

    // Stage 1: Input/Trigger
    stages.push({
      number: 1,
      name: 'User Input',
      description: 'User initiates the action through the UI',
      inputs: ['User action (click, form submit, navigation)'],
      outputs: ['Request to frontend component'],
    });

    // Stage 2: Frontend Processing
    stages.push({
      number: 2,
      name: 'Frontend Processing',
      description: 'Frontend validates and prepares the request',
      inputs: ['User input data'],
      outputs: ['Validated request', 'Loading state update'],
    });

    // Stage 3: API Request (if has endpoints)
    if (impactAnalysis.apiEndpoints.length > 0) {
      stages.push({
        number: 3,
        name: 'API Request',
        description: 'Frontend sends request to backend API',
        inputs: ['Validated request data', 'Authentication token'],
        outputs: ['HTTP request to API route'],
      });

      // Stage 4: Backend Processing
      stages.push({
        number: 4,
        name: 'Backend Processing',
        description: 'API route handles the request',
        inputs: ['HTTP request', 'Auth context'],
        outputs: ['Business logic execution', 'Database queries'],
      });
    }

    // Stage 5: Database (if has tables)
    if (impactAnalysis.databaseTables.length > 0) {
      stages.push({
        number: stages.length + 1,
        name: 'Database Operations',
        description: 'Data persistence and retrieval',
        inputs: ['SQL queries', 'RLS context'],
        outputs: ['Query results', 'Mutation confirmations'],
      });
    }

    // Stage 6: External Services (if integrations detected)
    const integrations = this.identifyIntegrations(description);
    if (integrations.length > 0) {
      stages.push({
        number: stages.length + 1,
        name: 'External Services',
        description: `Integration with ${integrations.map(i => i.name).join(', ')}`,
        inputs: ['Service requests'],
        outputs: ['Service responses'],
      });
    }

    // Final Stage: Response
    stages.push({
      number: stages.length + 1,
      name: 'Response',
      description: 'Response returned to user',
      inputs: ['Operation result'],
      outputs: ['UI update', 'Success/error notification'],
    });

    return stages;
  }

  // ==========================================================================
  // Integration Detection
  // ==========================================================================

  /**
   * Identify required integrations from description.
   */
  private identifyIntegrations(description: string): Integration[] {
    const integrations: Integration[] = [];
    const lowerDesc = description.toLowerCase();

    // Always include Supabase for database features
    if (
      lowerDesc.includes('database') ||
      lowerDesc.includes('store') ||
      lowerDesc.includes('save') ||
      lowerDesc.includes('persist')
    ) {
      integrations.push(INTEGRATION_PATTERNS.supabase);
    }

    // Payment integrations
    if (lowerDesc.includes('payment') || lowerDesc.includes('checkout') || lowerDesc.includes('billing')) {
      integrations.push(INTEGRATION_PATTERNS.netcash);
    }

    // CRM integrations
    if (lowerDesc.includes('crm') || lowerDesc.includes('zoho') || lowerDesc.includes('customer')) {
      integrations.push(INTEGRATION_PATTERNS.zoho);
    }

    // Communication integrations
    if (lowerDesc.includes('sms') || lowerDesc.includes('message')) {
      integrations.push(INTEGRATION_PATTERNS.clickatell);
    }

    if (lowerDesc.includes('email') || lowerDesc.includes('notification')) {
      integrations.push(INTEGRATION_PATTERNS.sendgrid);
    }

    // KYC integration
    if (lowerDesc.includes('kyc') || lowerDesc.includes('verification') || lowerDesc.includes('identity')) {
      integrations.push(INTEGRATION_PATTERNS.didit);
    }

    // Maps integration
    if (lowerDesc.includes('address') || lowerDesc.includes('location') || lowerDesc.includes('map')) {
      integrations.push(INTEGRATION_PATTERNS.google_maps);
    }

    return integrations;
  }

  // ==========================================================================
  // Diagram Generation
  // ==========================================================================

  /**
   * Generate ASCII data flow diagram.
   */
  private generateDataFlowDiagram(workflow: WorkflowStage[], integrations: Integration[]): string {
    const lines: string[] = [];

    // Header
    lines.push('┌─────────────────────────────────────────────────────────────────┐');
    lines.push('│                        DATA FLOW DIAGRAM                         │');
    lines.push('└─────────────────────────────────────────────────────────────────┘');
    lines.push('');

    // Build flow
    for (let i = 0; i < workflow.length; i++) {
      const stage = workflow[i];
      const boxWidth = 30;
      const name = this.centerText(stage.name, boxWidth - 4);

      lines.push(`  ┌${'─'.repeat(boxWidth)}┐`);
      lines.push(`  │ [${stage.number}] ${name} │`);
      lines.push(`  └${'─'.repeat(boxWidth)}┘`);

      if (i < workflow.length - 1) {
        lines.push('            │');
        lines.push('            ▼');
      }
    }

    // Add integrations if present
    if (integrations.length > 0) {
      lines.push('');
      lines.push('  External Integrations:');
      for (const integration of integrations) {
        lines.push(`  ◇ ${integration.name} (${integration.type})`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate ASCII component diagram.
   */
  private generateComponentDiagram(impactAnalysis: ImpactAnalysis): string {
    const lines: string[] = [];

    // Header
    lines.push('┌─────────────────────────────────────────────────────────────────┐');
    lines.push('│                      COMPONENT DIAGRAM                           │');
    lines.push('└─────────────────────────────────────────────────────────────────┘');
    lines.push('');

    // Frontend layer
    const frontendFiles = impactAnalysis.filesToCreate.filter(
      f => f.path.includes('component') || f.path.includes('page')
    );
    if (frontendFiles.length > 0) {
      lines.push('┌─────────────────────────────────────────┐');
      lines.push('│              FRONTEND LAYER              │');
      lines.push('├─────────────────────────────────────────┤');
      for (const file of frontendFiles.slice(0, 5)) {
        const name = file.path.split('/').pop() || file.path;
        lines.push(`│  □ ${name.padEnd(35)} │`);
      }
      if (frontendFiles.length > 5) {
        lines.push(`│  ... and ${frontendFiles.length - 5} more files              │`);
      }
      lines.push('└─────────────────────────────────────────┘');
      lines.push('                    │');
      lines.push('                    ▼');
    }

    // API layer
    if (impactAnalysis.apiEndpoints.length > 0) {
      lines.push('┌─────────────────────────────────────────┐');
      lines.push('│                API LAYER                 │');
      lines.push('├─────────────────────────────────────────┤');
      for (const endpoint of impactAnalysis.apiEndpoints.slice(0, 5)) {
        const route = `${endpoint.method} ${endpoint.path}`;
        lines.push(`│  ○ ${route.padEnd(35)} │`);
      }
      if (impactAnalysis.apiEndpoints.length > 5) {
        lines.push(`│  ... and ${impactAnalysis.apiEndpoints.length - 5} more endpoints         │`);
      }
      lines.push('└─────────────────────────────────────────┘');
      lines.push('                    │');
      lines.push('                    ▼');
    }

    // Database layer
    if (impactAnalysis.databaseTables.length > 0) {
      lines.push('┌─────────────────────────────────────────┐');
      lines.push('│              DATABASE LAYER              │');
      lines.push('├─────────────────────────────────────────┤');
      for (const table of impactAnalysis.databaseTables) {
        const name = `${table.table} (${table.changeType})`;
        lines.push(`│  ◆ ${name.padEnd(35)} │`);
      }
      lines.push('└─────────────────────────────────────────┘');
    }

    return lines.join('\n');
  }

  /**
   * Center text within a given width.
   */
  private centerText(text: string, width: number): string {
    if (text.length >= width) return text.slice(0, width);
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text + ' '.repeat(width - padding - text.length);
  }

  // ==========================================================================
  // Content Generation
  // ==========================================================================

  /**
   * Build the full architecture markdown content.
   */
  private buildArchitectureContent(
    architecture: ArchitectureSection,
    featureRequest: FeatureRequest,
    codebaseAnalysis: CodebaseAnalysis,
    impactAnalysis: ImpactAnalysis
  ): string {
    const sections: string[] = [];

    // Header
    sections.push(`# Architecture Documentation

## Overview

This document describes the technical architecture for implementing: **${featureRequest.description}**`);

    // Technology Stack
    sections.push(this.buildTechStackSection(codebaseAnalysis));

    // Workflow
    sections.push(this.buildWorkflowSection(architecture.workflow));

    // Data Flow Diagram
    if (this.options.includeASCIIDiagrams && architecture.dataFlowDiagram) {
      sections.push(`## Data Flow Diagram

\`\`\`
${architecture.dataFlowDiagram}
\`\`\``);
    }

    // Component Diagram
    if (this.options.includeASCIIDiagrams && architecture.componentDiagram) {
      sections.push(`## Component Diagram

\`\`\`
${architecture.componentDiagram}
\`\`\``);
    }

    // Integrations
    if (this.options.includeIntegrations && architecture.integrations.length > 0) {
      sections.push(this.buildIntegrationsSection(architecture.integrations));
    }

    // Data Model
    if (impactAnalysis.databaseTables.length > 0) {
      sections.push(this.buildDataModelSection(impactAnalysis));
    }

    // Security Considerations
    sections.push(this.buildSecuritySection(impactAnalysis));

    // Performance Considerations
    sections.push(this.buildPerformanceSection(impactAnalysis));

    return sections.join('\n\n');
  }

  /**
   * Build tech stack section.
   */
  private buildTechStackSection(codebaseAnalysis: CodebaseAnalysis): string {
    const { techStack } = codebaseAnalysis;

    return `## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | ${techStack.framework} |
| Language | ${techStack.language} |
| Database | ${techStack.database} |
| Styling | ${techStack.styling} |
| Testing | ${techStack.testing} |`;
  }

  /**
   * Build workflow section.
   */
  private buildWorkflowSection(workflow: WorkflowStage[]): string {
    let content = `## Workflow

### Process Flow

${workflow.map(stage => `${stage.number}. **${stage.name}**: ${stage.description}`).join('\n')}

### Stage Details`;

    for (const stage of workflow) {
      content += `

#### Stage ${stage.number}: ${stage.name}

${stage.description}

**Inputs**:
${stage.inputs.map(i => `- ${i}`).join('\n')}

**Outputs**:
${stage.outputs.map(o => `- ${o}`).join('\n')}`;
    }

    return content;
  }

  /**
   * Build integrations section.
   */
  private buildIntegrationsSection(integrations: Integration[]): string {
    let content = `## External Integrations

### Integration Summary

| Service | Type | Description |
|---------|------|-------------|
${integrations.map(i => `| ${i.name} | ${i.type} | ${i.description} |`).join('\n')}

### Environment Variables

The following environment variables are required:

\`\`\`env
${integrations.flatMap(i => i.envVars || []).map(v => `${v}=<value>`).join('\n')}
\`\`\`

### Integration Details`;

    for (const integration of integrations) {
      content += `

#### ${integration.name}

- **Type**: ${integration.type}
- **Description**: ${integration.description}
- **Required Variables**: ${integration.envVars?.join(', ') || 'None'}`;
    }

    return content;
  }

  /**
   * Build data model section.
   */
  private buildDataModelSection(impactAnalysis: ImpactAnalysis): string {
    return `## Data Model

### Tables

| Table | Operation | Description |
|-------|-----------|-------------|
${impactAnalysis.databaseTables.map(t => `| \`${t.table}\` | ${t.changeType.toUpperCase()} | ${t.description} |`).join('\n')}

### Relationships

*Define table relationships based on the implementation requirements.*

### Access Control

- Row Level Security (RLS) will be enabled on all tables
- Access patterns will be defined based on user roles
- Service role access for server-side operations`;
  }

  /**
   * Build security section.
   */
  private buildSecuritySection(impactAnalysis: ImpactAnalysis): string {
    const considerations: string[] = [
      'All API routes must verify authentication',
      'RLS policies enforce data access control',
      'Input validation on all user inputs',
      'HTTPS for all communications',
    ];

    if (impactAnalysis.riskLevel === 'high') {
      considerations.push('Security review required before deployment');
      considerations.push('Penetration testing recommended');
    }

    if (impactAnalysis.riskFactors.some(f => f.includes('Payment'))) {
      considerations.push('PCI compliance considerations');
      considerations.push('Secure payment token handling');
    }

    return `## Security Considerations

${considerations.map(c => `- ${c}`).join('\n')}`;
  }

  /**
   * Build performance section.
   */
  private buildPerformanceSection(impactAnalysis: ImpactAnalysis): string {
    const considerations: string[] = [
      'Database indexes for frequently queried columns',
      'Caching for static data',
      'Lazy loading for large components',
      'Pagination for list endpoints',
    ];

    if (impactAnalysis.databaseTables.length > 0) {
      considerations.push('Query optimization for complex joins');
    }

    if (impactAnalysis.apiEndpoints.length > 5) {
      considerations.push('Rate limiting on public endpoints');
    }

    return `## Performance Considerations

${considerations.map(c => `- ${c}`).join('\n')}`;
  }
}

// ============================================================================
// Exports
// ============================================================================

export default ArchitectureGenerator;
export { INTEGRATION_PATTERNS };
