import { getTenantConfig, resetTenantConfigForTests } from '@/lib/tenant';

describe('getTenantConfig', () => {
  afterEach(() => {
    resetTenantConfigForTests();
    delete process.env.NEXT_PUBLIC_TENANT_COMPANY_NAME;
    delete process.env.NEXT_PUBLIC_TENANT_PRIMARY_COLOR;
  });

  it('returns CircleTel defaults when no env overrides are set', () => {
    const config = getTenantConfig();
    expect(config.branding.companyName).toBe('CircleTel');
    expect(config.branding.legalName).toBe('Circle Tel SA (Pty) Ltd');
    expect(config.branding.colors.primary).toBe('#F5841E');
    expect(config.contacts.EMAIL_PRIMARY).toBe('contactus@circletel.co.za');
    expect(config.contacts.PHYSICAL_ADDRESS.city).toBe('Sandton');
  });

  it('applies env overrides for company name and primary color', () => {
    process.env.NEXT_PUBLIC_TENANT_COMPANY_NAME = 'AcmeNet';
    process.env.NEXT_PUBLIC_TENANT_PRIMARY_COLOR = '#0055FF';
    const config = getTenantConfig();
    expect(config.branding.companyName).toBe('AcmeNet');
    expect(config.branding.colors.primary).toBe('#0055FF');
    expect(config.branding.legalName).toBe('Circle Tel SA (Pty) Ltd');
  });

  it('caches the config between calls', () => {
    const a = getTenantConfig();
    process.env.NEXT_PUBLIC_TENANT_COMPANY_NAME = 'ShouldNotApply';
    const b = getTenantConfig();
    expect(b).toBe(a);
    expect(b.branding.companyName).toBe('CircleTel');
  });
});
