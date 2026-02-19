// Shared form data types for all design variants

export interface FormData {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  speedRequirement: '100' | '200' | '500' | '1000';
  contention: 'best-effort' | '10:1' | 'dia';
  budget: string;
  needFailover: boolean;
  sites: string;
}

export const defaultFormData: FormData = {
  companyName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  speedRequirement: '100',
  contention: '10:1',
  budget: '',
  needFailover: false,
  sites: ''
};

// Parse sites from textarea into array of trimmed, non-empty strings
export function parseSites(sitesText: string): string[] {
  return sitesText
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// Helper to detect if input is GPS coordinates
export function isGPSCoordinate(input: string): boolean {
  const gpsPattern = /^-?\d{1,3}\.?\d*[°]?\s*[,\s]\s*-?\d{1,3}\.?\d*[°]?$/;
  return gpsPattern.test(input.trim());
}

// Parse GPS coordinates from string
export function parseCoordinates(input: string): { lat: number; lng: number } | null {
  const cleaned = input.replace(/[°]/g, '').trim();
  const parts = cleaned.split(/[,\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

// Calculate form completion percentage for badges
export function getCompletionStatus(formData: FormData): {
  client: { complete: boolean; fields: number; total: number };
  requirements: { complete: boolean; selected: string[] };
  sites: { complete: boolean; count: number };
} {
  const clientFields = [
    formData.companyName,
    formData.contactName,
    formData.contactEmail,
    formData.contactPhone
  ].filter(Boolean).length;

  const sitesCount = parseSites(formData.sites).length;

  return {
    client: {
      complete: Boolean(formData.companyName),
      fields: clientFields,
      total: 4
    },
    requirements: {
      complete: Boolean(formData.speedRequirement && formData.contention),
      selected: [
        formData.speedRequirement ? `${formData.speedRequirement}Mbps` : '',
        formData.contention,
        formData.budget ? `R${formData.budget}` : '',
        formData.needFailover ? 'Failover' : ''
      ].filter(Boolean)
    },
    sites: {
      complete: sitesCount > 0,
      count: sitesCount
    }
  };
}
