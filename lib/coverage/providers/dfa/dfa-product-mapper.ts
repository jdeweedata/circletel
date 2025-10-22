/**
 * DFA Product Mapper
 *
 * Maps DFA coverage responses to CircleTel BizFibre products
 * Handles connected and near-net coverage scenarios
 */

import { createClient } from '@/integrations/supabase/client';
import type { DFACoverageResponse } from './types';

export interface MappedProduct {
  id: string;
  name: string;
  category: string;
  service_type: string;
  download_speed: number;
  upload_speed: number;
  price: number;
  coverage_details: {
    provider_code: string;
    coverage_type: 'connected' | 'near-net' | 'none';
    building_id?: string;
    distance?: number;
    installation_note?: string;
  };
  description?: string;
}

export class DFAProductMapper {
  /**
   * Map DFA coverage response to available products
   *
   * @param coverageResponse - DFA coverage check result
   * @returns Array of available BizFibre products with coverage metadata
   */
  async mapToProducts(
    coverageResponse: DFACoverageResponse
  ): Promise<MappedProduct[]> {
    // No coverage = no products
    if (!coverageResponse.hasCoverage) {
      return [];
    }

    // Fetch DFA-compatible products from database
    const products = await this.fetchDFAProducts();

    // Map products with coverage details
    return products.map((product) => {
      const mappedProduct: MappedProduct = {
        id: product.id,
        name: product.name,
        category: product.category,
        service_type: product.service_type,
        download_speed: product.download_speed,
        upload_speed: product.upload_speed,
        price: product.price,
        coverage_details: {
          provider_code: 'dfa',
          coverage_type: coverageResponse.coverageType
        },
        description: product.description
      };

      // Add coverage-specific metadata
      if (coverageResponse.coverageType === 'connected') {
        // Active fiber connection
        mappedProduct.coverage_details.building_id =
          coverageResponse.buildingDetails?.buildingId;
        mappedProduct.coverage_details.installation_note =
          'Active DFA fiber connection available - standard installation';
      } else if (coverageResponse.coverageType === 'near-net') {
        // Near-net: within 100-200m of fiber
        mappedProduct.coverage_details.distance =
          coverageResponse.nearNetDetails?.distance;
        mappedProduct.coverage_details.installation_note = `Fiber extension required (${Math.round(coverageResponse.nearNetDetails?.distance || 0)}m from nearest fiber point). Additional installation costs may apply.`;
      }

      return mappedProduct;
    });
  }

  /**
   * Fetch BizFibre products compatible with DFA provider
   *
   * @returns Array of BizFibre products from database
   */
  private async fetchDFAProducts() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .contains('compatible_providers', ['dfa'])
      .eq('category', 'BizFibre')
      .eq('enabled', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching DFA products:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get product recommendations based on coverage and requirements
   *
   * @param coverageResponse - Coverage check result
   * @param minSpeed - Minimum required download speed (Mbps)
   * @param maxPrice - Maximum acceptable monthly price
   * @returns Filtered and sorted product recommendations
   */
  async getRecommendations(
    coverageResponse: DFACoverageResponse,
    minSpeed?: number,
    maxPrice?: number
  ): Promise<MappedProduct[]> {
    let products = await this.mapToProducts(coverageResponse);

    // Filter by speed if specified
    if (minSpeed) {
      products = products.filter(
        (product) => product.download_speed >= minSpeed
      );
    }

    // Filter by price if specified
    if (maxPrice) {
      products = products.filter((product) => product.price <= maxPrice);
    }

    // Sort by value (speed per rand)
    products.sort((a, b) => {
      const valueA = a.download_speed / a.price;
      const valueB = b.download_speed / b.price;
      return valueB - valueA; // Descending order (best value first)
    });

    return products;
  }

  /**
   * Get product by specific speed tier
   *
   * @param coverageResponse - Coverage check result
   * @param speedTier - Target speed (10, 20, 50, 100, 200)
   * @returns Matching product or null
   */
  async getProductBySpeed(
    coverageResponse: DFACoverageResponse,
    speedTier: 10 | 20 | 50 | 100 | 200
  ): Promise<MappedProduct | null> {
    const products = await this.mapToProducts(coverageResponse);

    return (
      products.find((product) => product.download_speed === speedTier) || null
    );
  }

  /**
   * Check if premium speeds (100Mbps+) are available
   *
   * @param coverageResponse - Coverage check result
   * @returns True if high-speed fiber is available
   */
  async hasPremiumSpeeds(
    coverageResponse: DFACoverageResponse
  ): Promise<boolean> {
    const products = await this.mapToProducts(coverageResponse);
    return products.some((product) => product.download_speed >= 100);
  }

  /**
   * Get installation estimate based on coverage type
   *
   * @param coverageResponse - Coverage check result
   * @returns Installation cost estimate and timeline
   */
  getInstallationEstimate(coverageResponse: DFACoverageResponse): {
    estimatedCost: string;
    estimatedDays: string;
    notes: string;
  } {
    if (coverageResponse.coverageType === 'connected') {
      return {
        estimatedCost: 'R0 - R1,500',
        estimatedDays: '5-10 business days',
        notes: 'Standard installation at existing fiber connection point'
      };
    } else if (coverageResponse.coverageType === 'near-net') {
      const distance = coverageResponse.nearNetDetails?.distance || 0;

      if (distance <= 100) {
        return {
          estimatedCost: 'R2,500 - R5,000',
          estimatedDays: '10-15 business days',
          notes: 'Fiber extension required (under 100m). Subject to site survey.'
        };
      } else {
        return {
          estimatedCost: 'R5,000 - R15,000',
          estimatedDays: '15-30 business days',
          notes: 'Fiber extension required (100-200m). Requires wayleave approval and site survey.'
        };
      }
    }

    return {
      estimatedCost: 'Not available',
      estimatedDays: 'N/A',
      notes: 'No DFA fiber coverage at this location'
    };
  }
}

// Export singleton instance
export const dfaProductMapper = new DFAProductMapper();
