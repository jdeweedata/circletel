/**
 * One-off remediation (2026-07-08): Kayamandi CT-2026-00022 June double-debit.
 *
 * INV-2026-00016 (R276 pro-rata) was collected in BOTH the 29-Jun and 01-Jul
 * NetCash batches -> R276 over-collected on the Esterkula (FNB ****5967) account.
 * Finance decision: net the R276 credit against the July invoice INV-2026-00027
 * (R450), leaving R174 to collect via a manual NetCash debit (action 2026-07-13).
 *
 * This script creates + applies credit note CN-2026-00002 (R276) against
 * INV-2026-00027, taking it to amount_paid=276 / status=partial (R174 remaining
 * = total_amount - amount_paid).
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/apply-kayamandi-credit-note.ts
 */
import { CompliantBillingService } from '@/lib/billing/compliant-billing-service';

const INV_00027 = '2bb90197-2bcf-488a-b7e4-f60bc518e5c3'; // Kayamandi July R450 invoice

async function main() {
  const creditNote = await CompliantBillingService.createCreditNote(
    {
      original_invoice_id: INV_00027,
      line_items: [
        {
          description:
            'Credit for duplicate debit of INV-2026-00016 (R276) collected in both the 29-Jun and 01-Jul 2026 NetCash batches. Offsets July invoice INV-2026-00027.',
          quantity: 1,
          unit_price: 276.0,
          amount: 276.0, // VAT-inclusive
          type: 'adjustment',
        },
      ],
      reason:
        'Duplicate debit collection of INV-2026-00016 (R276) across the 29-Jun and 01-Jul 2026 NetCash batches; credit offsets July invoice INV-2026-00027.',
      reason_category: 'billing_error',
      notes:
        'Netting per finance decision 2026-07-08: apply R276 June over-collection credit against the July R450 invoice, leaving R174 to collect via debit order (action date 2026-07-13).',
      auto_apply: true,
    },
    {
      user_email: 'claude-code@circletel.co.za',
      user_role: 'system',
      reason: 'Kayamandi June double-debit remediation',
    }
  );

  console.log('Credit note created + applied:');
  console.log(JSON.stringify(creditNote, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
