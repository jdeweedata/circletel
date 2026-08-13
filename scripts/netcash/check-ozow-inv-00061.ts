/**
 * Read-only: confirm whether Ozow P2CE1A7B / INV-2026-00061 settled on the
 * Netcash merchant statement (money in), vs webhook Success then Declined.
 *
 *   set -a && source .env.local && set +a && npx tsx scripts/netcash/check-ozow-inv-00061.ts
 */
import { NetCashStatementService } from '../../lib/payments/netcash-statement-service';

const NEEDLES = [
  'INV-2026-00061',
  'INV-00061',
  'cc82fe40',
  'p2ce1a7b',
  'P2CE1A7B',
  '24427582',
  'nokaneng',
  'helping hands',
  'molatswana',
];

const DATES = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05'];

async function main() {
  if (!process.env.NETCASH_ACCOUNT_SERVICE_KEY) {
    throw new Error('NETCASH_ACCOUNT_SERVICE_KEY missing');
  }

  const svc = new NetCashStatementService();
  const hits: Array<Record<string, unknown>> = [];
  const ozowOr517: Array<Record<string, unknown>> = [];
  const days: Array<Record<string, unknown>> = [];

  for (const dateStr of DATES) {
    const date = new Date(`${dateStr}T12:00:00+02:00`);
    console.log(`\n=== ${dateStr} ===`);
    const statement = await svc.getStatement(date, 8, 2500);
    if (!statement.success) {
      console.log(`FAIL: ${statement.error}`);
      days.push({ date: dateStr, success: false, error: statement.error });
      continue;
    }
    const txs = statement.transactions || [];
    const credits = txs.filter((t) => t.effect === '+');
    console.log(
      `OK ${txs.length} txs / ${credits.length} credits open=${statement.openingBalance} close=${statement.closingBalance}`
    );
    days.push({
      date: dateStr,
      success: true,
      txCount: txs.length,
      creditCount: credits.length,
      openingBalance: statement.openingBalance,
      closingBalance: statement.closingBalance,
    });

    for (const tx of txs) {
      const hay = [tx.description, tx.reference, tx.accountReference, tx.transactionCode]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const needleHits = NEEDLES.filter((n) => hay.includes(n.toLowerCase()));
      if (needleHits.length) hits.push({ date: dateStr, needleHits, ...tx });
      const code = String(tx.transactionCode || '').toUpperCase();
      if (
        tx.effect === '+' &&
        (Math.abs(tx.amount - 517.5) < 0.01 ||
          code.includes('OZW') ||
          hay.includes('ozow') ||
          hay.includes('paynow') ||
          hay.includes('p2c'))
      ) {
        ozowOr517.push({ date: dateStr, ...tx });
      }
    }
  }

  console.log('\n========== NEEDLE HITS ==========');
  console.log(JSON.stringify(hits, null, 2));
  console.log('\n========== CREDITS R517.50 / OZW / PayNow ==========');
  console.log(JSON.stringify(ozowOr517, null, 2));
  console.log('\n========== DAYS ==========');
  console.log(JSON.stringify(days, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
