/**
 * Sample Unjani NPC statement of account PDF (as at 28 September 2026).
 * Matches the second attachment in the monthly NPC pack.
 *
 *   npx tsx scripts/generate-unjani-npc-statement-example.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { generateStatementPDFBuffer } from '@/lib/billing/statement-pdf-generator';
import { UNJANI_NPC_BILL_TO } from '@/lib/billing/unjani-connect-rules';

const TOTAL_INCL = 10867.5;

const statement = {
  statementDate: '2026-09-28',
  customer: {
    name: UNJANI_NPC_BILL_TO.legalName,
    accountNumber: UNJANI_NPC_BILL_TO.accountCode,
    email: UNJANI_NPC_BILL_TO.billingEmail,
    vatNumber: UNJANI_NPC_BILL_TO.vatNumber,
    registrationNumber: UNJANI_NPC_BILL_TO.registrationNumber,
    address: { ...UNJANI_NPC_BILL_TO.address },
  },
  transactions: [
    {
      date: '2026-09-28',
      reference: 'INV-2026-NPC-SEP',
      description: 'Unjani Connect — September 2026',
      debit: TOTAL_INCL,
    },
  ],
  aging: {
    over120Days: 0,
    days90: 0,
    days60: 0,
    days30: 0,
    current: TOTAL_INCL,
  },
  totalDue: TOTAL_INCL,
  totalPaid: 0,
};

const outDir = path.join(
  process.cwd(),
  'docs/clients/unjani-clinics/billing/examples'
);
mkdirSync(outDir, { recursive: true });
const out = path.join(
  outDir,
  'UNJANI_CONNECT_NPC_STATEMENT_EXAMPLE_SEP_2026.pdf'
);
writeFileSync(out, Buffer.from(generateStatementPDFBuffer(statement)));
console.log(JSON.stringify({ out, totalDue: TOTAL_INCL }, null, 2));
