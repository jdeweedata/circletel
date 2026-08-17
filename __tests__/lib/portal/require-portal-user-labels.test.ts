import { roleLabel } from '@/lib/portal/access-templates';

describe('portal Super User role contract', () => {
  it('maps admin role to Super User label', () => {
    expect(roleLabel('admin')).toBe('Super User');
  });

  it('maps site_user role to Site User label', () => {
    expect(roleLabel('site_user')).toBe('Site User');
  });
});
