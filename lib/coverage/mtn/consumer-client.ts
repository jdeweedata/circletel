import { Coordinates, ServiceCoverage, ServiceType, SignalStrength } from '../types';
import { MTNWMSRealtimeClient, MTN_WMS_LAYERS } from './wms-realtime-client';

const CONSUMER_MOBILE_TYPES: ServiceType[] = ['lte', '5g'];

export interface ConsumerCoverageResult {
  available: boolean;
  services: ServiceCoverage[];
  checkedAt: string;
}

export class MTNConsumerClient {
  static async checkMobileCoverage(
    coordinates: Coordinates,
    serviceTypes?: ServiceType[]
  ): Promise<ConsumerCoverageResult> {
    const typesToCheck = serviceTypes
      ? serviceTypes.filter(t => CONSUMER_MOBILE_TYPES.includes(t))
      : CONSUMER_MOBILE_TYPES;

    if (typesToCheck.length === 0) {
      return {
        available: false,
        services: [],
        checkedAt: new Date().toISOString()
      };
    }

    const result = await MTNWMSRealtimeClient.checkCoverage(coordinates, typesToCheck);

    const services: ServiceCoverage[] = result.services.map(svc => ({
      type: svc.type,
      available: svc.available,
      signal: mapSignalStrength(svc.available, svc.layerData),
      provider: 'mtn',
      technology: svc.type === '5g' ? '5G' : 'LTE'
    }));

    return {
      available: services.some(s => s.available),
      services,
      checkedAt: new Date().toISOString()
    };
  }
}

function mapSignalStrength(available: boolean, layerData?: any): SignalStrength {
  if (!available) return 'none';
  return 'good';
}
