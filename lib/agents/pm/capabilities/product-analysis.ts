/**
 * Product Gap Analysis Capability
 *
 * Analyzes high-level business goals against the CircleTel product map
 * to identify feature opportunities with impact and effort scoring.
 *
 * @module lib/agents/pm/capabilities/product-analysis
 */

import {
  CIRCLETEL_SITEMAP,
  findRoutes,
  getRouteSection,
  getProductsByCategory,
  RouteItem,
  ProductDefinition,
  NavigationTab,
  MenuSection,
} from '../context/product-map'

// =============================================================================
// Types
// =============================================================================

/**
 * Domain types in the CircleTel platform.
 */
export type ProductDomain = 'PUBLIC' | 'DASHBOARD' | 'PARTNER' | 'ADMIN'

/**
 * Impact score levels (1-5 scale).
 */
export type ImpactScore = 1 | 2 | 3 | 4 | 5

/**
 * Effort score levels (1-5 scale).
 */
export type EffortScore = 1 | 2 | 3 | 4 | 5

/**
 * Feature category types.
 */
export type FeatureCategory =
  | 'retention'
  | 'acquisition'
  | 'revenue'
  | 'efficiency'
  | 'compliance'
  | 'support'
  | 'analytics'
  | 'integration'

/**
 * Input for product gap analysis.
 */
export interface ProductGapInput {
  /** High-level business goal */
  goal: string
  /** Optional focus domains */
  focusDomains?: ProductDomain[]
  /** Optional feature categories to prioritize */
  priorityCategories?: FeatureCategory[]
  /** Maximum features to return */
  maxFeatures?: number
}

/**
 * A suggested feature from gap analysis.
 */
export interface SuggestedFeature {
  /** Feature name */
  name: string
  /** Feature description */
  description: string
  /** Primary domain this feature belongs to */
  primaryDomain: ProductDomain
  /** Additional domains affected */
  affectedDomains: ProductDomain[]
  /** Suggested route placement */
  suggestedRoute: string
  /** Related existing routes */
  relatedRoutes: RouteItem[]
  /** Feature category */
  category: FeatureCategory
  /** Impact score (1-5, higher = more impact) */
  impactScore: ImpactScore
  /** Effort score (1-5, higher = more effort) */
  effortScore: EffortScore
  /** Priority score (impact / effort ratio) */
  priorityScore: number
  /** Rationale for this suggestion */
  rationale: string
  /** Prerequisites or dependencies */
  prerequisites: string[]
  /** Key user stories */
  userStories: string[]
}

/**
 * Output from product gap analysis.
 */
export interface ProductGapOutput {
  /** Original goal analyzed */
  goal: string
  /** Relevant sections identified in the sitemap */
  relevantSections: RelevantSection[]
  /** Suggested features sorted by priority */
  suggestedFeatures: SuggestedFeature[]
  /** Summary statistics */
  summary: {
    totalFeatures: number
    averageImpact: number
    averageEffort: number
    quickWins: number // High impact, low effort
    majorProjects: number // High impact, high effort
    fillIns: number // Low impact, low effort
    thankless: number // Low impact, high effort
  }
  /** Analysis metadata */
  metadata: {
    analyzedAt: Date
    domainsAnalyzed: ProductDomain[]
    categoriesConsidered: FeatureCategory[]
  }
}

/**
 * A relevant section from the sitemap.
 */
export interface RelevantSection {
  /** Section name */
  name: string
  /** Domain */
  domain: ProductDomain
  /** Routes in this section */
  routes: RouteItem[]
  /** Relevance score (0-1) */
  relevanceScore: number
  /** Why this section is relevant */
  relevanceReason: string
}

// =============================================================================
// Goal Keywords Mapping
// =============================================================================

/**
 * Maps business goal keywords to feature categories and relevant sitemap sections.
 */
const GOAL_KEYWORD_MAP: Record<string, {
  categories: FeatureCategory[]
  domains: ProductDomain[]
  sectionKeywords: string[]
}> = {
  // Retention-focused keywords
  retention: {
    categories: ['retention', 'support'],
    domains: ['DASHBOARD', 'ADMIN'],
    sectionKeywords: ['services', 'billing', 'support', 'upgrade', 'usage'],
  },
  churn: {
    categories: ['retention', 'analytics'],
    domains: ['DASHBOARD', 'ADMIN'],
    sectionKeywords: ['services', 'billing', 'analytics', 'customers'],
  },
  loyalty: {
    categories: ['retention', 'revenue'],
    domains: ['DASHBOARD', 'PUBLIC'],
    sectionKeywords: ['services', 'pricing', 'bundles'],
  },

  // Acquisition-focused keywords
  acquisition: {
    categories: ['acquisition', 'revenue'],
    domains: ['PUBLIC', 'PARTNER'],
    sectionKeywords: ['connectivity', 'services', 'pricing', 'leads'],
  },
  growth: {
    categories: ['acquisition', 'revenue'],
    domains: ['PUBLIC', 'PARTNER', 'ADMIN'],
    sectionKeywords: ['coverage', 'products', 'partners', 'leads'],
  },
  leads: {
    categories: ['acquisition'],
    domains: ['PARTNER', 'ADMIN'],
    sectionKeywords: ['leads', 'partners', 'coverage'],
  },

  // Revenue-focused keywords
  revenue: {
    categories: ['revenue', 'acquisition'],
    domains: ['ADMIN', 'DASHBOARD'],
    sectionKeywords: ['billing', 'products', 'pricing', 'invoices'],
  },
  upsell: {
    categories: ['revenue', 'retention'],
    domains: ['DASHBOARD', 'ADMIN'],
    sectionKeywords: ['services', 'upgrade', 'products', 'bundles'],
  },
  pricing: {
    categories: ['revenue'],
    domains: ['ADMIN', 'PUBLIC'],
    sectionKeywords: ['products', 'pricing', 'quotes'],
  },

  // Efficiency-focused keywords
  efficiency: {
    categories: ['efficiency', 'analytics'],
    domains: ['ADMIN'],
    sectionKeywords: ['orders', 'workflow', 'integrations', 'automation'],
  },
  automation: {
    categories: ['efficiency'],
    domains: ['ADMIN'],
    sectionKeywords: ['workflow', 'integrations', 'cron', 'notifications'],
  },
  operations: {
    categories: ['efficiency'],
    domains: ['ADMIN'],
    sectionKeywords: ['orders', 'installations', 'technicians', 'coverage'],
  },

  // Compliance-focused keywords
  compliance: {
    categories: ['compliance'],
    domains: ['ADMIN', 'DASHBOARD', 'PARTNER'],
    sectionKeywords: ['kyc', 'compliance', 'documents'],
  },
  kyc: {
    categories: ['compliance'],
    domains: ['ADMIN', 'DASHBOARD'],
    sectionKeywords: ['kyc', 'compliance', 'customers'],
  },

  // Support-focused keywords
  support: {
    categories: ['support', 'retention'],
    domains: ['DASHBOARD', 'ADMIN'],
    sectionKeywords: ['support', 'tickets', 'help', 'notifications'],
  },
  help: {
    categories: ['support'],
    domains: ['DASHBOARD', 'PUBLIC'],
    sectionKeywords: ['support', 'resources', 'help'],
  },

  // Analytics-focused keywords
  analytics: {
    categories: ['analytics'],
    domains: ['ADMIN', 'DASHBOARD'],
    sectionKeywords: ['analytics', 'coverage', 'billing', 'usage'],
  },
  reporting: {
    categories: ['analytics', 'efficiency'],
    domains: ['ADMIN'],
    sectionKeywords: ['analytics', 'billing', 'orders', 'customers'],
  },

  // Integration-focused keywords
  integration: {
    categories: ['integration', 'efficiency'],
    domains: ['ADMIN'],
    sectionKeywords: ['integrations', 'zoho', 'webhooks', 'apis'],
  },
  api: {
    categories: ['integration'],
    domains: ['ADMIN'],
    sectionKeywords: ['integrations', 'apis', 'webhooks'],
  },

  // B2B-specific keywords
  b2b: {
    categories: ['acquisition', 'revenue'],
    domains: ['ADMIN', 'PUBLIC'],
    sectionKeywords: ['quotes', 'business', 'kyc', 'contracts'],
  },
  enterprise: {
    categories: ['acquisition', 'revenue'],
    domains: ['ADMIN', 'PUBLIC'],
    sectionKeywords: ['quotes', 'products', 'managed-it'],
  },

  // B2C-specific keywords
  b2c: {
    categories: ['acquisition', 'retention'],
    domains: ['PUBLIC', 'DASHBOARD'],
    sectionKeywords: ['connectivity', 'services', 'checkout'],
  },
  consumer: {
    categories: ['acquisition', 'retention'],
    domains: ['PUBLIC', 'DASHBOARD'],
    sectionKeywords: ['connectivity', 'services', 'dashboard'],
  },
}

// =============================================================================
// Feature Templates
// =============================================================================

/**
 * Feature templates by category that can be suggested based on gaps.
 */
const FEATURE_TEMPLATES: Record<FeatureCategory, Array<{
  name: string
  description: string
  primaryDomain: ProductDomain
  affectedDomains: ProductDomain[]
  baseImpact: ImpactScore
  baseEffort: EffortScore
  prerequisites: string[]
  userStories: string[]
  keywords: string[]
}>> = {
  retention: [
    {
      name: 'Service Health Dashboard',
      description: 'Real-time service health monitoring with proactive alerts for customers',
      primaryDomain: 'DASHBOARD',
      affectedDomains: ['ADMIN'],
      baseImpact: 4,
      baseEffort: 3,
      prerequisites: ['Service monitoring infrastructure', 'Alert notification system'],
      userStories: [
        'As a customer, I want to see my service health at a glance',
        'As a customer, I want to receive alerts before issues affect me',
      ],
      keywords: ['health', 'monitoring', 'alerts', 'uptime'],
    },
    {
      name: 'Loyalty Rewards Program',
      description: 'Points-based rewards for long-term customers with tier benefits',
      primaryDomain: 'DASHBOARD',
      affectedDomains: ['ADMIN', 'PUBLIC'],
      baseImpact: 4,
      baseEffort: 4,
      prerequisites: ['Customer tenure tracking', 'Rewards catalog'],
      userStories: [
        'As a customer, I want to earn points for my subscription',
        'As a customer, I want to redeem points for discounts or upgrades',
      ],
      keywords: ['loyalty', 'rewards', 'points', 'retention'],
    },
    {
      name: 'Proactive Support Outreach',
      description: 'AI-driven identification of at-risk customers for proactive support',
      primaryDomain: 'ADMIN',
      affectedDomains: ['DASHBOARD'],
      baseImpact: 5,
      baseEffort: 4,
      prerequisites: ['Customer behavior analytics', 'Support ticketing integration'],
      userStories: [
        'As support, I want to identify at-risk customers before they churn',
        'As a customer, I want to receive help before I need to ask',
      ],
      keywords: ['proactive', 'support', 'churn', 'retention'],
    },
    {
      name: 'Usage Analytics & Recommendations',
      description: 'Personalized usage insights with plan optimization recommendations',
      primaryDomain: 'DASHBOARD',
      affectedDomains: ['ADMIN'],
      baseImpact: 3,
      baseEffort: 2,
      prerequisites: ['Usage data collection', 'Analytics engine'],
      userStories: [
        'As a customer, I want to understand my usage patterns',
        'As a customer, I want recommendations to optimize my plan',
      ],
      keywords: ['usage', 'analytics', 'recommendations', 'optimization'],
    },
  ],
  acquisition: [
    {
      name: 'Coverage Pre-Qualification',
      description: 'Instant coverage check with competitive comparison before signup',
      primaryDomain: 'PUBLIC',
      affectedDomains: ['ADMIN'],
      baseImpact: 5,
      baseEffort: 3,
      prerequisites: ['Multi-provider coverage API', 'Address validation'],
      userStories: [
        'As a visitor, I want to check coverage before providing my details',
        'As a visitor, I want to compare available options at my address',
      ],
      keywords: ['coverage', 'acquisition', 'comparison', 'signup'],
    },
    {
      name: 'Partner Referral Portal Enhancement',
      description: 'Enhanced partner tools for lead tracking and commission visibility',
      primaryDomain: 'PARTNER',
      affectedDomains: ['ADMIN'],
      baseImpact: 4,
      baseEffort: 3,
      prerequisites: ['Partner authentication', 'Commission calculation engine'],
      userStories: [
        'As a partner, I want to track my referrals in real-time',
        'As a partner, I want clear visibility into my commissions',
      ],
      keywords: ['partner', 'referral', 'leads', 'commission'],
    },
    {
      name: 'Self-Service Quote Builder',
      description: 'Interactive quote builder for B2B prospects without sales involvement',
      primaryDomain: 'PUBLIC',
      affectedDomains: ['ADMIN'],
      baseImpact: 4,
      baseEffort: 4,
      prerequisites: ['Product catalog API', 'Pricing rules engine'],
      userStories: [
        'As a business, I want to build a custom quote myself',
        'As a business, I want to compare different package options',
      ],
      keywords: ['quote', 'self-service', 'b2b', 'acquisition'],
    },
  ],
  revenue: [
    {
      name: 'Smart Upsell Engine',
      description: 'AI-powered upsell recommendations based on usage and behavior',
      primaryDomain: 'DASHBOARD',
      affectedDomains: ['ADMIN'],
      baseImpact: 5,
      baseEffort: 4,
      prerequisites: ['Usage analytics', 'Recommendation ML model'],
      userStories: [
        'As a customer, I want relevant upgrade suggestions',
        'As admin, I want to track upsell conversion rates',
      ],
      keywords: ['upsell', 'revenue', 'recommendations', 'upgrade'],
    },
    {
      name: 'Add-On Services Marketplace',
      description: 'Marketplace for additional services (security, backup, support tiers)',
      primaryDomain: 'DASHBOARD',
      affectedDomains: ['ADMIN', 'PUBLIC'],
      baseImpact: 4,
      baseEffort: 3,
      prerequisites: ['Add-on product catalog', 'Billing integration'],
      userStories: [
        'As a customer, I want to browse and add services easily',
        'As admin, I want to manage add-on offerings',
      ],
      keywords: ['addons', 'marketplace', 'services', 'revenue'],
    },
    {
      name: 'Dynamic Pricing Engine',
      description: 'Location and demand-based pricing optimization',
      primaryDomain: 'ADMIN',
      affectedDomains: ['PUBLIC'],
      baseImpact: 4,
      baseEffort: 5,
      prerequisites: ['Pricing rules engine', 'Market data integration'],
      userStories: [
        'As admin, I want to set dynamic pricing rules',
        'As admin, I want to A/B test pricing strategies',
      ],
      keywords: ['pricing', 'dynamic', 'optimization', 'revenue'],
    },
  ],
  efficiency: [
    {
      name: 'Automated Order Processing',
      description: 'End-to-end automation from order to provisioning',
      primaryDomain: 'ADMIN',
      affectedDomains: [],
      baseImpact: 5,
      baseEffort: 4,
      prerequisites: ['Provider API integrations', 'Workflow engine'],
      userStories: [
        'As admin, I want orders to process automatically',
        'As admin, I want to only handle exceptions',
      ],
      keywords: ['automation', 'orders', 'provisioning', 'efficiency'],
    },
    {
      name: 'Intelligent Ticket Routing',
      description: 'AI-powered support ticket categorization and routing',
      primaryDomain: 'ADMIN',
      affectedDomains: ['DASHBOARD'],
      baseImpact: 3,
      baseEffort: 3,
      prerequisites: ['Support ticketing system', 'ML classification model'],
      userStories: [
        'As support, I want tickets routed to the right team automatically',
        'As a customer, I want faster resolution times',
      ],
      keywords: ['tickets', 'routing', 'automation', 'support'],
    },
    {
      name: 'Bulk Operations Dashboard',
      description: 'Admin interface for bulk customer and order operations',
      primaryDomain: 'ADMIN',
      affectedDomains: [],
      baseImpact: 3,
      baseEffort: 2,
      prerequisites: ['Batch processing infrastructure'],
      userStories: [
        'As admin, I want to update multiple records at once',
        'As admin, I want to export data in bulk',
      ],
      keywords: ['bulk', 'operations', 'admin', 'efficiency'],
    },
  ],
  compliance: [
    {
      name: 'Automated KYC Verification',
      description: 'Integration with identity verification services for instant KYC',
      primaryDomain: 'ADMIN',
      affectedDomains: ['DASHBOARD', 'PARTNER'],
      baseImpact: 4,
      baseEffort: 4,
      prerequisites: ['KYC provider integration', 'Document storage'],
      userStories: [
        'As a customer, I want quick identity verification',
        'As admin, I want automated KYC processing',
      ],
      keywords: ['kyc', 'verification', 'compliance', 'automation'],
    },
    {
      name: 'Compliance Audit Trail',
      description: 'Comprehensive audit logging for regulatory compliance',
      primaryDomain: 'ADMIN',
      affectedDomains: [],
      baseImpact: 3,
      baseEffort: 2,
      prerequisites: ['Audit logging infrastructure'],
      userStories: [
        'As admin, I want complete audit trails for all actions',
        'As compliance, I want to generate audit reports',
      ],
      keywords: ['audit', 'compliance', 'logging', 'regulatory'],
    },
  ],
  support: [
    {
      name: 'Self-Service Troubleshooting',
      description: 'Guided troubleshooting wizards for common issues',
      primaryDomain: 'DASHBOARD',
      affectedDomains: ['PUBLIC'],
      baseImpact: 4,
      baseEffort: 2,
      prerequisites: ['Knowledge base', 'Diagnostic APIs'],
      userStories: [
        'As a customer, I want to resolve simple issues myself',
        'As support, I want fewer tickets for common problems',
      ],
      keywords: ['troubleshooting', 'self-service', 'support', 'help'],
    },
    {
      name: 'Live Chat Integration',
      description: 'Real-time chat support with AI-assisted responses',
      primaryDomain: 'DASHBOARD',
      affectedDomains: ['ADMIN', 'PUBLIC'],
      baseImpact: 4,
      baseEffort: 3,
      prerequisites: ['Chat platform integration', 'AI response system'],
      userStories: [
        'As a customer, I want instant support via chat',
        'As support, I want AI suggestions for common queries',
      ],
      keywords: ['chat', 'support', 'live', 'instant'],
    },
  ],
  analytics: [
    {
      name: 'Customer 360 Dashboard',
      description: 'Unified view of customer data, interactions, and health score',
      primaryDomain: 'ADMIN',
      affectedDomains: [],
      baseImpact: 4,
      baseEffort: 3,
      prerequisites: ['Data aggregation pipeline', 'Customer health scoring'],
      userStories: [
        'As admin, I want a complete view of each customer',
        'As support, I want context before helping a customer',
      ],
      keywords: ['customer', '360', 'analytics', 'dashboard'],
    },
    {
      name: 'Revenue Analytics Dashboard',
      description: 'Real-time revenue tracking with forecasting and trends',
      primaryDomain: 'ADMIN',
      affectedDomains: [],
      baseImpact: 4,
      baseEffort: 3,
      prerequisites: ['Financial data pipeline', 'Forecasting model'],
      userStories: [
        'As admin, I want real-time revenue visibility',
        'As admin, I want revenue forecasts and trends',
      ],
      keywords: ['revenue', 'analytics', 'forecasting', 'financial'],
    },
    {
      name: 'Coverage Performance Analytics',
      description: 'Provider performance tracking and coverage optimization insights',
      primaryDomain: 'ADMIN',
      affectedDomains: [],
      baseImpact: 3,
      baseEffort: 2,
      prerequisites: ['Coverage data collection', 'Provider metrics'],
      userStories: [
        'As admin, I want to compare provider performance',
        'As admin, I want to identify coverage gaps',
      ],
      keywords: ['coverage', 'analytics', 'performance', 'providers'],
    },
  ],
  integration: [
    {
      name: 'Zoho CRM Deep Integration',
      description: 'Bi-directional sync with Zoho CRM for sales and support',
      primaryDomain: 'ADMIN',
      affectedDomains: [],
      baseImpact: 4,
      baseEffort: 4,
      prerequisites: ['Zoho API access', 'Data mapping'],
      userStories: [
        'As sales, I want customer data synced to Zoho',
        'As admin, I want deal stages reflected in both systems',
      ],
      keywords: ['zoho', 'crm', 'integration', 'sync'],
    },
    {
      name: 'Webhook Event System',
      description: 'Configurable webhooks for external system notifications',
      primaryDomain: 'ADMIN',
      affectedDomains: [],
      baseImpact: 3,
      baseEffort: 2,
      prerequisites: ['Event bus infrastructure', 'Webhook delivery system'],
      userStories: [
        'As a developer, I want to subscribe to platform events',
        'As admin, I want to configure webhook destinations',
      ],
      keywords: ['webhooks', 'events', 'integration', 'api'],
    },
    {
      name: 'Provider API Gateway',
      description: 'Unified API gateway for all provider integrations',
      primaryDomain: 'ADMIN',
      affectedDomains: [],
      baseImpact: 4,
      baseEffort: 4,
      prerequisites: ['API gateway infrastructure', 'Provider adapters'],
      userStories: [
        'As a developer, I want a unified interface for all providers',
        'As admin, I want centralized provider monitoring',
      ],
      keywords: ['api', 'gateway', 'providers', 'integration'],
    },
  ],
}

// =============================================================================
// ProductGapAnalyzer Class
// =============================================================================

/**
 * Analyzes product gaps based on business goals.
 *
 * @example
 * ```typescript
 * const analyzer = new ProductGapAnalyzer()
 * const result = await analyzer.analyze({
 *   goal: 'We need to improve B2B retention',
 *   maxFeatures: 10,
 * })
 *
 * console.log(result.suggestedFeatures)
 * ```
 */
export class ProductGapAnalyzer {
  /**
   * Analyze product gaps for a given business goal.
   *
   * @param input - Analysis input
   * @returns Analysis output with suggested features
   */
  async analyze(input: ProductGapInput): Promise<ProductGapOutput> {
    const {
      goal,
      focusDomains,
      priorityCategories,
      maxFeatures = 10,
    } = input

    // Step 1: Parse goal to identify relevant categories and domains
    const { categories, domains, keywords } = this.parseGoal(goal)

    // Apply focus filters if provided
    const targetDomains = focusDomains?.length ? focusDomains : domains
    const targetCategories = priorityCategories?.length ? priorityCategories : categories

    // Step 2: Find relevant sections in the sitemap
    const relevantSections = this.findRelevantSections(keywords, targetDomains)

    // Step 3: Generate feature suggestions
    const suggestedFeatures = this.generateFeatureSuggestions(
      goal,
      targetCategories,
      targetDomains,
      relevantSections,
      maxFeatures
    )

    // Step 4: Calculate summary statistics
    const summary = this.calculateSummary(suggestedFeatures)

    return {
      goal,
      relevantSections,
      suggestedFeatures,
      summary,
      metadata: {
        analyzedAt: new Date(),
        domainsAnalyzed: targetDomains,
        categoriesConsidered: targetCategories,
      },
    }
  }

  /**
   * Parse the goal to extract relevant categories, domains, and keywords.
   */
  private parseGoal(goal: string): {
    categories: FeatureCategory[]
    domains: ProductDomain[]
    keywords: string[]
  } {
    const goalLower = goal.toLowerCase()
    const matchedCategories = new Set<FeatureCategory>()
    const matchedDomains = new Set<ProductDomain>()
    const matchedKeywords = new Set<string>()

    // Check each keyword mapping
    for (const [keyword, mapping] of Object.entries(GOAL_KEYWORD_MAP)) {
      if (goalLower.includes(keyword)) {
        mapping.categories.forEach((c) => matchedCategories.add(c))
        mapping.domains.forEach((d) => matchedDomains.add(d))
        mapping.sectionKeywords.forEach((k) => matchedKeywords.add(k))
      }
    }

    // Default to retention + efficiency if no matches
    if (matchedCategories.size === 0) {
      matchedCategories.add('retention')
      matchedCategories.add('efficiency')
    }

    // Default to all domains if no matches
    if (matchedDomains.size === 0) {
      matchedDomains.add('DASHBOARD')
      matchedDomains.add('ADMIN')
    }

    return {
      categories: Array.from(matchedCategories),
      domains: Array.from(matchedDomains),
      keywords: Array.from(matchedKeywords),
    }
  }

  /**
   * Find relevant sections in the sitemap based on keywords and domains.
   */
  private findRelevantSections(
    keywords: string[],
    targetDomains: ProductDomain[]
  ): RelevantSection[] {
    const sections: RelevantSection[] = []

    // Search public routes
    if (targetDomains.includes('PUBLIC')) {
      for (const section of CIRCLETEL_SITEMAP.publicRoutes.mainNavigation) {
        const relevance = this.calculateSectionRelevance(section.items, keywords)
        if (relevance > 0.3) {
          sections.push({
            name: section.label,
            domain: 'PUBLIC',
            routes: section.items,
            relevanceScore: relevance,
            relevanceReason: `Matches keywords: ${keywords.filter((k) =>
              section.items.some((i) => i.route.includes(k) || i.label.toLowerCase().includes(k))
            ).join(', ')}`,
          })
        }
      }
    }

    // Search dashboard
    if (targetDomains.includes('DASHBOARD')) {
      for (const tab of CIRCLETEL_SITEMAP.customerDashboard.tabs) {
        const relevance = this.calculateSectionRelevance(tab.sidebarItems, keywords)
        if (relevance > 0.3) {
          sections.push({
            name: `Dashboard > ${tab.tab}`,
            domain: 'DASHBOARD',
            routes: tab.sidebarItems,
            relevanceScore: relevance,
            relevanceReason: `Dashboard section relevant to goal`,
          })
        }
      }
    }

    // Search partner portal
    if (targetDomains.includes('PARTNER')) {
      for (const tab of CIRCLETEL_SITEMAP.partnerPortal.tabs) {
        const relevance = this.calculateSectionRelevance(tab.sidebarItems, keywords)
        if (relevance > 0.3) {
          sections.push({
            name: `Partner > ${tab.tab}`,
            domain: 'PARTNER',
            routes: tab.sidebarItems,
            relevanceScore: relevance,
            relevanceReason: `Partner section relevant to goal`,
          })
        }
      }
    }

    // Search admin panel
    if (targetDomains.includes('ADMIN')) {
      for (const section of CIRCLETEL_SITEMAP.adminPanel.mainNavigation) {
        const relevance = this.calculateSectionRelevance(section.items, keywords)
        if (relevance > 0.3) {
          sections.push({
            name: `Admin > ${section.label}`,
            domain: 'ADMIN',
            routes: section.items,
            relevanceScore: relevance,
            relevanceReason: `Admin section relevant to goal`,
          })
        }
      }
    }

    // Sort by relevance score
    return sections.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Calculate relevance score for a section based on keywords.
   */
  private calculateSectionRelevance(routes: RouteItem[], keywords: string[]): number {
    if (!keywords.length) return 0.5

    let matches = 0
    for (const route of routes) {
      for (const keyword of keywords) {
        if (
          route.route.toLowerCase().includes(keyword) ||
          route.label.toLowerCase().includes(keyword) ||
          route.description?.toLowerCase().includes(keyword)
        ) {
          matches++
        }
      }
    }

    return Math.min(1, matches / (keywords.length * 2))
  }

  /**
   * Generate feature suggestions based on categories and gaps.
   */
  private generateFeatureSuggestions(
    goal: string,
    categories: FeatureCategory[],
    domains: ProductDomain[],
    relevantSections: RelevantSection[],
    maxFeatures: number
  ): SuggestedFeature[] {
    const suggestions: SuggestedFeature[] = []

    // Get templates for relevant categories
    for (const category of categories) {
      const templates = FEATURE_TEMPLATES[category] || []

      for (const template of templates) {
        // Check if template fits target domains
        if (!domains.includes(template.primaryDomain)) continue

        // Check keyword relevance to goal
        const goalLower = goal.toLowerCase()
        const keywordMatch = template.keywords.some((k) => goalLower.includes(k))
        const categoryMatch = categories.includes(category)

        // Calculate adjusted scores based on relevance
        const relevanceBoost = keywordMatch ? 1 : categoryMatch ? 0.5 : 0
        const impactScore = Math.min(5, template.baseImpact + Math.round(relevanceBoost)) as ImpactScore
        const effortScore = template.baseEffort as EffortScore

        // Find related routes
        const relatedRoutes = findRoutes(template.name.split(' ')[0].toLowerCase())

        // Generate suggested route
        const suggestedRoute = this.generateSuggestedRoute(template.primaryDomain, template.name)

        suggestions.push({
          name: template.name,
          description: template.description,
          primaryDomain: template.primaryDomain,
          affectedDomains: template.affectedDomains,
          suggestedRoute,
          relatedRoutes: relatedRoutes.slice(0, 3),
          category,
          impactScore,
          effortScore,
          priorityScore: Math.round((impactScore / effortScore) * 100) / 100,
          rationale: this.generateRationale(goal, template.name, category),
          prerequisites: template.prerequisites,
          userStories: template.userStories,
        })
      }
    }

    // Sort by priority score and limit
    return suggestions
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, maxFeatures)
  }

  /**
   * Generate a suggested route for a feature.
   */
  private generateSuggestedRoute(domain: ProductDomain, featureName: string): string {
    const slug = featureName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    switch (domain) {
      case 'PUBLIC':
        return `/${slug}`
      case 'DASHBOARD':
        return `/dashboard/${slug}`
      case 'PARTNER':
        return `/partner/${slug}`
      case 'ADMIN':
        return `/admin/${slug}`
      default:
        return `/${slug}`
    }
  }

  /**
   * Generate rationale for a feature suggestion.
   */
  private generateRationale(goal: string, featureName: string, category: FeatureCategory): string {
    const categoryDescriptions: Record<FeatureCategory, string> = {
      retention: 'improves customer retention and reduces churn',
      acquisition: 'drives new customer acquisition',
      revenue: 'increases revenue and monetization',
      efficiency: 'improves operational efficiency',
      compliance: 'ensures regulatory compliance',
      support: 'enhances customer support experience',
      analytics: 'provides better business insights',
      integration: 'improves system integration and automation',
    }

    return `${featureName} ${categoryDescriptions[category]}, directly supporting the goal: "${goal}"`
  }

  /**
   * Calculate summary statistics for suggested features.
   */
  private calculateSummary(features: SuggestedFeature[]): ProductGapOutput['summary'] {
    const totalFeatures = features.length

    if (totalFeatures === 0) {
      return {
        totalFeatures: 0,
        averageImpact: 0,
        averageEffort: 0,
        quickWins: 0,
        majorProjects: 0,
        fillIns: 0,
        thankless: 0,
      }
    }

    const avgImpact = features.reduce((sum, f) => sum + f.impactScore, 0) / totalFeatures
    const avgEffort = features.reduce((sum, f) => sum + f.effortScore, 0) / totalFeatures

    // Categorize by impact/effort quadrants
    let quickWins = 0 // High impact, low effort
    let majorProjects = 0 // High impact, high effort
    let fillIns = 0 // Low impact, low effort
    let thankless = 0 // Low impact, high effort

    for (const feature of features) {
      const highImpact = feature.impactScore >= 4
      const highEffort = feature.effortScore >= 4

      if (highImpact && !highEffort) quickWins++
      else if (highImpact && highEffort) majorProjects++
      else if (!highImpact && !highEffort) fillIns++
      else thankless++
    }

    return {
      totalFeatures,
      averageImpact: Math.round(avgImpact * 10) / 10,
      averageEffort: Math.round(avgEffort * 10) / 10,
      quickWins,
      majorProjects,
      fillIns,
      thankless,
    }
  }
}

// =============================================================================
// Convenience Function
// =============================================================================

/**
 * Analyze product gaps for a given goal.
 *
 * @param input - Analysis input
 * @returns Analysis output
 */
export async function analyzeProductGap(input: ProductGapInput): Promise<ProductGapOutput> {
  const analyzer = new ProductGapAnalyzer()
  return analyzer.analyze(input)
}

// =============================================================================
// Exports
// =============================================================================

export default ProductGapAnalyzer
