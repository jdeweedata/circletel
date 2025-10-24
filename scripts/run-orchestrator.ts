#!/usr/bin/env node
/**
 * CircleTel Multi-Agent Orchestration System - CLI Runner
 *
 * Purpose: Manual invocation script for orchestrator
 * Usage: npm run orchestrate -- "implement customer referral program"
 *
 * This script allows running the orchestration system from command line
 * without Claude Code's slash command interface.
 */

import { SonnetOrchestrator } from '../lib/agents/core/sonnet-orchestrator';
import { getWorkflowEngine } from '../lib/agents/core/workflow-engine';

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  const userPrompt = args.join(' ');

  console.log('\n' + '='.repeat(80));
  console.log('🤖 CircleTel Multi-Agent Orchestration System');
  console.log('='.repeat(80));
  console.log(`\n📝 Task: ${userPrompt}\n`);

  try {
    // Step 1: Analyze and create execution plan
    console.log('📊 Step 1: Analyzing task and creating execution plan...\n');
    const orchestrator = new SonnetOrchestrator({ verbose: true });

    const plan = await orchestrator.analyzeAndPlan({
      userPrompt,
      context: {
        projectPath: process.cwd(),
      },
    });

    console.log('\n✅ Execution plan created!\n');
    console.log('📋 Plan Summary:');
    console.log(`   Intent: ${plan.analysis.intent}`);
    console.log(`   Complexity: ${plan.analysis.complexity}`);
    console.log(`   Layers: ${plan.analysis.layers.join(', ')}`);
    console.log(`   Estimated time: ${plan.dag.totalEstimatedMinutes} minutes`);
    console.log(`   Tasks: ${plan.dag.tasks.length}`);
    console.log(`   Workers: ${plan.analysis.suggestedWorkers.join(', ')}`);

    // Display task breakdown
    console.log('\n📦 Task Breakdown:');
    plan.dag.tasks.forEach((task, i) => {
      console.log(`   ${i + 1}. [${task.worker}] ${task.description}`);
      if (task.dependencies.length > 0) {
        console.log(`      Dependencies: ${task.dependencies.join(', ')}`);
      }
    });

    // Display quality gates
    console.log('\n🔍 Quality Gates:');
    plan.qualityGates.forEach((gate) => {
      console.log(`   - ${gate.name}: ${gate.description}`);
    });

    // Ask for confirmation (in real implementation)
    console.log('\n⚠️  Note: This is a prompt-based system.');
    console.log('    Workers will generate structured prompts for Claude Code to execute.');
    console.log('    Execution is sequential (not parallel) and may take longer.\n');

    // Step 2: Execute workflow
    console.log('🚀 Step 2: Executing workflow...\n');
    const workflowEngine = getWorkflowEngine({ verbose: true });

    const result = await workflowEngine.execute(plan, {
      onProgress: (progress) => {
        console.log(
          `\n📊 Progress: ${progress.progress.toFixed(0)}% ` +
            `(${progress.completedTasks}/${progress.totalTasks} tasks)`
        );
      },
      stopOnError: true,
    });

    // Step 3: Display results
    console.log('\n' + '='.repeat(80));
    console.log('📊 EXECUTION RESULTS');
    console.log('='.repeat(80) + '\n');

    console.log(workflowEngine.getSummaryMarkdown(result));

    // Step 4: Show generated files
    const files = workflowEngine.getAggregatedFiles(result);
    if (files.length > 0) {
      console.log('\n📁 Generated Files:');
      files.forEach((file) => {
        console.log(`   ${file.action === 'create' ? '✨' : '✏️ '} ${file.path}`);
      });
    }

    // Step 5: Next steps
    console.log('\n' + '='.repeat(80));
    if (result.status === 'success') {
      console.log('✅ Orchestration completed successfully!\n');
      console.log('📋 Next Steps:');
      console.log('   1. Review generated files above');
      console.log('   2. Run `npm run type-check` to verify TypeScript');
      console.log('   3. Run `npm run dev:memory` to test locally');
      console.log('   4. Run tests if applicable');
      console.log('   5. Commit changes when ready\n');
      process.exit(0);
    } else {
      console.log('❌ Orchestration failed. Please review errors above.\n');
      console.log('💡 Troubleshooting:');
      console.log('   1. Check error messages in task results');
      console.log('   2. Review quality gate failures');
      console.log('   3. Fix issues and re-run orchestrator');
      console.log('   4. Try with more specific task description\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    if (error instanceof Error) {
      console.error(`\n${error.message}`);
      if (error.stack) {
        console.error(`\nStack trace:\n${error.stack}`);
      }
    }
    process.exit(1);
  }
}

// ============================================================================
// Help Text
// ============================================================================

function printHelp() {
  console.log(`
🤖 CircleTel Multi-Agent Orchestration System - CLI Runner

USAGE:
  npm run orchestrate -- "task description"
  npm run orchestrate -- --help

DESCRIPTION:
  Analyzes complex tasks and orchestrates specialized workers to implement
  complete features with database migrations, API routes, UI components, and tests.

EXAMPLES:
  npm run orchestrate -- "implement customer referral program"
  npm run orchestrate -- "add multi-tenant organization support"
  npm run orchestrate -- "create admin analytics dashboard"
  npm run orchestrate -- "build payment subscription system"

WORKERS:
  - user-stories:  Product analysis and user story generation
  - database:      Schema design, migrations, RLS policies
  - api:           Next.js API routes with validation and RBAC
  - ui:            React components with shadcn/ui and CircleTel design
  - test:          Unit, integration, and E2E tests

QUALITY GATES:
  - TypeScript validation (no 'any', strict types)
  - RBAC enforcement (permission checks on admin routes)
  - Standards compliance (CircleTel design system, patterns)
  - Build verification (Next.js build success)
  - Test coverage (unit, integration, E2E)

EXECUTION:
  Sequential execution of workers based on dependency graph (DAG).
  Workers run one after another in topological order.

OUTPUT:
  - Complete execution plan with time estimates
  - All generated files (migrations, routes, components, tests)
  - Quality gate results
  - Summary markdown with next steps

WHEN TO USE:
  ✅ Complex features spanning multiple layers (database + API + UI + tests)
  ✅ Features requiring 30+ minutes of work
  ✅ Production-ready implementations with quality gates
  ❌ Simple one-file changes
  ❌ Quick bug fixes
  ❌ Exploration or research tasks

REQUIREMENTS:
  - Node.js 18+
  - TypeScript project
  - CircleTel codebase
  - Domain memory files in .claude/memory/

NOTES:
  - This is a prompt-based system (no API key required)
  - Works with Claude Code + Claude Max subscription
  - Execution is sequential (not parallel)
  - May take 60-90 minutes for complex features

For more information, see:
  - docs/agents/MULTI_AGENT_IMPLEMENTATION_STATUS.md
  - lib/agents/README.md
`);
}

// ============================================================================
// Run Main
// ============================================================================

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
