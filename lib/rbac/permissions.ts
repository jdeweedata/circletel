/**
 * Role-Based Access Control (RBAC) Permissions
 *
 * Defines all available permissions in the system organized by resource.
 * Each permission follows the pattern: {resource}:{action}
 */

export const PERMISSIONS = {
  // Dashboard & Analytics
  DASHBOARD: {
    VIEW: 'dashboard:view',
    VIEW_ANALYTICS: 'dashboard:view_analytics',
    VIEW_REPORTS: 'dashboard:view_reports',
    EXPORT_DATA: 'dashboard:export_data',
  },

  // Product Management
  PRODUCTS: {
    VIEW: 'products:view',
    CREATE: 'products:create',
    EDIT: 'products:edit',
    DELETE: 'products:delete',
    APPROVE: 'products:approve',
    PUBLISH: 'products:publish',
    MANAGE_PRICING: 'products:manage_pricing',
    VIEW_COSTS: 'products:view_costs',
  },

  // Coverage Management
  COVERAGE: {
    VIEW: 'coverage:view',
    EDIT: 'coverage:edit',
    MANAGE_PROVIDERS: 'coverage:manage_providers',
    RUN_TESTS: 'coverage:run_tests',
    VIEW_ANALYTICS: 'coverage:view_analytics',
  },

  // Customer & Orders
  CUSTOMERS: {
    VIEW: 'customers:view',
    EDIT: 'customers:edit',
    DELETE: 'customers:delete',
    VIEW_PERSONAL_INFO: 'customers:view_personal_info',
    EXPORT: 'customers:export',
  },

  ORDERS: {
    VIEW: 'orders:view',
    CREATE: 'orders:create',
    EDIT: 'orders:edit',
    CANCEL: 'orders:cancel',
    PROCESS: 'orders:process',
    REFUND: 'orders:refund',
  },

  // Financial Management
  BILLING: {
    VIEW: 'billing:view',
    MANAGE_INVOICES: 'billing:manage_invoices',
    PROCESS_PAYMENTS: 'billing:process_payments',
    VIEW_REVENUE: 'billing:view_revenue',
    MANAGE_SUBSCRIPTIONS: 'billing:manage_subscriptions',
    EXPORT_REPORTS: 'billing:export_reports',
  },

  FINANCE: {
    VIEW_ALL: 'finance:view_all',
    APPROVE_EXPENSES: 'finance:approve_expenses',
    MANAGE_BUDGETS: 'finance:manage_budgets',
    VIEW_PROFIT_LOSS: 'finance:view_profit_loss',
    EXPORT_FINANCIAL_DATA: 'finance:export_financial_data',
  },

  // Content Management
  CMS: {
    VIEW: 'cms:view',
    CREATE: 'cms:create',
    EDIT: 'cms:edit',
    PUBLISH: 'cms:publish',
    DELETE: 'cms:delete',
  },

  // Marketing & Campaigns
  MARKETING: {
    VIEW: 'marketing:view',
    CREATE_CAMPAIGNS: 'marketing:create_campaigns',
    EDIT_CAMPAIGNS: 'marketing:edit_campaigns',
    MANAGE_PROMOTIONS: 'marketing:manage_promotions',
    VIEW_ANALYTICS: 'marketing:view_analytics',
  },

  // Sales Management
  SALES: {
    VIEW: 'sales:view',
    MANAGE_LEADS: 'sales:manage_leads',
    VIEW_PIPELINE: 'sales:view_pipeline',
    CLOSE_DEALS: 'sales:close_deals',
    VIEW_COMMISSIONS: 'sales:view_commissions',
  },

  // Operations
  OPERATIONS: {
    VIEW: 'operations:view',
    MANAGE_WORKFLOWS: 'operations:manage_workflows',
    MANAGE_INVENTORY: 'operations:manage_inventory',
    MANAGE_LOGISTICS: 'operations:manage_logistics',
  },

  // Support & Service
  SUPPORT: {
    VIEW_TICKETS: 'support:view_tickets',
    RESPOND_TICKETS: 'support:respond_tickets',
    CLOSE_TICKETS: 'support:close_tickets',
    VIEW_CUSTOMER_HISTORY: 'support:view_customer_history',
  },

  // Integration Management
  INTEGRATIONS: {
    VIEW: 'integrations:view',
    CONFIGURE: 'integrations:configure',
    MANAGE_ZOHO: 'integrations:manage_zoho',
    MANAGE_API_KEYS: 'integrations:manage_api_keys',
  },

  // User & Access Management
  USERS: {
    VIEW: 'users:view',
    CREATE: 'users:create',
    EDIT: 'users:edit',
    DELETE: 'users:delete',
    MANAGE_ROLES: 'users:manage_roles',
    VIEW_ACTIVITY: 'users:view_activity',
  },

  ACCESS_REQUESTS: {
    VIEW: 'access_requests:view',
    APPROVE: 'access_requests:approve',
    REJECT: 'access_requests:reject',
  },

  // System Administration
  SYSTEM: {
    VIEW_LOGS: 'system:view_logs',
    MANAGE_SETTINGS: 'system:manage_settings',
    MANAGE_SECURITY: 'system:manage_security',
    PERFORM_BACKUPS: 'system:perform_backups',
    VIEW_AUDIT_TRAIL: 'system:view_audit_trail',
  },
} as const

// Flatten permissions for easy iteration
export const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap(category =>
  Object.values(category)
)

// Permission categories for UI grouping
export const PERMISSION_CATEGORIES = {
  'Dashboard & Analytics': PERMISSIONS.DASHBOARD,
  'Product Management': PERMISSIONS.PRODUCTS,
  'Coverage Management': PERMISSIONS.COVERAGE,
  'Customer Management': PERMISSIONS.CUSTOMERS,
  'Order Management': PERMISSIONS.ORDERS,
  'Billing & Invoicing': PERMISSIONS.BILLING,
  'Financial Management': PERMISSIONS.FINANCE,
  'Content Management': PERMISSIONS.CMS,
  'Marketing & Campaigns': PERMISSIONS.MARKETING,
  'Sales Management': PERMISSIONS.SALES,
  'Operations': PERMISSIONS.OPERATIONS,
  'Customer Support': PERMISSIONS.SUPPORT,
  'Integrations': PERMISSIONS.INTEGRATIONS,
  'User Management': PERMISSIONS.USERS,
  'Access Control': PERMISSIONS.ACCESS_REQUESTS,
  'System Administration': PERMISSIONS.SYSTEM,
} as const

// Helper type for permission strings
export type Permission = typeof ALL_PERMISSIONS[number]
export type PermissionCategory = keyof typeof PERMISSION_CATEGORIES
