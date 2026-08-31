import { npcPackEmailAmountFromInvoice } from '@/lib/billing/unjani-npc-pack';

describe('NPC pack email amount', () => {
  it('uses the invoice row when generate omitted total_amount', () => {
    expect(
      npcPackEmailAmountFromInvoice({
        amount_due: '7762.50',
        total_amount: '7762.50',
      })
    ).toBe(7762.5);
    expect(
      npcPackEmailAmountFromInvoice({
        amount_due: 7762.5,
        total_amount: 7762.5,
      })
    ).toBe(7762.5);
  });

  it('does not become 0 just because generate returned no amount', () => {
    const generatedTotal = undefined;
    const emailAmount = npcPackEmailAmountFromInvoice({
      amount_due: 7762.5,
      total_amount: 7762.5,
    });
    expect(Number(generatedTotal ?? 0)).toBe(0);
    expect(emailAmount).toBe(7762.5);
  });
});
