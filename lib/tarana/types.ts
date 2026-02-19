/**
 * Tarana TCS Portal API Types
 * Based on API discovery from portal.tcs.taranawireless.com
 */

// Authentication
export interface TaranaAuthRequest {
  username: string;
  password: string;
}

export interface TaranaAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface TaranaUser {
  id: string;
  name: string;
  email: string;
  retailerId: number;
  retailerName: string;
  operatorId: number;
  operatorName: string;
  roleId: number;
  roleName: string;
}

// Network Hierarchy
export interface TaranaRegion {
  id: number;
  name: string;
  operatorId: number;
}

export interface TaranaMarket {
  id: number;
  name: string;
  regionId: number;
}

export interface TaranaSite {
  id: number;
  name: string;
  marketId: number;
  latitude?: number;
  longitude?: number;
}

// Radio/Device Data
export interface TaranaRadioSearchQuery {
  deviceType: 'BN' | 'RN';
  pagination: {
    offset: number;
    limit: number;
  };
  sort?: Array<{
    field: string;
    direction: 'ASC' | 'DESC';
  }>;
  conditions?: Array<{
    logicalOperator: 'AND' | 'OR';
    conditions: Array<{
      type: 'hierarchy' | 'field';
      conditions?: Array<{
        field: string;
        operation: 'EXIST' | 'EQ' | 'IN';
        values: any[];
      }>;
    }>;
  }>;
}

export interface TaranaRadioOutputSchema {
  deviceFields: string[];
}

export interface TaranaRadio {
  serialNumber: string;
  deviceId: string;
  deviceType: 'BN' | 'RN';
  regionId: number;
  regionName: string;
  marketId: number;
  marketName: string;
  siteId: number;
  siteName: string;
  cellId?: number;
  cellName?: string;
  sectorId?: number;
  sectorName?: string;
  latitude: number;
  longitude: number;
  height?: number;
  azimuth?: number;
  band?: string;
  deviceStatus: number; // 1 = connected
  lastSeen?: string;
}

export interface TaranaRadioSearchResponse {
  radios: TaranaRadio[];
  totalCount: number;
  pagination: {
    offset: number;
    limit: number;
  };
}

// Device Counts
export interface TaranaDeviceCount {
  connected: number;
  disconnected: number;
  spectrumUnassigned: number;
  newInstalls30Days: number;
  total: number;
}

// API Error
export interface TaranaApiError {
  code: string;
  message: string;
  details?: any;
}
