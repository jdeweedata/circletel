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

import { ALL_MODULES } from '@/lib/admin/workspace-access';

describe('getTenantConfig modules (PR2.5)', () => {
  afterEach(() => {
    resetTenantConfigForTests();
    delete process.env.NEXT_PUBLIC_TENANT_MODULES;
  });

  it('defaults to all modules (CircleTel: everything on)', () => {
    expect(getTenantConfig().modules).toEqual(ALL_MODULES);
    expect(getTenantConfig().modules).toContain('core');
  });

  it('parses NEXT_PUBLIC_TENANT_MODULES and force-includes core', () => {
    process.env.NEXT_PUBLIC_TENANT_MODULES = 'billing, crm ,orders';
    const mods = getTenantConfig().modules;
    expect(mods).toEqual(expect.arrayContaining(['billing', 'crm', 'orders', 'core']));
    expect(mods).toHaveLength(4);
  });

  it('drops unknown module ids', () => {
    process.env.NEXT_PUBLIC_TENANT_MODULES = 'billing,bogus,crm';
    const mods = getTenantConfig().modules;
    expect(mods).toEqual(expect.arrayContaining(['billing', 'crm', 'core']));
    expect(mods).not.toContain('bogus');
    expect(mods).toHaveLength(3);
  });

  it('blank env falls back to defaults', () => {
    process.env.NEXT_PUBLIC_TENANT_MODULES = '  ';
    expect(getTenantConfig().modules).toEqual(ALL_MODULES);
  });
});
