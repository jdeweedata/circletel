// Multi-source Coverage Aggregation Service
import { Coordinates, ServiceType, CoverageResponse, CoverageProvider } from './types';
import { mtnWMSClient } from './mtn/wms-client';
import { MTNWMSParser } from './mtn/wms-parser';
import { MTNServiceCoverage } from './mtn/types';
import { mtnWMSRealtimeClient } from './mtn/wms-realtime-client';

export interface AggregatedCoverageResponse {
  coordinates: Coordinates;
  providers: {
    [provider in CoverageProvider]: {
      available: boolean;
      confidence: 'high' | 'medium' | 'low';
      services: any[];
      error?: string;
    };
  };
  bestServices: ServiceCoverageRecommendation[];
  overallCoverage: boolean;
  lastUpdated: string;
}

export interface ServiceCoverageRecommendation {
  serviceType: ServiceType;
  available: boolean;
  providers: {
    provider: CoverageProvider;
    signal: string;
    estimatedSpeed?: {
      download: number;
      upload: number;
      unit: 'Mbps' | 'Gbps';
    };
    confidence: 'high' | 'medium' | 'low';
  }[];
  recommendedProvider?: CoverageProvider;
  alternativeProviders: CoverageProvider[];
}

export interface CoverageAggregationOptions {
  providers?: CoverageProvider[];
  serviceTypes?: ServiceType[];
  includeAlternatives?: boolean;
  prioritizeSpeed?: boolean;
  prioritizeReliability?: boolean;
}

export class CoverageAggregationService {
  private static instance: CoverageAggregationService;
  private cache = new Map<string, { data: AggregatedCoverageResponse; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CoverageAggregationService {
    if (!this.instance) {
      this.instance = new CoverageAggregationService();
    }
    return this.instance;
  }

  /**
   * Aggregate coverage data from multiple providers
   */
  async aggregateCoverage(
    coordinates: Coordinates,
    options: CoverageAggregationOptions = {}
  ): Promise<AggregatedCoverageResponse> {
    const cacheKey = this.getCacheKey(coordinates, options);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const {
      providers = ['mtn'] as CoverageProvider[],
      serviceTypes,
      includeAlternatives = true,
      prioritizeSpeed = false,
      prioritizeReliability = true
    } = options;

    const results: Partial<AggregatedCoverageResponse['providers']> = {};
    const providerPromises = providers.map(async (provider) => {
      try {
        const coverage = await this.getCoverageFromProvider(provider, coordinates, serviceTypes);
        return { provider, coverage, error: null };
      } catch (error) {
        console.error(`Failed to get coverage from ${provider}:`, error);
        return {
          provider,
          coverage: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const providerResults = await Promise.allSettled(providerPromises);

    // Process results from each provider
    for (const result of providerResults) {
      if (result.status === 'fulfilled' && result.value) {
        const { provider, coverage, error } = result.value;

        if (coverage) {
          results[provider] = {
            available: coverage.available,
            confidence: coverage.confidence,
            services: coverage.services,
          };
        } else {
          results[provider] = {
            available: false,
            confidence: 'low',
            services: [],
            error: error || undefined
          };
        }
      }
    }

    // Aggregate service recommendations
    const bestServices = this.aggregateServiceRecommendations(
      results as AggregatedCoverageResponse['providers'],
      { prioritizeSpeed, prioritizeReliability, includeAlternatives }
    );

    const aggregatedResponse: AggregatedCoverageResponse = {
      coordinates,
      providers: results as AggregatedCoverageResponse['providers'],
      bestServices,
      overallCoverage: bestServices.some(service => service.available),
      lastUpdated: new Date().toISOString()
    };

    this.setCache(cacheKey, aggregatedResponse);
    return aggregatedResponse;
  }

  /**
   * Get coverage data from a specific provider
   */
  private async getCoverageFromProvider(
    provider: CoverageProvider,
    coordinates: Coordinates,
    serviceTypes?: ServiceType[]
  ): Promise<CoverageResponse | null> {
    switch (provider) {
      case 'mtn':
        return this.getMTNCoverage(coordinates, serviceTypes);

      // Add other providers here as they become available
      case 'vodacom':
      case 'cell_c':
      case 'telkom':
        throw new Error(`Provider ${provider} not yet implemented`);

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get MTN coverage using real-time WMS or fallback to dual-source approach
   */
  private async getMTNCoverage(
    coordinates: Coordinates,
    serviceTypes?: ServiceType[]
  ): Promise<CoverageResponse> {
    try {
      // Try real-time WMS first for most accurate, up-to-date coverage
      const realtimeCoverage = await mtnWMSRealtimeClient.checkCoverage(
        coordinates,
        serviceTypes
      );

      if (realtimeCoverage.available) {
        // Successfully got real-time data
        return {
          available: realtimeCoverage.available,
          coordinates,
          confidence: 'high', // WMS data is high confidence
          services: realtimeCoverage.services.map(service => ({
            type: service.type,
            available: service.available,
            signal: this.inferSignalFromLayerData(service.layerData),
            provider: 'MTN',
            technology: this.getTechnologyForServiceType(service.type)
          })),
          providers: [{
            name: 'MTN',
            available: realtimeCoverage.available,
            services: realtimeCoverage.services.map(service => ({
              type: service.type,
              available: service.available,
              signal: this.inferSignalFromLayerData(service.layerData),
              provider: 'MTN',
              technology: this.getTechnologyForServiceType(service.type)
            }))
          }],
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (error) {
      console.warn('Real-time WMS check failed, falling back to dual-source:', error);
    }

    // Fallback to original dual-source approach
    const coverageResults = await mtnWMSClient.checkCoverage(coordinates, serviceTypes);

    const mtnResponse = MTNWMSParser.parseDualSourceCoverage(
      coverageResults.business,
      coverageResults.consumer,
      coordinates
    );

    // Transform MTNCoverageResponse to CoverageResponse format
    return {
      available: mtnResponse.available,
      coordinates: mtnResponse.coordinates,
      confidence: mtnResponse.confidence,
      services: mtnResponse.services.map(service => ({
        type: service.type,
        available: service.available,
        signal: service.signal,
        provider: 'MTN',
        technology: service.technology
      })),
      providers: [{
        name: 'MTN',
        available: mtnResponse.available,
        services: mtnResponse.services.map(service => ({
          type: service.type,
          available: service.available,
          signal: service.signal,
          provider: 'MTN',
          technology: service.technology
        }))
      }],
      lastUpdated: mtnResponse.lastUpdated
    };
  }

  /**
   * Infer signal strength from WMS layer data
   */
  private inferSignalFromLayerData(layerData?: any): 'excellent' | 'good' | 'fair' | 'poor' | 'none' {
    if (!layerData) return 'good'; // Default to good if no data

    // If layer has signal quality indicators, use them
    // For now, default to good since presence of coverage indicates good signal
    return 'good';
  }

  /**
   * Get technology name for service type
   */
  private getTechnologyForServiceType(serviceType: ServiceType): string {
    const technologyMap: Record<ServiceType, string> = {
      'uncapped_wireless': 'Tarana Wireless G1',
      'fixed_lte': 'Fixed LTE',
      'fibre': 'FTTB',
      'licensed_wireless': 'PMP',
      '5g': '5G',
      'lte': 'LTE',
      '3g_900': '3G 900MHz',
      '3g_2100': '3G 2100MHz',
      '2g': '2G'
    };

    return technologyMap[serviceType] || serviceType;
  }

  /**
   * Aggregate service recommendations from all providers
   */
  private aggregateServiceRecommendations(
    providerResults: AggregatedCoverageResponse['providers'],
    options: {
      prioritizeSpeed: boolean;
      prioritizeReliability: boolean;
      includeAlternatives: boolean;
    }
  ): ServiceCoverageRecommendation[] {
    const serviceMap = new Map<ServiceType, ServiceCoverageRecommendation>();

    // Collect all services from all providers
    Object.entries(providerResults).forEach(([provider, result]) => {
      if (!result.available) return;

      result.services.forEach((service: MTNServiceCoverage) => {
        const existing = serviceMap.get(service.type);

        const providerInfo = {
          provider: provider as CoverageProvider,
          signal: service.signal,
          estimatedSpeed: service.estimatedSpeed,
          confidence: result.confidence
        };

        if (existing) {
          existing.providers.push(providerInfo);
          existing.available = existing.available || service.available;
        } else {
          serviceMap.set(service.type, {
            serviceType: service.type,
            available: service.available,
            providers: [providerInfo],
            alternativeProviders: []
          });
        }
      });
    });

    // Determine recommendations for each service
    const recommendations: ServiceCoverageRecommendation[] = [];

    serviceMap.forEach((recommendation) => {
      if (recommendation.providers.length === 0) return;

      // Sort providers by preference
      const sortedProviders = this.sortProvidersByPreference(
        recommendation.providers,
        options
      );

      recommendation.recommendedProvider = sortedProviders[0]?.provider;
      recommendation.alternativeProviders = options.includeAlternatives
        ? sortedProviders.slice(1).map(p => p.provider)
        : [];

      recommendations.push(recommendation);
    });

    // Sort recommendations by service priority
    return recommendations.sort((a, b) => {
      // Prioritize available services
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }

      // Sort by service type priority (fiber > 5G > LTE > etc.)
      const servicePriority: Record<ServiceType, number> = {
        fibre: 1,
        '5g': 2,
        fixed_lte: 3,
        uncapped_wireless: 4,
        licensed_wireless: 5,
        lte: 6,
        '3g_2100': 7,
        '3g_900': 8,
        '2g': 9
      };

      const aPriority = servicePriority[a.serviceType] || 999;
      const bPriority = servicePriority[b.serviceType] || 999;

      return aPriority - bPriority;
    });
  }

  /**
   * Sort providers by user preferences
   */
  private sortProvidersByPreference(
    providers: ServiceCoverageRecommendation['providers'],
    options: { prioritizeSpeed: boolean; prioritizeReliability: boolean }
  ) {
    return [...providers].sort((a, b) => {
      // Reliability scoring (confidence + signal strength)
      if (options.prioritizeReliability) {
        const aReliability = this.calculateReliabilityScore(a);
        const bReliability = this.calculateReliabilityScore(b);

        if (aReliability !== bReliability) {
          return bReliability - aReliability; // Higher is better
        }
      }

      // Speed scoring
      if (options.prioritizeSpeed) {
        const aSpeed = this.calculateSpeedScore(a);
        const bSpeed = this.calculateSpeedScore(b);

        if (aSpeed !== bSpeed) {
          return bSpeed - aSpeed; // Higher is better
        }
      }

      // Default: prefer higher confidence
      const confidenceScore = { high: 3, medium: 2, low: 1 };
      return confidenceScore[b.confidence] - confidenceScore[a.confidence];
    });
  }

  /**
   * Calculate reliability score for a provider
   */
  private calculateReliabilityScore(
    provider: ServiceCoverageRecommendation['providers'][0]
  ): number {
    const confidenceScore = { high: 3, medium: 2, low: 1 };
    const signalScore = { excellent: 4, good: 3, fair: 2, poor: 1, none: 0 };

    return (
      confidenceScore[provider.confidence] * 2 +
      signalScore[provider.signal as keyof typeof signalScore]
    );
  }

  /**
   * Calculate speed score for a provider
   */
  private calculateSpeedScore(
    provider: ServiceCoverageRecommendation['providers'][0]
  ): number {
    if (!provider.estimatedSpeed) return 0;

    const speed = provider.estimatedSpeed;
    const baseSpeed = speed.unit === 'Gbps' ? speed.download * 1000 : speed.download;

    return baseSpeed;
  }

  /**
   * Compare coverage between providers for a specific service
   */
  async compareCoverageByService(
    coordinates: Coordinates,
    serviceType: ServiceType,
    providers: CoverageProvider[] = ['mtn']
  ): Promise<{
    serviceType: ServiceType;
    comparison: {
      provider: CoverageProvider;
      available: boolean;
      signal: string;
      estimatedSpeed?: any;
      confidence: string;
      pros: string[];
      cons: string[];
    }[];
  }> {
    const aggregated = await this.aggregateCoverage(coordinates, {
      providers,
      serviceTypes: [serviceType]
    });

    const serviceRecommendation = aggregated.bestServices.find(s => s.serviceType === serviceType);

    if (!serviceRecommendation) {
      return {
        serviceType,
        comparison: providers.map(provider => ({
          provider,
          available: false,
          signal: 'none',
          confidence: 'low',
          pros: [],
          cons: ['Service not available']
        }))
      };
    }

    const comparison = serviceRecommendation.providers.map(provider => {
      const pros: string[] = [];
      const cons: string[] = [];

      // Analyze pros and cons
      if (provider.confidence === 'high') pros.push('High confidence coverage');
      if (provider.signal === 'excellent') pros.push('Excellent signal strength');
      if (provider.estimatedSpeed && provider.estimatedSpeed.download > 100) {
        pros.push('High speed connection');
      }

      if (provider.confidence === 'low') cons.push('Low confidence in coverage data');
      if (provider.signal === 'poor') cons.push('Weak signal strength');
      if (!provider.estimatedSpeed) cons.push('Speed estimate unavailable');

      return {
        provider: provider.provider,
        available: true,
        signal: provider.signal,
        estimatedSpeed: provider.estimatedSpeed,
        confidence: provider.confidence,
        pros,
        cons
      };
    });

    return { serviceType, comparison };
  }

  /**
   * Cache management
   */
  private getCacheKey(coordinates: Coordinates, options: CoverageAggregationOptions): string {
    return `${coordinates.lat.toFixed(6)},${coordinates.lng.toFixed(6)}-${JSON.stringify(options)}`;
  }

  private getFromCache(key: string): AggregatedCoverageResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: AggregatedCoverageResponse): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const coverageAggregationService = CoverageAggregationService.getInstance();