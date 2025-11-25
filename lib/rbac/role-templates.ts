/**
 * Role Templates for RBAC System
 *
 * Predefined role templates for different organizational functions.
 * Each template defines a complete set of permissions for a specific role.
 */

import { PERMISSIONS } from './permissions'

export interface RoleTemplate {
  id: string
  name: string
  description: string
  department: string
  level: 'executive' | 'management' | 'staff' | 'support'
  permissions: string[]
  isDefault?: boolean
  color?: string
  icon?: string
}

export const ROLE_TEMPLATES: Record<string, RoleTemplate> = {
  // ============================================
  // EXECUTIVE MANAGEMENT
  // ============================================

  CEO: {
    id: 'ceo',
    name: 'Chief Executive Officer',
    description: 'Full system access with all permissions',
    department: 'Executive',
    level: 'executive',
    color: 'purple',
    icon: 'Crown',
    permissions: [
      // Full access to everything
      ...Object.values(PERMISSIONS.DASHBOARD),
      ...Object.values(PERMISSIONS.PRODUCTS),
      ...Object.values(PERMISSIONS.COVERAGE),
      ...Object.values(PERMISSIONS.CUSTOMERS),
      ...Object.values(PERMISSIONS.ORDERS),
      ...Object.values(PERMISSIONS.BILLING),
      ...Object.values(PERMISSIONS.FINANCE),
      ...Object.values(PERMISSIONS.CMS),
      ...Object.values(PERMISSIONS.MARKETING),
      ...Object.values(PERMISSIONS.SALES),
      ...Object.values(PERMISSIONS.OPERATIONS),
      ...Object.values(PERMISSIONS.SUPPORT),
      ...Object.values(PERMISSIONS.INTEGRATIONS),
      ...Object.values(PERMISSIONS.USERS),
      ...Object.values(PERMISSIONS.ACCESS_REQUESTS),
      ...Object.values(PERMISSIONS.SYSTEM),
      ...Object.values(PERMISSIONS.PARTNERS),
      ...Object.values(PERMISSIONS.PARTNERS_ADMIN),
    ],
  },

  CFO: {
    id: 'cfo',
    name: 'Chief Financial Officer',
    description: 'Full financial management and executive reporting access',
    department: 'Executive',
    level: 'executive',
    color: 'green',
    icon: 'DollarSign',
    permissions: [
      ...Object.values(PERMISSIONS.DASHBOARD),
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.PRODUCTS.VIEW_COSTS,
      ...Object.values(PERMISSIONS.BILLING),
      ...Object.values(PERMISSIONS.FINANCE),
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.EXPORT,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.SALES.VIEW,
      PERMISSIONS.SALES.VIEW_COMMISSIONS,
      PERMISSIONS.USERS.VIEW,
      PERMISSIONS.SYSTEM.VIEW_AUDIT_TRAIL,
    ],
  },

  COO: {
    id: 'coo',
    name: 'Chief Operating Officer',
    description: 'Full operational and product management access',
    department: 'Executive',
    level: 'executive',
    color: 'blue',
    icon: 'Settings',
    permissions: [
      ...Object.values(PERMISSIONS.DASHBOARD),
      ...Object.values(PERMISSIONS.PRODUCTS),
      ...Object.values(PERMISSIONS.COVERAGE),
      ...Object.values(PERMISSIONS.OPERATIONS),
      ...Object.values(PERMISSIONS.CUSTOMERS),
      ...Object.values(PERMISSIONS.ORDERS),
      PERMISSIONS.BILLING.VIEW,
      PERMISSIONS.BILLING.VIEW_REVENUE,
      PERMISSIONS.SUPPORT.VIEW_TICKETS,
      PERMISSIONS.SUPPORT.VIEW_CUSTOMER_HISTORY,
      PERMISSIONS.USERS.VIEW,
      PERMISSIONS.SYSTEM.VIEW_LOGS,
    ],
  },

  CTO: {
    id: 'cto',
    name: 'Chief Technology Officer',
    description: 'Full technology, systems, and integration management access',
    department: 'Executive',
    level: 'executive',
    color: 'slate',
    icon: 'Cpu',
    permissions: [
      ...Object.values(PERMISSIONS.DASHBOARD),
      ...Object.values(PERMISSIONS.SYSTEM),
      ...Object.values(PERMISSIONS.INTEGRATIONS),
      ...Object.values(PERMISSIONS.PRODUCTS),
      ...Object.values(PERMISSIONS.COVERAGE),
      ...Object.values(PERMISSIONS.OPERATIONS),
      PERMISSIONS.USERS.VIEW,
      PERMISSIONS.USERS.EDIT,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.SUPPORT.VIEW_TICKETS,
    ],
  },

  CMO: {
    id: 'cmo',
    name: 'Chief Marketing Officer',
    description: 'Full marketing, content, and brand management access',
    department: 'Executive',
    level: 'executive',
    color: 'violet',
    icon: 'Sparkles',
    permissions: [
      ...Object.values(PERMISSIONS.DASHBOARD),
      ...Object.values(PERMISSIONS.MARKETING),
      ...Object.values(PERMISSIONS.CMS),
      ...Object.values(PERMISSIONS.PRODUCTS),
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.EXPORT,
      PERMISSIONS.SALES.VIEW,
      PERMISSIONS.SALES.VIEW_PIPELINE,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.BILLING.VIEW,
      PERMISSIONS.BILLING.VIEW_REVENUE,
    ],
  },

  // ============================================
  // MANAGEMENT ROLES
  // ============================================

  GENERAL_MANAGER: {
    id: 'general_manager',
    name: 'General Manager',
    description: 'Broad operational authority across multiple departments',
    department: 'Management',
    level: 'management',
    color: 'indigo',
    icon: 'Briefcase',
    permissions: [
      ...Object.values(PERMISSIONS.DASHBOARD),
      ...Object.values(PERMISSIONS.OPERATIONS),
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.PRODUCTS.EDIT,
      PERMISSIONS.PRODUCTS.APPROVE,
      PERMISSIONS.COVERAGE.VIEW,
      PERMISSIONS.COVERAGE.EDIT,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.EDIT,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.ORDERS.PROCESS,
      PERMISSIONS.ORDERS.EDIT,
      PERMISSIONS.BILLING.VIEW,
      PERMISSIONS.BILLING.VIEW_REVENUE,
      PERMISSIONS.SUPPORT.VIEW_TICKETS,
      PERMISSIONS.SUPPORT.RESPOND_TICKETS,
      PERMISSIONS.SALES.VIEW,
      PERMISSIONS.SALES.VIEW_PIPELINE,
      PERMISSIONS.USERS.VIEW,
    ],
  },

  DEPARTMENT_MANAGER: {
    id: 'department_manager',
    name: 'Department Manager',
    description: 'Manages specific department operations and team',
    department: 'Management',
    level: 'management',
    color: 'sky',
    icon: 'Users',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      PERMISSIONS.DASHBOARD.VIEW_REPORTS,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.EDIT,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.ORDERS.PROCESS,
      PERMISSIONS.SUPPORT.VIEW_TICKETS,
      PERMISSIONS.SUPPORT.RESPOND_TICKETS,
      PERMISSIONS.SUPPORT.CLOSE_TICKETS,
      PERMISSIONS.OPERATIONS.VIEW,
      PERMISSIONS.OPERATIONS.MANAGE_WORKFLOWS,
      PERMISSIONS.USERS.VIEW,
    ],
  },

  REGIONAL_MANAGER: {
    id: 'regional_manager',
    name: 'Regional Manager',
    description: 'Oversees operations and sales within a specific region',
    department: 'Management',
    level: 'management',
    color: 'cyan',
    icon: 'Map',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      PERMISSIONS.DASHBOARD.VIEW_REPORTS,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.COVERAGE.VIEW,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.EDIT,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.ORDERS.CREATE,
      PERMISSIONS.ORDERS.PROCESS,
      PERMISSIONS.SALES.VIEW,
      PERMISSIONS.SALES.MANAGE_LEADS,
      PERMISSIONS.SALES.VIEW_PIPELINE,
      PERMISSIONS.SALES.CLOSE_DEALS,
      PERMISSIONS.SUPPORT.VIEW_TICKETS,
      PERMISSIONS.OPERATIONS.VIEW,
      PERMISSIONS.BILLING.VIEW,
    ],
  },

  // ============================================
  // FINANCIAL ROLES
  // ============================================

  FINANCE_MANAGER: {
    id: 'finance_manager',
    name: 'Finance Manager',
    description: 'Manages financial operations, budgets, and reporting',
    department: 'Finance',
    level: 'management',
    color: 'emerald',
    icon: 'TrendingUp',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_REPORTS,
      ...Object.values(PERMISSIONS.BILLING),
      ...Object.values(PERMISSIONS.FINANCE),
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.PRODUCTS.VIEW_COSTS,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.SALES.VIEW,
      PERMISSIONS.SALES.VIEW_COMMISSIONS,
    ],
  },

  ACCOUNTANT: {
    id: 'accountant',
    name: 'Accountant',
    description: 'Handles invoicing, payments, and financial records',
    department: 'Finance',
    level: 'staff',
    color: 'teal',
    icon: 'Calculator',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.BILLING.VIEW,
      PERMISSIONS.BILLING.MANAGE_INVOICES,
      PERMISSIONS.BILLING.PROCESS_PAYMENTS,
      PERMISSIONS.BILLING.EXPORT_REPORTS,
      PERMISSIONS.FINANCE.VIEW_ALL,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.ORDERS.VIEW,
    ],
  },

  BILLING_SPECIALIST: {
    id: 'billing_specialist',
    name: 'Billing Specialist',
    description: 'Focuses on billing operations and subscription management',
    department: 'Finance',
    level: 'staff',
    color: 'cyan',
    icon: 'Receipt',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      ...Object.values(PERMISSIONS.BILLING),
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.ORDERS.VIEW,
    ],
  },

  // ============================================
  // PRODUCT & OPERATIONS ROLES
  // ============================================

  PRODUCT_MANAGER: {
    id: 'product_manager',
    name: 'Product Manager',
    description: 'Manages product catalog, pricing, and approvals',
    department: 'Product',
    level: 'management',
    color: 'orange',
    icon: 'Package',
    isDefault: true,
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      ...Object.values(PERMISSIONS.PRODUCTS),
      PERMISSIONS.COVERAGE.VIEW,
      PERMISSIONS.COVERAGE.VIEW_ANALYTICS,
      PERMISSIONS.CMS.VIEW,
      PERMISSIONS.CMS.EDIT,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.CUSTOMERS.VIEW,
    ],
  },

  PRODUCT_ANALYST: {
    id: 'product_analyst',
    name: 'Product Analyst',
    description: 'Analyzes product performance and market data',
    department: 'Product',
    level: 'staff',
    color: 'amber',
    icon: 'BarChart',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      PERMISSIONS.DASHBOARD.VIEW_REPORTS,
      PERMISSIONS.DASHBOARD.EXPORT_DATA,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.COVERAGE.VIEW,
      PERMISSIONS.COVERAGE.VIEW_ANALYTICS,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.CUSTOMERS.VIEW,
    ],
  },

  OPERATIONS_MANAGER: {
    id: 'operations_manager',
    name: 'Operations Manager',
    description: 'Oversees daily operations, workflows, and logistics',
    department: 'Operations',
    level: 'management',
    color: 'indigo',
    icon: 'Workflow',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      ...Object.values(PERMISSIONS.OPERATIONS),
      PERMISSIONS.COVERAGE.VIEW,
      PERMISSIONS.COVERAGE.EDIT,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.ORDERS.PROCESS,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.SUPPORT.VIEW_TICKETS,
    ],
  },

  SERVICE_DELIVERY_MANAGER: {
    id: 'service_delivery_manager',
    name: 'Service Delivery Manager',
    description: 'Manages end-to-end service delivery, installations, and customer activations',
    department: 'Operations',
    level: 'management',
    color: 'blue',
    icon: 'Truck',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      PERMISSIONS.OPERATIONS.VIEW,
      PERMISSIONS.OPERATIONS.MANAGE_WORKFLOWS,
      PERMISSIONS.OPERATIONS.MANAGE_INVENTORY,
      PERMISSIONS.OPERATIONS.MANAGE_LOGISTICS,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.ORDERS.PROCESS,
      PERMISSIONS.ORDERS.EDIT,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.EDIT,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.COVERAGE.VIEW,
      PERMISSIONS.SUPPORT.VIEW_TICKETS,
      PERMISSIONS.SUPPORT.VIEW_CUSTOMER_HISTORY,
    ],
  },

  SERVICE_DELIVERY_ADMINISTRATOR: {
    id: 'service_delivery_administrator',
    name: 'Service Delivery Administrator',
    description: 'Handles service delivery administration, scheduling, and coordination',
    department: 'Operations',
    level: 'staff',
    color: 'teal',
    icon: 'ClipboardList',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.OPERATIONS.VIEW,
      PERMISSIONS.OPERATIONS.MANAGE_WORKFLOWS,
      PERMISSIONS.OPERATIONS.MANAGE_LOGISTICS,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.ORDERS.PROCESS,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.COVERAGE.VIEW,
      PERMISSIONS.SUPPORT.VIEW_TICKETS,
    ],
  },

  // ============================================
  // SALES & MARKETING ROLES
  // ============================================

  SALES_MANAGER: {
    id: 'sales_manager',
    name: 'Sales Manager',
    description: 'Manages sales team, pipeline, and revenue targets',
    department: 'Sales',
    level: 'management',
    color: 'rose',
    icon: 'Target',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      ...Object.values(PERMISSIONS.SALES),
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.EDIT,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.ORDERS.CREATE,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.BILLING.VIEW,
      PERMISSIONS.BILLING.VIEW_REVENUE,
    ],
  },

  SALES_REP: {
    id: 'sales_rep',
    name: 'Sales Representative',
    description: 'Handles customer sales, leads, and order creation',
    department: 'Sales',
    level: 'staff',
    color: 'pink',
    icon: 'UserCheck',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.SALES.VIEW,
      PERMISSIONS.SALES.MANAGE_LEADS,
      PERMISSIONS.SALES.VIEW_PIPELINE,
      PERMISSIONS.SALES.CLOSE_DEALS,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.EDIT,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.ORDERS.CREATE,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.COVERAGE.VIEW,
    ],
  },

  SALES_PARTNER: {
    id: 'sales_partner',
    name: 'Sales Partner',
    description: 'External sales partners managing leads and tracking commissions',
    department: 'Sales',
    level: 'staff',
    color: 'fuchsia',
    icon: 'Handshake',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.PARTNERS.VIEW,
      PERMISSIONS.PARTNERS.VIEW_OWN_DATA,
      PERMISSIONS.PARTNERS.MANAGE_LEADS,
      PERMISSIONS.PARTNERS.VIEW_COMMISSIONS,
      PERMISSIONS.PARTNERS.ACCESS_RESOURCES,
      PERMISSIONS.PARTNERS.UPDATE_PROFILE,
      PERMISSIONS.CUSTOMERS.VIEW, // Limited to own leads
      PERMISSIONS.ORDERS.VIEW,    // Limited to own orders
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.COVERAGE.VIEW,
    ],
  },

  MARKETING_MANAGER: {
    id: 'marketing_manager',
    name: 'Marketing Manager',
    description: 'Manages marketing campaigns, content, and analytics',
    department: 'Marketing',
    level: 'management',
    color: 'violet',
    icon: 'Megaphone',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      ...Object.values(PERMISSIONS.MARKETING),
      ...Object.values(PERMISSIONS.CMS),
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.EXPORT,
    ],
  },

  CONTENT_EDITOR: {
    id: 'content_editor',
    name: 'Content Editor',
    description: 'Creates and manages website content and marketing materials',
    department: 'Marketing',
    level: 'staff',
    color: 'purple',
    icon: 'FileEdit',
    isDefault: true,
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      ...Object.values(PERMISSIONS.CMS),
      PERMISSIONS.MARKETING.VIEW,
      PERMISSIONS.MARKETING.VIEW_ANALYTICS,
      PERMISSIONS.PRODUCTS.VIEW,
    ],
  },

  CONTENT_MANAGER: {
    id: 'content_manager',
    name: 'Content Manager',
    description: 'Full CMS access including templates, AI generation, and publishing',
    department: 'Marketing',
    level: 'management',
    color: 'indigo',
    icon: 'Layout',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      ...Object.values(PERMISSIONS.CMS),
      ...Object.values(PERMISSIONS.MARKETING),
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.PRODUCTS.EDIT,
      PERMISSIONS.CUSTOMERS.VIEW,
    ],
  },

  BLOG_WRITER: {
    id: 'blog_writer',
    name: 'Blog Writer',
    description: 'Creates and edits blog content, no publishing rights',
    department: 'Marketing',
    level: 'staff',
    color: 'teal',
    icon: 'PenTool',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.CMS.VIEW,
      PERMISSIONS.CMS.CREATE,
      PERMISSIONS.CMS.EDIT,
      PERMISSIONS.CMS.USE_AI,
      PERMISSIONS.CMS.MANAGE_MEDIA,
      PERMISSIONS.MARKETING.VIEW,
      PERMISSIONS.PRODUCTS.VIEW,
    ],
  },

  // ============================================
  // SUPPORT & CUSTOMER SERVICE ROLES
  // ============================================

  SUPPORT_MANAGER: {
    id: 'support_manager',
    name: 'Support Manager',
    description: 'Oversees customer support operations and team',
    department: 'Support',
    level: 'management',
    color: 'sky',
    icon: 'Headphones',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      ...Object.values(PERMISSIONS.SUPPORT),
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.EDIT,
      PERMISSIONS.CUSTOMERS.VIEW_PERSONAL_INFO,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.ORDERS.EDIT,
      PERMISSIONS.ORDERS.CANCEL,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.COVERAGE.VIEW,
    ],
  },

  SUPPORT_AGENT: {
    id: 'support_agent',
    name: 'Support Agent',
    description: 'Handles customer inquiries and support tickets',
    department: 'Support',
    level: 'staff',
    color: 'blue',
    icon: 'MessageCircle',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      ...Object.values(PERMISSIONS.SUPPORT),
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.CUSTOMERS.VIEW_PERSONAL_INFO,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.COVERAGE.VIEW,
    ],
  },

  // ============================================
  // TECHNICAL & ADMIN ROLES
  // ============================================

  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Complete system access for system administrators',
    department: 'IT',
    level: 'executive',
    color: 'red',
    icon: 'Shield',
    isDefault: true,
    permissions: [
      // Full access to everything
      ...Object.values(PERMISSIONS.DASHBOARD),
      ...Object.values(PERMISSIONS.PRODUCTS),
      ...Object.values(PERMISSIONS.COVERAGE),
      ...Object.values(PERMISSIONS.CUSTOMERS),
      ...Object.values(PERMISSIONS.ORDERS),
      ...Object.values(PERMISSIONS.BILLING),
      ...Object.values(PERMISSIONS.FINANCE),
      ...Object.values(PERMISSIONS.CMS),
      ...Object.values(PERMISSIONS.MARKETING),
      ...Object.values(PERMISSIONS.SALES),
      ...Object.values(PERMISSIONS.OPERATIONS),
      ...Object.values(PERMISSIONS.SUPPORT),
      ...Object.values(PERMISSIONS.INTEGRATIONS),
      ...Object.values(PERMISSIONS.USERS),
      ...Object.values(PERMISSIONS.ACCESS_REQUESTS),
      ...Object.values(PERMISSIONS.SYSTEM),
      ...Object.values(PERMISSIONS.PARTNERS),
      ...Object.values(PERMISSIONS.PARTNERS_ADMIN),
    ],
  },

  SYSTEM_ADMIN: {
    id: 'system_admin',
    name: 'System Administrator',
    description: 'Manages system settings, integrations, and security',
    department: 'IT',
    level: 'management',
    color: 'slate',
    icon: 'Server',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      ...Object.values(PERMISSIONS.SYSTEM),
      ...Object.values(PERMISSIONS.INTEGRATIONS),
      PERMISSIONS.USERS.VIEW,
      PERMISSIONS.USERS.EDIT,
      PERMISSIONS.ACCESS_REQUESTS.VIEW,
    ],
  },

  // ============================================
  // READ-ONLY / VIEWER ROLES
  // ============================================

  EXECUTIVE_VIEWER: {
    id: 'executive_viewer',
    name: 'Executive Viewer',
    description: 'Read-only access to executive dashboards and reports',
    department: 'Executive',
    level: 'executive',
    color: 'gray',
    icon: 'Eye',
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.DASHBOARD.VIEW_ANALYTICS,
      PERMISSIONS.DASHBOARD.VIEW_REPORTS,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.ORDERS.VIEW,
      PERMISSIONS.BILLING.VIEW,
      PERMISSIONS.BILLING.VIEW_REVENUE,
      PERMISSIONS.FINANCE.VIEW_ALL,
      PERMISSIONS.FINANCE.VIEW_PROFIT_LOSS,
      PERMISSIONS.SALES.VIEW,
      PERMISSIONS.MARKETING.VIEW_ANALYTICS,
    ],
  },

  VIEWER: {
    id: 'viewer',
    name: 'Viewer',
    description: 'Basic read-only access to public information',
    department: 'General',
    level: 'support',
    color: 'zinc',
    icon: 'Book',
    isDefault: true,
    permissions: [
      PERMISSIONS.DASHBOARD.VIEW,
      PERMISSIONS.PRODUCTS.VIEW,
    ],
  },
}

// Helper to get all role template IDs
export const ROLE_TEMPLATE_IDS = Object.keys(ROLE_TEMPLATES)

// Helper to get role templates by department
export function getRoleTemplatesByDepartment(department: string): RoleTemplate[] {
  return Object.values(ROLE_TEMPLATES).filter(
    template => template.department === department
  )
}

// Helper to get role templates by level
export function getRoleTemplatesByLevel(
  level: RoleTemplate['level']
): RoleTemplate[] {
  return Object.values(ROLE_TEMPLATES).filter(template => template.level === level)
}

// Helper to get default role templates (shown first in UI)
export function getDefaultRoleTemplates(): RoleTemplate[] {
  return Object.values(ROLE_TEMPLATES).filter(template => template.isDefault)
}

// All departments for filtering
export const DEPARTMENTS = [
  'Executive',
  'Management',
  'Finance',
  'Product',
  'Operations',
  'Sales',
  'Marketing',
  'Support',
  'IT',
  'General',
] as const

export type Department = typeof DEPARTMENTS[number]
