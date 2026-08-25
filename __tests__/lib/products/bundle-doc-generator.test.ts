import { generateFlyerDocs } from '@/lib/products/bundle-doc-generator';
import { FIXTURE_OTG } from './bundle-template-fixtures';
import type { FlyerWizardFields } from '@/lib/products/bundle-doc-fields';

const otgFields: FlyerWizardFields = {
  name: 'OTG — On the Go',
  code: 'otg',
  tagline: 'MiFi, data, and Microsoft 365',
  buyerType: 'soho',
  salesBlurb: 'A pocket office for people on the road.',
  billedInclVat: 399,
  termMonths: 12,
  connectivityName: '20GB mobile data SIM',
  connectivityCostExcl: 174,
  heliosIncludesCpe: false,
  cpeName: 'MiFi router',
  cpeCostExcl: 360,
  m365Seats: 1,
  needsSiteCheck: false,
  supportHours: 'Mon-Fri, 8am-5pm',
  fairUse: '20GB then shaped',
  needsNewIt: false,
};

describe('generateFlyerDocs', () => {
  it('writes house headers, VAT both ways, and Helios rule without placeholders', () => {
    const docs = generateFlyerDocs(otgFields, FIXTURE_OTG);
    expect(docs.cpsMarkdown).toContain('CT-CPS-OTG-2026-001');
    expect(docs.cpsMarkdown).toContain('R346.96');
    expect(docs.cpsMarkdown).toContain('R399.00');
    expect(docs.brdMarkdown).toContain('PS-001');
    expect(docs.brdMarkdown).toContain('Do not bill a second router');
    expect(docs.cpsMarkdown).not.toContain('{{');
    expect(docs.brdMarkdown).not.toContain('{{');
    expect(docs.cpsPath).toBe('products/bundles/OTGOntheGo_Commercial_Product_Spec_v1_0.md');
  });
});
