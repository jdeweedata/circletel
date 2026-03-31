/**
 * Terrain Analysis Types
 * Used by elevation-client.ts and fresnel-zone.ts
 */

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface ElevationPoint extends Coordinate {
  elevation_m: number;
}

export interface ElevationProfile {
  points: ElevationPoint[];        // Evenly spaced points from BN to target
  totalDistanceM: number;          // Total path length in metres
  startElevationM: number;         // Elevation at BN
  endElevationM: number;           // Elevation at target/RN
  maxTerrainElevationM: number;    // Highest terrain point along path
  minClearanceM: number;           // Lowest clearance between LOS and terrain (can be negative if obstructed)
}

export interface FresnelAnalysis {
  clearanceRatioMin: number;       // Min Fresnel zone clearance ratio (1.0 = just clear, <0 = obstructed)
  worstObstructionPointM: number;  // Distance along path where worst obstruction occurs (metres from BN)
  obstructionLossDb: number;       // Estimated additional path loss from obstruction (dB, 0 if clear)
  isLineOfSight: boolean;          // True if LOS is not blocked by terrain
  fresnelRadius1M: number;         // 1st Fresnel zone radius at worst obstruction point (metres)
  recommendation: string;          // Human-readable recommendation (e.g., "Clear LOS", "Elevated mount required")
}

export interface ElevationCacheEntry {
  lat: number;
  lng: number;
  elevation_m: number;
  source: 'open_elevation' | 'open_meteo' | 'manual';
  fetched_at: string;
}
