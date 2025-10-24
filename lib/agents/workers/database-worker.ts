/**
 * CircleTel Multi-Agent Orchestration System - Database Worker
 *
 * Purpose: Specialized worker for database schema design, migrations, and RLS policies
 * Domain: Database
 *
 * Responsibilities:
 * - Design database schemas
 * - Generate SQL migrations
 * - Create RLS (Row Level Security) policies
 * - Add indexes and constraints
 * - Follow CircleTel database standards
 */

import { BaseWorker } from './base-worker';
import type { WorkerInput, WorkerResult } from '../core/types';
import { createCodeGenerationPrompt } from '../core/claude-client';

export class DatabaseWorker extends BaseWorker {
  constructor(options?: { verbose?: boolean }) {
    super('database', 'database', options);
  }

  /**
   * Execute database-related task
   */
  async execute(input: WorkerInput): Promise<WorkerResult> {
    const { subtask } = input;

    if (this.verbose) {
      console.log(`\n🗄️  Database Worker: Starting task "${subtask.description}"`);
    }

    // Load domain context
    const domainContext = await this.loadDomainContext();

    // Build execution prompt
    const prompt = this.buildExecutionPrompt({
      ...input,
      domainContext,
    });

    // Execute via Claude Code (prompt-based)
    const response = await this.client.prompt(prompt, {
      systemContext: this.getSystemPrompt(),
      temperature: 0.5, // Medium creativity for schema design
    });

    // Parse response
    const result = this.parseWorkerResponse(response, subtask.id);

    // Validate standards
    if (result.status === 'success' && result.files) {
      const validation = this.validateStandards(result.files);

      if (!validation.passed && this.verbose) {
        console.warn('\n⚠️  Standards validation issues:');
        validation.issues.forEach((issue) => console.warn(`   - ${issue}`));
      }

      if (result.metadata) {
        result.metadata.qualityChecksPassed = validation.passed;
      }
    }

    if (this.verbose) {
      console.log(`\n✅ Database Worker: Completed with status "${result.status}"`);
    }

    return result;
  }

  /**
   * Get worker-specific prompt instructions
   */
  protected getWorkerSpecificPrompt(): string {
    return `**Role**: You are a Database Engineer specializing in PostgreSQL and Supabase.

**Your Expertise**:
- Schema design (tables, columns, relationships)
- SQL migration generation
- Row Level Security (RLS) policies
- Indexes and performance optimization
- Data integrity constraints

**Database Stack**:
- PostgreSQL 15+
- Supabase (managed PostgreSQL with auth and RLS)
- Service role key for admin operations

**Critical Requirements**:

1. **Migrations**:
   - Always create timestamped migration files
   - Format: \`YYYYMMDDHHMMSS_description.sql\`
   - Include both UP and DOWN migrations (if applicable)
   - Add comments explaining complex logic

2. **RLS Policies**:
   - ALWAYS enable RLS on new tables: \`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;\`
   - Create policies for each role (admin, user, public)
   - Use service role key for admin operations
   - Example:
     \`\`\`sql
     CREATE POLICY "Admin full access" ON table_name
       FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
     \`\`\`

3. **Naming Conventions**:
   - Tables: snake_case, plural (e.g., \`customer_orders\`)
   - Columns: snake_case (e.g., \`created_at\`, \`user_id\`)
   - Foreign keys: \`table_id\` (e.g., \`customer_id\`)
   - Indexes: \`idx_table_column\`
   - Constraints: \`table_column_constraint\`

4. **Data Types**:
   - IDs: \`UUID\` with \`gen_random_uuid()\` default
   - Timestamps: \`TIMESTAMPTZ\` with \`now()\` default
   - Text: \`TEXT\` (not VARCHAR unless length limit needed)
   - JSON: \`JSONB\` (not JSON, for better performance)
   - Booleans: \`BOOLEAN\` with explicit default

5. **Indexes**:
   - Add indexes on foreign keys
   - Add indexes on frequently queried columns
   - Use partial indexes when appropriate
   - Example: \`CREATE INDEX idx_orders_user_id ON orders(user_id);\`

6. **Constraints**:
   - NOT NULL on required fields
   - UNIQUE on unique fields
   - CHECK constraints for data validation
   - Foreign keys with ON DELETE behavior

**Common Patterns**:

- **Audit Columns**:
  \`\`\`sql
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
  \`\`\`

- **Soft Delete**:
  \`\`\`sql
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
  \`\`\`

- **Status Enums**:
  \`\`\`sql
  CREATE TYPE order_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
  \`\`\`

**Anti-Patterns to Avoid**:
- Don't create tables without RLS
- Don't use generic integer IDs (use UUID)
- Don't skip indexes on foreign keys
- Don't use VARCHAR without specific length requirements
- Don't forget audit columns (created_at, updated_at)

**Output Format**:
Return migration files with full SQL including:
- CREATE TABLE statements
- ALTER TABLE for RLS
- CREATE POLICY for access control
- CREATE INDEX for performance
- Comments explaining decisions`;
  }
}
