/**
 * CircleTel Product & Sitemap Mental Map
 *
 * This file serves as the PM Agent's "Mental Map" for understanding
 * where features belong in the CircleTel platform.
 *
 * @module lib/agents/pm/context/product-map
 */

// =============================================================================
// Type Definitions
// =============================================================================

export interface RouteItem {
  label: string
  route: string
  description?: string
}

export interface MenuSection {
  label: string
  items: RouteItem[]
}

export interface NavigationTab {
  tab: string
  sidebarItems: RouteItem[]
}

export interface ProductCategory {
  category: string
  description: string
  products: ProductDefinition[]
}

export interface ProductDefinition {
  name: string
  slug: string
  description: string
  features?: string[]
}

export interface SitemapStructure {
  publicRoutes: {
    mainNavigation: MenuSection[]
    additionalRoutes: RouteItem[]
  }
  customerDashboard: {
    baseRoute: string
    tabs: NavigationTab[]
  }
  partnerPortal: {
    baseRoute: string
    tabs: NavigationTab[]
  }
  adminPanel: {
    baseRoute: string
    mainNavigation: MenuSection[]
    superAdminOnly: MenuSection[]
  }
  productDefinitions: ProductCategory[]
}

// =============================================================================
// CIRCLETEL_SITEMAP - The Complete Mental Map
// =============================================================================

export const CIRCLETEL_SITEMAP: SitemapStructure = {
  // ===========================================================================
  // 1. PUBLIC ROUTES (Marketing Website)
  // ===========================================================================
  publicRoutes: {
    mainNavigation: [
      {
        label: 'Managed IT',
        items: [
          { label: 'Complete IT Management', route: '/services', description: 'Full-service IT support overview' },
          { label: 'Small Business IT', route: '/services/small-business', description: 'Tailored for small businesses' },
          { label: 'Mid-Size Business IT', route: '/services/mid-size', description: 'For established companies' },
          { label: 'Growth-Ready IT', route: '/services/growth-ready', description: 'Scalable solutions' },
          { label: 'Security Solutions', route: '/services/security', description: 'Cybersecurity services' },
          { label: 'Service Bundles', route: '/bundles', description: 'Combined IT + connectivity packages' },
          { label: 'Value-Driven Pricing', route: '/pricing', description: 'Pricing overview' },
        ],
      },
      {
        label: 'Connectivity',
        items: [
          { label: 'Connectivity Overview', route: '/connectivity', description: 'All connectivity options' },
          { label: 'Wi-Fi as a Service', route: '/connectivity/wifi-as-a-service', description: 'Enterprise-grade managed Wi-Fi' },
          { label: 'Fixed Wireless', route: '/connectivity/fixed-wireless', description: 'Fast wireless connectivity' },
          { label: 'Fibre', route: '/connectivity/fibre', description: 'High-speed fibre internet' },
          { label: 'Connectivity Guide', route: '/resources/connectivity-guide', description: 'Help choosing the right option' },
        ],
      },
      {
        label: 'Cloud & Hosting',
        items: [
          { label: 'Cloud Migration', route: '/cloud/migration', description: 'Transition to cloud infrastructure' },
          { label: 'Hosting Solutions', route: '/cloud/hosting', description: 'Business application hosting' },
          { label: 'Backup & Recovery', route: '/cloud/backup', description: 'Disaster recovery services' },
          { label: 'Virtual Desktops', route: '/cloud/virtual-desktops', description: 'Remote desktop solutions' },
        ],
      },
      {
        label: 'Resources',
        items: [
          { label: 'Resources Hub', route: '/resources', description: 'All resources and guides' },
          { label: 'Client Forms', route: '/forms', description: 'Client onboarding forms' },
          { label: 'IT Health Assessment', route: '/resources/it-health', description: 'Free IT health check' },
          { label: 'Power Backup Solutions', route: '/resources/power-backup', description: 'UPS and power solutions' },
          { label: 'Connectivity Guide', route: '/resources/connectivity-guide', description: 'Choosing connectivity' },
          { label: 'Wi-Fi Toolkit', route: '/resources/wifi-toolkit', description: 'Wi-Fi optimization tools' },
        ],
      },
      {
        label: 'Partners',
        items: [
          { label: 'Become a Partner', route: '/become-a-partner', description: 'Partner program signup' },
          { label: 'Partner Portal', route: '/partner/login', description: 'Existing partner login' },
        ],
      },
    ],
    additionalRoutes: [
      { label: 'Homepage', route: '/', description: 'Main landing page' },
      { label: 'Contact', route: '/contact', description: 'Contact page' },
      { label: 'Customer Login', route: '/login', description: 'Customer authentication' },
      { label: 'Checkout', route: '/checkout', description: 'Checkout flow' },
      { label: 'Packages', route: '/packages', description: 'Package selection' },
      { label: 'Coverage Check', route: '/order/coverage', description: 'Check coverage availability' },
      { label: 'Privacy Policy', route: '/privacy-policy', description: 'Privacy policy' },
      { label: 'Terms of Service', route: '/terms-of-service', description: 'Terms of service' },
      { label: 'Refund Policy', route: '/refund-policy', description: 'Refund policy' },
      { label: 'Payment Terms', route: '/payment-terms', description: 'Payment terms' },
      { label: 'Wireless Products', route: '/wireless', description: 'Wireless product pages' },
      { label: 'Business Services', route: '/business', description: 'B2B services overview' },
      { label: 'Email Unsubscribe', route: '/unsubscribe', description: 'Email preference management' },
    ],
  },

  // ===========================================================================
  // 2. CUSTOMER DASHBOARD
  // ===========================================================================
  customerDashboard: {
    baseRoute: '/dashboard',
    tabs: [
      {
        tab: 'Dashboard',
        sidebarItems: [
          { label: 'Overview', route: '/dashboard', description: 'Full-width dashboard overview' },
        ],
      },
      {
        tab: 'Services',
        sidebarItems: [
          { label: 'My Services', route: '/dashboard/services', description: 'Active service subscriptions' },
          { label: 'Usage', route: '/dashboard/usage', description: 'Usage statistics and history' },
          { label: 'Upgrade Plan', route: '/dashboard/services/upgrade', description: 'Upgrade current plan' },
          { label: 'Downgrade Plan', route: '/dashboard/services/downgrade', description: 'Downgrade current plan' },
        ],
      },
      {
        tab: 'Billing',
        sidebarItems: [
          { label: 'Overview', route: '/dashboard/billing', description: 'Billing summary' },
          { label: 'Orders', route: '/dashboard/orders', description: 'Order history' },
          { label: 'Payment Method', route: '/dashboard/payment-method', description: 'Manage payment methods' },
        ],
      },
      {
        tab: 'Account',
        sidebarItems: [
          { label: 'Profile', route: '/dashboard/profile', description: 'Personal information' },
          { label: 'KYC Documents', route: '/dashboard/kyc', description: 'Identity verification documents' },
          { label: 'Compliance', route: '/dashboard/compliance', description: 'FICA compliance status' },
        ],
      },
      {
        tab: 'Help',
        sidebarItems: [
          { label: 'Support', route: '/dashboard/support', description: 'Help and FAQs' },
          { label: 'Tickets', route: '/dashboard/tickets', description: 'Support ticket management' },
        ],
      },
    ],
  },

  // ===========================================================================
  // 3. PARTNER PORTAL
  // ===========================================================================
  partnerPortal: {
    baseRoute: '/partner',
    tabs: [
      {
        tab: 'Dashboard',
        sidebarItems: [
          { label: 'Overview', route: '/partner/dashboard', description: 'Partner dashboard overview' },
        ],
      },
      {
        tab: 'Business',
        sidebarItems: [
          { label: 'All Leads', route: '/partner/leads', description: 'Manage referred leads' },
          { label: 'New Lead', route: '/partner/leads/new', description: 'Submit a new lead' },
        ],
      },
      {
        tab: 'Earnings',
        sidebarItems: [
          { label: 'Commissions', route: '/partner/commissions', description: 'Commission tracking and payouts' },
        ],
      },
      {
        tab: 'Account',
        sidebarItems: [
          { label: 'Profile', route: '/partner/profile', description: 'Partner profile and settings' },
          { label: 'Resources', route: '/partner/resources', description: 'Partner marketing materials' },
        ],
      },
    ],
  },

  // ===========================================================================
  // 4. ADMIN PANEL
  // ===========================================================================
  adminPanel: {
    baseRoute: '/admin',
    mainNavigation: [
      {
        label: 'Dashboard',
        items: [
          { label: 'Overview', route: '/admin', description: 'Admin dashboard' },
        ],
      },
      {
        label: 'Products',
        items: [
          { label: 'All Products', route: '/admin/products', description: 'Product catalog management' },
          { label: 'Add Product', route: '/admin/products/new', description: 'Create new product' },
          { label: 'MTN Deals', route: '/admin/products/mtn-deals', description: 'MTN special deals' },
          { label: 'Drafts', route: '/admin/products/drafts', description: 'Draft products' },
          { label: 'Archived', route: '/admin/products/archived', description: 'Archived products' },
        ],
      },
      {
        label: 'Quotes',
        items: [
          { label: 'All Quotes', route: '/admin/quotes', description: 'Quote management' },
          { label: 'Pending Approval', route: '/admin/quotes?status=pending_approval', description: 'Quotes awaiting approval' },
          { label: 'Accepted', route: '/admin/quotes?status=accepted', description: 'Accepted quotes' },
        ],
      },
      {
        label: 'Orders',
        items: [
          { label: 'All Orders', route: '/admin/orders', description: 'Order management' },
          { label: 'Installation Schedule', route: '/admin/orders/installations', description: 'Installation calendar' },
          { label: 'Technicians', route: '/admin/orders/technicians', description: 'Technician management' },
        ],
      },
      {
        label: 'Customers',
        items: [
          { label: 'All Customers', route: '/admin/customers', description: 'Customer management' },
        ],
      },
      {
        label: 'Partners',
        items: [
          { label: 'All Partners', route: '/admin/partners', description: 'Partner management' },
          { label: 'Pending Approvals', route: '/admin/partners/approvals', description: 'Partner applications' },
        ],
      },
      {
        label: 'Workflow',
        items: [
          { label: 'Approvals', route: '/admin/workflow', description: 'Workflow approval queue' },
        ],
      },
      {
        label: 'KYC & Compliance',
        items: [
          { label: 'KYC Review', route: '/admin/kyc', description: 'KYC document review' },
          { label: 'KYB Compliance', route: '/admin/compliance/kyb', description: 'Business compliance' },
        ],
      },
      {
        label: 'Notifications',
        items: [
          { label: 'All Notifications', route: '/admin/notifications', description: 'Notification management' },
        ],
      },
      {
        label: 'Integrations',
        items: [
          { label: 'Overview', route: '/admin/integrations', description: 'Integration dashboard' },
          { label: 'Zoho Integration', route: '/admin/zoho', description: 'Zoho CRM sync' },
          { label: 'OAuth Tokens', route: '/admin/integrations/oauth', description: 'OAuth token management' },
          { label: 'Webhooks', route: '/admin/integrations/webhooks', description: 'Webhook configuration' },
          { label: 'API Health', route: '/admin/integrations/apis', description: 'API health monitoring' },
          { label: 'Cron Jobs', route: '/admin/integrations/cron', description: 'Scheduled job management' },
        ],
      },
      {
        label: 'CMS Management',
        items: [
          { label: 'Pages', route: '/admin/cms', description: 'Page management' },
          { label: 'Media Library', route: '/admin/cms/media', description: 'Media asset management' },
          { label: 'Page Builder', route: '/admin/cms/builder', description: 'Visual page builder' },
        ],
      },
      {
        label: 'Coverage',
        items: [
          { label: 'Dashboard', route: '/admin/coverage', description: 'Coverage overview' },
          { label: 'Analytics', route: '/admin/coverage/analytics', description: 'Coverage analytics' },
          { label: 'Testing', route: '/admin/coverage/testing', description: 'Coverage testing tools' },
          { label: 'Providers', route: '/admin/coverage/providers', description: 'Provider management' },
          { label: 'Maps', route: '/admin/coverage/maps', description: 'Coverage maps' },
        ],
      },
      {
        label: 'Billing & Revenue',
        items: [
          { label: 'Dashboard', route: '/admin/billing', description: 'Billing overview' },
          { label: 'Customers', route: '/admin/billing/customers', description: 'Customer billing' },
          { label: 'Invoices', route: '/admin/billing/invoices', description: 'Invoice management' },
        ],
      },
      {
        label: 'Payments',
        items: [
          { label: 'Provider Monitoring', route: '/admin/payments/monitoring', description: 'Payment provider status' },
          { label: 'Transactions', route: '/admin/payments/transactions', description: 'Transaction history' },
          { label: 'Webhooks', route: '/admin/payments/webhooks', description: 'Payment webhooks' },
          { label: 'Settings', route: '/admin/payments/settings', description: 'Payment configuration' },
        ],
      },
    ],
    superAdminOnly: [
      {
        label: 'System',
        items: [
          { label: 'Orchestrator', route: '/admin/orchestrator', description: 'Agent orchestration' },
        ],
      },
      {
        label: 'Users',
        items: [
          { label: 'All Users', route: '/admin/users', description: 'Admin user management' },
          { label: 'Roles & Permissions', route: '/admin/users/roles', description: 'RBAC configuration' },
          { label: 'Activity Log', route: '/admin/users/activity', description: 'User activity audit' },
        ],
      },
      {
        label: 'Settings',
        items: [
          { label: 'System Settings', route: '/admin/settings', description: 'Global system settings' },
        ],
      },
    ],
  },

  // ===========================================================================
  // 5. PRODUCT DEFINITIONS
  // ===========================================================================
  productDefinitions: [
    {
      category: 'Connectivity',
      description: 'Internet and network connectivity solutions',
      products: [
        {
          name: 'Fibre',
          slug: 'fibre',
          description: 'High-speed fibre internet for homes and businesses',
          features: [
            'Symmetrical upload/download speeds',
            'Low latency',
            'Unlimited data options',
            'Multiple speed tiers',
          ],
        },
        {
          name: 'Fixed Wireless',
          slug: 'fixed-wireless',
          description: 'Fast wireless connectivity where fibre is unavailable',
          features: [
            'Quick installation',
            'No trenching required',
            'Suitable for rural areas',
            'Business-grade SLAs available',
          ],
        },
        {
          name: 'Wi-Fi as a Service',
          slug: 'wifi-as-a-service',
          description: 'Enterprise-grade managed Wi-Fi solutions',
          features: [
            'Managed access points',
            'Guest network portals',
            'Usage analytics',
            'Remote management',
          ],
        },
      ],
    },
    {
      category: 'Managed IT',
      description: 'Comprehensive IT management and support services',
      products: [
        {
          name: 'Complete IT Management',
          slug: 'complete-it',
          description: 'Full-service IT support and management',
          features: [
            '24/7 helpdesk support',
            'Proactive monitoring',
            'Patch management',
            'Vendor management',
          ],
        },
        {
          name: 'Small Business IT',
          slug: 'small-business',
          description: 'Tailored IT solutions for small businesses (1-20 employees)',
          features: [
            'Essential IT support',
            'Cloud email setup',
            'Basic security',
            'Fixed monthly pricing',
          ],
        },
        {
          name: 'Mid-Size Business IT',
          slug: 'mid-size',
          description: 'Comprehensive IT for established companies (20-100 employees)',
          features: [
            'Dedicated account manager',
            'On-site support options',
            'Advanced security',
            'Compliance assistance',
          ],
        },
        {
          name: 'Growth-Ready IT',
          slug: 'growth-ready',
          description: 'Scalable solutions for rapidly growing businesses',
          features: [
            'Scalable infrastructure',
            'Strategic IT planning',
            'Technology roadmap',
            'M&A IT integration',
          ],
        },
        {
          name: 'Security Solutions',
          slug: 'security',
          description: 'Cybersecurity services and solutions',
          features: [
            'Endpoint protection',
            'Email security',
            'Firewall management',
            'Security awareness training',
          ],
        },
        {
          name: 'Service Bundles',
          slug: 'bundles',
          description: 'Combined IT + connectivity packages',
          features: [
            'Discounted bundle pricing',
            'Single vendor management',
            'Integrated support',
            'Simplified billing',
          ],
        },
      ],
    },
    {
      category: 'Cloud & Hosting',
      description: 'Cloud infrastructure and hosting services',
      products: [
        {
          name: 'Cloud Migration',
          slug: 'cloud-migration',
          description: 'Transition to cloud infrastructure',
          features: [
            'Assessment and planning',
            'Data migration',
            'Application modernization',
            'Hybrid cloud options',
          ],
        },
        {
          name: 'Hosting Solutions',
          slug: 'hosting',
          description: 'Business application hosting',
          features: [
            'Managed hosting',
            'High availability',
            'Automated backups',
            'SSL certificates',
          ],
        },
        {
          name: 'Backup & Recovery',
          slug: 'backup',
          description: 'Disaster recovery and backup services',
          features: [
            'Automated backups',
            'Off-site replication',
            'Rapid recovery',
            'Compliance-ready',
          ],
        },
        {
          name: 'Virtual Desktops',
          slug: 'virtual-desktops',
          description: 'Remote desktop infrastructure (VDI)',
          features: [
            'Work from anywhere',
            'BYOD support',
            'Centralized management',
            'Enhanced security',
          ],
        },
      ],
    },
  ],
}

// =============================================================================
// Helper Functions for PM Agent
// =============================================================================

/**
 * Find all routes matching a search term
 */
export function findRoutes(searchTerm: string): RouteItem[] {
  const results: RouteItem[] = []
  const term = searchTerm.toLowerCase()

  // Search public routes
  CIRCLETEL_SITEMAP.publicRoutes.mainNavigation.forEach((section) => {
    section.items.forEach((item) => {
      if (
        item.label.toLowerCase().includes(term) ||
        item.route.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      ) {
        results.push(item)
      }
    })
  })

  CIRCLETEL_SITEMAP.publicRoutes.additionalRoutes.forEach((item) => {
    if (
      item.label.toLowerCase().includes(term) ||
      item.route.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    ) {
      results.push(item)
    }
  })

  // Search dashboard routes
  CIRCLETEL_SITEMAP.customerDashboard.tabs.forEach((tab) => {
    tab.sidebarItems.forEach((item) => {
      if (
        item.label.toLowerCase().includes(term) ||
        item.route.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      ) {
        results.push(item)
      }
    })
  })

  // Search partner routes
  CIRCLETEL_SITEMAP.partnerPortal.tabs.forEach((tab) => {
    tab.sidebarItems.forEach((item) => {
      if (
        item.label.toLowerCase().includes(term) ||
        item.route.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      ) {
        results.push(item)
      }
    })
  })

  // Search admin routes
  ;[...CIRCLETEL_SITEMAP.adminPanel.mainNavigation, ...CIRCLETEL_SITEMAP.adminPanel.superAdminOnly].forEach(
    (section) => {
      section.items.forEach((item) => {
        if (
          item.label.toLowerCase().includes(term) ||
          item.route.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term)
        ) {
          results.push(item)
        }
      })
    }
  )

  return results
}

/**
 * Get the section a route belongs to
 */
export function getRouteSection(route: string): string | null {
  if (route.startsWith('/admin')) return 'Admin Panel'
  if (route.startsWith('/dashboard')) return 'Customer Dashboard'
  if (route.startsWith('/partner')) return 'Partner Portal'
  return 'Public Website'
}

/**
 * Find products by category
 */
export function getProductsByCategory(category: string): ProductDefinition[] {
  const cat = CIRCLETEL_SITEMAP.productDefinitions.find(
    (c) => c.category.toLowerCase() === category.toLowerCase()
  )
  return cat?.products ?? []
}

/**
 * Get all product slugs
 */
export function getAllProductSlugs(): string[] {
  return CIRCLETEL_SITEMAP.productDefinitions.flatMap((cat) => cat.products.map((p) => p.slug))
}

/**
 * Check if a route exists in the sitemap
 */
export function routeExists(route: string): boolean {
  return findRoutes(route).some((r) => r.route === route)
}
