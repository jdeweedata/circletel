/**
 * Location Type Definitions
 * Used for coverage checks and order processing
 */

export type LocationType =
  | 'residential'
  | 'business'
  | 'estate'
  | 'complex'
  | 'office_park'
  | 'industrial'
  | 'retail'
  | 'farm'
  | 'rural'
  | 'other';

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  residential: 'Residential Home',
  business: 'Business Premises',
  estate: 'Gated Estate',
  complex: 'Apartment Complex',
  office_park: 'Office Park',
  industrial: 'Industrial Park',
  retail: 'Retail/Shopping Centre',
  farm: 'Farm/Smallholding',
  rural: 'Rural Area',
  other: 'Other',
};
