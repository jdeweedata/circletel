// Test data for MTN coverage system when external APIs are unavailable
import { MTNWMSResponse, MTNServiceCoverage } from './types';
import { Coordinates, ServiceType } from '../types';

export const MOCK_COVERAGE_RESPONSES: Record<string, MTNWMSResponse[]> = {
  'business': [
    {
      success: true,
      layer: 'FTTBCoverage',
      coordinates: { lat: -26.2041, lng: 28.0473 },
      data: [{
        layer: 'FTTBCoverage',
        feature: {
          properties: {
            COVERAGE: 'Available',
            SIGNAL_STRENGTH: 85,
            TECHNOLOGY: 'Fibre',
            PROVIDER: 'MTN Business'
          }
        },
        coverage: {
          available: true,
          signal: 'excellent',
          technology: 'Fibre',
          metadata: { testData: true }
        }
      }]
    },
    {
      success: true,
      layer: 'UncappedWirelessEBU',
      coordinates: { lat: -26.2041, lng: 28.0473 },
      data: [{
        layer: 'UncappedWirelessEBU',
        feature: {
          properties: {
            COVERAGE: 'Available',
            SIGNAL_STRENGTH: 72,
            TECHNOLOGY: 'Wireless',
            PROVIDER: 'MTN Business'
          }
        },
        coverage: {
          available: true,
          signal: 'good',
          technology: 'Wireless',
          metadata: { testData: true }
        }
      }]
    },
    {
      success: true,
      layer: 'FLTECoverageEBU',
      coordinates: { lat: -26.2041, lng: 28.0473 },
      data: [{
        layer: 'FLTECoverageEBU',
        feature: {
          properties: {
            COVERAGE: 'Available',
            SIGNAL_STRENGTH: 78,
            TECHNOLOGY: 'Fixed LTE',
            PROVIDER: 'MTN Business'
          }
        },
        coverage: {
          available: true,
          signal: 'good',
          technology: 'Fixed LTE',
          metadata: { testData: true }
        }
      }]
    }
  ],
  'consumer': [
    {
      success: true,
      layer: 'mtnsi:MTNSA-Coverage-5G-5G',
      coordinates: { lat: -26.2041, lng: 28.0473 },
      data: [{
        layer: 'mtnsi:MTNSA-Coverage-5G-5G',
        feature: {
          properties: {
            SITEID: 'JHB001',
            CELLID: '5G_001',
            NETWORK_TYPE: '5G',
            ACCESS_TYPE: 'NR',
            SPEED: 'High'
          }
        },
        coverage: {
          available: true,
          signal: 'excellent',
          technology: '5G NR',
          metadata: { testData: true }
        }
      }]
    },
    {
      success: true,
      layer: 'mtnsi:MTNSA-Coverage-LTE',
      coordinates: { lat: -26.2041, lng: 28.0473 },
      data: [{
        layer: 'mtnsi:MTNSA-Coverage-LTE',
        feature: {
          properties: {
            SITEID: 'JHB002',
            CELLID: 'LTE_001',
            NETWORK_TYPE: 'LTE',
            ACCESS_TYPE: 'LTE-A',
            SPEED: 'High'
          }
        },
        coverage: {
          available: true,
          signal: 'good',
          technology: 'LTE-A',
          metadata: { testData: true }
        }
      }]
    },
    {
      success: true,
      layer: 'mtnsi:SUPERSONIC-CONSOLIDATED',
      coordinates: { lat: -26.2041, lng: 28.0473 },
      data: [{
        layer: 'mtnsi:SUPERSONIC-CONSOLIDATED',
        feature: {
          properties: {
            NAME: 'Supersonic Fibre',
            STATUS: 'Active',
            TYPE: 'FTTH',
            PROVIDER: 'Supersonic',
            ID: 'SS001'
          }
        },
        coverage: {
          available: true,
          signal: 'excellent',
          technology: 'FTTH',
          metadata: { testData: true }
        }
      }]
    }
  ]
};

export function getMockCoverageData(
  source: 'business' | 'consumer',
  coordinates: Coordinates,
  serviceTypes?: ServiceType[]
): MTNWMSResponse[] {
  const responses = MOCK_COVERAGE_RESPONSES[source] || [];

  if (!serviceTypes || serviceTypes.length === 0) {
    return responses;
  }

  // Filter by requested service types
  return responses.filter(response => {
    const layer = response.layer;

    // Map layers to service types
    const layerToServiceType: Record<string, ServiceType> = {
      'FTTBCoverage': 'fibre',
      'UncappedWirelessEBU': 'uncapped_wireless',
      'FLTECoverageEBU': 'fixed_lte',
      'PMPCoverage': 'licensed_wireless',
      'mtnsi:MTNSA-Coverage-5G-5G': '5g',
      'mtnsi:MTNSA-Coverage-LTE': 'lte',
      'mtnsi:SUPERSONIC-CONSOLIDATED': 'fibre',
      'mtnsi:MTNSA-Coverage-UMTS-900': '3g_900',
      'mtnsi:MTNSA-Coverage-UMTS-2100': '3g_2100',
      'mtnsi:MTNSA-Coverage-GSM': '2g'
    };

    const serviceType = layerToServiceType[layer];
    return serviceType && serviceTypes.includes(serviceType);
  });
}

export const TEST_COORDINATES = {
  johannesburg: { lat: -26.2041, lng: 28.0473 },
  capeTown: { lat: -33.9249, lng: 18.4241 },
  durban: { lat: -29.8587, lng: 31.0218 },
  pretoria: { lat: -25.7479, lng: 28.2293 }
};

export const TEST_SERVICE_TYPES: ServiceType[] = [
  'fibre',
  'fixed_lte',
  'uncapped_wireless',
  'licensed_wireless',
  '5g',
  'lte',
  '3g_900',
  '3g_2100',
  '2g'
];