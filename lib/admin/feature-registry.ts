/**
 * Admin Feature Registry — whitelabel baseline design §6.
 * Every admin section is registered here with role + maturity metadata;
 * the Sidebar renders whatever this module returns. Phase 4 will extend
 * this into the five role workspaces; Phase 0 only centralizes the data.
 *
 * Maturity: 'stable' (default) | 'beta' | 'internal' | 'hidden'.
 * 'internal' and 'hidden' items never render in the nav.
 */
import type React from 'react';
import {
  PiArrowsClockwiseBold,
  PiBellBold,
  PiBriefcaseBold,
  PiBuildingsBold,
  PiCalendarBold,
  PiChartBarBold,
  PiCheckCircleBold,
  PiClipboardTextBold,
  PiClockBold,
  PiCreditCardBold,
  PiFileTextBold,
  PiGearBold,
  PiGlobeBold,
  PiGraphBold,
  PiHandshakeBold,
  PiImageBold,
  PiLightningBold,
  PiLinkBold,
  PiListBold,
  PiMapPinBold,
  PiMapTrifoldBold,
  PiMegaphoneBold,
  PiPackageBold,
  PiPercentBold,
  PiPlusBold,
  PiPulseBold,
  PiRadioBold,
  PiReceiptBold,
  PiRocketBold,
  PiShieldCheckBold,
  PiShoppingCartBold,
  PiSidebarSimpleBold,
  PiSparkleBold,
  PiSquaresFourBold,
  PiTargetBold,
  PiTestTubeBold,
  PiTrendUpBold,
  PiTruckBold,
  PiUserCheckBold,
  PiUserPlusBold,
  PiUsersBold,
  PiWarningCircleBold,
  PiWifiHighBold,
  PiWrenchBold,
} from 'react-icons/pi';
import { RandSign } from '@/components/ui/icons/rand-sign';
import type { AdminRole } from '@/lib/auth/constants';

export type Maturity = 'stable' | 'beta' | 'internal' | 'hidden';

export interface NavChild {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavItemWithHref {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  description?: string;
  adminOnly?: boolean;
  maturity?: Maturity;
}

export interface NavItemWithChildren {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavChild[];
  description?: string;
  adminOnly?: boolean;
  maturity?: Maturity;
}

export type NavItem = NavItemWithHref | NavItemWithChildren;

export interface NavSection {
  label: string | null;
  maturity?: Maturity;
  items: NavItem[];
}

export function hasChildren(item: NavItem): item is NavItemWithChildren {
  return 'children' in item && Array.isArray(item.children);
}

// ── Registry data ─────────────────────────────────────────────
// MOVED VERBATIM from components/admin/layout/Sidebar.tsx.
// The main nav becomes `featureSections`; the admin-only nav becomes `bottomSections`.

export const featureSections: NavSection[] = [
  {
    label: null, // No label for first section (Dashboard)
    items: [
      {
        name: 'Dashboard',
        href: '/admin',
        icon: PiSquaresFourBold,
        end: true,
      },
    ],
  },
  {
    label: 'Core Operations',
    items: [
      {
        name: 'Products',
        icon: PiPackageBold,
        children: [
          { name: 'Product Workspace', href: '/admin/products', icon: PiSquaresFourBold },
          { name: 'Add Product', href: '/admin/products/new', icon: PiPlusBold },
        ],
      },
      {
        name: 'Quotes',
        icon: PiFileTextBold,
        children: [
          { name: 'All Quotes', href: '/admin/quotes', icon: PiListBold },
          { name: 'Pending Approval', href: '/admin/quotes?status=pending_approval', icon: PiClockBold },
          { name: 'Accepted', href: '/admin/quotes?status=accepted', icon: PiCheckCircleBold },
        ],
      },
      {
        name: 'Contracts',
        icon: PiReceiptBold,
        children: [
          { name: 'All Contracts', href: '/admin/contracts', icon: PiListBold },
          { name: 'Pending Signature', href: '/admin/contracts?status=pending_signature', icon: PiClockBold },
          { name: 'Active', href: '/admin/contracts?status=active', icon: PiCheckCircleBold },
        ],
      },
      {
        name: 'Orders',
        href: '/admin/orders',
        icon: PiShoppingCartBold,
        description: 'Manage customer orders',
      },
      {
        name: 'Order Fulfillment',
        icon: PiTruckBold,
        description: 'Device dispatch, delivery & activation',
        children: [
          { name: 'Fulfillment Dashboard', href: '/admin/fulfillment', icon: PiSquaresFourBold },
          { name: 'Device Stock', href: '/admin/fulfillment/devices', icon: PiPackageBold },
          { name: 'Dispatch Queue', href: '/admin/fulfillment/dispatch', icon: PiTruckBold },
          { name: 'Pending Activation', href: '/admin/fulfillment/activation', icon: PiLightningBold },
        ],
      },
      {
        name: 'Field Operations',
        icon: PiWrenchBold,
        children: [
          { name: 'Dashboard', href: '/admin/field-ops', icon: PiSquaresFourBold },
          { name: 'Technicians', href: '/admin/field-ops/technicians', icon: PiUsersBold },
          { name: 'Jobs', href: '/admin/field-ops/jobs', icon: PiBriefcaseBold },
          { name: 'Installation Schedule', href: '/admin/orders/installations', icon: PiCalendarBold },
        ],
      },
      {
        name: 'Customers',
        href: '/admin/customers',
        icon: PiUsersBold,
        description: 'Manage customer accounts',
      },
      {
        name: 'B2B Customers',
        icon: PiBuildingsBold,
        description: 'Business customer journey',
        children: [
          { name: 'Clinic Onboarding', href: '/admin/unjani/onboarding', icon: PiUserPlusBold },
          { name: 'Manual Onboarding', href: '/admin/b2b/manual-intake', icon: PiClipboardTextBold },
          { name: 'Document Vetting', href: '/admin/b2b/vetting', icon: PiUserCheckBold },
          { name: 'All B2B Customers', href: '/admin/b2b-customers', icon: PiBuildingsBold },
          { name: 'Site Details', href: '/admin/b2b-customers/site-details', icon: PiMapPinBold },
          { name: 'Journey Overview', href: '/admin/b2b-customers?view=journey', icon: PiTrendUpBold },
          { name: 'Blocked', href: '/admin/b2b-customers?status=blocked', icon: PiWarningCircleBold },
        ],
      },
      {
        name: 'Corporate Clients',
        icon: PiBriefcaseBold,
        description: 'Enterprise multi-site accounts',
        children: [
          { name: 'All Corporates', href: '/admin/corporate', icon: PiBuildingsBold },
          { name: 'Add Corporate', href: '/admin/corporate/new', icon: PiPlusBold },
        ],
      },
      {
        name: 'Suppliers',
        icon: PiTruckBold,
        children: [{ name: 'Suppliers', href: '/admin/products?section=suppliers', icon: PiTruckBold }],
      },
    ],
  },
  {
    label: 'Sales & Partners',
    items: [
      {
        name: 'Sales Engine',
        icon: PiGraphBold,
        children: [
          { name: 'Dashboard', href: '/admin/sales-engine', icon: PiSquaresFourBold },
          { name: 'Briefing', href: '/admin/sales-engine/briefing', icon: PiPulseBold },
          { name: 'Zones', href: '/admin/sales-engine/zones', icon: PiTargetBold },
          { name: 'Lead Scoring', href: '/admin/sales-engine/leads', icon: PiChartBarBold },
          { name: 'Pipeline', href: '/admin/sales-engine/pipeline', icon: PiTrendUpBold },
          { name: 'Demographics', href: '/admin/sales-engine/demographics', icon: PiUsersBold },
          { name: 'Heat Map', href: '/admin/sales-engine/map', icon: PiMapPinBold },
          { name: 'Execution Plan', href: '/admin/sales-engine/execution-plan', icon: PiRocketBold },
        ],
      },
      {
        name: 'B2B Feasibility',
        href: '/admin/sales/feasibility',
        icon: PiLightningBold,
        description: 'Quick coverage check & quote generation',
      },
      {
        name: 'Coverage Checker',
        href: '/admin/coverage/checker',
        icon: PiWifiHighBold,
        description: 'Quick Tarana FWB coverage check',
      },
      {
        name: 'CPQ Builder',
        href: '/admin/cpq',
        icon: PiSparkleBold,
        description: 'AI-powered quote configuration wizard',
      },
      {
        name: 'Partners',
        icon: PiHandshakeBold,
        children: [
          { name: 'All Partners', href: '/admin/partners', icon: PiUsersBold },
          { name: 'Pending Approvals', href: '/admin/partners/approvals', icon: PiClockBold },
        ],
      },
      {
        name: 'Competitor Analysis',
        icon: PiTargetBold,
        children: [
          { name: 'Dashboard', href: '/admin/competitor-analysis', icon: PiSquaresFourBold },
          { name: 'Providers', href: '/admin/competitor-analysis/providers', icon: PiBuildingsBold },
          { name: 'Matching', href: '/admin/competitor-analysis/matching', icon: PiLinkBold },
        ],
      },
    ],
  },
  {
    label: 'Marketing',
    items: [
      {
        name: 'Marketing',
        icon: PiMegaphoneBold,
        children: [
          { name: 'Dashboard', href: '/admin/marketing', icon: PiSquaresFourBold },
          { name: 'Promotions', href: '/admin/marketing/promotions', icon: PiPercentBold },
          { name: 'Campaigns', href: '/admin/marketing/campaigns', icon: PiTargetBold },
          { name: 'No Coverage Leads', href: '/admin/marketing/no-coverage-leads', icon: PiMapPinBold },
          { name: 'Campaign Builder', href: '/admin/marketing/campaign-builder', icon: PiTargetBold },
          { name: 'Analytics', href: '/admin/marketing/analytics', icon: PiChartBarBold },
        ],
      },
    ],
  },
  {
    label: 'Compliance',
    items: [
      {
        name: 'Approvals',
        href: '/admin/workflow',
        icon: PiCheckCircleBold,
      },
      {
        name: 'KYC Review',
        href: '/admin/kyc',
        icon: PiShieldCheckBold,
        description: 'Review customer verification documents',
      },
      {
        name: 'KYB Compliance',
        href: '/admin/compliance/kyb',
        icon: PiShieldCheckBold,
        description: 'View KYB subject KYC status and risk',
      },
      {
        name: 'Document Reviews',
        href: '/admin/compliance/documents',
        icon: PiFileTextBold,
        description: 'FICA/RICA documents uploaded via the customer portal',
      },
    ],
  },
  {
    label: 'Network',
    items: [
      {
        name: 'Coverage',
        icon: PiRadioBold,
        children: [
          { name: 'Dashboard', href: '/admin/coverage', icon: PiSquaresFourBold },
          { name: 'Analytics', href: '/admin/coverage/analytics', icon: PiPulseBold },
          { name: 'Testing', href: '/admin/coverage/testing', icon: PiTestTubeBold },
          { name: 'Providers', href: '/admin/coverage/providers', icon: PiBuildingsBold },
          { name: 'Maps', href: '/admin/coverage/maps', icon: PiMapTrifoldBold },
          { name: 'Base Stations', href: '/admin/coverage/base-stations', icon: PiMapPinBold },
          { name: 'DFA Buildings', href: '/admin/coverage/dfa-buildings', icon: PiBuildingsBold },
        ],
      },
      {
        name: 'Diagnostics',
        href: '/admin/diagnostics',
        icon: PiPulseBold,
        description: 'Monitor subscriber connection health',
      },
      {
        name: 'Network Management',
        icon: PiWifiHighBold,
        children: [
          { name: 'Devices', href: '/admin/network/devices', icon: PiWifiHighBold },
          { name: 'Remote Nodes', href: '/admin/network/remote-nodes', icon: PiRadioBold },
          { name: 'Sites', href: '/admin/network/sites', icon: PiMapPinBold },
          { name: 'Incidents', href: '/admin/network/outages', icon: PiWarningCircleBold },
          { name: 'Health Monitor', href: '/admin/network/health', icon: PiPulseBold },
          { name: 'Analytics', href: '/admin/network/analytics', icon: PiChartBarBold },
          { name: 'Network Map', href: '/admin/network/map', icon: PiMapTrifoldBold },
        ],
      },
    ],
  },
  {
    label: 'Support',
    items: [
      {
        name: 'Customer Devices',
        href: '/admin/support/devices',
        icon: PiUsersBold,
        description: 'Look up customer linked devices',
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        name: 'Billing & Revenue',
        icon: PiCreditCardBold,
        children: [
          { name: 'Dashboard', href: '/admin/billing', icon: PiSquaresFourBold },
          { name: 'Customers', href: '/admin/billing/customers', icon: PiUserCheckBold },
          { name: 'Invoices', href: '/admin/billing/invoices', icon: PiReceiptBold },
          { name: 'Outstanding', href: '/admin/finance/outstanding', icon: PiWarningCircleBold },
          { name: 'AR Analytics', href: '/admin/finance/ar-analytics', icon: PiTrendUpBold },
        ],
      },
      {
        name: 'Payments',
        icon: RandSign,
        children: [
          { name: 'Provider Monitoring', href: '/admin/payments/monitoring', icon: PiPulseBold },
          { name: 'Transactions', href: '/admin/payments/transactions', icon: PiReceiptBold },
          { name: 'Reconciliation', href: '/admin/finance/reconciliation', icon: PiArrowsClockwiseBold },
          { name: 'Webhooks', href: '/admin/payments/webhooks', icon: PiLightningBold },
          { name: 'Settings', href: '/admin/payments/settings', icon: PiGearBold },
        ],
      },
    ],
  },
  {
    label: 'Platform',
    items: [
      {
        name: 'Notifications',
        href: '/admin/notifications',
        icon: PiBellBold,
        description: 'Email templates and notification logs',
      },
      {
        name: 'Integrations',
        icon: PiLinkBold,
        children: [
          { name: 'Overview', href: '/admin/integrations', icon: PiSquaresFourBold },
          { name: 'Zoho CRM', href: '/admin/zoho', icon: PiLightningBold },
          { name: 'Zoho Sign', href: '/admin/integrations/zoho-sign', icon: PiFileTextBold },
          { name: 'WhatsApp Campaign', href: '/admin/integrations/whatsapp-campaign', icon: PiChartBarBold },
          { name: 'Interstellio RADIUS', href: '/admin/integrations/interstellio', icon: PiRadioBold },
          { name: 'OAuth Tokens', href: '/admin/integrations/oauth', icon: PiGearBold },
          { name: 'Webhooks', href: '/admin/integrations/webhooks', icon: PiLightningBold },
          { name: 'API Health', href: '/admin/integrations/apis', icon: PiPulseBold },
          { name: 'Cron Jobs', href: '/admin/integrations/cron', icon: PiClockBold },
        ],
      },
      {
        name: 'CMS Management',
        icon: PiGlobeBold,
        children: [
          { name: 'Pages', href: '/admin/cms', icon: PiFileTextBold },
          { name: 'Media Library', href: '/admin/cms/media', icon: PiImageBold },
          { name: 'Page Builder', href: '/admin/cms/builder', icon: PiSidebarSimpleBold },
        ],
      },
    ],
  },
];

export const bottomSections: NavSection[] = [
  {
    label: null,
    items: [
      {
        name: 'Orchestrator',
        href: '/admin/orchestrator',
        icon: PiGraphBold,
        adminOnly: true,
        description: 'AI agent workflows and performance',
      },
      {
        name: 'Users',
        icon: PiUsersBold,
        adminOnly: true,
        children: [
          { name: 'All Users', href: '/admin/users', icon: PiUsersBold },
          { name: 'Roles & Permissions', href: '/admin/users/roles', icon: PiUserCheckBold },
          { name: 'Activity Log', href: '/admin/users/activity', icon: PiClockBold },
        ],
      },
      {
        name: 'Settings',
        href: '/admin/settings',
        icon: PiGearBold,
        adminOnly: true,
      },
    ],
  },
];

// ── Visibility ────────────────────────────────────────────────
export function getVisibleSections(
  sections: NavSection[],
  opts: { isAdmin: boolean }
): NavSection[] {
  const itemVisible = (item: NavItem): boolean => {
    const m = item.maturity ?? 'stable';
    if (m === 'hidden' || m === 'internal') return false;
    if (item.adminOnly && !opts.isAdmin) return false;
    return true;
  };
  return sections
    .filter((s) => (s.maturity ?? 'stable') !== 'hidden' && (s.maturity ?? 'stable') !== 'internal')
    .map((s) => ({ ...s, items: s.items.filter(itemVisible) }))
    .filter((s) => s.items.length > 0);
}

// ── Module + Workspace axes (whitelabel productization) ───────────
// Additive: existing data/exports above are untouched. See
// docs/2026-07-11-modular-product-catalog.md and the role-scoped-admin spec.

/** Sellable module a section belongs to (the whitelabel product axis). */
export type ModuleId =
  | 'billing' | 'ra' | 'offers' | 'sales' | 'crm' | 'orders' | 'field'
  | 'coverage' | 'network' | 'compliance' | 'portal' | 'checkout'
  | 'workflows' | 'integrations' | 'core';

/** Role-area a section renders in (the admin-console nav axis). */
export type WorkspaceId =
  | 'finance' | 'sales' | 'ops' | 'support' | 'executive' | 'platform' | 'admin';

export interface WorkspaceMeta {
  id: WorkspaceId;
  label: string;
  roles: AdminRole[]; // roles that may enter this workspace (porting-plan B1a)
  order: number;
}

const ELEVATED: AdminRole[] = ['super_admin', 'product_manager'];
const OPERATIONAL: AdminRole[] = ['super_admin', 'product_manager', 'editor'];
const ALL_ADMIN_ROLES: AdminRole[] = ['super_admin', 'product_manager', 'editor', 'viewer'];

// B1a: viewer -> read-oriented (Executive/Support); editor -> operational
// feature workspaces; elevated -> all incl. Administration (parity with
// today's getVisibleSections({isAdmin})).
export const WORKSPACES: WorkspaceMeta[] = [
  { id: 'executive', label: 'Executive',         roles: ALL_ADMIN_ROLES, order: 0 },
  { id: 'finance',   label: 'Finance',           roles: OPERATIONAL,     order: 1 },
  { id: 'sales',     label: 'Sales & Marketing', roles: OPERATIONAL,     order: 2 },
  { id: 'ops',       label: 'Ops & Onboarding',  roles: OPERATIONAL,     order: 3 },
  { id: 'support',   label: 'Support',           roles: ALL_ADMIN_ROLES, order: 4 },
  { id: 'platform',  label: 'Platform',          roles: OPERATIONAL,     order: 5 },
  { id: 'admin',     label: 'Administration',    roles: ELEVATED,        order: 6 },
];

/** Which workspace each top-level item renders in. Keyed by item.name (unique). */
export const ITEM_WORKSPACE: Record<string, WorkspaceId> = {
  Dashboard: 'executive',
  'Billing & Revenue': 'finance',
  Payments: 'finance',
  Products: 'sales',
  Quotes: 'sales',
  Suppliers: 'sales',
  'Sales Engine': 'sales',
  'B2B Feasibility': 'sales',
  'Coverage Checker': 'sales',
  'CPQ Builder': 'sales',
  Partners: 'sales',
  'Competitor Analysis': 'sales',
  Marketing: 'sales',
  'CMS Management': 'sales',
  Contracts: 'ops',
  Orders: 'ops',
  'Order Fulfillment': 'ops',
  'Field Operations': 'ops',
  'B2B Customers': 'ops',
  'Corporate Clients': 'ops',
  Approvals: 'ops',
  'KYC Review': 'ops',
  'KYB Compliance': 'ops',
  'Document Reviews': 'ops',
  Customers: 'support',
  'Customer Devices': 'support',
  Diagnostics: 'support',
  Coverage: 'platform',
  'Network Management': 'platform',
  Notifications: 'platform',
  Integrations: 'platform',
  Orchestrator: 'admin',
  Users: 'admin',
  Settings: 'admin',
};

/** Which sellable module each top-level item belongs to. Keyed by item.name. */
export const ITEM_MODULE: Record<string, ModuleId> = {
  Dashboard: 'core',
  'Billing & Revenue': 'billing',
  Payments: 'billing',
  Products: 'offers',
  Quotes: 'offers',
  Suppliers: 'offers',
  'CPQ Builder': 'offers',
  'Sales Engine': 'sales',
  Partners: 'sales',
  'Competitor Analysis': 'sales',
  Marketing: 'sales',
  'CMS Management': 'sales',
  'B2B Feasibility': 'coverage',
  'Coverage Checker': 'coverage',
  Coverage: 'coverage',
  'Network Management': 'network',
  Contracts: 'orders',
  Orders: 'orders',
  'Order Fulfillment': 'orders',
  'Field Operations': 'field',
  Customers: 'crm',
  'B2B Customers': 'crm',
  'Corporate Clients': 'crm',
  'Customer Devices': 'crm',
  Diagnostics: 'crm',
  Approvals: 'compliance',
  'KYC Review': 'compliance',
  'KYB Compliance': 'compliance',
  'Document Reviews': 'compliance',
  Notifications: 'core',
  Integrations: 'integrations',
  Orchestrator: 'workflows',
  Users: 'core',
  Settings: 'core',
};

export interface WorkspaceNav {
  id: WorkspaceId;
  label: string;
  items: NavItem[];
}

const isElevated = (role: AdminRole) => ELEVATED.includes(role);

// Mirrors getVisibleSections' item rule (hide internal/hidden; honour adminOnly).
function moduleItemVisible(item: NavItem, role: AdminRole): boolean {
  const m = item.maturity ?? 'stable';
  if (m === 'hidden' || m === 'internal') return false;
  if (item.adminOnly && !isElevated(role)) return false;
  return true;
}

/**
 * Role-scoped, module-gated nav grouped by workspace.
 * @param modules enabled ModuleIds for the tenant; omit = all on (tenant #1).
 *                This is the whitelabel per-module entitlement switch (Phase 2).
 */
export function getWorkspaceNav(opts: {
  role: AdminRole;
  modules?: ModuleId[];
}): WorkspaceNav[] {
  const { role, modules } = opts;
  const allItems: NavItem[] = [...featureSections, ...bottomSections].flatMap((s) => s.items);
  return WORKSPACES.filter((w) => w.roles.includes(role))
    .sort((a, b) => a.order - b.order)
    .map((w) => ({
      id: w.id,
      label: w.label,
      items: allItems.filter(
        (i) =>
          ITEM_WORKSPACE[i.name] === w.id &&
          moduleItemVisible(i, role) &&
          (!modules || modules.includes(ITEM_MODULE[i.name] ?? 'core'))
      ),
    }))
    .filter((w) => w.items.length > 0);
}

/** Which workspace owns a route (for deep-link / cross-workspace nav). */
export function workspaceForPath(pathname: string): WorkspaceId | null {
  const path = pathname.split('?')[0];
  const allItems: NavItem[] = [...featureSections, ...bottomSections].flatMap((s) => s.items);
  for (const item of allItems) {
    const match = hasChildren(item)
      ? item.children.some((c) => c.href.split('?')[0] === path)
      : item.href.split('?')[0] === path;
    if (match) return ITEM_WORKSPACE[item.name] ?? null;
  }
  return null;
}
