/**
 * DFA (Dark Fibre Africa) ArcGIS API Type Definitions
 * Based on ArcGIS REST API responses from gisportal.dfafrica.co.za
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
// Response Types - Connected Buildings
// =====================================================

export interface DFAConnectedBuilding {
  OBJECTID: number;
  DFA_Building_ID: string;
  Longitude: number;
  Latitude: number;
  DFA_Connected_Y_N: 'Y' | 'N';
  Third_Party_Dependant_For_Conne?: string;
  QBRecordID?: number;
  Broadband?: string;
  FTTH?: string;
  Precinct?: string;
  Promotion?: string;
  Microwave_Connected?: string;
}

// =====================================================
// Response Types - Near-Net Buildings
// =====================================================

export interface DFANearNetBuilding {
  OBJECTID: number;
  DFA_Building_ID: string;
  Building_Name: string;
  Street_Address: string;
  Property_Owner?: string;
}

// =====================================================
// Response Types - Ductbank (Fiber Infrastructure)
// =====================================================

export interface DFADuctbank {
  OBJECTID: number;
  ductbankid: number;
  name?: string;
  owner?: string;
  placement?: string;
  installcompany?: string;
  stage: 'Completed' | 'Construction' | string; // Maps to legend: Completed=green, Construction=blue
  start_dir?: string;
  start_depth?: number;
  start_depth_units?: string;
  start_comments?: string;
  end_dir?: string;
  end_depth?: number;
  end_depth_units?: string;
  end_comments?: string;
  user1?: string;
  user2?: string;
  installday?: number;
  installmonth?: number;
  installyear?: number;
  workorderid?: number;
  totlength?: number; // Total length of fiber route
  length_units?: string;
  n_superducts?: number;
  n_innerducts?: number;
  updatetime?: string; // ISO date
  updateuser?: string;
  ea1?: string; // Route Name
  ea2?: string; // DFA Region
  start_buildingid?: number;
  end_buildingid?: number;
  start_access_pointid?: number;
  end_access_pointid?: number;
  start_poleid?: number;
  end_poleid?: number;
  ospgid?: string; // GUID
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
