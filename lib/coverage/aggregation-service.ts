// Multi-source Coverage Aggregation Service
import { Coordinates, ServiceType, CoverageResponse, CoverageProvider, SignalStrength, BaseStationProximityResult } from './types';
import { mtnWMSClient } from './mtn/wms-client';
import { MTNWMSParser } from './mtn/wms-parser';
import { MTNServiceCoverage } from './mtn/types';
import { mtnWMSRealtimeClient } from './mtn/wms-realtime-client';
import { mtnWholesaleClient } from './mtn/wholesale-client';
import { mtnNADClient, NADCorrectionResult } from './mtn/nad-client';
import { checkBaseStationProximity, shouldShowSkyFibre } from './mtn/base-station-service';
import { dfaCoverageClient } from './providers/dfa';
import { dfaProductMapper } from './providers/dfa';

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
  // Optimization: Request deduplication for concurrent coverage checks
  private pendingRequests = new Map<string, Promise<AggregatedCoverageResponse>>();

  static getInstance(): CoverageAggregationService {
    if (!this.instance) {
      this.instance = new CoverageAggregationService();
    }
    return this.instance;
  }

  /**
   * Aggregate coverage data from multiple providers
   * Optimized: Deduplicates concurrent requests for same coordinates
   */
  async aggregateCoverage(
    coordinates: Coordinates,
    options: CoverageAggregationOptions = {}
  ): Promise<AggregatedCoverageResponse> {
    const cacheKey = this.getCacheKey(coordinates, options);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Optimization: Check if request is already pending
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      console.log('[Coverage Aggregation] Deduplicating concurrent request for', coordinates);
      return pending;
    }

    // Create the request promise and store it for deduplication
    const requestPromise = this.executeAggregation(coordinates, options);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      return await requestPromise;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Execute the actual aggregation logic
   */
  private async executeAggregation(
    coordinates: Coordinates,
    options: CoverageAggregationOptions
  ): Promise<AggregatedCoverageResponse> {
    const cacheKey = this.getCacheKey(coordinates, options);

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
      case 'dfa':
      case 'openserve':
        return this.getDFACoverage(coordinates, serviceTypes);

      case 'vodacom':
      case 'cell_c':
      case 'telkom':
        throw new Error(`Provider ${provider} not yet implemented`);

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get MTN coverage using Consumer API (GeoServer WMS)
   *
   * ✅ PHASE 2 ENABLED - MTN Consumer API Integration (October 4, 2025)
   * ✅ PHASE 3 ENHANCED - Infrastructure-Based Quality Metrics (October 4, 2025)
   * ✅ PHASE 4 ENABLED - NAD Coordinate Correction (December 9, 2025)
   *
   * Using verified Consumer API endpoint: https://mtnsi.mtn.co.za/cache/geoserver/wms
   * Infrastructure scoring available via InfrastructureSignalEstimator
   * NAD correction fixes ~460m geocoding variance from Google Maps
   * Documentation: docs/MTN_PHASE2_COMPLETION.md, docs/MTN_PHASE3_COMPLETION.md
   */
  private async getMTNCoverage(
    coordinates: Coordinates,
    serviceTypes?: ServiceType[]
  ): Promise<CoverageResponse> {
    try {
      // PHASE 4: Apply NAD coordinate correction before coverage check
      // Google Maps geocoding can be ~460m off from actual location
      // MTN's NAD (National Address Database) provides accurate coordinates
      let nadCorrection: NADCorrectionResult | null = null;
      let checkCoordinates = coordinates;

      try {
        nadCorrection = await mtnNADClient.correctCoordinates(coordinates);

        if (nadCorrection.source === 'nad' && nadCorrection.distance > 50) {
          // Only use NAD correction if distance is significant (>50m)
          console.log('[MTN Coverage] NAD correction applied:', {
            original: coordinates,
            corrected: nadCorrection.corrected,
            distance: `${nadCorrection.distance.toFixed(0)}m`,
            address: nadCorrection.address?.formattedAddress
          });
          checkCoordinates = nadCorrection.corrected;
        } else {
          console.log('[MTN Coverage] NAD correction minimal, using original coordinates:', {
            distance: `${nadCorrection.distance.toFixed(0)}m`
          });
        }
      } catch (nadError) {
        console.warn('[MTN Coverage] NAD correction failed, using original coordinates:', nadError);
        // Continue with original coordinates if NAD fails
      }

      // Use Consumer API (GeoServer WMS) - verified working endpoint
      const realtimeCoverage = await mtnWMSRealtimeClient.checkCoverage(
        checkCoordinates,
        serviceTypes
      );

      if (realtimeCoverage.available) {
        // Successfully got real-time data from Consumer API
        console.log('[MTN Coverage] Consumer API returned coverage:', {
          services: realtimeCoverage.services.length,
          coordinates
        });

        // Build services array from WMS results
        const services = realtimeCoverage.services.map(service => ({
          type: service.type,
          available: service.available,
          signal: this.inferSignalFromLayerData(service.layerData),
          provider: 'MTN',
          technology: this.getTechnologyForServiceType(service.type)
        }));

        // Check if uncapped_wireless (SkyFibre/Tarana) is missing from WMS results
        // If missing, try MTN Wholesale API as fallback for Fixed Wireless Broadband
        const hasUncappedWireless = services.some(
          s => s.type === 'uncapped_wireless' && s.available
        );

        // Track wholesale fallback debug info
        let wholesaleDebug: { attempted: boolean; result?: any; error?: string } = { attempted: false };

        // PHASE 5: Validate SkyFibre with base station proximity
        let baseStationValidation: BaseStationProximityResult | null = null;
        if (hasUncappedWireless) {
          baseStationValidation = await this.validateSkyFibreWithBaseStation(checkCoordinates);

          if (baseStationValidation && !shouldShowSkyFibre(baseStationValidation)) {
            // Base station check says no coverage - remove uncapped_wireless
            console.log('[MTN Coverage] Base station validation failed - removing SkyFibre from results:', {
              confidence: baseStationValidation.confidence,
              nearestStation: baseStationValidation.nearestStation?.siteName,
              distance: baseStationValidation.nearestStation?.distanceKm
            });
            // Filter out uncapped_wireless
            const filteredServices = services.filter(s => s.type !== 'uncapped_wireless');
            services.length = 0;
            services.push(...filteredServices);
          } else if (baseStationValidation && baseStationValidation.installationNote) {
            // Update the uncapped_wireless service with installation note
            const skyFibreService = services.find(s => s.type === 'uncapped_wireless');
            if (skyFibreService) {
              (skyFibreService as any).metadata = {
                baseStationValidation: {
                  confidence: baseStationValidation.confidence,
                  nearestStation: baseStationValidation.nearestStation,
                  requiresElevatedInstall: baseStationValidation.requiresElevatedInstall,
                  installationNote: baseStationValidation.installationNote
                }
              };
            }
          }
        }

        if (!hasUncappedWireless) {
          wholesaleDebug.attempted = true;
          try {
            console.log('[MTN Coverage] WMS missing uncapped_wireless, trying Wholesale API fallback for:', {
              lat: coordinates.lat,
              lng: coordinates.lng
            });

            const wholesaleResult = await mtnWholesaleClient.checkFeasibility(
              coordinates,
              ['Fixed Wireless Broadband']
            );

            // Log the full result including any errors
            console.log('[MTN Coverage] Wholesale API result:', {
              available: wholesaleResult.available,
              productCount: wholesaleResult.products.length,
              products: wholesaleResult.products.map(p => ({ name: p.name, feasible: p.feasible, capacity: p.capacity })),
              error: wholesaleResult.error,
              responseTime: wholesaleResult.responseTime
            });

            // Store debug info
            wholesaleDebug.result = {
              available: wholesaleResult.available,
              productCount: wholesaleResult.products.length,
              error: wholesaleResult.error,
              responseTime: wholesaleResult.responseTime
            };

            const fwbProduct = wholesaleResult.products.find(
              p => p.name === 'Fixed Wireless Broadband' && p.feasible
            );

            if (fwbProduct) {
              console.log('[MTN Coverage] Wholesale API found Fixed Wireless Broadband coverage:', {
                capacity: fwbProduct.capacity,
                region: fwbProduct.region
              });
              // Add uncapped_wireless service from Wholesale API
              services.push({
                type: 'uncapped_wireless' as ServiceType,
                available: true,
                signal: 'good' as SignalStrength,
                provider: 'MTN',
                technology: 'Tarana Wireless G1'
              });
              wholesaleDebug.result.fwbFound = true;
              wholesaleDebug.result.capacity = fwbProduct.capacity;
            } else if (wholesaleResult.error) {
              console.error('[MTN Coverage] Wholesale API returned error:', wholesaleResult.error);
              wholesaleDebug.error = wholesaleResult.error;
            } else {
              console.log('[MTN Coverage] Wholesale API found no Fixed Wireless Broadband coverage');
              wholesaleDebug.result.fwbFound = false;
            }
          } catch (wholesaleError) {
            console.error('[MTN Coverage] Wholesale API fallback exception:', wholesaleError);
            wholesaleDebug.error = wholesaleError instanceof Error ? wholesaleError.message : 'Unknown error';
            // Continue without Wholesale fallback - WMS results still valid
          }
        }

        return {
          available: true,
          coordinates,
          confidence: 'high', // Consumer API data is high confidence
          services,
          providers: [{
            name: 'MTN',
            available: true,
            services
          }],
          lastUpdated: new Date().toISOString(),
          metadata: {
            source: 'mtn_consumer_api',
            endpoint: 'https://mtnsi.mtn.co.za/cache/geoserver/wms',
            phase: 'phase_5_base_station_validation',
            infrastructureEstimatorAvailable: true,
            wholesaleFallbackUsed: !hasUncappedWireless && services.some(s => s.type === 'uncapped_wireless'),
            wholesaleDebug,
            nadCorrection: nadCorrection ? {
              applied: nadCorrection.source === 'nad' && nadCorrection.distance > 50,
              distance: nadCorrection.distance,
              original: coordinates,
              corrected: checkCoordinates
            } : undefined,
            baseStationValidation: baseStationValidation ? {
              confidence: baseStationValidation.confidence,
              nearestStation: baseStationValidation.nearestStation,
              requiresElevatedInstall: baseStationValidation.requiresElevatedInstall,
              installationNote: baseStationValidation.installationNote,
              stationsChecked: baseStationValidation.metadata.stationsChecked
            } : undefined
          }
        };
      }

      // If Consumer API returns no coverage, try Wholesale API as fallback
      // Use NAD-corrected coordinates for wholesale check as well
      console.log('[MTN Coverage] Consumer API found no coverage, trying Wholesale API fallback for:', {
        lat: checkCoordinates.lat,
        lng: checkCoordinates.lng,
        nadCorrected: nadCorrection?.source === 'nad'
      });

      try {
        const wholesaleResult = await mtnWholesaleClient.checkFeasibility(
          checkCoordinates,
          ['Fixed Wireless Broadband']
        );

        // Log the full result including any errors
        console.log('[MTN Coverage] Wholesale API result (no WMS coverage):', {
          available: wholesaleResult.available,
          productCount: wholesaleResult.products.length,
          products: wholesaleResult.products.map(p => ({ name: p.name, feasible: p.feasible, capacity: p.capacity })),
          error: wholesaleResult.error,
          responseTime: wholesaleResult.responseTime
        });

        const fwbProduct = wholesaleResult.products.find(
          p => p.name === 'Fixed Wireless Broadband' && p.feasible
        );

        if (fwbProduct) {
          console.log('[MTN Coverage] Wholesale API found Fixed Wireless Broadband coverage:', {
            capacity: fwbProduct.capacity,
            region: fwbProduct.region
          });

          // PHASE 5: Also validate Wholesale API results with base station proximity
          const wholesaleBaseStationCheck = await this.validateSkyFibreWithBaseStation(checkCoordinates);

          if (wholesaleBaseStationCheck && !shouldShowSkyFibre(wholesaleBaseStationCheck)) {
            // Base station validation failed - don't show SkyFibre
            console.log('[MTN Coverage] Wholesale coverage rejected by base station validation:', {
              confidence: wholesaleBaseStationCheck.confidence,
              distance: wholesaleBaseStationCheck.nearestStation?.distanceKm
            });
            // Continue to return no coverage
          } else {
            const services = [{
              type: 'uncapped_wireless' as ServiceType,
              available: true,
              signal: 'good' as SignalStrength,
              provider: 'MTN',
              technology: 'Tarana Wireless G1'
            }];

            return {
              available: true,
              coordinates,
              confidence: wholesaleBaseStationCheck?.confidence === 'low' ? 'low' : 'medium',
              services,
              providers: [{
                name: 'MTN',
                available: true,
                services
              }],
              lastUpdated: new Date().toISOString(),
              metadata: {
                source: 'mtn_wholesale_api',
                endpoint: 'https://asp-feasibility.mtnbusiness.co.za',
                phase: 'phase_5_base_station_validation',
                note: 'Coverage found via Wholesale API (WMS returned no coverage)',
                wholesaleFallbackUsed: true,
                baseStationValidation: wholesaleBaseStationCheck ? {
                  confidence: wholesaleBaseStationCheck.confidence,
                  nearestStation: wholesaleBaseStationCheck.nearestStation,
                  requiresElevatedInstall: wholesaleBaseStationCheck.requiresElevatedInstall,
                  installationNote: wholesaleBaseStationCheck.installationNote,
                  stationsChecked: wholesaleBaseStationCheck.metadata.stationsChecked
                } : undefined
              }
            };
          }
        }
      } catch (wholesaleError) {
        console.error('[MTN Coverage] Wholesale API fallback also failed:', wholesaleError);
      }

      // No coverage from either WMS or Wholesale API
      return {
        available: false,
        coordinates,
        confidence: 'high', // High confidence that no coverage exists
        services: [],
        providers: [{
          name: 'MTN',
          available: false,
          services: []
        }],
        lastUpdated: new Date().toISOString(),
        metadata: {
          source: 'mtn_consumer_api',
          endpoint: 'https://mtnsi.mtn.co.za/cache/geoserver/wms',
          phase: 'phase_2_enabled',
          note: 'No coverage found at location (WMS and Wholesale checked)'
        }
      };

    } catch (error) {
      console.error('[MTN Coverage] Consumer API check failed:', error);

      // Return low-confidence unavailable on error
      return {
        available: false,
        coordinates,
        confidence: 'low',
        services: [],
        providers: [{
          name: 'MTN',
          available: false,
          services: []
        }],
        lastUpdated: new Date().toISOString(),
        metadata: {
          source: 'mtn_consumer_api_error',
          error: error instanceof Error ? error.message : 'Unknown error',
          phase: 'phase_2_enabled'
        }
      };
    }
  }

  /**
   * Get DFA fibre coverage using ArcGIS REST API
   *
   * ✅ PHASE 1A ENABLED - DFA Provider Integration (October 22, 2025)
   * Using DFA ArcGIS REST API: https://gisportal.dfafrica.co.za/server/rest/services/API
   * Checks Connected Buildings (active fiber) and Near-Net Buildings (within 200m)
   * Documentation: docs/integrations/DFA_ARCGIS_INTEGRATION_ANALYSIS.md
   */
  private async getDFACoverage(
    coordinates: Coordinates,
    serviceTypes?: ServiceType[]
  ): Promise<CoverageResponse> {
    try {
      // Use DFA ArcGIS client to check coverage
      const dfaResponse = await dfaCoverageClient.checkCoverage({
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        checkNearNet: true,
        maxNearNetDistance: 200
      });

      if (!dfaResponse.hasCoverage) {
        // No DFA coverage at location
        return {
          available: false,
          coordinates,
          confidence: 'high', // High confidence that no coverage exists
          services: [],
          providers: [{
            name: 'DFA',
            available: false,
            services: []
          }],
          lastUpdated: new Date().toISOString(),
          metadata: {
            source: 'dfa_arcgis_api',
            endpoint: 'https://gisportal.dfafrica.co.za/server/rest/services/API',
            coverageType: 'none',
            note: dfaResponse.message
          }
        };
      }

      // Get available products based on coverage type
      const mappedProducts = await dfaProductMapper.mapToProducts(dfaResponse);

      // Convert mapped products to service coverage format
      const services = mappedProducts.map(product => ({
        type: 'fibre' as ServiceType,
        available: true,
        signal: 'good' as SignalStrength, // Fiber is always 'good' when connected
        provider: 'DFA',
        technology: 'FTTB',
        estimatedSpeed: {
          download: product.download_speed,
          upload: product.upload_speed,
          unit: 'Mbps' as const
        },
        metadata: {
          productId: product.id,
          productName: product.name,
          price: product.price,
          coverageType: product.coverage_details.coverage_type,
          installationNote: product.coverage_details.installation_note
        }
      }));

      // Get installation estimate
      const installationEstimate = dfaProductMapper.getInstallationEstimate(dfaResponse);

      return {
        available: true,
        coordinates,
        confidence: dfaResponse.coverageType === 'connected' ? 'high' : 'medium',
        services,
        providers: [{
          name: 'DFA',
          available: true,
          services
        }],
        lastUpdated: new Date().toISOString(),
        metadata: {
          source: 'dfa_arcgis_api',
          endpoint: 'https://gisportal.dfafrica.co.za/server/rest/services/API',
          coverageType: dfaResponse.coverageType,
          buildingId: dfaResponse.buildingDetails?.buildingId,
          distance: dfaResponse.nearNetDetails?.distance,
          installationEstimate,
          productsAvailable: mappedProducts.length,
          note: dfaResponse.message
        }
      };
    } catch (error) {
      console.error('[DFA Coverage] API check failed:', error);

      // Return low-confidence unavailable on error
      return {
        available: false,
        coordinates,
        confidence: 'low',
        services: [],
        providers: [{
          name: 'DFA',
          available: false,
          services: []
        }],
        lastUpdated: new Date().toISOString(),
        metadata: {
          source: 'dfa_arcgis_api_error',
          error: error instanceof Error ? error.message : 'Unknown error',
          note: 'DFA API integration failed - check logs'
        }
      };
    }
  }

  /**
   * Infer signal strength from WMS layer data
   *
   * ✅ PHASE 3 ENHANCED - Infrastructure-Based Signal Estimation (October 4, 2025)
   * Now uses InfrastructureSignalEstimator for quality metrics
   * MTN only provides availability (yes/no), not signal strength
   * Infrastructure scoring provides essential quality information
   */
  private inferSignalFromLayerData(
    layerData?: any,
    serviceType?: ServiceType,
    coordinates?: Coordinates
  ): SignalStrength {
    // Default to 'good' if we don't have enough data for infrastructure estimation
    if (!layerData || !serviceType || !coordinates) {
      return 'good';
    }

    // Phase 3: Use infrastructure-based estimation
    // Note: This requires full feature data, not just properties
    // For now, we estimate based on ACCESS_TYPE
    if (layerData.ACCESS_TYPE === 'Yes' || layerData.ACCESS_TYPE === 'yes') {
      // Coverage available - return good as baseline
      // TODO: Pass full features array to InfrastructureSignalEstimator for advanced scoring
      return 'good';
    }

    return 'none';
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
    const providers = (options.providers || ['mtn']).sort().join(',');
    const serviceTypes = (options.serviceTypes || []).sort().join(',');
    return `${coordinates.lat.toFixed(4)},${coordinates.lng.toFixed(4)}_${providers}_${serviceTypes}`;
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
   * Validate SkyFibre (uncapped_wireless) coverage using base station proximity
   *
   * ✅ PHASE 5 ENABLED - Base Station Proximity Validation (December 9, 2025)
   *
   * This provides an additional layer of validation beyond WMS coverage maps:
   * - Checks distance to nearest Tarana base station
   * - Evaluates active connections at the base station
   * - Returns coverage confidence and installation requirements
   *
   * Coverage Rules:
   * - <3km, >10 connections: HIGH confidence - Show SkyFibre
   * - 3-5km, >5 connections: MEDIUM confidence - Show with note
   * - 3-5km, 1-5 connections: LOW confidence - Show with elevated install warning
   * - >5km: NONE - Hide SkyFibre
   */
  private async validateSkyFibreWithBaseStation(
    coordinates: Coordinates
  ): Promise<BaseStationProximityResult | null> {
    try {
      const proximityResult = await checkBaseStationProximity(coordinates, { limit: 5 });

      console.log('[SkyFibre Validation] Base station proximity check:', {
        hasCoverage: proximityResult.hasCoverage,
        confidence: proximityResult.confidence,
        nearestStation: proximityResult.nearestStation?.siteName,
        distance: proximityResult.nearestStation?.distanceKm,
        activeConnections: proximityResult.nearestStation?.activeConnections,
        requiresElevatedInstall: proximityResult.requiresElevatedInstall
      });

      return proximityResult;
    } catch (error) {
      console.error('[SkyFibre Validation] Base station check failed:', error);
      // Return null to indicate validation couldn't be performed
      // The WMS result will be used as fallback
      return null;
    }
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