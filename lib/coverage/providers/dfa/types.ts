/**
 * DFA (Dark Fibre Africa) ArcGIS API Type Definitions
 * Based on public FeatureServer at dfafrica.maps.arcgis.com
 */

// =====================================================
// Request Types
// =====================================================

export interface DFACoverageRequest {
  latitude: number;
  longitude: number;
  checkNearNet?: boolean; // Default: true
  maxNearNetDistance?: number; // Default: 200 meters
}

export interface DFABoundingBoxRequest {
  north: number; // Latitude
  south: number;
  east: number; // Longitude
  west: number;
}

// =====================================================
// Response Types - Connected Buildings (FeatureServer/2)
// =====================================================

export interface DFAConnectedBuilding {
  objectid: number;
  orig_objectid?: number;
  dfa_building_id: string;
  building_name?: string;
  longitude?: number;
  latitude?: number;
  street_address?: string;
  dfa_connected_y_n?: string;
  third_party_dependant_for_conne?: string;
  feasible_y_n?: string;
  qbrecordid?: number;
  broadband?: string;
  ftth?: string;
  precinct?: string;
  promotion?: string;
}

// =====================================================
// Response Types - Near-Net Buildings (FeatureServer/1)
// =====================================================

export interface DFANearNetBuilding {
  objectid: number;
  orig_objectid?: number;
  dfa_building_id?: string;
  building_name?: string;
  longitude?: number;
  latitude?: number;
  street_address?: string;
  dfa_connected_y_n?: string;
  third_party_dependant_for_conne?: string;
  feasible_y_n?: string;
  qbrecordid?: number;
  broadband?: string;
  ftth?: string;
  precinct?: string;
  promotion?: string;
}

// =====================================================
// Response Types - Ductbank (Fiber Infrastructure)
// =====================================================

export interface DFADuctbank {
  objectid: number;
  ductbankid: number;
  name?: string;
  owner?: string;
  stage: 'Completed' | 'Construction' | string;
  ea1?: string; // Route Name
  ea2?: string; // DFA Region
}

// =====================================================
// ArcGIS Generic Response Types
// =====================================================

export interface ArcGISGeometry {
  // Polygon
  rings?: number[][][];
  // Polyline
  paths?: number[][][];
  // Point
  x?: number;
  y?: number;
  // Spatial Reference
  spatialReference?: {
    wkid: number;
    latestWkid?: number;
  };
}

export interface ArcGISFeature<T> {
  attributes: T;
  geometry?: ArcGISGeometry;
}

export interface ArcGISQueryResponse<T> {
  displayFieldName: string;
  fieldAliases: Record<string, string>;
  geometryType: 'esriGeometryPolygon' | 'esriGeometryPolyline' | 'esriGeometryPoint';
  spatialReference: {
    wkid: number;
    latestWkid?: number;
  };
  features: ArcGISFeature<T>[];
  exceededTransferLimit?: boolean;
}

// =====================================================
// Coverage Response Types
// =====================================================

export type DFACoverageType = 'connected' | 'near-net' | 'none';

export interface DFACoverageResponse {
  hasCoverage: boolean;
  coverageType: DFACoverageType;
  buildingDetails?: {
    objectId: number;
    buildingId: string;
    buildingName?: string;
    address?: string;
    status: string;
    ftth?: string;
    broadband?: string;
    precinct?: string;
    promotion?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  nearNetDetails?: {
    buildingName: string;
    address: string;
    distance: number; // meters
  };
  message: string;
}

// =====================================================
// Web Mercator Projection Types
// =====================================================

export interface WebMercatorCoordinates {
  x: number; // Easting
  y: number; // Northing
  spatialReference: {
    wkid: 102100; // Web Mercator
  };
}

export interface WGS84Coordinates {
  latitude: number;
  longitude: number;
  spatialReference: {
    wkid: 4326; // WGS84
  };
}

// =====================================================
// Query Parameter Types
// =====================================================

export interface ArcGISQueryParams {
  f: 'json';
  returnGeometry: 'true' | 'false';
  spatialRel: 'esriSpatialRelIntersects' | 'esriSpatialRelContains';
  geometry: string; // JSON string
  geometryType: 'esriGeometryPoint' | 'esriGeometryEnvelope' | 'esriGeometryPolygon';
  inSR: string; // Input Spatial Reference (e.g., "102100")
  outFields: string; // Comma-separated field names or "*"
  outSR: string; // Output Spatial Reference (e.g., "102100")
  where?: string; // SQL WHERE clause
  returnCentroid?: 'true' | 'false';
  returnExceededLimitFeatures?: 'true' | 'false';
  maxAllowableOffset?: number;
}

// =====================================================
// Error Types
// =====================================================

export interface DFAAPIError {
  error: {
    code: number;
    message: string;
    details?: string[];
  };
}

export class DFACoverageError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DFACoverageError';
  }
}
