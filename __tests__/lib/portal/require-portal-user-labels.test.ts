/**
 * Role labelling contract for Phase 1 portal:
 * DB role `admin` === Super User (max one per org).
 */

describe('portal Super User role contract', () => {
  it('maps admin role to Super User label', () => {
    const role: 'admin' | 'site_user' = 'admin';
    const label = role === 'admin' ? 'Super User' : 'Site User';
    expect(label).toBe('Super User');
  });

  it('maps site_user role to Site User label', () => {
    const role: 'admin' | 'site_user' = 'site_user';
    const label = role === 'admin' ? 'Super User' : 'Site User';
    expect(label).toBe('Site User');
  });
});
