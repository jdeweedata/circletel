import type {
  AdminSection,
  AdminRegistry,
  Workspace,
  UserContext,
} from './types';

/**
 * CircleTel's default admin sections — workspaces organized by user role.
 * This registry is the ONE source of truth for what admin pages exist and
 * who can see them. Every section must be explicitly registered here.
 */
const CIRCLETEL_SECTIONS: AdminSection[] = [
  // FINANCE WORKSPACE
  {
    id: 'billing-invoices',
    route: '/admin/billing/invoices',
    name: 'Invoices',
    icon: 'FileText',
    workspace: 'finance',
    roles: ['admin', 'finance-manager'],
    maturity: 'stable',
    order: 1,
    description: 'View and manage customer invoices',
  },
  {
    id: 'billing-batches',
    route: '/admin/billing/batches',
    name: 'Debit Batches',
    icon: 'CreditCard',
    workspace: 'finance',
    roles: ['admin', 'finance-manager'],
    maturity: 'stable',
    order: 2,
    description: 'Authorize and track debit order batches',
  },
  {
    id: 'billing-reconciliation',
    route: '/admin/billing/reconciliation',
    name: 'Reconciliation',
    icon: 'BarChart3',
    workspace: 'finance',
    roles: ['admin', 'finance-manager'],
    maturity: 'stable',
    order: 3,
    description: 'Reconcile payments and resolve discrepancies',
  },
  {
    id: 'billing-reports',
    route: '/admin/billing/reports',
    name: 'Reports',
    icon: 'TrendingUp',
    workspace: 'finance',
    roles: ['admin', 'finance-manager'],
    maturity: 'beta',
    order: 4,
    description: 'Revenue reports and collections analytics',
  },

  // SALES WORKSPACE
  {
    id: 'offers-manager',
    route: '/admin/offers/manager',
    name: 'Offer Manager',
    icon: 'Gift',
    workspace: 'sales',
    roles: ['admin', 'sales-manager'],
    maturity: 'stable',
    order: 1,
    description: 'Create and manage promotions and offers',
  },
  {
    id: 'campaigns',
    route: '/admin/campaigns',
    name: 'Campaigns',
    icon: 'Megaphone',
    workspace: 'sales',
    roles: ['admin', 'sales-manager'],
    maturity: 'beta',
    order: 2,
    description: 'Launch marketing campaigns and track performance',
  },
  {
    id: 'leads',
    route: '/admin/sales/leads',
    name: 'Leads',
    icon: 'Target',
    workspace: 'sales',
    roles: ['admin', 'sales-manager'],
    maturity: 'stable',
    order: 3,
    description: 'View and qualify sales leads',
  },
  {
    id: 'partners',
    route: '/admin/partners',
    name: 'Partners',
    icon: 'Handshake',
    workspace: 'sales',
    roles: ['admin', 'sales-manager'],
    maturity: 'stable',
    featureFlag: 'partners',
    order: 4,
    description: 'Manage partner accounts and revenue',
  },

  // OPS WORKSPACE
  {
    id: 'vetting-workbench',
    route: '/admin/b2b/vetting',
    name: 'Vetting Workbench',
    icon: 'CheckCircle2',
    workspace: 'ops',
    roles: ['admin', 'ops-manager'],
    maturity: 'stable',
    order: 1,
    description: 'Review and approve onboarding applications',
  },
  {
    id: 'onboarding-dashboard',
    route: '/admin/unjani/onboarding',
    name: 'Onboarding',
    icon: 'ClipboardList',
    workspace: 'ops',
    roles: ['admin', 'ops-manager'],
    maturity: 'stable',
    featureFlag: 'unjani',
    order: 2,
    description: 'Manage clinic onboarding and install scheduling',
  },
  {
    id: 'coverage-checker',
    route: '/admin/coverage/checker',
    name: 'Coverage Checker',
    icon: 'MapPin',
    workspace: 'ops',
    roles: ['admin', 'ops-manager'],
    maturity: 'stable',
    order: 3,
    description: 'Verify service availability by address',
  },
  {
    id: 'fulfillment',
    route: '/admin/fulfillment',
    name: 'Fulfillment',
    icon: 'Package',
    workspace: 'ops',
    roles: ['admin', 'ops-manager'],
    maturity: 'beta',
    order: 4,
    description: 'Track installation and activation status',
  },

  // SUPPORT WORKSPACE
  {
    id: 'customer-360',
    route: '/admin/support/customer',
    name: 'Customer 360',
    icon: 'User',
    workspace: 'support',
    roles: ['admin', 'support-agent'],
    maturity: 'stable',
    order: 1,
    description: 'Complete customer view: services, invoices, tickets',
  },
  {
    id: 'diagnostics',
    route: '/admin/support/diagnostics',
    name: 'Diagnostics',
    icon: 'Zap',
    workspace: 'support',
    roles: ['admin', 'support-agent'],
    maturity: 'beta',
    order: 2,
    description: 'Service and connectivity diagnostics',
  },
  {
    id: 'tickets',
    route: '/admin/support/tickets',
    name: 'Tickets',
    icon: 'AlertCircle',
    workspace: 'support',
    roles: ['admin', 'support-agent'],
    maturity: 'stable',
    order: 3,
    description: 'Track support tickets and escalations',
  },

  // EXECUTIVE WORKSPACE
  {
    id: 'dashboard',
    route: '/admin/executive/dashboard',
    name: 'Dashboard',
    icon: 'BarChart3',
    workspace: 'executive',
    roles: ['admin', 'executive'],
    maturity: 'stable',
    order: 1,
    description: 'KPIs: MRR, collections, churn, pipeline',
  },
  {
    id: 'analytics',
    route: '/admin/executive/analytics',
    name: 'Analytics',
    icon: 'TrendingUp',
    workspace: 'executive',
    roles: ['admin', 'executive'],
    maturity: 'beta',
    order: 2,
    description: 'Detailed business analytics and forecasts',
  },

  // ADMIN-ONLY SECTIONS (internal/hidden from regular staff)
  {
    id: 'admin-settings',
    route: '/admin/settings',
    name: 'Settings',
    icon: 'Settings',
    workspace: 'executive',
    roles: ['admin'],
    maturity: 'stable',
    order: 100,
    description: 'System configuration and integrations',
  },
  {
    id: 'integrations',
    route: '/admin/integrations',
    name: 'Integrations',
    icon: 'Plug',
    workspace: 'executive',
    roles: ['admin'],
    maturity: 'stable',
    order: 101,
    description: 'Third-party service connections and status',
  },
  {
    id: 'audit-log',
    route: '/admin/audit',
    name: 'Audit Log',
    icon: 'LogOut',
    workspace: 'executive',
    roles: ['admin'],
    maturity: 'internal',
    order: 102,
    description: 'System-wide event audit trail',
  },
];

let registry: AdminRegistry | null = null;

/**
 * Build the default admin registry with CircleTel sections.
 * Sections are sorted by workspace, then by order property.
 */
function buildRegistry(): AdminRegistry {
  const sections = new Map<string, AdminSection>();

  for (const section of CIRCLETEL_SECTIONS) {
    sections.set(section.id, section);
  }

  return {
    getSectionsForUser(userContext: UserContext): AdminSection[] {
      return Array.from(sections.values())
        .filter((section) => {
          // Check role permission (must have a role OR be admin)
          const hasRole =
            userContext.roles.includes('admin') ||
            section.roles.some((r) => userContext.roles.includes(r));
          if (!hasRole) return false;

          // Check maturity level
          const maturityRank = { stable: 0, beta: 1, internal: 2 };
          const userRank = maturityRank[userContext.maturityAccess];
          const sectionRank = maturityRank[section.maturity];
          if (sectionRank > userRank) return false;

          return true;
        })
        .sort((a, b) => {
          // Sort by workspace first, then by order
          const aOrder = a.order ?? 99;
          const bOrder = b.order ?? 99;
          return aOrder - bOrder;
        });
    },

    getWorkspacesForUser(userContext: UserContext): Workspace[] {
      const visible = this.getSectionsForUser(userContext);
      const workspaces = new Set<Workspace>();
      for (const section of visible) {
        workspaces.add(section.workspace);
      }
      return Array.from(workspaces).sort();
    },

    getSectionsForWorkspace(
      workspace: Workspace,
      userContext: UserContext
    ): AdminSection[] {
      return this.getSectionsForUser(userContext).filter(
        (s) => s.workspace === workspace
      );
    },

    getSectionById(id: string): AdminSection | undefined {
      return sections.get(id);
    },

    register(section: AdminSection): void {
      sections.set(section.id, section);
    },
  };
}

/**
 * Get the admin registry. Lazy-initialized on first call, cached thereafter.
 */
export function getAdminRegistry(): AdminRegistry {
  if (!registry) {
    registry = buildRegistry();
  }
  return registry;
}

/**
 * Test-only: reset the registry to its initial state so tests can register
 * custom sections without interfering with each other.
 */
export function resetRegistryForTests(): void {
  registry = null;
}
