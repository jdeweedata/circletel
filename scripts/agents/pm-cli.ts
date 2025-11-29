#!/usr/bin/env npx ts-node

/**
 * PM Agent CLI
 *
 * Command-line interface for the PM Agent that generates Agent-OS specifications
 * from natural language feature requests.
 *
 * @example
 * ```bash
 * # Generate a full spec
 * npx ts-node scripts/agents/pm-cli.ts generate "Add user dashboard"
 *
 * # Quick analysis
 * npx ts-node scripts/agents/pm-cli.ts analyze "Add SMS notifications"
 *
 * # With options
 * npx ts-node scripts/agents/pm-cli.ts generate "Critical fix" --priority critical --verbose
 * ```
 *
 * @module scripts/agents/pm-cli
 */

import { PMAgent, FeatureRequest } from '../../lib/agents/pm';

// ============================================================================
// Types
// ============================================================================

interface CLIOptions {
  action: 'generate' | 'analyze' | 'help';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  output: string;
  verbose: boolean;
}

// ============================================================================
// Console Styling
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message: string, color: keyof typeof colors = 'white'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title: string): void {
  console.log('');
  log('═'.repeat(50), 'cyan');
  log(` ${title}`, 'cyan');
  log('═'.repeat(50), 'cyan');
  console.log('');
}

function logStep(step: string, status: 'pending' | 'running' | 'success' | 'error' = 'pending'): void {
  const icons = {
    pending: '[..]',
    running: '[>>]',
    success: '[OK]',
    error: '[!!]',
  };
  const statusColors: Record<string, keyof typeof colors> = {
    pending: 'dim',
    running: 'yellow',
    success: 'green',
    error: 'red',
  };
  log(`${icons[status]} ${step}`, statusColors[status]);
}

function logError(message: string): void {
  console.log('');
  log(`ERROR: ${message}`, 'red');
  console.log('');
}

function logSuccess(message: string): void {
  console.log('');
  log(`SUCCESS: ${message}`, 'green');
  console.log('');
}

function logInfo(label: string, value: string): void {
  console.log(`${colors.dim}${label}:${colors.reset} ${value}`);
}

// ============================================================================
// Argument Parsing
// ============================================================================

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    action: 'help',
    description: '',
    priority: 'medium',
    output: 'agent-os/specs',
    verbose: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === 'generate' || arg === 'analyze' || arg === 'help') {
      options.action = arg;
    } else if (arg === '--priority' || arg === '-p') {
      const value = args[++i];
      if (['low', 'medium', 'high', 'critical'].includes(value)) {
        options.priority = value as CLIOptions['priority'];
      }
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      options.action = 'help';
    } else if (!arg.startsWith('-') && !options.description) {
      // Collect description (everything that's not a flag)
      options.description = arg.replace(/^["']|["']$/g, '');
    } else if (!arg.startsWith('-')) {
      // Append to description
      options.description += ' ' + arg.replace(/^["']|["']$/g, '');
    }

    i++;
  }

  return options;
}

// ============================================================================
// Help
// ============================================================================

function showHelp(): void {
  logHeader('PM Agent CLI - Spec Generator');

  log('USAGE:', 'yellow');
  console.log('  npx ts-node scripts/agents/pm-cli.ts <action> <description> [options]');
  console.log('');

  log('ACTIONS:', 'yellow');
  console.log('  generate    Generate a full Agent-OS specification');
  console.log('  analyze     Quick impact analysis (no files created)');
  console.log('  help        Show this help message');
  console.log('');

  log('OPTIONS:', 'yellow');
  console.log('  --priority, -p   low | medium | high | critical (default: medium)');
  console.log('  --output, -o     Output directory (default: agent-os/specs)');
  console.log('  --verbose, -v    Enable verbose output');
  console.log('  --help, -h       Show this help message');
  console.log('');

  log('EXAMPLES:', 'yellow');
  console.log('  npx ts-node scripts/agents/pm-cli.ts generate "Add user dashboard"');
  console.log('  npx ts-node scripts/agents/pm-cli.ts analyze "Add SMS notifications" -p high');
  console.log('  npx ts-node scripts/agents/pm-cli.ts generate "Critical fix" --priority critical -v');
  console.log('');

  log('OUTPUT:', 'yellow');
  console.log('  Specs are saved to: agent-os/specs/YYYYMMDD-feature-name/');
  console.log('    - README.md       Quick overview');
  console.log('    - SPEC.md         Full specification');
  console.log('    - TASKS.md        Task breakdown by agent');
  console.log('    - PROGRESS.md     Progress tracking');
  console.log('    - architecture.md Technical architecture');
  console.log('');
}

// ============================================================================
// Actions
// ============================================================================

async function runGenerate(options: CLIOptions): Promise<void> {
  logHeader('PM Agent - GENERATE SPEC');

  if (!options.description) {
    logError('Description is required. Use: pm-cli generate "Your feature description"');
    process.exit(1);
  }

  logInfo('Feature', options.description);
  logInfo('Priority', options.priority);
  logInfo('Output', options.output);
  console.log('');

  // Create PM Agent
  const agent = PMAgent.forDevelopment();

  // Set up event listeners
  agent.on('spec:analyzing:codebase', () => {
    logStep('Analyzing codebase...', 'running');
  });

  agent.on('spec:analyzing:impact', () => {
    logStep('Analyzing codebase...', 'success');
    logStep('Assessing impact...', 'running');
  });

  agent.on('spec:generating:spec', () => {
    logStep('Assessing impact...', 'success');
    logStep('Generating specification...', 'running');
  });

  agent.on('spec:generating:tasks', () => {
    logStep('Generating specification...', 'success');
    logStep('Breaking down tasks...', 'running');
  });

  agent.on('spec:generating:architecture', () => {
    logStep('Breaking down tasks...', 'success');
    logStep('Documenting architecture...', 'running');
  });

  agent.on('spec:generation:completed', (data) => {
    logStep('Documenting architecture...', 'success');
  });

  try {
    // Start the agent
    await agent.start();

    // Generate spec
    const featureRequest: FeatureRequest = {
      description: options.description,
      priority: options.priority,
    };

    const result = await agent.generateSpec(featureRequest);

    // Stop the agent
    await agent.stop();

    // Display results
    console.log('');
    log('─'.repeat(50), 'dim');
    console.log('');

    log('SPEC GENERATED', 'green');
    console.log('');

    logInfo('Spec ID', result.specId);
    logInfo('Location', result.specPath);
    console.log('');

    log('Files Created:', 'cyan');
    console.log('  - README.md (overview)');
    console.log('  - SPEC.md (full specification)');
    console.log('  - TASKS.md (task breakdown)');
    console.log('  - PROGRESS.md (tracking)');
    console.log('  - architecture.md (technical docs)');
    console.log('');

    log('Impact Analysis:', 'cyan');
    console.log(`  - Files to create: ${result.impact.filesToCreate.length}`);
    console.log(`  - Files to modify: ${result.impact.filesToModify.length}`);
    console.log(`  - Database tables: ${result.impact.databaseTables.length}`);
    console.log(`  - API endpoints: ${result.impact.apiEndpoints.length}`);
    console.log('');

    log('Estimation:', 'cyan');
    console.log(`  - Total story points: ${result.estimatedPoints}`);
    console.log(`  - Risk level: ${result.impact.riskLevel}`);
    console.log('');

    if (result.impact.riskFactors.length > 0) {
      log('Risk Factors:', 'yellow');
      result.impact.riskFactors.forEach((factor) => {
        console.log(`  - ${factor}`);
      });
      console.log('');
    }

    logSuccess(`Spec saved to ${result.specPath}`);

  } catch (error) {
    logStep('Generation failed', 'error');
    logError(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

async function runAnalyze(options: CLIOptions): Promise<void> {
  logHeader('PM Agent - QUICK ANALYSIS');

  if (!options.description) {
    logError('Description is required. Use: pm-cli analyze "Your feature description"');
    process.exit(1);
  }

  logInfo('Feature', options.description);
  logInfo('Priority', options.priority);
  console.log('');

  // Create PM Agent
  const agent = PMAgent.forAPI(); // Use API config (no auto-save)

  try {
    // Start the agent
    await agent.start();

    logStep('Analyzing codebase...', 'running');

    // Quick analysis
    const result = await agent.quickAnalysis(options.description);

    logStep('Analyzing codebase...', 'success');
    logStep('Assessing impact...', 'running');

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 100));

    logStep('Assessing impact...', 'success');

    // Stop the agent
    await agent.stop();

    // Display results
    console.log('');
    log('─'.repeat(50), 'dim');
    console.log('');

    log('QUICK IMPACT ANALYSIS', 'cyan');
    console.log('');

    logInfo('Feature', options.description);
    logInfo('Estimated Points', String(result.estimatedPoints));
    logInfo('Risk Level', result.impact.riskLevel);
    console.log('');

    log('Codebase:', 'cyan');
    console.log(`  - Total files: ${result.codebase.structure.totalFiles}`);
    console.log(`  - Framework: ${result.codebase.techStack.framework}`);
    console.log(`  - Database: ${result.codebase.techStack.database}`);
    console.log('');

    log('File Changes:', 'cyan');
    console.log(`  Files to create: ${result.impact.filesToCreate.length}`);
    result.impact.filesToCreate.slice(0, 5).forEach((file) => {
      console.log(`    - ${file.path}: ${file.description}`);
    });
    if (result.impact.filesToCreate.length > 5) {
      console.log(`    ... and ${result.impact.filesToCreate.length - 5} more`);
    }
    console.log('');

    console.log(`  Files to modify: ${result.impact.filesToModify.length}`);
    result.impact.filesToModify.slice(0, 5).forEach((file) => {
      console.log(`    - ${file.path}: ${file.description}`);
    });
    if (result.impact.filesToModify.length > 5) {
      console.log(`    ... and ${result.impact.filesToModify.length - 5} more`);
    }
    console.log('');

    if (result.impact.databaseTables.length > 0) {
      log('Database Changes:', 'cyan');
      result.impact.databaseTables.forEach((table) => {
        console.log(`  - ${table.table} (${table.changeType}): ${table.description}`);
      });
      console.log('');
    }

    if (result.impact.apiEndpoints.length > 0) {
      log('API Endpoints:', 'cyan');
      result.impact.apiEndpoints.forEach((endpoint) => {
        console.log(`  - ${endpoint.method} ${endpoint.path}: ${endpoint.description}`);
      });
      console.log('');
    }

    if (result.impact.dependencies.length > 0) {
      log('Dependencies:', 'cyan');
      result.impact.dependencies.forEach((dep) => {
        console.log(`  - ${dep.name}: ${dep.reason}`);
      });
      console.log('');
    }

    if (result.impact.riskFactors.length > 0) {
      log('Risk Factors:', 'yellow');
      result.impact.riskFactors.forEach((factor) => {
        console.log(`  - ${factor}`);
      });
      console.log('');
    }

    console.log('');
    log('NOTE: This is a quick analysis. Use "generate" for a full specification.', 'dim');
    console.log('');

  } catch (error) {
    logStep('Analysis failed', 'error');
    logError(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.verbose) {
    log('Parsed options:', 'dim');
    console.log(JSON.stringify(options, null, 2));
    console.log('');
  }

  switch (options.action) {
    case 'generate':
      await runGenerate(options);
      break;
    case 'analyze':
      await runAnalyze(options);
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

main().catch((error) => {
  logError(error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
});
