import type { TechnologyType, ServicePackage } from '@/types/adminProducts';
import { fetchAdminProducts } from '@/services/adminProducts';
import { mtnWmsService, MTNCoverageResult } from '@/services/mtnWmsService';

export interface CoverageResult {
  provider: string;
  technologies: TechnologyType[];
  hasConcentration: boolean;
  confidence: number; // 0-100
  availablePackages: string[];
  estimatedInstallTime?: number; // days
  notes?: string;
  // Integration with admin products
  adminProducts?: ServicePackage[];
  packageCount?: number;
}

export interface MultiProviderCoverageResult {
  address: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  overall: {
    hasAnyConcentration: boolean;
    availableTechnologies: TechnologyType[];
    bestProvider: string;
    confidence: number;
  };
  providers: CoverageResult[];
  recommendations: {
    primary: CoverageResult | null;
    alternatives: CoverageResult[];
  };
}

export interface CoverageProvider {
  name: string;
  technologies: TechnologyType[];
  priority: number; // 1-10, higher is better
  checkCoverage: (lat: number, lng: number) => Promise<CoverageResult>;
}

// DFA FTTB Coverage Provider
class DFACoverageProvider implements CoverageProvider {
  name = 'DFA';
  technologies: TechnologyType[] = ['FIBRE'];
  priority = 8;

  async checkCoverage(lat: number, lng: number): Promise<CoverageResult> {
    try {
      const response = await fetch('/api/check-fttb-coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });

      const data = await response.json();

      return {
        provider: this.name,
        technologies: this.technologies,
        hasConcentration: data.hasConcentration || false,
        confidence: data.hasConcentration ? 95 : 5,
        availablePackages: data.hasConcentration ? ['BizFibreConnect', 'HomeFibreConnect'] : [],
        estimatedInstallTime: data.hasConcentration ? 3 : undefined,
        notes: data.hasConcentration ? 'High-speed fibre available' : 'Fibre infrastructure not available'
      };
    } catch (error) {
      console.error('DFA coverage check failed:', error);
      return {
        provider: this.name,
        technologies: this.technologies,
        hasConcentration: false,
        confidence: 0,
        availablePackages: [],
        notes: 'Unable to check DFA coverage'
      };
    }
  }
}

// Openserve Coverage Provider
class OpenserveCoverageProvider implements CoverageProvider {
  name = 'Openserve';
  technologies: TechnologyType[] = ['FIBRE'];
  priority = 9;

  async checkCoverage(lat: number, lng: number): Promise<CoverageResult> {
    // Simulate Openserve coverage check
    // In real implementation, this would call Openserve API
    try {
      // Approximate coverage based on major metros
      const metros = [
        { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, radius: 50 },
        { name: 'Cape Town', lat: -33.9249, lng: 18.4241, radius: 40 },
        { name: 'Durban', lat: -29.8587, lng: 31.0218, radius: 30 },
        { name: 'Pretoria', lat: -25.7479, lng: 28.2293, radius: 30 },
        { name: 'Port Elizabeth', lat: -33.9608, lng: 25.6022, radius: 20 }
      ];

      const isInCoverage = metros.some(metro => {
        const distance = this.calculateDistance(lat, lng, metro.lat, metro.lng);
        return distance <= metro.radius;
      });

      return {
        provider: this.name,
        technologies: this.technologies,
        hasConcentration: isInCoverage,
        confidence: isInCoverage ? 85 : 10,
        availablePackages: isInCoverage ? ['Openserve Fibre 50Mbps', 'Openserve Fibre 100Mbps'] : [],
        estimatedInstallTime: isInCoverage ? 5 : undefined,
        notes: isInCoverage ? 'Openserve fibre network available' : 'Outside Openserve coverage area'
      };
    } catch (error) {
      console.error('Openserve coverage check failed:', error);
      return {
        provider: this.name,
        technologies: this.technologies,
        hasConcentration: false,
        confidence: 0,
        availablePackages: [],
        notes: 'Unable to check Openserve coverage'
      };
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

// Vuma Coverage Provider
class VumaCoverageProvider implements CoverageProvider {
  name = 'Vuma';
  technologies: TechnologyType[] = ['FIBRE'];
  priority = 7;

  async checkCoverage(lat: number, lng: number): Promise<CoverageResult> {
    // Simulate Vuma coverage check
    // Vuma focuses on residential estates and business parks
    try {
      // Simulate business park detection
      const isBusinessArea = Math.random() > 0.7; // 30% chance for demonstration

      return {
        provider: this.name,
        technologies: this.technologies,
        hasConcentration: isBusinessArea,
        confidence: isBusinessArea ? 80 : 15,
        availablePackages: isBusinessArea ? ['Vuma Business 100Mbps', 'Vuma Business 200Mbps'] : [],
        estimatedInstallTime: isBusinessArea ? 7 : undefined,
        notes: isBusinessArea ? 'Vuma fibre network in business park' : 'No Vuma coverage in this area'
      };
    } catch (error) {
      console.error('Vuma coverage check failed:', error);
      return {
        provider: this.name,
        technologies: this.technologies,
        hasConcentration: false,
        confidence: 0,
        availablePackages: [],
        notes: 'Unable to check Vuma coverage'
      };
    }
  }
}

// CircleTel Wireless Coverage Provider (Enhanced with Admin Products Integration)
class CircleTelWirelessProvider implements CoverageProvider {
  name = 'CircleTel';
  technologies: TechnologyType[] = ['FIXED_WIRELESS', 'LTE'];
  priority = 10; // Highest priority - our own network

  async checkCoverage(lat: number, lng: number): Promise<CoverageResult> {
    try {
      // CircleTel has wide wireless coverage
      // In real implementation, this would check our tower coverage maps

      // Simulate tower coverage calculation
      const towers = [
        { lat: -26.2041, lng: 28.0473, range: 15 }, // Johannesburg
        { lat: -33.9249, lng: 18.4241, range: 12 }, // Cape Town
        { lat: -29.8587, lng: 31.0218, range: 10 }, // Durban
        { lat: -25.7479, lng: 28.2293, range: 12 }, // Pretoria
      ];

      const nearestTower = towers.find(tower => {
        const distance = this.calculateDistance(lat, lng, tower.lat, tower.lng);
        return distance <= tower.range;
      });

      const hasWirelessCoverage = !!nearestTower;
      const hasLTECoverage = true; // Assume LTE is available everywhere

      // Enhanced: Fetch real admin products for available technologies
      let adminProducts: ServicePackage[] = [];
      let packageNames: string[] = [];

      try {
        const availableTechnologies = hasWirelessCoverage ? ['FIXED_WIRELESS', 'LTE'] : ['LTE'];

        // Fetch admin products for available technologies
        adminProducts = await fetchAdminProducts(availableTechnologies);

        // Extract package names for backward compatibility
        packageNames = adminProducts.map(pkg => pkg.name);

      } catch (adminError) {
        console.warn('Failed to load admin products, falling back to hardcoded packages:', adminError);

        // Fallback to hardcoded packages if admin products fail
        packageNames = hasWirelessCoverage
          ? ['SkyFibre 50Mbps', 'SkyFibre 100Mbps', 'Mobile LTE']
          : ['Mobile LTE'];
      }

      return {
        provider: this.name,
        technologies: hasWirelessCoverage ? ['FIXED_WIRELESS', 'LTE'] : ['LTE'],
        hasConcentration: hasWirelessCoverage || hasLTECoverage,
        confidence: hasWirelessCoverage ? 95 : 70,
        availablePackages: packageNames,
        estimatedInstallTime: hasWirelessCoverage ? 1 : 0, // Same day for wireless
        notes: hasWirelessCoverage
          ? 'SkyFibre wireless and mobile coverage available'
          : 'Mobile LTE coverage available, wireless under consideration',
        // New admin products integration
        adminProducts,
        packageCount: adminProducts.length
      };
    } catch (error) {
      console.error('CircleTel wireless coverage check failed:', error);

      // Fallback response
      return {
        provider: this.name,
        technologies: ['LTE'],
        hasConcentration: true, // Fallback to mobile
        confidence: 50,
        availablePackages: ['Mobile LTE'],
        notes: 'Mobile coverage available (fallback mode)',
        adminProducts: [],
        packageCount: 0
      };
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

// MTN Coverage Provider (NEW - WMS Integration)
class MTNCoverageProvider implements CoverageProvider {
  name = 'MTN';
  technologies: TechnologyType[] = ['LTE']; // MTN provides mobile LTE/4G/5G
  priority = 6; // Mid-priority

  async checkCoverage(lat: number, lng: number): Promise<CoverageResult> {
    try {

      // Check 4G coverage first (most common)
      let mtnResult: MTNCoverageResult;
      try {
        mtnResult = await mtnWmsService.checkCoverage(lat, lng, '4G');
      } catch (error) {
        console.warn('MTN 4G check failed, trying 5G:', error);

        // Fallback to 5G check
        try {
          mtnResult = await mtnWmsService.checkCoverage(lat, lng, '5G');
        } catch (fiveGError) {
          console.warn('MTN 5G check also failed, trying LTE:', fiveGError);

          // Final fallback to LTE
          mtnResult = await mtnWmsService.checkCoverage(lat, lng, 'LTE');
        }
      }

      const hasGoodCoverage = mtnResult.signalStrength >= 40;
      const availablePackages = mtnResult.availablePackages.length > 0
        ? mtnResult.availablePackages
        : hasGoodCoverage
          ? ['MTN Business 4G 25GB', 'MTN Business 4G 50GB']
          : [];

      return {
        provider: this.name,
        technologies: this.technologies,
        hasConcentration: mtnResult.hasConcentration,
        confidence: mtnResult.confidence,
        availablePackages,
        estimatedInstallTime: 0, // Mobile service - immediate activation
        notes: mtnResult.notes ||
               `${mtnResult.technology} signal: ${mtnResult.signalStrength}% (${mtnResult.speedEstimate} Mbps estimated)`
      };
    } catch (error) {
      console.error('MTN coverage check failed:', error);

      // Fallback response - assume basic mobile coverage exists
      return {
        provider: this.name,
        technologies: this.technologies,
        hasConcentration: true, // Assume mobile coverage in South Africa
        confidence: 30, // Low confidence due to service failure
        availablePackages: ['MTN Business 4G 10GB', 'MTN Business 4G 25GB'],
        estimatedInstallTime: 0,
        notes: 'MTN coverage service unavailable - basic mobile packages shown'
      };
    }
  }

  /**
   * Enhanced method to get detailed MTN coverage with WMS data
   */
  async getDetailedCoverage(lat: number, lng: number): Promise<{
    coverage: CoverageResult;
    wmsData: MTNCoverageResult[];
  }> {
    const technologies = ['4G', '5G', 'LTE'] as const;
    const wmsResults: MTNCoverageResult[] = [];

    // Query all technologies in parallel
    const promises = technologies.map(async tech => {
      try {
        return await mtnWmsService.checkCoverage(lat, lng, tech);
      } catch (error) {
        console.warn(`MTN ${tech} query failed:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(promises);
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        wmsResults.push(result.value);
      }
    });

    // Get standard coverage result
    const standardCoverage = await this.checkCoverage(lat, lng);

    return {
      coverage: standardCoverage,
      wmsData: wmsResults
    };
  }
}

// Main Multi-Provider Coverage Service
export class MultiProviderCoverageService {
  private providers: CoverageProvider[];

  constructor() {
    this.providers = [
      new CircleTelWirelessProvider(),
      new OpenserveCoverageProvider(),
      new DFACoverageProvider(),
      new VumaCoverageProvider(),
      new MTNCoverageProvider() // Added MTN WMS integration
    ];
  }

  async checkAllProviders(
    lat: number,
    lng: number,
    address: string
  ): Promise<MultiProviderCoverageResult> {

    // Check all providers in parallel
    const results = await Promise.allSettled(
      this.providers.map(provider => provider.checkCoverage(lat, lng))
    );

    const providerResults: CoverageResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Provider ${this.providers[index].name} failed:`, result.reason);
        return {
          provider: this.providers[index].name,
          technologies: this.providers[index].technologies,
          hasConcentration: false,
          confidence: 0,
          availablePackages: [],
          notes: 'Provider check failed'
        };
      }
    });

    return this.aggregateResults(providerResults, address, { lat, lng });
  }

  private aggregateResults(
    results: CoverageResult[],
    address: string,
    coordinates: { lat: number; lng: number }
  ): MultiProviderCoverageResult {
    // Filter providers with coverage
    const providersWithCoverage = results.filter(r => r.hasConcentration);

    // Get all available technologies
    const availableTechnologies = Array.from(
      new Set(providersWithCoverage.flatMap(r => r.technologies))
    );

    // Find best provider (highest priority with coverage)
    const bestProvider = providersWithCoverage
      .sort((a, b) => {
        const providerA = this.providers.find(p => p.name === a.provider);
        const providerB = this.providers.find(p => p.name === b.provider);
        return (providerB?.priority || 0) - (providerA?.priority || 0);
      })[0];

    // Calculate overall confidence
    const overallConfidence = providersWithCoverage.length > 0
      ? Math.max(...providersWithCoverage.map(r => r.confidence))
      : 0;

    // Get alternatives (other providers with coverage, sorted by priority)
    const alternatives = providersWithCoverage
      .filter(r => r.provider !== bestProvider?.provider)
      .sort((a, b) => {
        const providerA = this.providers.find(p => p.name === a.provider);
        const providerB = this.providers.find(p => p.name === b.provider);
        return (providerB?.priority || 0) - (providerA?.priority || 0);
      });

    return {
      address,
      coordinates,
      timestamp: new Date().toISOString(),
      overall: {
        hasAnyConcentration: providersWithCoverage.length > 0,
        availableTechnologies,
        bestProvider: bestProvider?.provider || 'None',
        confidence: overallConfidence
      },
      providers: results,
      recommendations: {
        primary: bestProvider || null,
        alternatives
      }
    };
  }

  // Get providers by technology type
  getProvidersByTechnology(technology: TechnologyType): CoverageProvider[] {
    return this.providers.filter(p => p.technologies.includes(technology));
  }

  // Check specific provider coverage
  async checkProviderCoverage(
    providerName: string,
    lat: number,
    lng: number
  ): Promise<CoverageResult | null> {
    const provider = this.providers.find(p => p.name === providerName);
    if (!provider) {
      console.error(`Provider ${providerName} not found`);
      return null;
    }

    try {
      return await provider.checkCoverage(lat, lng);
    } catch (error) {
      console.error(`Failed to check ${providerName} coverage:`, error);
      return null;
    }
  }

  // Enhanced: Get admin products for CircleTel coverage result
  async getAdminProductsForCoverage(
    technologies: TechnologyType[],
    coverageArea?: string
  ): Promise<ServicePackage[]> {
    try {
      return await fetchAdminProducts(technologies, coverageArea);
    } catch (error) {
      console.error('Failed to fetch admin products for coverage integration:', error);
      return [];
    }
  }

  // Enhanced: Get coverage result with admin products integration
  async getCircleTelCoverageWithProducts(
    lat: number,
    lng: number,
    coverageArea?: string
  ): Promise<CoverageResult | null> {
    const circleTelProvider = this.providers.find(p => p.name === 'CircleTel');
    if (!circleTelProvider) {
      console.error('CircleTel provider not found');
      return null;
    }

    try {
      // Get coverage result (this will include admin products due to our integration)
      const result = await circleTelProvider.checkCoverage(lat, lng);

      // If admin products weren't loaded or failed, try again with explicit call
      if (!result.adminProducts || result.adminProducts.length === 0) {
        const adminProducts = await this.getAdminProductsForCoverage(result.technologies, coverageArea);

        if (adminProducts.length > 0) {
          result.adminProducts = adminProducts;
          result.packageCount = adminProducts.length;
          result.availablePackages = adminProducts.map(pkg => pkg.name);

        }
      }

      return result;
    } catch (error) {
      console.error('Failed to get CircleTel coverage with products:', error);
      return null;
    }
  }

  // Enhanced: Check all providers with admin products integration
  async checkAllProvidersEnhanced(
    lat: number,
    lng: number,
    address: string,
    coverageArea?: string
  ): Promise<MultiProviderCoverageResult> {

    // Check all providers in parallel
    const results = await Promise.allSettled(
      this.providers.map(async provider => {
        const result = await provider.checkCoverage(lat, lng);

        // For CircleTel, ensure admin products are loaded
        if (provider.name === 'CircleTel' && (!result.adminProducts || result.adminProducts.length === 0)) {
          try {
            const adminProducts = await this.getAdminProductsForCoverage(result.technologies, coverageArea);
            if (adminProducts.length > 0) {
              result.adminProducts = adminProducts;
              result.packageCount = adminProducts.length;
              // Update package names with real products
              result.availablePackages = adminProducts.map(pkg => pkg.name);
            }
          } catch (adminError) {
            console.warn('Failed to enhance CircleTel result with admin products:', adminError);
          }
        }

        return result;
      })
    );

    const providerResults: CoverageResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Provider ${this.providers[index].name} failed:`, result.reason);
        return {
          provider: this.providers[index].name,
          technologies: this.providers[index].technologies,
          hasConcentration: false,
          confidence: 0,
          availablePackages: [],
          notes: 'Provider check failed',
          adminProducts: [],
          packageCount: 0
        };
      }
    });

    return this.aggregateResults(providerResults, address, { lat, lng });
  }
}

// Export singleton instance
export const multiProviderCoverageService = new MultiProviderCoverageService();