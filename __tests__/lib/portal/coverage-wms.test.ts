import { MTN_CONFIGS } from '@/lib/coverage/mtn/types';
import {
  PORTAL_COVERAGE_WMS,
  portalWmsProxyPath,
} from '@/lib/portal/coverage-wms';

describe('consumer WMS allowlist', () => {
  it('includes the Tarana GeoServer layer used for Unjani fixed wireless', () => {
    expect(Object.values(MTN_CONFIGS.consumer.layers)).toContain(
      'mtnsi:MTNSA-Coverage-Tarana'
    );
    expect(MTN_CONFIGS.consumer.queryLayers).toContain(
      'mtnsi:MTNSA-Coverage-Tarana'
    );
  });
});

describe('PORTAL_COVERAGE_WMS', () => {
  it('paints fixed wireless from the consumer Tarana layer', () => {
    expect(PORTAL_COVERAGE_WMS.fixed_wireless).toEqual({
      source: 'consumer',
      layer: 'mtnsi:MTNSA-Coverage-Tarana',
      style: 'MTN-Coverage-UWA-EBU',
    });
  });

  it('keeps 5G and 4G on the consumer GeoServer layers that already render', () => {
    expect(PORTAL_COVERAGE_WMS['5g']).toEqual({
      source: 'consumer',
      layer: 'mtnsi:MTNSA-Coverage-5G-5G',
    });
    expect(PORTAL_COVERAGE_WMS['4g']).toEqual({
      source: 'consumer',
      layer: 'mtnsi:MTNSA-Coverage-LTE',
    });
  });

  it('passes the Tarana style on the proxy URL and leaves 5G without a style', () => {
    expect(portalWmsProxyPath(PORTAL_COVERAGE_WMS.fixed_wireless)).toContain(
      'styles=MTN-Coverage-UWA-EBU'
    );
    expect(portalWmsProxyPath(PORTAL_COVERAGE_WMS['5g'])).not.toContain(
      'styles='
    );
  });
});
