import {
  issueUnjaniNpcMonthlyPack,
  packDatesFor,
} from '@/lib/billing/unjani-npc-pack';
import { UNJANI_NPC_BILLING_START } from '@/lib/billing/unjani-connect-rules';

// The start-date guard returns before any database call, so a Supabase stub
// that throws the moment it is touched is enough to prove which side of the
// cutover we landed on:
//   returns skipped, stub untouched -> guard held
//   throws TOUCHED                  -> guard let it through
// No mocks, no database, no PDF or email machinery.
const TOUCHED = 'SUPABASE_TOUCHED';
const supabase = new Proxy(
  {},
  {
    get() {
      throw new Error(TOUCHED);
    },
  }
) as never;

const at = (iso: string) => new Date(`${iso}T06:00:00Z`);

describe('Unjani NPC pack — commercial start date', () => {
  it('starts NPC billing on 1 September 2026', () => {
    expect(UNJANI_NPC_BILLING_START).toBe('2026-09-01');
  });

  // Last Monday bills the next month in advance. 27 Jul → August service,
  // which is still per-clinic and must not go to NPC.
  it('does not issue an August (in-advance) pack on Monday 27 July 2026', async () => {
    const result = await issueUnjaniNpcMonthlyPack(supabase, {
      now: at('2026-07-27'),
    });
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('before_npc_billing_start');
  });

  it('force does not bill a service month before 1 September 2026', async () => {
    const result = await issueUnjaniNpcMonthlyPack(supabase, {
      now: at('2026-07-27'),
      force: true,
    });
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('before_npc_billing_start');
  });

  // 31/08/2026 is the last Monday of August and bills September in advance.
  // Reaching the database is the pass condition here.
  it('issues the September pack on Monday 31 August 2026', async () => {
    await expect(
      issueUnjaniNpcMonthlyPack(supabase, { now: at('2026-08-31') })
    ).rejects.toThrow(TOUCHED);
  });

  it('issues the October pack on Monday 28 September 2026', async () => {
    await expect(
      issueUnjaniNpcMonthlyPack(supabase, { now: at('2026-09-28') })
    ).rejects.toThrow(TOUCHED);
  });

  it('bills the next month in advance, issued last Monday, due 30 days later', () => {
    expect(packDatesFor(at('2026-08-31'))).toEqual({
      invoiceDate: '2026-08-31',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      dueDate: '2026-09-30',
    });
    expect(packDatesFor(at('2026-09-28'))).toEqual({
      invoiceDate: '2026-09-28',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      dueDate: '2026-10-28',
    });
  });
});
