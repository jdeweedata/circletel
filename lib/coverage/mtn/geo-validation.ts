// Enhanced Geographic Bounds Validation for South Africa
import { Coordinates } from '../types';

export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  name: string;
  description?: string;
}

export interface ProvinceInfo {
  code: string;
  name: string;
  bounds: GeographicBounds;
  majorCities: Array<{
    name: string;
    coordinates: Coordinates;
    population?: number;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  province?: ProvinceInfo;
  nearestCity?: {
    name: string;
    distance: number; // km
    coordinates: Coordinates;
  };
  warnings: string[];
  suggestions?: string[];
}

// Detailed South African provincial boundaries
export const SOUTH_AFRICAN_PROVINCES: Record<string, ProvinceInfo> = {
  WC: {
    code: 'WC',
    name: 'Western Cape',
    bounds: {
      north: -30.0,
      south: -35.0,
      east: 25.0,
      west: 16.0,
      name: 'Western Cape Province'
    },
    majorCities: [
      { name: 'Cape Town', coordinates: { lat: -33.9249, lng: 18.4241 }, population: 4618000 },
      { name: 'Stellenbosch', coordinates: { lat: -33.9321, lng: 18.8602 }, population: 155000 },
      { name: 'George', coordinates: { lat: -33.9628, lng: 22.4619 }, population: 204000 },
      { name: 'Worcester', coordinates: { lat: -33.6457, lng: 19.4484 }, population: 127000 }
    ]
  },
  EC: {
    code: 'EC',
    name: 'Eastern Cape',
    bounds: {
      north: -30.0,
      south: -34.5,
      east: 30.0,
      west: 22.0,
      name: 'Eastern Cape Province'
    },
    majorCities: [
      { name: 'Port Elizabeth', coordinates: { lat: -33.9580, lng: 25.6200 }, population: 1244000 },
      { name: 'East London', coordinates: { lat: -32.9833, lng: 27.8667 }, population: 755000 },
      { name: 'Mthatha', coordinates: { lat: -31.5937, lng: 28.7831 }, population: 190000 },
      { name: 'Bhisho', coordinates: { lat: -32.8473, lng: 27.4410 }, population: 137000 }
    ]
  },
  NC: {
    code: 'NC',
    name: 'Northern Cape',
    bounds: {
      north: -24.0,
      south: -32.0,
      east: 25.0,
      west: 16.0,
      name: 'Northern Cape Province'
    },
    majorCities: [
      { name: 'Kimberley', coordinates: { lat: -28.7282, lng: 24.7499 }, population: 225000 },
      { name: 'Upington', coordinates: { lat: -28.4479, lng: 21.2561 }, population: 75000 },
      { name: 'Kathu', coordinates: { lat: -27.6833, lng: 23.0500 }, population: 65000 }
    ]
  },
  FS: {
    code: 'FS',
    name: 'Free State',
    bounds: {
      north: -26.0,
      south: -31.0,
      east: 30.0,
      west: 24.0,
      name: 'Free State Province'
    },
    majorCities: [
      { name: 'Bloemfontein', coordinates: { lat: -29.0852, lng: 26.1596 }, population: 520000 },
      { name: 'Welkom', coordinates: { lat: -27.9772, lng: 26.7397 }, population: 430000 },
      { name: 'Kroonstad', coordinates: { lat: -27.6506, lng: 27.2340 }, population: 130000 }
    ]
  },
  KZN: {
    code: 'KZN',
    name: 'KwaZulu-Natal',
    bounds: {
      north: -26.5,
      south: -31.5,
      east: 33.0,
      west: 28.5,
      name: 'KwaZulu-Natal Province'
    },
    majorCities: [
      { name: 'Durban', coordinates: { lat: -29.8587, lng: 31.0218 }, population: 3950000 },
      { name: 'Pietermaritzburg', coordinates: { lat: -29.6107, lng: 30.3951 }, population: 750000 },
      { name: 'Newcastle', coordinates: { lat: -27.7594, lng: 29.9319 }, population: 404000 },
      { name: 'Richards Bay', coordinates: { lat: -28.7833, lng: 32.0833 }, population: 252000 }
    ]
  },
  NW: {
    code: 'NW',
    name: 'North West',
    bounds: {
      north: -24.0,
      south: -28.0,
      east: 28.5,
      west: 22.0,
      name: 'North West Province'
    },
    majorCities: [
      { name: 'Rustenburg', coordinates: { lat: -25.6672, lng: 27.2424 }, population: 395000 },
      { name: 'Klerksdorp', coordinates: { lat: -26.8500, lng: 26.6667 }, population: 350000 },
      { name: 'Potchefstroom', coordinates: { lat: -26.7000, lng: 27.0833 }, population: 128000 },
      { name: 'Mahikeng', coordinates: { lat: -25.8601, lng: 25.6358 }, population: 75000 }
    ]
  },
  GP: {
    code: 'GP',
    name: 'Gauteng',
    bounds: {
      north: -25.0,
      south: -27.0,
      east: 29.0,
      west: 27.0,
      name: 'Gauteng Province'
    },
    majorCities: [
      { name: 'Johannesburg', coordinates: { lat: -26.2041, lng: 28.0473 }, population: 5635000 },
      { name: 'Pretoria', coordinates: { lat: -25.7479, lng: 28.2293 }, population: 2921000 },
      { name: 'Ekurhuleni', coordinates: { lat: -26.1715, lng: 28.3949 }, population: 3178000 },
      { name: 'Soweto', coordinates: { lat: -26.2678, lng: 27.8585 }, population: 1271000 },
      { name: 'Sandton', coordinates: { lat: -26.1076, lng: 28.0567 }, population: 222000 }
    ]
  },
  MP: {
    code: 'MP',
    name: 'Mpumalanga',
    bounds: {
      north: -22.0,
      south: -27.5,
      east: 32.0,
      west: 28.0,
      name: 'Mpumalanga Province'
    },
    majorCities: [
      { name: 'Nelspruit', coordinates: { lat: -25.4743, lng: 30.9794 }, population: 104000 },
      { name: 'Witbank', coordinates: { lat: -25.8669, lng: 29.2353 }, population: 262000 },
      { name: 'Secunda', coordinates: { lat: -26.5504, lng: 29.1781 }, population: 150000 },
      { name: 'Middelburg', coordinates: { lat: -25.7756, lng: 29.4644 }, population: 154000 }
    ]
  },
  LP: {
    code: 'LP',
    name: 'Limpopo',
    bounds: {
      north: -22.0,
      south: -25.5,
      east: 31.5,
      west: 26.0,
      name: 'Limpopo Province'
    },
    majorCities: [
      { name: 'Polokwane', coordinates: { lat: -23.9045, lng: 29.4689 }, population: 790000 },
      { name: 'Thohoyandou', coordinates: { lat: -22.9458, lng: 30.4839 }, population: 69000 },
      { name: 'Tzaneen', coordinates: { lat: -23.8833, lng: 30.1667 }, population: 30000 },
      { name: 'Musina', coordinates: { lat: -22.3436, lng: 30.0414 }, population: 45000 }
    ]
  }
};

// Overall South African bounds
export const SOUTH_AFRICA_BOUNDS: GeographicBounds = {
  north: -22.0,
  south: -35.0,
  east: 33.0,
  west: 16.0,
  name: 'South Africa',
  description: 'Republic of South Africa including all 9 provinces'
};

// Neighboring countries for context
export const NEIGHBORING_COUNTRIES: Record<string, GeographicBounds> = {
  namibia: {
    north: -17.0,
    south: -29.0,
    east: 25.0,
    west: 11.5,
    name: 'Namibia'
  },
  botswana: {
    north: -17.8,
    south: -27.0,
    east: 29.5,
    west: 20.0,
    name: 'Botswana'
  },
  zimbabwe: {
    north: -15.6,
    south: -22.4,
    east: 33.1,
    west: 25.2,
    name: 'Zimbabwe'
  },
  mozambique: {
    north: -10.5,
    south: -27.0,
    east: 41.0,
    west: 30.2,
    name: 'Mozambique'
  },
  swaziland: {
    north: -25.7,
    south: -27.3,
    east: 32.1,
    west: 30.8,
    name: 'Eswatini (Swaziland)'
  },
  lesotho: {
    north: -28.6,
    south: -30.7,
    east: 29.5,
    west: 27.0,
    name: 'Lesotho'
  }
};

export class GeographicValidator {
  /**
   * Comprehensive coordinate validation for South African context
   */
  validateCoordinates(coordinates: Coordinates): ValidationResult {
    const result: ValidationResult = {
      isValid: false,
      confidence: 'low',
      warnings: [],
      suggestions: []
    };

    // Basic coordinate validation
    if (!this.isValidCoordinateFormat(coordinates)) {
      result.warnings.push('Invalid coordinate format');
      result.suggestions?.push('Ensure coordinates are valid numbers');
      return result;
    }

    // Check if coordinates are in South Africa
    if (this.isInSouthAfrica(coordinates)) {
      result.isValid = true;
      result.confidence = 'high';

      // Determine province
      const province = this.getProvince(coordinates);
      if (province) {
        result.province = province;
        result.confidence = 'high';

        // Find nearest major city
        const nearestCity = this.findNearestCity(coordinates, province);
        if (nearestCity) {
          result.nearestCity = nearestCity;

          // Adjust confidence based on distance to city
          if (nearestCity.distance > 200) {
            result.confidence = 'medium';
            result.warnings.push(`Location is ${nearestCity.distance.toFixed(1)}km from nearest major city (${nearestCity.name})`);
          } else if (nearestCity.distance > 100) {
            result.warnings.push(`Location is ${nearestCity.distance.toFixed(1)}km from ${nearestCity.name}`);
          }
        }
      } else {
        result.confidence = 'medium';
        result.warnings.push('Unable to determine province - coordinates may be in disputed territory or border area');
      }

      // Check for offshore coordinates
      if (this.isOffshore(coordinates)) {
        result.confidence = 'low';
        result.warnings.push('Coordinates appear to be offshore - coverage unlikely');
        result.suggestions?.push('Verify coordinates are for a land-based location');
      }

      return result;
    }

    // Check if coordinates are in neighboring countries
    const neighboringCountry = this.getNeighboringCountry(coordinates);
    if (neighboringCountry) {
      result.warnings.push(`Coordinates are in ${neighboringCountry.name}, not South Africa`);
      result.suggestions?.push(`CircleTel services are only available in South Africa`);

      // Suggest nearest South African city
      const nearestSACity = this.findNearestSouthAfricanCity(coordinates);
      if (nearestSACity) {
        result.suggestions?.push(
          `Nearest South African city: ${nearestSACity.name} (${nearestSACity.distance.toFixed(1)}km away)`
        );
      }
      return result;
    }

    // Coordinates are completely outside region
    const distanceToSA = this.calculateDistanceToSouthAfrica(coordinates);
    result.warnings.push(`Coordinates are ${distanceToSA.toFixed(0)}km from South Africa`);
    result.suggestions?.push('CircleTel services are only available within South Africa');

    // Suggest major South African cities if coordinates are way off
    if (distanceToSA > 1000) {
      result.suggestions?.push('Try coordinates for major cities: Johannesburg (-26.2041, 28.0473), Cape Town (-33.9249, 18.4241), Durban (-29.8587, 31.0218)');
    }

    return result;
  }

  /**
   * Check if coordinates are in valid format
   */
  private isValidCoordinateFormat(coordinates: Coordinates): boolean {
    return (
      typeof coordinates.lat === 'number' &&
      typeof coordinates.lng === 'number' &&
      !isNaN(coordinates.lat) &&
      !isNaN(coordinates.lng) &&
      isFinite(coordinates.lat) &&
      isFinite(coordinates.lng) &&
      coordinates.lat >= -90 &&
      coordinates.lat <= 90 &&
      coordinates.lng >= -180 &&
      coordinates.lng <= 180
    );
  }

  /**
   * Check if coordinates are within South African bounds
   */
  private isInSouthAfrica(coordinates: Coordinates): boolean {
    return (
      coordinates.lat >= SOUTH_AFRICA_BOUNDS.south &&
      coordinates.lat <= SOUTH_AFRICA_BOUNDS.north &&
      coordinates.lng >= SOUTH_AFRICA_BOUNDS.west &&
      coordinates.lng <= SOUTH_AFRICA_BOUNDS.east
    );
  }

  /**
   * Determine which province coordinates are in
   */
  private getProvince(coordinates: Coordinates): ProvinceInfo | null {
    for (const province of Object.values(SOUTH_AFRICAN_PROVINCES)) {
      if (this.isInBounds(coordinates, province.bounds)) {
        return province;
      }
    }
    return null;
  }

  /**
   * Check if coordinates are within specific bounds
   */
  private isInBounds(coordinates: Coordinates, bounds: GeographicBounds): boolean {
    return (
      coordinates.lat >= bounds.south &&
      coordinates.lat <= bounds.north &&
      coordinates.lng >= bounds.west &&
      coordinates.lng <= bounds.east
    );
  }

  /**
   * Find nearest major city within a province
   */
  private findNearestCity(coordinates: Coordinates, province: ProvinceInfo): {
    name: string;
    distance: number;
    coordinates: Coordinates;
  } | null {
    let nearest: { name: string; distance: number; coordinates: Coordinates } | null = null;
    let minDistance = Infinity;

    for (const city of province.majorCities) {
      const distance = this.calculateDistance(coordinates, city.coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = {
          name: city.name,
          distance,
          coordinates: city.coordinates
        };
      }
    }

    return nearest;
  }

  /**
   * Find nearest South African city (for out-of-country coordinates)
   */
  private findNearestSouthAfricanCity(coordinates: Coordinates): {
    name: string;
    distance: number;
    coordinates: Coordinates;
  } | null {
    let nearest: { name: string; distance: number; coordinates: Coordinates } | null = null;
    let minDistance = Infinity;

    for (const province of Object.values(SOUTH_AFRICAN_PROVINCES)) {
      for (const city of province.majorCities) {
        const distance = this.calculateDistance(coordinates, city.coordinates);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = {
            name: city.name,
            distance,
            coordinates: city.coordinates
          };
        }
      }
    }

    return nearest;
  }

  /**
   * Check if coordinates are in neighboring country
   */
  private getNeighboringCountry(coordinates: Coordinates): GeographicBounds | null {
    for (const country of Object.values(NEIGHBORING_COUNTRIES)) {
      if (this.isInBounds(coordinates, country)) {
        return country;
      }
    }
    return null;
  }

  /**
   * Check if coordinates appear to be offshore
   */
  private isOffshore(coordinates: Coordinates): boolean {
    // Simple heuristic: if very close to coast bounds, might be offshore
    const OFFSHORE_BUFFER = 0.05; // ~5km buffer

    return (
      coordinates.lng < SOUTH_AFRICA_BOUNDS.west + OFFSHORE_BUFFER ||
      coordinates.lng > SOUTH_AFRICA_BOUNDS.east - OFFSHORE_BUFFER ||
      coordinates.lat < SOUTH_AFRICA_BOUNDS.south + OFFSHORE_BUFFER
    );
  }

  /**
   * Calculate distance to South Africa
   */
  private calculateDistanceToSouthAfrica(coordinates: Coordinates): number {
    // Find closest point on South African border
    const closestPoint: Coordinates = {
      lat: Math.max(SOUTH_AFRICA_BOUNDS.south, Math.min(SOUTH_AFRICA_BOUNDS.north, coordinates.lat)),
      lng: Math.max(SOUTH_AFRICA_BOUNDS.west, Math.min(SOUTH_AFRICA_BOUNDS.east, coordinates.lng))
    };

    return this.calculateDistance(coordinates, closestPoint);
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
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
   * Get detailed location information
   */
  getLocationInfo(coordinates: Coordinates): {
    validation: ValidationResult;
    details: {
      province?: string;
      nearestCity?: string;
      distanceToMajorCity?: number;
      populationDensityArea?: 'urban' | 'suburban' | 'rural';
      coverageLikelihood?: 'high' | 'medium' | 'low';
    };
  } {
    const validation = this.validateCoordinates(coordinates);

    const details: any = {};

    if (validation.province) {
      details.province = validation.province.name;
    }

    if (validation.nearestCity) {
      details.nearestCity = validation.nearestCity.name;
      details.distanceToMajorCity = validation.nearestCity.distance;

      // Estimate population density and coverage likelihood
      if (validation.nearestCity.distance < 10) {
        details.populationDensityArea = 'urban';
        details.coverageLikelihood = 'high';
      } else if (validation.nearestCity.distance < 50) {
        details.populationDensityArea = 'suburban';
        details.coverageLikelihood = 'medium';
      } else {
        details.populationDensityArea = 'rural';
        details.coverageLikelihood = 'low';
      }
    }

    return {
      validation,
      details
    };
  }
}

// Export singleton instance
export const geographicValidator = new GeographicValidator();