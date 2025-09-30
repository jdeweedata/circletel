// MTN-specific Coverage Types
import { Coordinates, ServiceType, SignalStrength } from '../types';

export interface MTNMapConfig {
  configId: string;
  name: string;
  type: 'business' | 'consumer';
  layers: Record<ServiceType, string>;
  wmsEndpoint: string;
  queryLayers: string[];
}

export interface MTNWMSRequest {
  configId: string;
  layer: string;
  coordinates: Coordinates;
  bbox?: BoundingBox;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  format?: 'application/json' | 'text/html' | 'text/plain';
}

export interface MTNWMSResponse {
  success: boolean;
  data?: MTNFeatureInfo[];
  error?: string;
  layer: string;
  coordinates: Coordinates;
  validationErrors?: number;
  validationWarnings?: number;
}

export interface MTNFeatureInfo {
  layer: string;
  feature?: {
    properties: Record<string, any>;
    geometry?: any;
  };
  coverage?: {
    available: boolean;
    signal: SignalStrength;
    technology?: string;
    metadata?: Record<string, any>;
  };
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface MTNCoverageRequest {
  coordinates: Coordinates;
  serviceTypes?: ServiceType[];
  includeSignalStrength?: boolean;
  sources?: ('business' | 'consumer')[];
}

export interface MTNCoverageResponse {
  available: boolean;
  coordinates: Coordinates;
  confidence: 'high' | 'medium' | 'low';
  services: MTNServiceCoverage[];
  businessCoverage?: MTNSourceCoverage;
  consumerCoverage?: MTNSourceCoverage;
  lastUpdated: string;
}

export interface MTNServiceCoverage {
  type: ServiceType;
  available: boolean;
  signal: SignalStrength;
  source: 'business' | 'consumer';
  layer: string;
  technology?: string;
  estimatedSpeed?: {
    download: number;
    upload: number;
    unit: 'Mbps' | 'Gbps';
  };
  metadata?: Record<string, any>;
}

export interface MTNSourceCoverage {
  configId: string;
  available: boolean;
  services: MTNServiceCoverage[];
  queryTime: number; // ms
}

// MTN Configuration constants
export const MTN_CONFIGS: Record<string, MTNMapConfig> = {
  business: {
    configId: 'busr-407a787d7e9949dbb2d8fc9a3d073976',
    name: 'MTN Business Retail',
    type: 'business',
    layers: {
      fibre: 'FTTBCoverage',
      licensed_wireless: 'PMPCoverage',
      fixed_lte: 'FLTECoverageEBU',
      uncapped_wireless: 'UncappedWirelessEBU',
      // Note: business map doesn't have mobile services
    } as Record<ServiceType, string>,
    wmsEndpoint: 'https://mtnsi.mtn.co.za/coverage/dev/v3',
    queryLayers: ['FTTBCoverage', 'PMPCoverage', 'FLTECoverageEBU', 'UncappedWirelessEBU']
  },
  consumer: {
    configId: 'mtncoza',
    name: 'MTN Consumer',
    type: 'consumer',
    layers: {
      '5g': 'mtnsi:MTNSA-Coverage-5G-5G',
      fixed_lte: 'mtnsi:MTNSA-Coverage-FIXLTE-0',
      fibre: 'mtnsi:SUPERSONIC-CONSOLIDATED', // FTTH
      lte: 'mtnsi:MTNSA-Coverage-LTE',
      '3g_900': 'mtnsi:MTNSA-Coverage-UMTS-900',
      '3g_2100': 'mtnsi:MTNSA-Coverage-UMTS-2100',
      '2g': 'mtnsi:MTNSA-Coverage-GSM',
      uncapped_wireless: 'UncappedWirelessEBU', // Cross-reference from business map
    } as Record<ServiceType, string>,
    wmsEndpoint: 'https://mtnsi.mtn.co.za/cache/geoserver/wms',
    queryLayers: ['mtnsi:MTNSA-Coverage-5G-5G', 'mtnsi:MTNSA-Coverage-FIXLTE-0', 'mtnsi:SUPERSONIC-CONSOLIDATED', 'mtnsi:MTNSA-Coverage-LTE', 'mtnsi:MTNSA-Coverage-UMTS-900', 'mtnsi:MTNSA-Coverage-UMTS-2100', 'mtnsi:MTNSA-Coverage-GSM']
  }
};

// Service type mapping for CircleTel packages
export const SERVICE_TYPE_MAPPING: Record<ServiceType, {
  name: string;
  description: string;
  priority: number;
  category: 'fixed' | 'mobile';
  color: string;
}> = {
  fibre: {
    name: 'Fibre (FTTB)',
    description: 'Fibre to the Business/Building',
    priority: 1,
    category: 'fixed',
    color: '#10B981' // Green
  },
  '5g': {
    name: '5G Mobile',
    description: 'Fifth-generation mobile network',
    priority: 2,
    category: 'mobile',
    color: '#8B5CF6' // Purple
  },
  fixed_lte: {
    name: 'Fixed LTE',
    description: 'Fixed wireless LTE connection',
    priority: 3,
    category: 'fixed',
    color: '#3B82F6' // Blue
  },
  uncapped_wireless: {
    name: 'Uncapped Wireless',
    description: 'Unlimited wireless data',
    priority: 4,
    category: 'fixed',
    color: '#F59E0B' // Amber
  },
  licensed_wireless: {
    name: 'Licensed Wireless',
    description: 'Point-to-multipoint wireless',
    priority: 5,
    category: 'fixed',
    color: '#06B6D4' // Cyan
  },
  lte: {
    name: 'LTE Mobile',
    description: 'Long Term Evolution mobile network',
    priority: 6,
    category: 'mobile',
    color: '#EC4899' // Pink
  },
  '3g_900': {
    name: '3G (900MHz)',
    description: '3G network on 900MHz frequency',
    priority: 7,
    category: 'mobile',
    color: '#84CC16' // Lime
  },
  '3g_2100': {
    name: '3G (2100MHz)',
    description: '3G network on 2100MHz frequency',
    priority: 8,
    category: 'mobile',
    color: '#22C55E' // Green
  },
  '2g': {
    name: '2G GSM',
    description: 'Second-generation mobile network',
    priority: 9,
    category: 'mobile',
    color: '#6B7280' // Gray
  }
};

// Signal strength interpretation for MTN responses
export const SIGNAL_STRENGTH_THRESHOLDS = {
  excellent: 90,
  good: 70,
  fair: 50,
  poor: 30,
  none: 0
};

// MTN WMS specific error codes
export type MTNErrorCode =
  | 'CONFIG_NOT_FOUND'
  | 'LAYER_NOT_AVAILABLE'
  | 'WMS_REQUEST_FAILED'
  | 'FEATURE_INFO_EMPTY'
  | 'COORDINATE_OUT_OF_BOUNDS'
  | 'SERVICE_UNAVAILABLE';

export class MTNError extends Error {
  constructor(
    message: string,
    public code: MTNErrorCode,
    public layer?: string,
    public configId?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'MTNError';
  }
}