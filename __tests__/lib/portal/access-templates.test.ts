import {
  can,
  isInvitableHqRole,
  navItemsForRole,
  roleLabel,
  templateFromRole,
} from '@/lib/portal/access-templates';

describe('portal HQ access templates', () => {
  it('maps DB roles to templates', () => {
    expect(templateFromRole('admin')).toBe('super_user');
    expect(templateFromRole('finance')).toBe('finance');
    expect(templateFromRole('operations')).toBe('operations');
    expect(templateFromRole('viewer')).toBe('viewer');
    expect(templateFromRole('site_user')).toBe('site_user');
  });

  it('labels roles for the Team table', () => {
    expect(roleLabel('admin')).toBe('Super User');
    expect(roleLabel('finance')).toBe('Finance');
    expect(roleLabel('operations')).toBe('Operations');
    expect(roleLabel('viewer')).toBe('Viewer');
    expect(roleLabel('site_user')).toBe('Site User');
  });

  it('allows Super User to invite only HQ templates', () => {
    expect(isInvitableHqRole('finance')).toBe(true);
    expect(isInvitableHqRole('operations')).toBe(true);
    expect(isInvitableHqRole('viewer')).toBe(true);
    expect(isInvitableHqRole('admin')).toBe(false);
    expect(isInvitableHqRole('site_user')).toBe(false);
  });

  it('gives Super User every capability including Team', () => {
    expect(can('admin', 'dashboard')).toBe(true);
    expect(can('admin', 'sites.read')).toBe(true);
    expect(can('admin', 'sites.write')).toBe(true);
    expect(can('admin', 'coverage.read')).toBe(true);
    expect(can('admin', 'coverage.write')).toBe(true);
    expect(can('admin', 'billing.read')).toBe(true);
    expect(can('admin', 'support.read')).toBe(true);
    expect(can('admin', 'support.write')).toBe(true);
    expect(can('admin', 'team.manage')).toBe(true);
  });

  it('limits Finance to dashboard and billing', () => {
    expect(can('finance', 'dashboard')).toBe(true);
    expect(can('finance', 'billing.read')).toBe(true);
    expect(can('finance', 'sites.read')).toBe(false);
    expect(can('finance', 'coverage.read')).toBe(false);
    expect(can('finance', 'support.read')).toBe(false);
    expect(can('finance', 'team.manage')).toBe(false);
  });

  it('gives Operations sites, coverage, and support but not billing or team', () => {
    expect(can('operations', 'sites.read')).toBe(true);
    expect(can('operations', 'sites.write')).toBe(true);
    expect(can('operations', 'coverage.read')).toBe(true);
    expect(can('operations', 'coverage.write')).toBe(true);
    expect(can('operations', 'support.read')).toBe(true);
    expect(can('operations', 'support.write')).toBe(true);
    expect(can('operations', 'billing.read')).toBe(false);
    expect(can('operations', 'team.manage')).toBe(false);
  });

  it('gives Viewer read-only access and no team or writes', () => {
    expect(can('viewer', 'sites.read')).toBe(true);
    expect(can('viewer', 'billing.read')).toBe(true);
    expect(can('viewer', 'coverage.read')).toBe(true);
    expect(can('viewer', 'support.read')).toBe(true);
    expect(can('viewer', 'sites.write')).toBe(false);
    expect(can('viewer', 'coverage.write')).toBe(false);
    expect(can('viewer', 'support.write')).toBe(false);
    expect(can('viewer', 'team.manage')).toBe(false);
  });

  it('keeps legacy site users on dashboard, billing, and support', () => {
    expect(can('site_user', 'dashboard')).toBe(true);
    expect(can('site_user', 'billing.read')).toBe(true);
    expect(can('site_user', 'support.read')).toBe(true);
    expect(can('site_user', 'support.write')).toBe(true);
    expect(can('site_user', 'sites.read')).toBe(true);
    expect(can('site_user', 'coverage.read')).toBe(false);
    expect(can('site_user', 'team.manage')).toBe(false);
  });

  it('builds Unjani nav from the template', () => {
    expect(navItemsForRole('admin', true).map((item) => item.key)).toEqual([
      'dashboard',
      'sites',
      'coverage',
      'billing',
      'support',
      'team',
    ]);
    expect(navItemsForRole('finance', true).map((item) => item.key)).toEqual([
      'dashboard',
      'billing',
    ]);
    expect(navItemsForRole('operations', true).map((item) => item.key)).toEqual([
      'dashboard',
      'sites',
      'coverage',
      'support',
    ]);
    expect(navItemsForRole('viewer', true).map((item) => item.key)).toEqual([
      'dashboard',
      'sites',
      'coverage',
      'billing',
      'support',
    ]);
    expect(navItemsForRole('site_user', true).map((item) => item.key)).toEqual([
      'dashboard',
      'billing',
      'support',
    ]);
  });

  it('omits coverage from non-Unjani nav', () => {
    expect(navItemsForRole('admin', false).map((item) => item.key)).toEqual([
      'dashboard',
      'sites',
      'billing',
      'support',
      'team',
    ]);
  });
});
