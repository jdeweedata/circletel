/**
 * CircleTel Multi-Agent Orchestration System - API Worker
 *
 * Purpose: Specialized worker for backend API development
 * Domain: Backend
 *
 * Responsibilities:
 * - Generate Next.js API routes
 * - Add request validation (Zod)
 * - Implement error handling
 * - Add RBAC permission checks
 * - Follow RESTful conventions
 */

import { BaseWorker } from './base-worker';
import type { WorkerInput, WorkerResult } from '../core/types';

export class ApiWorker extends BaseWorker {
  constructor(options?: { verbose?: boolean }) {
    super('api', 'backend', options);
  }

  async execute(input: WorkerInput): Promise<WorkerResult> {
    const { subtask } = input;

    if (this.verbose) {
      console.log(`\n⚙️  API Worker: Starting task "${subtask.description}"`);
    }

    const domainContext = await this.loadDomainContext();
    const prompt = this.buildExecutionPrompt({ ...input, domainContext });

    const response = await this.client.prompt(prompt, {
      systemContext: this.getSystemPrompt(),
      temperature: 0.4, // Lower temperature for consistent API patterns
    });

    const result = this.parseWorkerResponse(response, subtask.id);

    if (result.status === 'success' && result.files) {
      const validation = this.validateStandards(result.files);
      if (result.metadata) {
        result.metadata.qualityChecksPassed = validation.passed;
      }
    }

    if (this.verbose) {
      console.log(`\n✅ API Worker: Completed with status "${result.status}"`);
    }

    return result;
  }

  protected getWorkerSpecificPrompt(): string {
    return `**Role**: You are a Backend API Engineer specializing in Next.js App Router.

**Your Expertise**:
- Next.js 15 API routes (\`/app/api/\`)
- Request validation (Zod schemas)
- Error handling and proper HTTP status codes
- RBAC permission checks
- Supabase database operations

**API Route Pattern (Next.js 15)**:
\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Request schema
const requestSchema = z.object({
  field1: z.string(),
  field2: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Parse and validate request
    const body = await request.json();
    const validated = requestSchema.parse(body);

    // RBAC check (if needed)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Business logic
    const { data, error } = await supabase
      .from('table_name')
      .insert(validated)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
\`\`\`

**Critical Requirements**:
1. **Always use try-catch** for error handling
2. **Always use Zod** for request validation
3. **Always check permissions** for protected routes
4. **Always use NextResponse** for responses
5. **Always return typed responses**: \`{ success: boolean, data?: T, error?: string }\`

**HTTP Status Codes**:
- 200: Success
- 201: Created
- 400: Bad request (validation error)
- 401: Unauthorized (not logged in)
- 403: Forbidden (no permission)
- 404: Not found
- 500: Internal server error

**File Location**: \`/app/api/[endpoint]/route.ts\`

**Output**: Generate complete API route files with validation, error handling, and RBAC.`;
  }
}
