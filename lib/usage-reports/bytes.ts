const BYTES_PER_GB = 1_000_000_000;
const BYTES_PER_MB = 1_000_000;

export function bytesToGb(bytes: number): number {
  return bytes / BYTES_PER_GB;
}

export function formatBytesAsGb(bytes: number, fractionDigits = 2): string {
  return `${bytesToGb(bytes).toLocaleString('en-ZA', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })} GB`;
}

export function formatBytesAsMb(bytes: number, fractionDigits = 1): string {
  return `${(bytes / BYTES_PER_MB).toLocaleString('en-ZA', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })} MB`;
}
