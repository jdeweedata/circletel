/**
 * Sales Engine Types
 * Shared types for the data-driven sales strategy system
 */

// =============================================================================
// Zone Types (Layer 1)
// =============================================================================

export type ZoneType = 'office_park' | 'commercial_strip' | 'clinic_cluster' | 'residential_estate' | 'mixed';
export type ZoneStatus = 'active' | 'parked' | 'saturated';
export type ZonePriority = 'high' | 'medium' | 'low';
export type CoverageConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

export interface SalesZone {
  id: string;
  name: string;
  zone_type: ZoneType;
  description: string | null;
  center_lat: number;
  center_lng: number;
  boundary?: unknown; // PostGIS GEOGRAPHY
  sme_density_score: number;
  penetration_rate: number;
  competitor_weakness_score: number;
  serviceable_addresses: number;
  active_customers: number;
  zone_score: number; // Computed column
  status: ZoneStatus;
  priority: ZonePriority;
  province: string;
  suburb: string | null;
  notes: string | null;
  // Coverage enrichment fields
  base_station_count: number;
  base_station_connections: number;
  dfa_connected_count: number;
  dfa_near_net_count: number;
  coverage_confidence: CoverageConfidenceLevel | null;
  coverage_enriched_at: string | null;
  radius_km: number;
  coverage_score: number;
  enriched_zone_score: number;
  // Demographic enrichment fields
  demographic_fit_score: number;
  business_poi_density: number;
  pct_no_internet: number;
  pct_income_target: number;
  propensity_score: number;
  demographic_enriched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateZoneInput {
  name: string;
  zone_type: ZoneType;
  description?: string;
  center_lat: number;
  center_lng: number;
  sme_density_score?: number;
  penetration_rate?: number;
  competitor_weakness_score?: number;
  serviceable_addresses?: number;
  active_customers?: number;
  status?: ZoneStatus;
  priority?: ZonePriority;
  province?: string;
  suburb?: string;
  notes?: string;
}

export interface UpdateZoneInput extends Partial<CreateZoneInput> {
  id: string;
}

// =============================================================================
// Lead Scoring Types (Layer 2)
// =============================================================================

export type OutreachTrack = 'office_park' | 'sme_strip' | 'clinic' | 'referral' | 'residential';

export interface LeadScore {
  id: string;
  coverage_lead_id: string;
  zone_id: string | null;
  product_fit_score: number;
  revenue_potential_score: number;
  competitive_vuln_score: number;
  conversion_speed_score: number;
  composite_score: number; // Computed column
  recommended_product: string | null;
  recommended_track: OutreachTrack | null;
  estimated_mrr: number | null;
  competitor_identified: string | null;
  scoring_date: string;
  scored_by: string;
  // Coverage enrichment fields
  nearest_base_station_km: number | null;
  skyfibre_confidence: CoverageConfidenceLevel | null;
  nearest_dfa_building_km: number | null;
  dfa_coverage_type: 'connected' | 'near-net' | 'none' | null;
  coverage_product_eligible: string[] | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  coverage_lead?: CoverageLeadBasic;
}

export interface ScoreLeadInput {
  coverage_lead_id: string;
  zone_id?: string;
  product_fit_score: number;
  revenue_potential_score: number;
  competitive_vuln_score: number;
  conversion_speed_score: number;
  recommended_product?: string;
  recommended_track?: OutreachTrack;
  estimated_mrr?: number;
  competitor_identified?: string;
  scored_by?: string;
}

export interface CoverageLeadBasic {
  id: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  customer_type?: string;
  company_name?: string;
  phone?: string;
  created_at: string;
}

// =============================================================================
// Pipeline Types (Layers 3-4)
// =============================================================================

export type PipelineStage =
  | 'coverage_confirmed'
  | 'contact_made'
  | 'site_survey_booked'
  | 'quote_sent'
  | 'objection_stage'
  | 'contract_signed'
  | 'installed_active';

export type ContactMethod = 'linkedin' | 'whatsapp' | 'walk_in' | 'referral' | 'phone' | 'email';
export type ContractType = 'month_to_month' | '12_month' | '24_month' | '36_month';
export type ObjectionCategory = 'price' | 'competitor_lock_in' | 'trust' | 'need_to_think' | 'technical' | 'budget' | 'timing' | 'none';
export type PipelineOutcome = 'open' | 'won' | 'lost' | 'parked';

export interface PipelineEntry {
  id: string;
  coverage_lead_id: string;
  zone_id: string | null;
  lead_score_id: string | null;
  stage: PipelineStage;
  stage_entered_at: string;
  day_target: number | null;
  contact_method: ContactMethod | null;
  decision_maker_confirmed: boolean;
  quote_mrr: number | null;
  product_tier: string | null;
  contract_type: ContractType | null;
  objection_category: ObjectionCategory | null;
  outcome: PipelineOutcome;
  loss_reason: string | null;
  loss_competitor: string | null;
  zoho_deal_id: string | null;
  zoho_synced: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  coverage_lead?: CoverageLeadBasic;
  lead_score?: LeadScore;
  zone?: SalesZone;
}

export interface CreatePipelineInput {
  coverage_lead_id: string;
  zone_id?: string;
  lead_score_id?: string;
  stage?: PipelineStage;
  contact_method?: ContactMethod;
  day_target?: number;
}

export interface AdvanceStageInput {
  id: string;
  stage: PipelineStage;
  contact_method?: ContactMethod;
  decision_maker_confirmed?: boolean;
  quote_mrr?: number;
  product_tier?: string;
  contract_type?: ContractType;
  objection_category?: ObjectionCategory;
  outcome?: PipelineOutcome;
  loss_reason?: string;
  loss_competitor?: string;
}

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  'coverage_confirmed',
  'contact_made',
  'site_survey_booked',
  'quote_sent',
  'objection_stage',
  'contract_signed',
  'installed_active',
];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  coverage_confirmed: 'Coverage Confirmed',
  contact_made: 'Contact Made',
  site_survey_booked: 'Site Survey Booked',
  quote_sent: 'Quote Sent',
  objection_stage: 'Objection Stage',
  contract_signed: 'Contract Signed',
  installed_active: 'Installed & Active',
};

export const PIPELINE_STAGE_DAY_TARGETS: Record<PipelineStage, number> = {
  coverage_confirmed: 0,
  contact_made: 1,
  site_survey_booked: 3,
  quote_sent: 4,
  objection_stage: 5,
  contract_signed: 6,
  installed_active: 7,
};

// =============================================================================
// Scorecard Types (Layer 5)
// =============================================================================

export type ConversionTrend = 'improving' | 'stable' | 'declining';
export type RecommendedAction = 'increase_effort' | 'change_message' | 'park_zone' | 'maintain';

export interface ZoneMetric {
  id: string;
  zone_id: string;
  week_start: string;
  serviceable_addresses: number;
  active_customers: number;
  penetration_rate: number;
  addresses_canvassed: number;
  leads_generated: number;
  coverage_to_lead_rate: number;
  qualified_leads: number;
  closed_deals: number;
  lead_to_close_rate: number;
  new_mrr_added: number;
  total_zone_mrr: number;
  cost_per_activation: number;
  avg_arpu: number;
  active_rns: number;
  linkedin_contacts: number;
  whatsapp_contacts: number;
  walk_ins: number;
  referrals_generated: number;
  conversion_rate_trend: ConversionTrend | null;
  recommended_action: RecommendedAction | null;
  created_at: string;
  // Joined fields
  zone?: SalesZone;
}

export interface RecordMetricsInput {
  zone_id: string;
  week_start: string;
  serviceable_addresses?: number;
  active_customers?: number;
  addresses_canvassed?: number;
  leads_generated?: number;
  qualified_leads?: number;
  closed_deals?: number;
  new_mrr_added?: number;
  total_zone_mrr?: number;
  cost_per_activation?: number;
  active_rns?: number;
  linkedin_contacts?: number;
  whatsapp_contacts?: number;
  walk_ins?: number;
  referrals_generated?: number;
}

// =============================================================================
// MSC Types
// =============================================================================

export type MSCStatus = 'upcoming' | 'active' | 'met' | 'at_risk' | 'missed';

export interface MSCPeriod {
  id: string;
  period_label: string;
  period_start: string;
  period_end: string;
  msc_amount: number;
  required_rns: number;
  actual_rns: number;
  actual_spend: number;
  status: MSCStatus;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Dashboard Summary Types
// =============================================================================

export interface SalesEngineSummary {
  total_zones: number;
  active_zones: number;
  total_leads_scored: number;
  avg_lead_score: number;
  pipeline_open: number;
  pipeline_won: number;
  pipeline_lost: number;
  total_pipeline_mrr: number;
  overall_penetration_rate: number;
  total_active_rns: number;
  msc_current: MSCPeriod | null;
}

export interface ZoneScorecardRow {
  zone: SalesZone;
  metrics: ZoneMetric | null;
  pipeline_count: number;
  won_count: number;
  lost_count: number;
}

export interface PipelineStageSummary {
  stage: PipelineStage;
  label: string;
  count: number;
  total_mrr: number;
}

// =============================================================================
// Coverage Enrichment Types
// =============================================================================

export interface ZoneCoverageEnrichment {
  zone_id: string;
  base_station_count: number;
  base_station_connections: number;
  dfa_connected_count: number;
  dfa_near_net_count: number;
  coverage_confidence: CoverageConfidenceLevel;
  coverage_score: number;
  enriched_zone_score: number;
}

export interface LeadCoverageEnrichment {
  lead_score_id: string;
  nearest_base_station_km: number | null;
  skyfibre_confidence: CoverageConfidenceLevel;
  nearest_dfa_building_km: number | null;
  dfa_coverage_type: 'connected' | 'near-net' | 'none';
  coverage_product_eligible: string[];
  recommended_product: string;
}

export interface CoverageGapAnalysis {
  investment_needed: Array<{
    zone: SalesZone;
    lead_count: number;
    coverage_confidence: CoverageConfidenceLevel | null;
  }>;
  untapped_opportunity: Array<{
    zone: SalesZone;
    base_station_count: number;
    dfa_count: number;
  }>;
  coverage_summary: {
    high: number;
    medium: number;
    low: number;
    none: number;
    not_enriched: number;
  };
}

// =============================================================================
// Ward Demographic Types
// =============================================================================

export interface WardDemographic {
  id: string;
  ward_code: string;
  ward_name: string | null;
  municipality: string | null;
  province: string;
  boundary?: unknown; // PostGIS GEOGRAPHY(MULTIPOLYGON, 4326)
  centroid_lat: number | null;
  centroid_lng: number | null;
  total_population: number;
  total_households: number;
  pct_income_above_r12800: number;
  pct_income_r6400_12800: number;
  pct_no_internet: number;
  pct_cellphone_internet: number;
  pct_fixed_internet: number;
  pct_employed: number;
  pct_formal_dwelling: number;
  business_poi_count: number;
  office_poi_count: number;
  healthcare_poi_count: number;
  demographic_fit_score: number;
  data_source: string;
  imported_at: string;
  updated_at: string;
}

export interface WardDemographicImportRow {
  ward_code: string;
  ward_name?: string;
  municipality?: string;
  province: string;
  centroid_lat?: number;
  centroid_lng?: number;
  total_population?: number;
  total_households?: number;
  pct_income_above_r12800?: number;
  pct_income_r6400_12800?: number;
  pct_no_internet?: number;
  pct_cellphone_internet?: number;
  pct_fixed_internet?: number;
  pct_employed?: number;
  pct_formal_dwelling?: number;
}

export interface ZoneDemographicEnrichment {
  zone_id: string;
  demographic_fit_score: number;
  business_poi_density: number;
  pct_no_internet: number;
  pct_income_target: number;
  propensity_score: number;
  ward_count: number;
  total_population: number;
}

export interface DemographicsInRadius {
  ward_count: number;
  total_population: number;
  total_households: number;
  avg_pct_no_internet: number;
  avg_pct_cellphone_internet: number;
  avg_pct_fixed_internet: number;
  avg_pct_income_above_r12800: number;
  avg_pct_income_r6400_12800: number;
  avg_pct_employed: number;
  avg_pct_formal_dwelling: number;
  total_business_pois: number;
  total_office_pois: number;
  total_healthcare_pois: number;
  avg_demographic_fit_score: number;
}

export interface ZoneSuggestion {
  ward_code: string;
  ward_name: string | null;
  municipality: string | null;
  province: string;
  centroid_lat: number;
  centroid_lng: number;
  demographic_fit_score: number;
  pct_no_internet: number;
  pct_income_above_r12800: number;
  total_population: number;
  total_households: number;
  business_poi_count: number;
  nearby_base_stations: number;
}
