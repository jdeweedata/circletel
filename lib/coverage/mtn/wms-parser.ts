// MTN WMS Response Parser
import {
  MTNWMSResponse,
  MTNFeatureInfo,
  MTNCoverageResponse,
  MTNServiceCoverage,
  MTNSourceCoverage,
  MTN_CONFIGS,
  SERVICE_TYPE_MAPPING,
  SIGNAL_STRENGTH_THRESHOLDS
} from './types';
import { Coordinates, ServiceType, SignalStrength } from '../types';

export class MTNWMSParser {
  /**
   * Parse dual-source WMS responses into unified coverage response
   */
  static parseDualSourceCoverage(
    businessResponses: MTNWMSResponse[],
    consumerResponses: MTNWMSResponse[],
    coordinates: Coordinates
  ): MTNCoverageResponse {
    const businessCoverage = this.parseSourceCoverage(businessResponses, 'business');
    const consumerCoverage = this.parseSourceCoverage(consumerResponses, 'consumer');

    // Combine services from both sources
    const allServices = [
      ...businessCoverage.services,
      ...consumerCoverage.services
    ];

    // Determine overall availability
    const available = allServices.some(service => service.available);

    // Calculate confidence based on successful responses and signal strength
    const confidence = this.calculateConfidence(businessResponses, consumerResponses, allServices);

    return {
      available,
      coordinates,
      confidence,
      services: allServices,
      businessCoverage,
      consumerCoverage,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Parse responses from a single source (business or consumer)
   */
  static parseSourceCoverage(
    responses: MTNWMSResponse[],
    source: 'business' | 'consumer'
  ): MTNSourceCoverage {
    const startTime = Date.now();
    const config = MTN_CONFIGS[source];
    const services: MTNServiceCoverage[] = [];

    let hasAnyAvailability = false;

    for (const response of responses) {
      if (response.success && response.data) {
        const serviceType = this.getServiceTypeFromLayer(response.layer, source);
        if (serviceType) {
          const serviceCoverage = this.parseServiceCoverage(
            response,
            serviceType,
            source
          );

          if (serviceCoverage) {
            services.push(serviceCoverage);
            if (serviceCoverage.available) {
              hasAnyAvailability = true;
            }
          }
        }
      } else {
        // Handle failed responses
        const serviceType = this.getServiceTypeFromLayer(response.layer, source);
        if (serviceType) {
          services.push({
            type: serviceType,
            available: false,
            signal: 'none',
            source,
            layer: response.layer,
            metadata: { error: response.error }
          });
        }
      }
    }

    return {
      configId: config.configId,
      available: hasAnyAvailability,
      services,
      queryTime: Date.now() - startTime
    };
  }

  /**
   * Parse coverage for a specific service type
   */
  static parseServiceCoverage(
    response: MTNWMSResponse,
    serviceType: ServiceType,
    source: 'business' | 'consumer'
  ): MTNServiceCoverage | null {
    if (!response.data || response.data.length === 0) {
      return {
        type: serviceType,
        available: false,
        signal: 'none',
        source,
        layer: response.layer
      };
    }

    // Analyze all features to determine best coverage
    let bestCoverage: MTNFeatureInfo['coverage'] | undefined;
    let bestSignal: SignalStrength = 'none';

    for (const feature of response.data) {
      if (feature.coverage) {
        if (feature.coverage.available) {
          if (!bestCoverage || this.isSignalBetter(feature.coverage.signal, bestSignal)) {
            bestCoverage = feature.coverage;
            bestSignal = feature.coverage.signal;
          }
        }
      }
    }

    // If no explicit coverage found, try to infer from feature properties
    if (!bestCoverage) {
      bestCoverage = this.inferCoverageFromFeatures(response.data);
      bestSignal = bestCoverage.signal;
    }

    const serviceCoverage: MTNServiceCoverage = {
      type: serviceType,
      available: bestCoverage.available,
      signal: bestSignal,
      source,
      layer: response.layer,
      technology: bestCoverage.technology,
      metadata: bestCoverage.metadata
    };

    // Add estimated speed based on service type and signal
    serviceCoverage.estimatedSpeed = this.estimateSpeed(serviceType, bestSignal);

    return serviceCoverage;
  }

  /**
   * Get service type from WMS layer name
   */
  static getServiceTypeFromLayer(layer: string, source: 'business' | 'consumer'): ServiceType | null {
    const config = MTN_CONFIGS[source];

    for (const [serviceType, layerName] of Object.entries(config.layers)) {
      if (layerName === layer) {
        return serviceType as ServiceType;
      }
    }

    // Handle cross-source layers - check the alternative config
    const alternativeSource = source === 'business' ? 'consumer' : 'business';
    const alternativeConfig = MTN_CONFIGS[alternativeSource];

    for (const [serviceType, layerName] of Object.entries(alternativeConfig.layers)) {
      if (layerName === layer) {
        // This is a cross-source layer, return the service type but keep original source attribution
        return serviceType as ServiceType;
      }
    }

    return null;
  }

  /**
   * Compare signal strengths
   */
  static isSignalBetter(signal1: SignalStrength, signal2: SignalStrength): boolean {
    const levels = { excellent: 4, good: 3, fair: 2, poor: 1, none: 0 };
    return levels[signal1] > levels[signal2];
  }

  /**
   * Infer coverage from feature properties when not explicitly provided
   */
  static inferCoverageFromFeatures(features: MTNFeatureInfo[]) {
    // Look for any feature with properties (indicates coverage)
    const activeFeatures = features.filter(f =>
      f.feature?.properties && Object.keys(f.feature.properties).length > 0
    );

    if (activeFeatures.length === 0) {
      return { available: false, signal: 'none' as SignalStrength };
    }

    // Analyze properties to determine signal strength
    let maxSignalValue = 0;
    let signalStrength: SignalStrength = 'fair'; // Default for any coverage

    for (const feature of activeFeatures) {
      const props = feature.feature?.properties || {};

      // Look for numerical signal indicators
      const signalIndicators = ['signal', 'strength', 'quality', 'level', 'power'];
      for (const indicator of signalIndicators) {
        const value = props[indicator];
        if (typeof value === 'number' && value > maxSignalValue) {
          maxSignalValue = value;
          signalStrength = this.numericToSignalStrength(value);
        }
      }

      // Look for string signal indicators
      const stringValue = props.signal || props.strength || props.quality;
      if (typeof stringValue === 'string') {
        const inferredSignal = this.stringToSignalStrength(stringValue);
        if (this.isSignalBetter(inferredSignal, signalStrength)) {
          signalStrength = inferredSignal;
        }
      }
    }

    return {
      available: true,
      signal: signalStrength,
      metadata: { inferredFromFeatures: true, featureCount: activeFeatures.length }
    };
  }

  /**
   * Convert numeric value to signal strength
   */
  static numericToSignalStrength(value: number): SignalStrength {
    if (value >= SIGNAL_STRENGTH_THRESHOLDS.excellent) return 'excellent';
    if (value >= SIGNAL_STRENGTH_THRESHOLDS.good) return 'good';
    if (value >= SIGNAL_STRENGTH_THRESHOLDS.fair) return 'fair';
    if (value >= SIGNAL_STRENGTH_THRESHOLDS.poor) return 'poor';
    return 'none';
  }

  /**
   * Convert string value to signal strength
   */
  static stringToSignalStrength(value: string): SignalStrength {
    const lower = value.toLowerCase();

    if (lower.includes('excellent') || lower.includes('very strong') || lower.includes('very good')) {
      return 'excellent';
    }
    if (lower.includes('good') || lower.includes('strong')) {
      return 'good';
    }
    if (lower.includes('fair') || lower.includes('medium') || lower.includes('moderate')) {
      return 'fair';
    }
    if (lower.includes('poor') || lower.includes('weak') || lower.includes('low')) {
      return 'poor';
    }
    if (lower.includes('none') || lower.includes('no signal') || lower.includes('unavailable')) {
      return 'none';
    }

    // Default to fair if string indicates some coverage
    return 'fair';
  }

  /**
   * Estimate speed based on service type and signal strength
   */
  static estimateSpeed(serviceType: ServiceType, signal: SignalStrength): {
    download: number;
    upload: number;
    unit: 'Mbps' | 'Gbps';
  } | undefined {
    const signalMultiplier = {
      excellent: 1.0,
      good: 0.8,
      fair: 0.6,
      poor: 0.4,
      none: 0
    }[signal];

    if (signalMultiplier === 0) return undefined;

    // Base speeds for different service types (in Mbps)
    const baseSpeeds: Record<ServiceType, { download: number; upload: number } | undefined> = {
      fibre: { download: 1000, upload: 1000 }, // 1Gbps symmetric
      '5g': { download: 500, upload: 100 }, // 5G mobile
      fixed_lte: { download: 100, upload: 50 }, // Fixed LTE
      uncapped_wireless: { download: 50, upload: 20 }, // Uncapped wireless
      licensed_wireless: { download: 100, upload: 100 }, // Point-to-point
      lte: { download: 50, upload: 20 }, // Mobile LTE
      '3g_900': { download: 10, upload: 5 }, // 3G 900MHz
      '3g_2100': { download: 20, upload: 10 }, // 3G 2100MHz
      '2g': { download: 1, upload: 0.5 } // 2G GSM
    };

    const baseSpeed = baseSpeeds[serviceType];
    if (!baseSpeed) return undefined;

    const estimatedDownload = baseSpeed.download * signalMultiplier;
    const estimatedUpload = baseSpeed.upload * signalMultiplier;

    // Convert to Gbps if over 1000 Mbps
    if (estimatedDownload >= 1000) {
      return {
        download: Number((estimatedDownload / 1000).toFixed(1)),
        upload: Number((estimatedUpload / 1000).toFixed(1)),
        unit: 'Gbps'
      };
    }

    return {
      download: Math.round(estimatedDownload),
      upload: Math.round(estimatedUpload),
      unit: 'Mbps'
    };
  }

  /**
   * Calculate confidence level based on response quality
   */
  static calculateConfidence(
    businessResponses: MTNWMSResponse[],
    consumerResponses: MTNWMSResponse[],
    services: MTNServiceCoverage[]
  ): 'high' | 'medium' | 'low' {
    const totalResponses = businessResponses.length + consumerResponses.length;
    const successfulResponses = businessResponses.filter(r => r.success).length +
                               consumerResponses.filter(r => r.success).length;

    const successRate = totalResponses > 0 ? successfulResponses / totalResponses : 0;

    // Check signal quality of available services
    const availableServices = services.filter(s => s.available);
    const strongSignals = availableServices.filter(s =>
      s.signal === 'excellent' || s.signal === 'good'
    ).length;

    const signalQuality = availableServices.length > 0 ?
      strongSignals / availableServices.length : 0;

    // High confidence: Good success rate and strong signals
    if (successRate >= 0.8 && signalQuality >= 0.6) {
      return 'high';
    }

    // Low confidence: Poor success rate or weak signals
    if (successRate < 0.5 || (availableServices.length > 0 && signalQuality < 0.3)) {
      return 'low';
    }

    // Medium confidence: Everything else
    return 'medium';
  }

  /**
   * Filter services by availability and signal strength
   */
  static filterServicesByQuality(
    services: MTNServiceCoverage[],
    minSignal: SignalStrength = 'poor'
  ): MTNServiceCoverage[] {
    const signalOrder: Record<SignalStrength, number> = {
      excellent: 4,
      good: 3,
      fair: 2,
      poor: 1,
      none: 0
    };

    const minLevel = signalOrder[minSignal];

    return services.filter(service =>
      service.available && signalOrder[service.signal] >= minLevel
    );
  }

  /**
   * Sort services by priority and signal strength
   */
  static sortServicesByPriority(services: MTNServiceCoverage[]): MTNServiceCoverage[] {
    return [...services].sort((a, b) => {
      // First sort by availability
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }

      // Then by service priority
      const aPriority = SERVICE_TYPE_MAPPING[a.type]?.priority || 999;
      const bPriority = SERVICE_TYPE_MAPPING[b.type]?.priority || 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Finally by signal strength
      const signalOrder: Record<SignalStrength, number> = {
        excellent: 4,
        good: 3,
        fair: 2,
        poor: 1,
        none: 0
      };

      return signalOrder[b.signal] - signalOrder[a.signal];
    });
  }
}