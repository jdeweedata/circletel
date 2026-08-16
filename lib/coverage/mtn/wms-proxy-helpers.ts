export function parseWmsLayerList(layer: string): string[] {
  return layer
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

export function areWmsLayersAllowed(
  allowed: string[],
  layer: string
): boolean {
  const names = parseWmsLayerList(layer);
  if (names.length === 0) return false;
  return names.every((name) => allowed.includes(name));
}

export function wmsServiceUrl(endpoint: string): string {
  return endpoint.endsWith('/wms') ? endpoint : `${endpoint}/wms`;
}
