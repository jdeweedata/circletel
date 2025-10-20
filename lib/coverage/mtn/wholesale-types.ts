/**
 * MTN Wholesale Feasibility API Types
 *
 * Types for MTN MNS (Managed Network Services) Wholesale API
 * Test Environment: asp-feasibility.mtnbusiness.co.za
 * Production: ftool.mtnbusiness.co.za (requires IP whitelisting)
 */

import { Coordinates } from '../types';

// Product Information
export interface MTNWholesaleProduct {
  name: string;
  id?: string;
  description?: string;
  type?: 'fibre' | 'wireless' | 'connectivity';
}

// Feasibility Request
export interface MTNFeasibilityRequest {
  inputs: Array<{
    latitude: string;
    longitude: string;
    customer_name: string;
  }>;
  product_names: string[];
  requestor: string;
}

// Feasibility Response - Product Result
export interface MTNProductResult {
  id?: string;
  product_name: string;
  product_feasible: 'Yes' | 'No' | 'yes' | 'no';
  product_capacity: string;
  product_notes: string;
  product_region: string;
  product_uflte_mbps?: string;
}

// Feasibility Response - Output
export interface MTNFeasibilityOutput {
  customer_name: string;
  latitude: string;
  longitude: string;
  product_results: MTNProductResult[];
  response_time_seconds: number | string;
}

// Complete Feasibility Response
export interface MTNFeasibilityResponse {
  error_code: string;
  error_message: string;
  outputs: MTNFeasibilityOutput[];
  response_time_seconds: number;
}

// Products List Response
export interface MTNProductsResponse {
  error_code: string;
  error_message: string;
  outputs: string[];
  response_time_seconds: number;
}

// Client Configuration
export interface MTNWholesaleConfig {
  apiKey: string;
  baseUrl: string;
  environment: 'test' | 'production';
  timeout?: number;
}

// Mapped Coverage Result
export interface MTNWholesaleCoverageResult {
  coordinates: Coordinates;
  available: boolean;
  products: Array<{
    name: string;
    feasible: boolean;
    capacity: string;
    region: string;
    notes: string;
    // Mapped to CircleTel categories
    // fibre = FTTH (Fibre to the Home)
    // wireless = SkyFibre/uncapped wireless
    // connectivity = Business connectivity (cloud connect, ethernet, etc.)
    productCategory: 'fibre' | 'wireless' | 'connectivity';
  }>;
  responseTime: number;
  error?: string;
}
