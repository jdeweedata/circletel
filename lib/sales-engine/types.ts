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
  // Sniper engine fields
  campaign_tag: string | null;
  campaign_tagged_at: string | null;
  arlan_routing: 'tarana_primary' | 'arlan_primary' | 'dual_funnel';
  seo_slug: string | null;
  demand_signal_count: number;
  vertical_composition: Record<string, number> | null;
  commercial_property_count: number;
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
  campaign_tag?: string;
  arlan_routing?: 'tarana_primary' | 'arlan_primary' | 'dual_funnel';
  seo_slug?: string;
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

// =============================================================================
// Zone Discovery Types
// =============================================================================

export type ZoneDiscoveryStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ZoneDiscoveryCandidate {
  id: string;
  ward_code: string;
  ward_name: string | null;
  municipality: string | null;
  province: string;
  center_lat: number;
  center_lng: number;
  // Scores
  demographic_fit_score: number;
  coverage_score: number;
  product_alignment_score: number;
  market_opportunity_score: number;
  composite_score: number;
  // Coverage infrastructure
  base_station_count: number;
  base_station_connections: number;
  dfa_connected_count: number;
  dfa_near_net_count: number;
  // POI composition
  business_poi_count: number;
  office_poi_count: number;
  healthcare_poi_count: number;
  // Demographics snapshot
  total_population: number;
  total_households: number;
  pct_no_internet: number;
  pct_income_above_r12800: number;
  // Suggestions
  suggested_zone_type: ZoneType;
  suggested_zone_name: string;
  eligible_products: string[];
  // Arlan opportunity (nationally available via LTE/5G)
  estimated_arlan_mrr: number;
  arlan_upsell_use_cases: string[];
  // Execution alignment
  milestone_month: number | null;
  milestone_target_products: string[];
  // Admin workflow
  status: ZoneDiscoveryStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_zone_id: string | null;
  rejection_reason: string | null;
  // Batch
  discovery_batch_id: string;
  // Sniper engine fields
  auto_decision: 'auto_approved_high' | 'auto_approved_passive' | 'rejected' | null;
  auto_decided_at: string | null;
  campaign_tag: string | null;
  arlan_only_zone: boolean;
  created_at: string;
  updated_at: string;
}

export interface ZoneDiscoveryParams {
  province?: string;
  min_fit_score?: number;
  limit?: number;
}

export interface ZoneDiscoveryResult {
  batch_id: string;
  candidates: ZoneDiscoveryCandidate[];
  total_wards_scanned: number;
  milestone_month: number | null;
  milestone_target_products: string[];
}

export interface ProductCoverageRequirement {
  product_name: string;
  needs_base_stations: boolean;
  needs_dfa: boolean;
  needs_office_pois: boolean;
  needs_healthcare_pois: boolean;
}

// =============================================================================
// Market Indicators Types
// =============================================================================

export interface ProvinceMarketContext {
  province: string;
  home_internet_pct: number | null;
  internet_access_pct: number | null;
  five_g_coverage_pct: number | null;
  employment_change: number | null;
  employment_trend: 'growing' | 'shrinking' | 'stable' | null;
  avg_hh_expenditure: number | null;
  electricity_access_pct: number | null;
  water_access_pct: number | null;
  sassa_recipients_m: number | null;
  ftth_homes_passed: number | null;
}

export interface NationalMarketContext {
  ftth_subscribers_m: number | null;
  broadband_coverage_pct: number | null;
  smartphone_penetration_pct: number | null;
  five_g_national_pct: number | null;
  internet_users_m: number | null;
  offline_population_m: number | null;
  prepaid_cost_per_gb: number | null;
  contract_cost_per_gb: number | null;
}

export interface MarketAdjustment {
  signal: string;
  adjustment: number;
  reason: string;
}

export interface MarketAlert {
  province: string;
  signal: string;
  detail: string;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

// =============================================================================
// Execution Plan Types
// =============================================================================

export type ExecutionPhase = 'bootstrap' | 'scale' | 'expand';
export type MilestoneStatus = 'upcoming' | 'active' | 'met' | 'at_risk' | 'missed';

export interface ExecutionMilestone {
  id: string;
  phase: ExecutionPhase;
  month_number: number;
  label: string;
  target_mrr: number;
  target_customers: number;
  target_products: string[];
  actual_mrr: number;
  actual_customers: number;
  msc_commitment: number;
  status: MilestoneStatus;
  hiring_trigger: string | null;
  notes: string | null;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface ExecutionSnapshot {
  current_phase: ExecutionPhase;
  current_month: number;
  total_mrr: number;
  target_mrr: number;
  mrr_gap: number;
  mrr_attainment_pct: number;
  total_customers: number;
  msc_current: number;
  msc_coverage_ratio: number;
  active_milestones: ExecutionMilestone[];
  next_milestone: ExecutionMilestone | null;
  hiring_triggers_met: string[];
  alerts: ExecutionAlert[];
  monthly_trend: Array<{
    month: number;
    target_mrr: number;
    actual_mrr: number;
  }>;
  // Arlan MRR breakdown (separate line item)
  arlan_mrr?: ArlanMRRSnapshot | null;
  connectivity_mrr?: number;  // CircleTel connectivity products only (total_mrr - arlan markup)
}

export type ExecutionAlertType = 'mrr_behind' | 'msc_risk' | 'phase_gate' | 'hiring_trigger' | 'product_gap';
export type ExecutionAlertSeverity = 'info' | 'warning' | 'critical';

export interface ExecutionAlert {
  type: ExecutionAlertType;
  severity: ExecutionAlertSeverity;
  message: string;
  recommendation: string;
}

// =============================================================================
// Product Wholesale Cost Types
// =============================================================================

export interface ProductWholesaleCost {
  id: string;
  product_name: string;
  service_package_id: string | null;
  wholesale_provider: string;
  wholesale_mrc: number;
  wholesale_nrc: number;
  retail_price: number;
  gross_margin_pct: number;
  notes: string | null;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export interface ProductMarginSummary {
  product_name: string;
  wholesale_provider: string;
  wholesale_mrc: number;
  retail_price: number;
  gross_margin_pct: number;
  monthly_contribution: number;
}

// =============================================================================
// Sales Engine Config Types
// =============================================================================

export interface SalesEngineConfig {
  id: string;
  config_key: string;
  config_value: Record<string, unknown>;
  updated_at: string;
  updated_by: string;
}

export interface DynamicScoringConfig {
  estimated_mrr: Record<string, number>;
  product_fit_scores: Record<string, number>;
  revenue_potential_scores: Record<string, number>;
  recommended_products: Record<string, string>;
  arlan_recommended_deals?: Record<string, string[]>;  // customer_type → deal_ids
}

// =============================================================================
// Arlan MRR Types
// =============================================================================

export interface ArlanMRRSnapshot {
  total_arlan_mrr: number;
  commission_mrr: number;
  markup_mrr: number;
  curated_deals_count: number;
  deals_by_use_case: Record<string, { count: number; avg_price: number; avg_markup: number }>;
  msc_commitment: number;
  msc_coverage_ratio: number;
  avg_monthly_commission_per_deal: number;
  avg_monthly_markup_per_deal: number;
  avg_total_revenue_per_deal: number;
  projected_mrr_10_deals: number;
  projected_mrr_50_deals: number;
}

export interface ArlanRevenueProjection {
  deal_count: number;
  monthly_commission: number;
  monthly_markup: number;
  total_monthly_mrr: number;
  annual_commission: number;
  annual_markup: number;
  total_annual: number;
  avg_contract_value: number;
  avg_circletel_commission_per_contract: number;
}

export interface ArlanUseCaseSummary {
  use_case: string;
  deal_count: number;
  avg_mtn_price: number;
  avg_selling_price: number;
  avg_markup_pct: number;
  avg_monthly_commission: number;
  avg_monthly_markup: number;
  avg_total_monthly_revenue: number;
  top_deals: Array<{ deal_id: string; device_name: string | null; price_plan: string; selling_price: number }>;
}

// =============================================================================
// Competitor Intelligence Types
// =============================================================================

export interface CompetitorPriceChange {
  provider_name: string;
  product_name: string;
  old_price: number;
  new_price: number;
  change_pct: number;
  direction: 'increase' | 'decrease';
  detected_at: string;
}

export interface CompetitivePosition {
  product_name: string;
  circletel_price: number;
  avg_competitor_price: number;
  position: 'below' | 'competitive' | 'above';
  gap_pct: number;
  competitors: Array<{
    name: string;
    price: number;
  }>;
}

export interface CompetitorIntelligenceSummary {
  price_changes_7d: CompetitorPriceChange[];
  zones_affected: Array<{
    zone_id: string;
    zone_name: string;
    competitor: string;
    change: string;
  }>;
  competitive_positions: CompetitivePosition[];
}
