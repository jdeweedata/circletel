import { inngest } from '../client';
import { parseYearMonth } from '@/lib/billing/cycle-match/period';
import { runCycleMatch } from '@/lib/billing/cycle-match/run-cycle-match';
import { cronLogger } from '@/lib/logging';

export const billingCycleMatchFunction = inngest.createFunction(
  {
    id: 'billing-cycle-match',
    name: 'Billing cycle three-way match',
    retries: 2,
    triggers: [
      { cron: '0 6 3 * *' },
      { event: 'billing/cycle-match.requested' },
    ],
  },
  async ({ event, step }) => {
    const data = (event?.data || {}) as {
      triggered_by?: 'cron' | 'manual';
      yearMonth?: string;
      admin_user_id?: string;
    };
    const triggeredBy = data.triggered_by ?? 'cron';
    const yearMonth = parseYearMonth(data.yearMonth);

    try {
      const result = await step.run('snapshot-cycle', async () =>
        runCycleMatch({
          yearMonth,
          triggeredBy,
          userId: data.admin_user_id ?? null,
        })
      );

      await step.run('send-completed-event', async () => {
        await inngest.send({
          name: 'billing/cycle-match.completed',
          data: {
            run_id: result.runId,
            yearMonth: result.yearMonth,
            services_checked: result.servicesChecked,
            exception_count: result.exceptionCount,
          },
        });
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cycle match failed';
      cronLogger.error('[cycle-match] Inngest run failed', { yearMonth, error: message });
      await step.run('send-failure-event', async () => {
        await inngest.send({
          name: 'billing/cycle-match.failed',
          data: { yearMonth, error: message },
        });
      });
      throw error;
    }
  }
);
