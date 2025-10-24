/**
 * CircleTel Multi-Agent Orchestration System - UI Worker
 *
 * Purpose: Specialized worker for frontend component development
 * Domain: Frontend
 *
 * Responsibilities:
 * - Generate React components
 * - Use shadcn/ui and CircleTel design system
 * - Implement responsive design
 * - Add TypeScript types
 * - Follow component patterns
 */

import { BaseWorker } from './base-worker';
import type { WorkerInput, WorkerResult } from '../core/types';

export class UiWorker extends BaseWorker {
  constructor(options?: { verbose?: boolean }) {
    super('ui', 'frontend', options);
  }

  async execute(input: WorkerInput): Promise<WorkerResult> {
    const { subtask } = input;

    if (this.verbose) {
      console.log(`\n🎨 UI Worker: Starting task "${subtask.description}"`);
    }

    const domainContext = await this.loadDomainContext();
    const prompt = this.buildExecutionPrompt({ ...input, domainContext });

    const response = await this.client.prompt(prompt, {
      systemContext: this.getSystemPrompt(),
      temperature: 0.6, // Medium-high creativity for UI design
    });

    const result = this.parseWorkerResponse(response, subtask.id);

    if (result.status === 'success' && result.files) {
      const validation = this.validateStandards(result.files);
      if (result.metadata) {
        result.metadata.qualityChecksPassed = validation.passed;
      }
    }

    if (this.verbose) {
      console.log(`\n✅ UI Worker: Completed with status "${result.status}"`);
    }

    return result;
  }

  protected getWorkerSpecificPrompt(): string {
    return `**Role**: You are a Frontend Engineer specializing in React and Next.js.

**Your Expertise**:
- React 18+ components with TypeScript
- Next.js 15 App Router (Server/Client Components)
- shadcn/ui component library (Radix primitives)
- Tailwind CSS with CircleTel design system
- Responsive design (mobile-first)
- Accessibility (ARIA, semantic HTML)

**Component Pattern (Server Component)**:
\`\`\`typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ComponentProps } from '@/lib/types';

export default function MyComponent({ data }: ComponentProps) {
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-circleTel-orange">Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
}
\`\`\`

**Component Pattern (Client Component)**:
\`\`\`typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { ComponentProps } from '@/lib/types';

export function MyClientComponent({ initialData }: ComponentProps) {
  const [state, setState] = useState(initialData);
  const { toast } = useToast();

  const handleAction = async () => {
    try {
      // Business logic
      toast({ title: 'Success', variant: 'default' });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleAction} className="bg-circleTel-orange hover:bg-circleTel-orange/90">
        Action
      </Button>
    </div>
  );
}
\`\`\`

**CircleTel Design System**:
- **Colors**: Use Tailwind classes:
  - Primary: \`text-circleTel-orange\`, \`bg-circleTel-orange\`
  - Dark text: \`text-circleTel-darkNeutral\`
  - Light backgrounds: \`bg-circleTel-lightNeutral\`
- **Typography**: Arial/Helvetica sans-serif (default)
- **Spacing**: Use Tailwind spacing scale (space-y-4, gap-6, p-4)
- **Components**: Always use shadcn/ui from \`@/components/ui/\`

**Responsive Design**:
- Mobile-first approach
- Use Tailwind breakpoints: \`sm:\`, \`md:\`, \`lg:\`, \`xl:\`
- Example: \`<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">\`
- Test layouts at 320px, 768px, 1024px, 1920px

**Critical Requirements**:
1. **Always use 'use client'** for components with useState, useEffect, event handlers
2. **Always type props** with TypeScript interfaces
3. **Always use shadcn/ui** components (Button, Card, Input, etc.)
4. **Always use CircleTel colors** from Tailwind config
5. **Always handle loading states** and errors gracefully
6. **Always add accessibility** (aria-label, role, semantic HTML)

**File Location**: \`/components/[domain]/[ComponentName].tsx\`

**Available shadcn/ui Components**:
- Layout: Card, Separator, Tabs, ScrollArea
- Forms: Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch
- Data: Table, DataTable, Badge, Avatar
- Feedback: Toast, Alert, Dialog, Sheet, Popover
- Navigation: DropdownMenu, NavigationMenu, Breadcrumb

**State Management**:
- Server state: React Query (\`useQuery\`, \`useMutation\`)
- Client state: useState, useReducer
- Global state: Zustand (if needed)

**Output**: Generate complete React components with TypeScript types, shadcn/ui, and CircleTel design.`;
  }
}
