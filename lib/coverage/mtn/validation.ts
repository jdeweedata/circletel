// MTN WMS Response Validation
import { MTNWMSResponse, MTNFeatureInfo, MTNError } from './types';
import { Coordinates, ServiceType, SignalStrength } from '../types';

// JSON Schema definitions for WMS responses
export interface WMSGeoJSONResponse {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, any>;
    geometry?: any;
  }>;
}

export interface WMSPlainResponse {
  results?: Array<Record<string, any>>;
  features?: Array<Record<string, any>>;
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedData?: MTNFeatureInfo[];
}

export class MTNResponseValidator {
  private readonly REQUIRED_FEATURE_PROPERTIES = [
    'coverage', 'available', 'signal', 'strength', 'level', 'quality'
  ];

  private readonly VALID_SIGNAL_VALUES = [
    'excellent', 'good', 'fair', 'poor', 'none'
  ];

  private readonly VALID_COVERAGE_INDICATORS = [
    true, false, 'yes', 'no', 'available', 'unavailable', 'active', 'inactive'
  ];

  /**
   * Validate and normalize WMS response data
   */
  validateResponse(
    response: any,
    layer: string,
    coordinates: Coordinates
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      normalizedData: []
    };

    try {
      // Step 1: Basic structure validation
      if (!this.isValidResponseStructure(response)) {
        result.errors.push(`Invalid response structure for layer ${layer}`);
        result.isValid = false;
        return result;
      }

      // Step 2: Extract features based on response type
      const features = this.extractFeatures(response, result);
      if (!features || features.length === 0) {
        result.warnings.push(`No features found in response for layer ${layer}`);
        // Still valid - just no coverage at this location
        result.normalizedData = [{
          layer,
          coverage: {
            available: false,
            signal: 'none'
          }
        }];
        return result;
      }

      // Step 3: Validate and normalize each feature
      result.normalizedData = features.map((feature, index) => {
        const featureResult = this.validateFeature(feature, layer, index, result);
        return featureResult;
      }).filter(Boolean) as MTNFeatureInfo[];

      // Step 4: Post-processing validation
      this.validateCoordinateRelevance(result.normalizedData, coordinates, result);
      this.validateServiceTypeConsistency(result.normalizedData, layer, result);

    } catch (error) {
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.isValid = false;
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Check if response has valid basic structure
   */
  private isValidResponseStructure(response: any): boolean {
    if (!response || typeof response !== 'object') {
      return false;
    }

    // Check for GeoJSON structure
    if (response.type === 'FeatureCollection' && Array.isArray(response.features)) {
      return true;
    }

    // Check for custom results structure
    if (Array.isArray(response.results) || Array.isArray(response.features)) {
      return true;
    }

    // Check for single feature object
    if (typeof response === 'object' && !Array.isArray(response)) {
      return true;
    }

    return false;
  }

  /**
   * Extract features from different response formats
   */
  private extractFeatures(response: any, result: ValidationResult): any[] {
    // GeoJSON format
    if (response.type === 'FeatureCollection' && Array.isArray(response.features)) {
      return response.features;
    }

    // Custom results format
    if (Array.isArray(response.results)) {
      return response.results;
    }

    // Features array format
    if (Array.isArray(response.features)) {
      return response.features;
    }

    // Single feature object
    if (typeof response === 'object' && !Array.isArray(response)) {
      return [response];
    }

    result.warnings.push('Unknown response format, attempting fallback parsing');
    return [];
  }

  /**
   * Validate individual feature data
   */
  private validateFeature(
    feature: any,
    layer: string,
    index: number,
    result: ValidationResult
  ): MTNFeatureInfo | null {
    try {
      const properties = feature.properties || feature;

      // Validate properties exist
      if (!properties || typeof properties !== 'object') {
        result.warnings.push(`Feature ${index} in layer ${layer} has no valid properties`);
        return null;
      }

      // Extract coverage information with validation
      const coverage = this.extractAndValidateCoverage(properties, layer, index, result);

      return {
        layer,
        feature: {
          properties,
          geometry: feature.geometry
        },
        coverage
      };

    } catch (error) {
      result.errors.push(`Failed to validate feature ${index} in layer ${layer}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Extract and validate coverage information from properties
   */
  private extractAndValidateCoverage(
    properties: Record<string, any>,
    layer: string,
    index: number,
    result: ValidationResult
  ) {
    const coverage = {
      available: false,
      signal: 'none' as SignalStrength,
      technology: undefined as string | undefined,
      metadata: properties
    };

    // Validate availability
    const available = this.validateAvailability(properties);
    if (available.isValid) {
      coverage.available = available.value;
    } else {
      result.warnings.push(`Feature ${index} in layer ${layer}: ${available.warning}`);
    }

    // Validate signal strength
    const signal = this.validateSignalStrength(properties);
    if (signal.isValid) {
      coverage.signal = signal.value;
    } else {
      result.warnings.push(`Feature ${index} in layer ${layer}: ${signal.warning}`);
    }

    // Extract technology
    const technology = this.extractTechnology(properties);
    if (technology) {
      coverage.technology = technology;
    }

    return coverage;
  }

  /**
   * Validate coverage availability
   */
  private validateAvailability(properties: Record<string, any>): {
    isValid: boolean;
    value: boolean;
    warning?: string;
  } {
    const indicators = [
      'coverage', 'available', 'signal', 'strength', 'level', 'quality'
    ];

    for (const indicator of indicators) {
      const value = properties[indicator];
      if (value !== undefined && value !== null) {
        // Boolean values
        if (typeof value === 'boolean') {
          return { isValid: true, value };
        }

        // String values
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase().trim();
          if (['yes', 'true', 'available', 'active', 'good', 'excellent', 'fair'].includes(lowerValue)) {
            return { isValid: true, value: true };
          }
          if (['no', 'false', 'unavailable', 'inactive', 'none', 'poor'].includes(lowerValue)) {
            return { isValid: true, value: false };
          }
        }

        // Numeric values (signal strength)
        if (typeof value === 'number') {
          return { isValid: true, value: value > 0 };
        }
      }
    }

    // Default: if any properties exist, assume some coverage
    const hasProperties = Object.keys(properties).length > 0;
    return {
      isValid: false,
      value: hasProperties,
      warning: `No clear coverage indicator found, defaulting to ${hasProperties ? 'available' : 'unavailable'}`
    };
  }

  /**
   * Validate signal strength
   */
  private validateSignalStrength(properties: Record<string, any>): {
    isValid: boolean;
    value: SignalStrength;
    warning?: string;
  } {
    const strengthIndicators = ['signal', 'strength', 'quality', 'level'];

    for (const indicator of strengthIndicators) {
      const value = properties[indicator];
      if (value !== undefined && value !== null) {
        // Numeric values
        if (typeof value === 'number') {
          const strength = this.numericToSignalStrength(value);
          return { isValid: true, value: strength };
        }

        // String values
        if (typeof value === 'string') {
          const lowerValue = value.toLowerCase().trim();
          for (const validSignal of this.VALID_SIGNAL_VALUES) {
            if (lowerValue.includes(validSignal)) {
              return { isValid: true, value: validSignal as SignalStrength };
            }
          }
        }
      }
    }

    return {
      isValid: false,
      value: 'fair',
      warning: 'No signal strength indicator found, defaulting to fair'
    };
  }

  /**
   * Convert numeric signal value to signal strength
   */
  private numericToSignalStrength(value: number): SignalStrength {
    if (value >= 90) return 'excellent';
    if (value >= 70) return 'good';
    if (value >= 50) return 'fair';
    if (value >= 30) return 'poor';
    return 'none';
  }

  /**
   * Extract technology information
   */
  private extractTechnology(properties: Record<string, any>): string | undefined {
    const techFields = ['technology', 'type', 'service', 'layer_type'];

    for (const field of techFields) {
      const value = properties[field];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return undefined;
  }

  /**
   * Validate coordinate relevance
   */
  private validateCoordinateRelevance(
    features: MTNFeatureInfo[],
    coordinates: Coordinates,
    result: ValidationResult
  ): void {
    if (features.length === 0) return;

    // Check if features are within reasonable distance of query point
    const MAX_DISTANCE_KM = 10; // 10km radius seems reasonable for coverage data

    for (const feature of features) {
      if (feature.feature?.geometry?.coordinates) {
        const [lng, lat] = feature.feature.geometry.coordinates;
        const distance = this.calculateDistance(coordinates, { lat, lng });

        if (distance > MAX_DISTANCE_KM) {
          result.warnings.push(
            `Feature in layer ${feature.layer} is ${distance.toFixed(1)}km from query point - may be irrelevant`
          );
        }
      }
    }
  }

  /**
   * Validate service type consistency
   */
  private validateServiceTypeConsistency(
    features: MTNFeatureInfo[],
    layer: string,
    result: ValidationResult
  ): void {
    // Check if layer name matches expected service types
    const layerServiceMapping: Record<string, string[]> = {
      'FTTBCoverage': ['fibre', 'fttb', 'fiber'],
      'UncappedWirelessEBU': ['wireless', 'uncapped', 'lte'],
      'PMPCoverage': ['wireless', 'pmp', 'licensed'],
      'FLTECoverageEBU': ['lte', 'fixed'],
      'mtnsi:MTNSA-Coverage-5G-5G': ['5g', 'mobile'],
      'mtnsi:SUPERSONIC-CONSOLIDATED': ['fibre', 'ftth', 'fiber'],
      'mtnsi:MTNSA-Coverage-LTE': ['lte', 'mobile'],
    };

    const expectedServices = layerServiceMapping[layer];
    if (!expectedServices) {
      result.warnings.push(`Unknown layer type ${layer} - cannot validate service consistency`);
      return;
    }

    for (const feature of features) {
      if (feature.coverage?.technology) {
        const tech = feature.coverage.technology.toLowerCase();
        const isConsistent = expectedServices.some(service => tech.includes(service));

        if (!isConsistent) {
          result.warnings.push(
            `Service type mismatch: layer ${layer} returned technology '${feature.coverage.technology}' which doesn't match expected types: ${expectedServices.join(', ')}`
          );
        }
      }
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degToRad(coord2.lat - coord1.lat);
    const dLng = this.degToRad(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degToRad(coord1.lat)) * Math.cos(this.degToRad(coord2.lat)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Create validation summary for logging/monitoring
   */
  createValidationSummary(results: ValidationResult[]): {
    totalResponses: number;
    validResponses: number;
    totalErrors: number;
    totalWarnings: number;
    errorRate: number;
    commonErrors: string[];
    commonWarnings: string[];
  } {
    const summary = {
      totalResponses: results.length,
      validResponses: results.filter(r => r.isValid).length,
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
      errorRate: 0,
      commonErrors: [] as string[],
      commonWarnings: [] as string[]
    };

    summary.errorRate = summary.totalResponses > 0 ?
      (summary.totalResponses - summary.validResponses) / summary.totalResponses : 0;

    // Find common errors and warnings
    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);

    summary.commonErrors = this.findCommonMessages(allErrors);
    summary.commonWarnings = this.findCommonMessages(allWarnings);

    return summary;
  }

  private findCommonMessages(messages: string[]): string[] {
    const counts = new Map<string, number>();

    messages.forEach(message => {
      counts.set(message, (counts.get(message) || 0) + 1);
    });

    return Array.from(counts.entries())
      .filter(([_, count]) => count >= 2) // Only include messages that appear 2+ times
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Top 5 most common
      .map(([message]) => message);
  }
}

// Export singleton instance
export const mtnResponseValidator = new MTNResponseValidator();