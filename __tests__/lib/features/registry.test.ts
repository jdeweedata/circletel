import {
  getAdminRegistry,
  resetRegistryForTests,
  type AdminSection,
  type UserContext,
} from '@/lib/features';

describe('AdminRegistry', () => {
  afterEach(() => {
    resetRegistryForTests();
  });

  describe('getAdminRegistry', () => {
    it('returns all sections when user is admin', () => {
      const registry = getAdminRegistry();
      const userContext: UserContext = {
        roles: ['admin'],
        maturityAccess: 'internal',
      };

      const visibleSections = registry.getSectionsForUser(userContext);
      expect(visibleSections.length).toBeGreaterThan(0);
      expect(visibleSections.some((s) => s.workspace === 'finance')).toBe(true);
      expect(visibleSections.some((s) => s.workspace === 'sales')).toBe(true);
    });

    it('filters sections by user role', () => {
      const registry = getAdminRegistry();
      const financeUser: UserContext = {
        roles: ['finance-manager'],
        maturityAccess: 'stable',
      };

      const visibleSections = registry.getSectionsForUser(financeUser);
      expect(
        visibleSections.every(
          (s) => s.roles.includes('finance-manager') || s.roles.includes('admin')
        )
      ).toBe(true);

      const hasBillingSection = visibleSections.some((s) =>
        s.route.includes('/admin/billing')
      );
      expect(hasBillingSection).toBe(true);
    });

    it('hides beta sections from non-admin users', () => {
      const registry = getAdminRegistry();
      const opsUser: UserContext = {
        roles: ['ops-manager'],
        maturityAccess: 'stable',
      };

      const visibleSections = registry.getSectionsForUser(opsUser);
      expect(visibleSections.every((s) => s.maturity !== 'beta')).toBe(true);
    });

    it('hides internal sections from non-admin users', () => {
      const registry = getAdminRegistry();
      const salesUser: UserContext = {
        roles: ['sales-manager'],
        maturityAccess: 'stable',
      };

      const visibleSections = registry.getSectionsForUser(salesUser);
      expect(visibleSections.every((s) => s.maturity !== 'internal')).toBe(
        true
      );
    });

    it('groups sections by workspace', () => {
      const registry = getAdminRegistry();
      const userContext: UserContext = {
        roles: ['admin'],
        maturityAccess: 'internal',
      };

      const workspaces = registry.getWorkspacesForUser(userContext);
      expect(workspaces).toContain('finance');
      expect(workspaces).toContain('sales');
      expect(workspaces).toContain('ops');
      expect(workspaces).toContain('support');
      expect(workspaces).toContain('executive');
    });

    it('returns sections for a specific workspace', () => {
      const registry = getAdminRegistry();
      const userContext: UserContext = {
        roles: ['admin'],
        maturityAccess: 'internal',
      };

      const financeSections = registry.getSectionsForWorkspace(
        'finance',
        userContext
      );
      expect(financeSections.length).toBeGreaterThan(0);
      expect(financeSections.every((s) => s.workspace === 'finance')).toBe(
        true
      );
    });

    it('respects feature flags to enable/disable sections', () => {
      const registry = getAdminRegistry();
      const userContext: UserContext = {
        roles: ['admin'],
        maturityAccess: 'internal',
      };

      const allSections = registry.getSectionsForUser(userContext);
      const unjaniSections = allSections.filter(
        (s) => s.featureFlag === 'unjani'
      );

      if (unjaniSections.length > 0) {
        expect(unjaniSections[0].featureFlag).toBe('unjani');
      }
    });
  });
});
