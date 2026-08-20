import { readFileSync } from 'fs';
import path from 'path';
import { CONTACT } from '@/lib/constants/contact';

const pageSrc = readFileSync(
  path.join(process.cwd(), 'app/packages/[leadId]/page.tsx'),
  'utf8'
);

describe('coverage packages page', () => {
  it('uses tenant WhatsApp CONTACT, not the old 082 number', () => {
    expect(pageSrc).toContain('CONTACT.WHATSAPP_LINK');
    expect(pageSrc).toContain('CONTACT.WHATSAPP_NUMBER');
    expect(pageSrc).not.toContain('27824873900');
    expect(pageSrc).not.toContain('082 487 3900');
    expect(CONTACT.WHATSAPP_NUMBER).toBe('084 773 9467');
  });

  it('groups 5G/LTE from catalogue term and drives the sidebar from inclusions', () => {
    expect(pageSrc).toContain('groupCoveragePackagesByTerm');
    expect(pageSrc).toContain('getCoveragePackageInclusions');
    expect(pageSrc).toContain('24-month + router included');
    expect(pageSrc).toContain('Month-to-month SIM only');
    expect(pageSrc).not.toContain('extractBenefits');
    expect(pageSrc).not.toContain('extractAdditionalInfo');
  });
});
