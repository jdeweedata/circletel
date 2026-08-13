import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { issueUnjaniNpcMonthlyPack } from '@/lib/billing/unjani-npc-pack';

export const unjaniNpcMonthlyPackFunction = inngest.createFunction(
  {
    id: 'unjani-npc-monthly-pack',
    name: 'Unjani NPC monthly invoice and statement pack',
    retries: 3,
    triggers: [
      { cron: 'TZ=Africa/Johannesburg 0 8 * * 1' },
      { event: 'billing/unjani-npc-pack.requested' },
    ],
  },
  async ({ event, step }) => {
    const eventData = event?.data as
      | { force?: boolean; dryRun?: boolean }
      | undefined;

    return step.run('issue-npc-pack', async () => {
      const supabase = await createClient();
      return issueUnjaniNpcMonthlyPack(supabase, {
        force: eventData?.force === true,
        dryRun: eventData?.dryRun === true,
      });
    });
  }
);
