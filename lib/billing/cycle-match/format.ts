/** Display ids for cycle-match worklists (SVC-xxxxx / EXC-nnnn). */

export function formatServiceDisplayId(serviceId: string): string {
  const hex = serviceId.replace(/-/g, '');
  return `SVC-${hex.slice(-5).toUpperCase()}`;
}

export function formatExceptionCode(sequence: number): string {
  return `EXC-${String(sequence).padStart(4, '0')}`;
}
