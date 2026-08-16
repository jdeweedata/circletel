export type PortalCoverageLayer = 'fixed_wireless' | '5g' | '4g' | 'all';

export type PortalWmsSpec = {
  source: 'business' | 'consumer';
  layer: string;
  style?: string;
};

export const PORTAL_COVERAGE_WMS: Record<
  Exclude<PortalCoverageLayer, 'all'>,
  PortalWmsSpec
> = {
  fixed_wireless: {
    source: 'consumer',
    layer: 'mtnsi:MTNSA-Coverage-Tarana',
    style: 'MTN-Coverage-UWA-EBU',
  },
  '5g': { source: 'consumer', layer: 'mtnsi:MTNSA-Coverage-5G-5G' },
  '4g': { source: 'consumer', layer: 'mtnsi:MTNSA-Coverage-LTE' },
};

export function portalWmsProxyPath(spec: PortalWmsSpec): string {
  const params = new URLSearchParams({
    configId: spec.source,
    layer: spec.layer,
    width: '256',
    height: '256',
    format: 'image/png',
    transparent: 'true',
  });
  if (spec.style) params.set('styles', spec.style);
  return `/api/coverage/mtn/wms-proxy?${params.toString()}&bbox={bbox}`;
}
