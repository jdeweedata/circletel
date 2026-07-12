import { canAccessAdminPath, workspaceForPathname } from '@/lib/admin/workspace-access';

describe('canAccessAdminPath (PR5 route guard)', () => {
  it('viewer is blocked from operational + admin routes', () => {
    for (const p of [
      '/admin/billing', '/admin/quotes', '/admin/network/health',
      '/admin/settings', '/admin/users', '/admin/orchestrator',
    ]) {
      expect(canAccessAdminPath('viewer', p)).toBe(false);
    }
  });

  it('viewer reaches read-oriented routes', () => {
    for (const p of ['/admin', '/admin/dashboard', '/admin/customers', '/admin/support/devices', '/admin/diagnostics']) {
      expect(canAccessAdminPath('viewer', p)).toBe(true);
    }
  });

  it('editor is blocked from Administration only', () => {
    expect(canAccessAdminPath('editor', '/admin/settings')).toBe(false);
    expect(canAccessAdminPath('editor', '/admin/users/roles')).toBe(false); // detail route
    expect(canAccessAdminPath('editor', '/admin/orchestrator')).toBe(false);
    expect(canAccessAdminPath('editor', '/admin/billing/invoices')).toBe(true);
    expect(canAccessAdminPath('editor', '/admin/workflow')).toBe(true); // "Approvals" is ops, not admin
  });

  it('elevated roles reach everything mapped', () => {
    for (const role of ['super_admin', 'product_manager'] as const) {
      for (const p of ['/admin/settings', '/admin/billing', '/admin/network/health', '/admin/orchestrator']) {
        expect(canAccessAdminPath(role, p)).toBe(true);
      }
    }
  });

  it('detail/query routes resolve to their parent workspace', () => {
    expect(canAccessAdminPath('viewer', '/admin/quotes/123')).toBe(false);
    expect(canAccessAdminPath('viewer', '/admin/billing?tab=x')).toBe(false);
  });

  it('longest-prefix: coverage/checker is sales, coverage/* is platform', () => {
    expect(workspaceForPathname('/admin/coverage/checker')).toBe('sales');
    expect(workspaceForPathname('/admin/coverage/maps')).toBe('platform');
    // payments/settings (finance) must not be caught by /admin/settings (admin)
    expect(workspaceForPathname('/admin/payments/settings')).toBe('finance');
  });

  it('unmapped admin routes fail open (returns null workspace)', () => {
    expect(workspaceForPathname('/admin/some-unmapped-route')).toBeNull();
    expect(canAccessAdminPath('viewer', '/admin/some-unmapped-route')).toBe(true);
  });
});
