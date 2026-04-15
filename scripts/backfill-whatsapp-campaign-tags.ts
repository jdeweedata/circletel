/**
 * One-off backfill: search Zoho Desk for untagged WhatsApp campaign tickets
 * and add the "whatsapp lead" tag to each.
 *
 * Usage:
 *   npx tsx scripts/backfill-whatsapp-campaign-tags.ts
 *
 * Dry-run mode (no writes):
 *   DRY_RUN=true npx tsx scripts/backfill-whatsapp-campaign-tags.ts
 */

import 'dotenv/config';
import { createCampaignZohoDeskService } from '../lib/integrations/zoho/desk-campaign-service';

const SEARCH_TERMS = ['fb.me/', 'lnk.ms/', 'Hello! Can I get more info on this?'];
const DRY_RUN = process.env.DRY_RUN === 'true';

async function main() {
  console.log(`\n🚀 WhatsApp Campaign Backfill${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  const service = createCampaignZohoDeskService();

  // 1. Search for matching tickets across all search terms
  const seen = new Set<string>();
  const candidates: Awaited<ReturnType<typeof service.searchTicketsBySubject>> = [];

  for (const term of SEARCH_TERMS) {
    console.log(`🔍 Searching for: "${term}"`);
    const results = await service.searchTicketsBySubject(term);
    console.log(`   Found ${results.length} ticket(s)`);
    for (const t of results) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        candidates.push(t);
      }
    }
  }

  console.log(`\n📋 Total unique candidates: ${candidates.length}`);

  // 2. Filter to those NOT already tagged "whatsapp lead"
  const needsTag = candidates.filter(
    (t) => !t.tags.some((tag) => tag.toLowerCase() === 'whatsapp lead')
  );
  const alreadyTagged = candidates.length - needsTag.length;

  console.log(`   Already tagged: ${alreadyTagged}`);
  console.log(`   Needs tagging:  ${needsTag.length}\n`);

  if (needsTag.length === 0) {
    console.log('✅ Nothing to do — all matching tickets are already tagged.\n');
    return;
  }

  // 3. Apply tag to each untagged ticket
  let tagged = 0;
  let errors = 0;

  for (const ticket of needsTag) {
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would tag: #${ticket.ticketNumber} — ${ticket.subject.slice(0, 60)}`);
      tagged++;
      continue;
    }

    const ok = await service.addCampaignTag(ticket.id, ticket.tags);
    if (ok) {
      console.log(`✅ Tagged: #${ticket.ticketNumber} — ${ticket.subject.slice(0, 60)}`);
      tagged++;
    } else {
      console.error(`❌ Failed: #${ticket.ticketNumber}`);
      errors++;
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Tagged: ${tagged}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Skipped (already tagged): ${alreadyTagged}`);
  if (DRY_RUN) {
    console.log('\n💡 Re-run without DRY_RUN=true to apply changes.\n');
  } else {
    console.log('\n✅ Backfill complete.\n');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
