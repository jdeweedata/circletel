/**
 * MTN Consumer Package Data Definitions
 *
 * Contains all 19 consumer-friendly MTN packages:
 * - 3 x 5G Uncapped
 * - 5 x LTE Uncapped
 * - 11 x LTE Broadband Capped
 *
 * Used by: scripts/import-mtn-consumer-packages.js
 *
 * @module scripts/data/mtn-consumer-packages
 */

// ============================================================================
// 5G UNCAPPED PACKAGES (3)
// ============================================================================

const fiveGPackages = [
  {
    name: 'MTN Home Essential 5G 35Mbps',
    service_type: '5g',
    speed_down: 35,
    speed_up: 35,
    price: 449,
    description: 'Reliable home 5G internet with 35Mbps speed and 500GB monthly data. Perfect for families and home offices with up to 8 connected devices.',
    features: [
      'Guaranteed 35 Mbps speed',
      '500GB monthly data allowance',
      'Unlimited usage after 500GB at 2 Mbps',
      'Family WiFi Ready - Up to 64 devices',
      'Home Office Compatible - Video calls & cloud apps',
      'Streaming Optimized - HD video streaming',
      'Static IP available (optional add-on)',
      '24-month contract',
      'Huawei H155-382 5G router option',
      'Easy self-install setup'
    ],
    active: true,
    sort_order: 200,
    product_category: '5g',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 500,
      post_fup_speed_mbps: 2,
      contract_months: 24,
      static_ip: false,
      deal_code_sim: '202501EBU2013',
      deal_code_router: '202504EBU9916',
      router_model: 'Huawei H155-382 5G CPE',
      consumer_tier: 'essential'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Professional 5G 60Mbps',
    service_type: '5g',
    speed_down: 60,
    speed_up: 60,
    price: 649,
    description: 'Fast home 5G internet with 60Mbps speed and 800GB monthly data. Ideal for larger families, remote work, and streaming in multiple rooms.',
    features: [
      'Guaranteed 60 Mbps speed',
      '800GB monthly data allowance',
      'Unlimited usage after 800GB at 2 Mbps',
      'Family WiFi Ready - Up to 64 devices',
      'Home Office Compatible - Multiple video calls',
      'Streaming Optimized - 4K video streaming',
      'Gaming Ready - Low latency online gaming',
      'Smart Home Compatible - IoT devices support',
      '24-month contract',
      'Huawei H155-382 5G router option',
      'Easy self-install setup'
    ],
    active: true,
    sort_order: 201,
    product_category: '5g',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 800,
      post_fup_speed_mbps: 2,
      contract_months: 24,
      static_ip: false,
      deal_code_sim: '202501EBU2012',
      deal_code_router: '202504EBU9918',
      router_model: 'Huawei H155-382 5G CPE',
      consumer_tier: 'professional'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Enterprise 5G',
    service_type: '5g',
    speed_down: 150,
    speed_up: 150,
    price: 949,
    description: 'Premium home 5G internet with ultra-fast speeds (100-300 Mbps) and massive 1.5TB monthly data. Perfect for power users, content creators, and large households.',
    features: [
      'Ultra-fast speeds - 100-300 Mbps typical',
      '1.5TB monthly data allowance',
      'Unlimited usage after 1.5TB at 5 Mbps',
      'Family WiFi Ready - Up to 64 devices',
      'Home Office Compatible - Professional video conferencing',
      'Streaming Optimized - Multiple 4K streams',
      'Gaming Ready - Professional-grade latency',
      'Smart Home Compatible - Unlimited IoT devices',
      'Content Creation Ready - Fast uploads',
      '24-month contract',
      'Huawei H155-382 5G router option',
      'Easy self-install setup'
    ],
    active: true,
    sort_order: 202,
    product_category: '5g',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 1536,
      post_fup_speed_mbps: 5,
      contract_months: 24,
      static_ip: false,
      deal_code_sim: '202501EBU2014',
      deal_code_router: '202504EBU9919',
      router_model: 'Huawei H155-382 5G CPE',
      consumer_tier: 'enterprise'
    },
    provider_priority: 1
  }
];

// ============================================================================
// LTE UNCAPPED PACKAGES (5)
// ============================================================================

const lteUncappedPackages = [
  {
    name: 'MTN Home Basic LTE 5Mbps',
    service_type: 'lte',
    speed_down: 5,
    speed_up: 2,
    price: 299,
    description: 'Affordable home LTE internet with 5Mbps speed and 300GB monthly data. Great for email, browsing, and light streaming for small households.',
    features: [
      'Guaranteed 5 Mbps speed',
      '300GB monthly data allowance',
      'Unlimited usage after 300GB at 1 Mbps',
      'Family WiFi Ready - Up to 32 devices',
      'Home Office Compatible - Email & light apps',
      'Streaming Optimized - Standard definition video',
      '24-month contract',
      'Tozed ZLT X100 Pro router option',
      'Easy self-install setup'
    ],
    active: true,
    sort_order: 203,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 300,
      post_fup_speed_mbps: 1,
      contract_months: 24,
      static_ip: false,
      deal_code_sim: '202503EBU2805',
      deal_code_router: '202506EBU4100',
      router_model: 'Tozed ZLT X100 Pro 5G CPE',
      consumer_tier: 'basic'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Standard LTE 10Mbps',
    service_type: 'lte',
    speed_down: 10,
    speed_up: 5,
    price: 399,
    description: 'Reliable home LTE internet with 10Mbps speed and 400GB monthly data. Perfect for families with video calls, streaming, and online learning.',
    features: [
      'Guaranteed 10 Mbps speed',
      '400GB monthly data allowance',
      'Unlimited usage after 400GB at 1 Mbps',
      'Family WiFi Ready - Up to 32 devices',
      'Home Office Compatible - Video calls & cloud storage',
      'Streaming Optimized - HD video streaming',
      'Smart Home Compatible - Basic IoT devices',
      '24-month contract',
      'Tozed ZLT X100 Pro router option',
      'Easy self-install setup'
    ],
    active: true,
    sort_order: 204,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 400,
      post_fup_speed_mbps: 1,
      contract_months: 24,
      static_ip: false,
      deal_code_sim: '202503EBU2806',
      deal_code_router: '202506EBU4101',
      router_model: 'Tozed ZLT X100 Pro 5G CPE',
      consumer_tier: 'standard'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Advanced LTE 20Mbps',
    service_type: 'lte',
    speed_down: 20,
    speed_up: 10,
    price: 599,
    description: 'Fast home LTE internet with 20Mbps speed and 600GB monthly data. Ideal for active families with multiple devices, HD streaming, and online gaming.',
    features: [
      'Guaranteed 20 Mbps speed',
      '600GB monthly data allowance',
      'Unlimited usage after 600GB at 2 Mbps',
      'Family WiFi Ready - Up to 32 devices',
      'Home Office Compatible - Multiple video calls',
      'Streaming Optimized - 4K video streaming',
      'Gaming Ready - Good latency for online gaming',
      'Smart Home Compatible - Multiple IoT devices',
      '24-month contract',
      'Tozed ZLT X100 Pro router option',
      'Easy self-install setup'
    ],
    active: true,
    sort_order: 205,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 600,
      post_fup_speed_mbps: 2,
      contract_months: 24,
      static_ip: false,
      deal_code_sim: '202503EBU2807',
      deal_code_router: '202506EBU4102',
      router_model: 'Tozed ZLT X100 Pro 5G CPE',
      consumer_tier: 'advanced'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Premium LTE 10Mbps',
    service_type: 'lte',
    speed_down: 10,
    speed_up: 5,
    price: 599,
    description: 'Premium home LTE internet with 10Mbps speed and generous 700GB monthly data (75% more than standard). Perfect for heavy users who need more data at a great value.',
    features: [
      'Guaranteed 10 Mbps speed',
      '700GB monthly data allowance (75% more!)',
      'Unlimited usage after 700GB at 1 Mbps',
      'Family WiFi Ready - Up to 32 devices',
      'Home Office Compatible - Extended usage hours',
      'Streaming Optimized - HD video streaming',
      'Smart Home Compatible - IoT devices support',
      'Great value for heavy users',
      '24-month contract',
      'Tozed ZLT X100 Pro router option',
      'Easy self-install setup'
    ],
    active: true,
    sort_order: 206,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 700,
      post_fup_speed_mbps: 1,
      contract_months: 24,
      static_ip: false,
      deal_code_sim: '202503EBU2808',
      deal_code_router: '202506EBU4103',
      router_model: 'Tozed ZLT X100 Pro 5G CPE',
      consumer_tier: 'premium',
      premium_tier: true
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Premium LTE 20Mbps',
    service_type: 'lte',
    speed_down: 20,
    speed_up: 10,
    price: 699,
    description: 'Premium home LTE internet with 20Mbps speed and massive 1TB monthly data. Ultimate package for large households, content streaming, and heavy internet use.',
    features: [
      'Guaranteed 20 Mbps speed',
      '1TB monthly data allowance',
      'Unlimited usage after 1TB at 2 Mbps',
      'Family WiFi Ready - Up to 32 devices',
      'Home Office Compatible - Professional use',
      'Streaming Optimized - Multiple 4K streams',
      'Gaming Ready - Excellent latency',
      'Smart Home Compatible - Unlimited IoT devices',
      'Best value for power users',
      '24-month contract',
      'Tozed ZLT X100 Pro router option',
      'Easy self-install setup'
    ],
    active: true,
    sort_order: 207,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      fup_gb: 1024,
      post_fup_speed_mbps: 2,
      contract_months: 24,
      static_ip: false,
      deal_code_sim: '202503EBU2809',
      deal_code_router: '202506EBU4104',
      router_model: 'Tozed ZLT X100 Pro 5G CPE',
      consumer_tier: 'premium',
      premium_tier: true
    },
    provider_priority: 1
  }
];

// ============================================================================
// LTE BROADBAND CAPPED PACKAGES (11)
// ============================================================================

const lteCappedPackages = [
  {
    name: 'MTN Home Lite 10GB',
    service_type: 'lte',
    speed_down: 10,
    speed_up: 5,
    price: 85,
    description: 'Budget-friendly home LTE with 15GB total data (5GB priority + 10GB anytime). Perfect for light browsing, email, and occasional streaming.',
    features: [
      '15GB total monthly data',
      '5GB priority data + 10GB anytime',
      'Speeds up to 10 Mbps',
      'Ideal for light users',
      'Email and browsing',
      'Occasional video streaming',
      '24-month contract',
      'Router bundle available',
      'Cost-effective solution'
    ],
    active: true,
    sort_order: 208,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      total_data_gb: 15,
      priority_data_gb: 5,
      anytime_data_gb: 10,
      contract_months: 24,
      deal_code_sim: '202501EBU9000',
      deal_code_router: '202506EBU0001',
      router_model: 'Vida Technologies CPE 4000 Plus',
      consumer_tier: 'lite'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Starter 15GB',
    service_type: 'lte',
    speed_down: 15,
    speed_up: 7,
    price: 109,
    description: 'Starter home LTE with 25GB total data (10GB priority + 15GB anytime). Great for small families with regular browsing and streaming needs.',
    features: [
      '25GB total monthly data',
      '10GB priority data + 15GB anytime',
      'Speeds up to 15 Mbps',
      'Family browsing',
      'Regular video streaming',
      'Social media',
      'Cloud storage access',
      '24-month contract',
      'Router bundle available'
    ],
    active: true,
    sort_order: 209,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      total_data_gb: 25,
      priority_data_gb: 10,
      anytime_data_gb: 15,
      contract_months: 24,
      deal_code_sim: '202501EBU9002',
      deal_code_router: '202506EBU0002',
      router_model: 'Vida Technologies CPE 4000 Plus',
      consumer_tier: 'starter'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Connect 30GB',
    service_type: 'lte',
    speed_down: 20,
    speed_up: 10,
    price: 179,
    description: 'Connect home LTE with 60GB total data (30GB priority + 30GB anytime). Perfect for active families with video calls and streaming.',
    features: [
      '60GB total monthly data',
      '30GB priority data + 30GB anytime',
      'Speeds up to 20 Mbps',
      'Home Office Compatible',
      'Video calling (Zoom, Teams)',
      'HD streaming',
      'Online learning',
      '24-month contract',
      'Router bundle available'
    ],
    active: true,
    sort_order: 210,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      total_data_gb: 60,
      priority_data_gb: 30,
      anytime_data_gb: 30,
      contract_months: 24,
      deal_code_sim: '202501EBU9009',
      deal_code_router: '202506EBU0006',
      router_model: 'Vida Technologies CPE 4000 Plus',
      consumer_tier: 'connect'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Plus 60GB',
    service_type: 'lte',
    speed_down: 25,
    speed_up: 12,
    price: 269,
    description: 'Plus home LTE with 120GB total data (60GB priority + 60GB anytime). Ideal for families with multiple devices and regular streaming.',
    features: [
      '120GB total monthly data',
      '60GB priority data + 60GB anytime',
      'Speeds up to 25 Mbps',
      'Family WiFi Ready',
      'Multiple device support',
      'HD video streaming',
      'Online gaming',
      'Cloud backups',
      '24-month contract',
      'Router bundle available'
    ],
    active: true,
    sort_order: 211,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      total_data_gb: 120,
      priority_data_gb: 60,
      anytime_data_gb: 60,
      contract_months: 24,
      deal_code_sim: '202501EBU9017',
      deal_code_router: '202506EBU0009',
      router_model: 'Vida Technologies CPE 4000 Plus',
      consumer_tier: 'plus'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Plus+ 90GB',
    service_type: 'lte',
    speed_down: 30,
    speed_up: 15,
    price: 289,
    description: 'Plus+ home LTE with 150GB total data (60GB priority + 30GB bonus + 60GB anytime). Enhanced value with bonus data for growing families.',
    features: [
      '150GB total monthly data',
      '60GB priority + 30GB BONUS + 60GB anytime',
      'Speeds up to 30 Mbps',
      'Best value for data',
      'Family WiFi Ready',
      'HD streaming on multiple devices',
      'Gaming Ready',
      'Work from home compatible',
      '24-month contract',
      'Router bundle available'
    ],
    active: true,
    sort_order: 212,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      total_data_gb: 150,
      priority_data_gb: 60,
      bonus_data_gb: 30,
      anytime_data_gb: 60,
      contract_months: 24,
      deal_code_sim: '202501EBU9022',
      deal_code_router: '202506EBU0012',
      router_model: 'Vida Technologies CPE 4000 Plus',
      consumer_tier: 'plus'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Power 110GB',
    service_type: 'lte',
    speed_down: 35,
    speed_up: 17,
    price: 369,
    description: 'Power home LTE with 220GB total data (110GB priority + 110GB anytime). Powerful connectivity for data-hungry households.',
    features: [
      '220GB total monthly data',
      '110GB priority data + 110GB anytime',
      'Speeds up to 35 Mbps',
      'Family WiFi Ready',
      'Heavy streaming support',
      '4K video capable',
      'Gaming Ready',
      'Large file downloads',
      '24-month contract',
      'Router bundle available'
    ],
    active: true,
    sort_order: 213,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      total_data_gb: 220,
      priority_data_gb: 110,
      anytime_data_gb: 110,
      contract_months: 24,
      deal_code_sim: '202501EBU9027',
      deal_code_router: '202506EBU0016',
      router_model: 'Vida Technologies CPE 4000 Plus',
      consumer_tier: 'power'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Super 170GB',
    service_type: 'lte',
    speed_down: 40,
    speed_up: 20,
    price: 329,
    description: 'Super home LTE with 270GB total data (100GB priority + 170GB anytime). Excellent value with tons of data for active families.',
    features: [
      '270GB total monthly data',
      '100GB priority data + 170GB anytime',
      'Speeds up to 40 Mbps',
      'Exceptional value',
      'Family WiFi Ready',
      'Unlimited streaming',
      'Gaming Ready',
      'Content downloads',
      '24-month contract',
      'Router bundle available'
    ],
    active: true,
    sort_order: 214,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      total_data_gb: 270,
      priority_data_gb: 100,
      anytime_data_gb: 170,
      contract_months: 24,
      deal_code_sim: '202501EBU9038',
      deal_code_router: '202506EBU0015',
      router_model: 'Vida Technologies CPE 4000 Plus',
      consumer_tier: 'super'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Max 230GB',
    service_type: 'lte',
    speed_down: 45,
    speed_up: 22,
    price: 519,
    description: 'Max home LTE with 350GB total data (120GB priority + 230GB anytime). Maximum data for large households and power users.',
    features: [
      '350GB total monthly data',
      '120GB priority data + 230GB anytime',
      'Speeds up to 45 Mbps',
      'Large household support',
      'Multiple 4K streams',
      'Gaming Ready',
      'Content creation',
      'Heavy downloading',
      '24-month contract',
      'Router bundle available'
    ],
    active: true,
    sort_order: 215,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      total_data_gb: 350,
      priority_data_gb: 120,
      anytime_data_gb: 230,
      contract_months: 24,
      deal_code_sim: '202501EBU9044',
      deal_code_router: '202506EBU0021',
      router_model: 'Vida Technologies CPE 4000 Plus',
      consumer_tier: 'max'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Max+ 380GB',
    service_type: 'lte',
    speed_down: 50,
    speed_up: 25,
    price: 619,
    description: 'Max+ home LTE with 500GB total data (120GB priority + 150GB bonus + 230GB anytime). Premium data package with bonus allocation.',
    features: [
      '500GB total monthly data',
      '120GB priority + 150GB BONUS + 230GB anytime',
      'Speeds up to 50 Mbps',
      'Premium data allocation',
      'Family WiFi Ready',
      'Unlimited entertainment',
      'Gaming Ready',
      'Content creation support',
      '24-month contract',
      'Router bundle available'
    ],
    active: true,
    sort_order: 216,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      total_data_gb: 500,
      priority_data_gb: 120,
      bonus_data_gb: 150,
      anytime_data_gb: 230,
      contract_months: 24,
      deal_code_sim: '202501EBU9056',
      deal_code_router: '202506EBU0024',
      router_model: 'Vida Technologies CPE 4000 Plus',
      consumer_tier: 'max'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Ultra 380GB',
    service_type: 'lte',
    speed_down: 55,
    speed_up: 27,
    price: 649,
    description: 'Ultra home LTE with 580GB total data. Top-tier capped LTE package for the most demanding households.',
    features: [
      '580GB total monthly data',
      'Speeds up to 55 Mbps',
      'Ultimate data package',
      'Family WiFi Ready',
      'Professional streaming',
      'Gaming Ready - Pro level',
      'Content creation',
      'Massive downloads',
      '24-month contract',
      'Router bundle available'
    ],
    active: true,
    sort_order: 217,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      total_data_gb: 580,
      priority_data_gb: 120,
      bonus_data_gb: 150,
      anytime_data_gb: 310,
      contract_months: 24,
      deal_code_sim: '202501EBU9075',
      deal_code_router: '202506EBU0029',
      router_model: 'Vida Technologies CPE 4000 Plus',
      consumer_tier: 'ultra'
    },
    provider_priority: 1
  },
  {
    name: 'MTN Home Unlimited 1TB',
    service_type: 'lte',
    speed_down: 60,
    speed_up: 30,
    price: 599,
    description: 'Unlimited home LTE with massive 1TB monthly data. The ultimate package for households that need virtually unlimited data.',
    features: [
      '1TB (1024GB) total monthly data',
      'Speeds up to 60 Mbps',
      'Virtually unlimited usage',
      'Best value per GB',
      'Family WiFi Ready',
      'Unlimited streaming',
      'Gaming Ready',
      'Content creation',
      'Large backups',
      '24-month contract',
      'Router bundle available'
    ],
    active: true,
    sort_order: 218,
    product_category: 'lte',
    customer_type: 'consumer',
    requires_fttb_coverage: false,
    compatible_providers: ['mtn'],
    provider_specific_config: {
      total_data_gb: 1024,
      contract_months: 24,
      deal_code_sim: '202501EBU9073',
      deal_code_router: '202506EBU0030',
      router_model: 'Vida Technologies CPE 4000 Plus',
      consumer_tier: 'unlimited'
    },
    provider_priority: 1
  }
];

// ============================================================================
// EXPORTS
// ============================================================================

/** All 19 consumer packages */
const consumerPackages = [
  ...fiveGPackages,
  ...lteUncappedPackages,
  ...lteCappedPackages
];

/** Package counts by category */
const packageSummary = {
  total: consumerPackages.length,
  fiveG: fiveGPackages.length,
  lteUncapped: lteUncappedPackages.length,
  lteCapped: lteCappedPackages.length,
  priceRange: {
    min: Math.min(...consumerPackages.map(p => p.price)),
    max: Math.max(...consumerPackages.map(p => p.price))
  }
};

module.exports = {
  consumerPackages,
  fiveGPackages,
  lteUncappedPackages,
  lteCappedPackages,
  packageSummary
};
