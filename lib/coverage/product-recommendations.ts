// Product Recommendations based on Coverage Data
import { ServiceType, SignalStrength } from './types';
import { AggregatedCoverageResponse, ServiceCoverageRecommendation } from './aggregation-service';

export interface ProductRecommendation {
  productId: string;
  productName: string;
  productType: 'consumer' | 'sme' | 'enterprise';
  serviceType: ServiceType;
  provider: string;

  // Pricing
  monthlyPrice: number;
  setupFee?: number;
  currency: string;

  // Technical specifications
  speed: {
    download: number;
    upload: number;
    unit: 'Mbps' | 'Gbps';
  };
  dataAllowance?: {
    amount: number;
    unit: 'GB' | 'TB' | 'unlimited';
  };

  // Availability
  available: boolean;
  signal: SignalStrength;
  confidence: 'high' | 'medium' | 'low';

  // Recommendations
  recommendationScore: number; // 0-100
  matchReason: string[];
  pros: string[];
  cons: string[];

  // Links
  documentationUrl?: string;
  orderUrl?: string;
}

export interface ProductRecommendationOptions {
  customerType?: 'consumer' | 'sme' | 'enterprise';
  budget?: {
    min?: number;
    max?: number;
  };
  minSpeed?: number; // Mbps
  preferUnlimited?: boolean;
  servicePreference?: ServiceType[];
}

/**
 * SkyFibre Product Catalog
 * Based on Supersonic AirFibre / Tarana Wireless / MTN Uncapped Wireless
 */
export const SKYFIBRE_PRODUCTS = {
  consumer: [
    {
      productId: 'skyfibre-consumer-20',
      productName: 'SkyFibre Home 20',
      productType: 'consumer' as const,
      serviceType: 'uncapped_wireless' as ServiceType,
      provider: 'CircleTel (MTN Network)',
      monthlyPrice: 599,
      setupFee: 0,
      currency: 'ZAR',
      speed: { download: 20, upload: 10, unit: 'Mbps' as const },
      dataAllowance: { amount: 1, unit: 'unlimited' as const },
      documentationUrl: '/products/skyfibre/residential',
      orderUrl: '/order/skyfibre-consumer-20',
      description: 'Perfect for browsing, streaming, and light work-from-home use',
      features: [
        'Unlimited data',
        'No line rental required',
        'Quick installation',
        'Tarana Wireless Technology'
      ]
    },
    {
      productId: 'skyfibre-consumer-40',
      productName: 'SkyFibre Home 40',
      productType: 'consumer' as const,
      serviceType: 'uncapped_wireless' as ServiceType,
      provider: 'CircleTel (MTN Network)',
      monthlyPrice: 899,
      setupFee: 0,
      currency: 'ZAR',
      speed: { download: 40, upload: 20, unit: 'Mbps' as const },
      dataAllowance: { amount: 1, unit: 'unlimited' as const },
      documentationUrl: '/products/skyfibre/residential',
      orderUrl: '/order/skyfibre-consumer-40',
      description: 'Ideal for multiple devices, HD streaming, and remote work',
      features: [
        'Unlimited data',
        'Support for 4-6 devices',
        'HD/4K streaming',
        'Reliable for video calls'
      ]
    },
    {
      productId: 'skyfibre-consumer-60',
      productName: 'SkyFibre Home 60',
      productType: 'consumer' as const,
      serviceType: 'uncapped_wireless' as ServiceType,
      provider: 'CircleTel (MTN Network)',
      monthlyPrice: 1199,
      setupFee: 0,
      currency: 'ZAR',
      speed: { download: 60, upload: 30, unit: 'Mbps' as const },
      dataAllowance: { amount: 1, unit: 'unlimited' as const },
      documentationUrl: '/products/skyfibre/residential',
      orderUrl: '/order/skyfibre-consumer-60',
      description: 'Premium home internet for large households and heavy users',
      features: [
        'Unlimited data',
        'Support for 6-10 devices',
        'Gaming and streaming',
        'Multiple simultaneous video calls'
      ]
    }
  ],
  sme: [
    {
      productId: 'skyfibre-sme-50',
      productName: 'SkyFibre Business 50',
      productType: 'sme' as const,
      serviceType: 'uncapped_wireless' as ServiceType,
      provider: 'CircleTel (MTN Network)',
      monthlyPrice: 1499,
      setupFee: 0,
      currency: 'ZAR',
      speed: { download: 50, upload: 25, unit: 'Mbps' as const },
      dataAllowance: { amount: 1, unit: 'unlimited' as const },
      documentationUrl: '/products/skyfibre/sme',
      orderUrl: '/order/skyfibre-sme-50',
      description: 'Reliable business connectivity for small offices',
      features: [
        'Unlimited data',
        'Business-grade SLA',
        'Priority support',
        'Fixed IP available'
      ]
    },
    {
      productId: 'skyfibre-sme-100',
      productName: 'SkyFibre Business 100',
      productType: 'sme' as const,
      serviceType: 'uncapped_wireless' as ServiceType,
      provider: 'CircleTel (MTN Network)',
      monthlyPrice: 2499,
      setupFee: 0,
      currency: 'ZAR',
      speed: { download: 100, upload: 50, unit: 'Mbps' as const },
      dataAllowance: { amount: 1, unit: 'unlimited' as const },
      documentationUrl: '/products/skyfibre/sme',
      orderUrl: '/order/skyfibre-sme-100',
      description: 'High-performance connectivity for growing businesses',
      features: [
        'Unlimited data',
        'Business-grade SLA',
        '4-hour support response',
        'Fixed IP included'
      ]
    },
    {
      productId: 'skyfibre-sme-200',
      productName: 'SkyFibre Business 200',
      productType: 'sme' as const,
      serviceType: 'uncapped_wireless' as ServiceType,
      provider: 'CircleTel (MTN Network)',
      monthlyPrice: 3999,
      setupFee: 0,
      currency: 'ZAR',
      speed: { download: 200, upload: 100, unit: 'Mbps' as const },
      dataAllowance: { amount: 1, unit: 'unlimited' as const },
      documentationUrl: '/products/skyfibre/sme',
      orderUrl: '/order/skyfibre-sme-200',
      description: 'Enterprise-grade wireless connectivity for demanding businesses',
      features: [
        'Unlimited data',
        'Premium business SLA',
        '2-hour support response',
        'Multiple fixed IPs',
        'Dedicated account manager'
      ]
    }
  ]
};

export class ProductRecommendationService {
  /**
   * Get product recommendations based on coverage data
   */
  static async getRecommendations(
    coverageData: AggregatedCoverageResponse,
    options: ProductRecommendationOptions = {}
  ): Promise<ProductRecommendation[]> {
    const {
      customerType,
      budget,
      minSpeed = 0,
      preferUnlimited = true,
      servicePreference = []
    } = options;

    const recommendations: ProductRecommendation[] = [];

    // Check for uncapped_wireless (SkyFibre) availability
    const uncappedWirelessService = coverageData.bestServices.find(
      service => service.serviceType === 'uncapped_wireless'
    );

    if (uncappedWirelessService && uncappedWirelessService.available) {
      // Get SkyFibre products based on customer type
      const products = this.getSkyFibreProducts(customerType);

      for (const product of products) {
        const productRec = this.createProductRecommendation(
          product,
          uncappedWirelessService,
          { budget, minSpeed, preferUnlimited }
        );

        if (productRec) {
          recommendations.push(productRec);
        }
      }
    }

    // Sort by recommendation score
    return recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Get SkyFibre products filtered by customer type
   */
  private static getSkyFibreProducts(customerType?: 'consumer' | 'sme' | 'enterprise') {
    if (customerType === 'consumer') {
      return SKYFIBRE_PRODUCTS.consumer;
    } else if (customerType === 'sme' || customerType === 'enterprise') {
      return SKYFIBRE_PRODUCTS.sme;
    }

    // Return all products if no type specified
    return [...SKYFIBRE_PRODUCTS.consumer, ...SKYFIBRE_PRODUCTS.sme];
  }

  /**
   * Create a product recommendation with scoring
   */
  private static createProductRecommendation(
    product: typeof SKYFIBRE_PRODUCTS.consumer[0] | typeof SKYFIBRE_PRODUCTS.sme[0],
    serviceData: ServiceCoverageRecommendation,
    options: {
      budget?: { min?: number; max?: number };
      minSpeed?: number;
      preferUnlimited?: boolean;
    }
  ): ProductRecommendation | null {
    const { budget, minSpeed = 0, preferUnlimited = true } = options;

    // Filter by budget
    if (budget) {
      if (budget.min && product.monthlyPrice < budget.min) return null;
      if (budget.max && product.monthlyPrice > budget.max) return null;
    }

    // Filter by minimum speed
    if (product.speed.download < minSpeed) return null;

    // Get provider info from service data
    const providerInfo = serviceData.providers[0]; // Primary provider
    const signal = (providerInfo?.signal || 'good') as SignalStrength;
    const confidence = providerInfo?.confidence || 'medium';

    // Calculate recommendation score
    const score = this.calculateRecommendationScore(
      product,
      signal,
      confidence,
      options
    );

    // Generate match reasons
    const matchReason = this.generateMatchReasons(product, signal, options);

    // Generate pros and cons
    const { pros, cons } = this.generateProsAndCons(product, signal, confidence);

    return {
      ...product,
      available: true,
      signal,
      confidence,
      recommendationScore: score,
      matchReason,
      pros,
      cons
    };
  }

  /**
   * Calculate recommendation score (0-100)
   */
  private static calculateRecommendationScore(
    product: typeof SKYFIBRE_PRODUCTS.consumer[0] | typeof SKYFIBRE_PRODUCTS.sme[0],
    signal: SignalStrength,
    confidence: 'high' | 'medium' | 'low',
    options: {
      minSpeed?: number;
      preferUnlimited?: boolean;
    }
  ): number {
    let score = 50; // Base score

    // Signal strength impact (0-25 points)
    const signalScores = { excellent: 25, good: 20, fair: 15, poor: 10, none: 0 };
    score += signalScores[signal as keyof typeof signalScores] || 0;

    // Confidence impact (0-15 points)
    const confidenceScores = { high: 15, medium: 10, low: 5 };
    score += confidenceScores[confidence];

    // Unlimited data bonus (0-10 points)
    if (options.preferUnlimited && product.dataAllowance.unit === 'unlimited') {
      score += 10;
    }

    // Speed adequacy bonus (0-10 points)
    if (options.minSpeed && product.speed.download >= options.minSpeed * 1.5) {
      score += 10; // Exceeds minimum by 50%
    } else if (options.minSpeed && product.speed.download >= options.minSpeed) {
      score += 5; // Meets minimum
    }

    // Business product bonus for SME products (0-5 points)
    if (product.productType === 'sme' || product.productType === 'enterprise') {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate human-readable match reasons
   */
  private static generateMatchReasons(
    product: typeof SKYFIBRE_PRODUCTS.consumer[0] | typeof SKYFIBRE_PRODUCTS.sme[0],
    signal: SignalStrength,
    options: {
      minSpeed?: number;
      preferUnlimited?: boolean;
    }
  ): string[] {
    const reasons: string[] = [];

    reasons.push(`Available via MTN Uncapped Wireless network with ${signal} signal`);

    if (product.dataAllowance.unit === 'unlimited') {
      reasons.push('Unlimited data - no cap, no throttling');
    }

    if (options.minSpeed && product.speed.download >= options.minSpeed) {
      reasons.push(`Meets your ${options.minSpeed} Mbps speed requirement`);
    }

    if (product.productType === 'sme' || product.productType === 'enterprise') {
      reasons.push('Business-grade service with SLA');
    }

    if (product.setupFee === 0) {
      reasons.push('No setup fees');
    }

    return reasons;
  }

  /**
   * Generate pros and cons for a product
   */
  private static generateProsAndCons(
    product: typeof SKYFIBRE_PRODUCTS.consumer[0] | typeof SKYFIBRE_PRODUCTS.sme[0],
    signal: SignalStrength,
    confidence: 'high' | 'medium' | 'low'
  ): { pros: string[]; cons: string[] } {
    const pros: string[] = [];
    const cons: string[] = [];

    // Pros
    if (signal === 'excellent' || signal === 'good') {
      pros.push(`${signal.charAt(0).toUpperCase() + signal.slice(1)} signal strength`);
    }

    if (product.dataAllowance.unit === 'unlimited') {
      pros.push('Truly unlimited data');
    }

    if (product.setupFee === 0) {
      pros.push('No installation fees');
    }

    if (product.speed.download >= 50) {
      pros.push('High-speed connectivity');
    }

    if (product.productType === 'sme' || product.productType === 'enterprise') {
      pros.push('Business SLA included');
      pros.push('Priority support');
    }

    // Cons
    if (signal === 'fair' || signal === 'poor') {
      cons.push(`${signal.charAt(0).toUpperCase() + signal.slice(1)} signal strength may affect performance`);
    }

    if (confidence === 'low') {
      cons.push('Coverage confidence is lower - recommend site survey');
    }

    if (product.productType === 'consumer' && product.speed.download < 40) {
      cons.push('May be limiting for multiple heavy users');
    }

    // Wireless technology considerations
    cons.push('Fixed wireless - line of sight to tower preferred');

    if (pros.length === 0) {
      pros.push('Wireless internet alternative to fixed line');
    }

    return { pros, cons };
  }

  /**
   * Get specific product details by ID
   */
  static getProductById(productId: string) {
    const allProducts = [...SKYFIBRE_PRODUCTS.consumer, ...SKYFIBRE_PRODUCTS.sme];
    return allProducts.find(p => p.productId === productId);
  }

  /**
   * Check if SkyFibre is available at location
   */
  static isSkyFibreAvailable(coverageData: AggregatedCoverageResponse): boolean {
    return coverageData.bestServices.some(
      service => service.serviceType === 'uncapped_wireless' && service.available
    );
  }
}