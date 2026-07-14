import { recommendCloudWifiTier } from './tier-recommendation';
import type { CloudWifiSurveyRequest } from './survey-schema';

export function buildCloudWifiLeadPayload(request: CloudWifiSurveyRequest) {
  const recommendation = recommendCloudWifiTier({
    venueType: request.venue.venueType,
    floorArea: request.venue.floorArea,
    peakUsers: request.venue.peakUsers,
    backhaul: request.venue.backhaul,
  });
  const [firstName, ...lastNameParts] = request.contact.fullName.split(/\s+/);
  const attribution = {
    ...(request.attribution.utmSource
      ? { utm_source: request.attribution.utmSource }
      : {}),
    ...(request.attribution.utmMedium
      ? { utm_medium: request.attribution.utmMedium }
      : {}),
    ...(request.attribution.utmCampaign
      ? { utm_campaign: request.attribution.utmCampaign }
      : {}),
    ...(request.attribution.referrer
      ? { referrer: request.attribution.referrer }
      : {}),
  };

  return {
    customer_type: 'smme' as const,
    first_name: firstName,
    last_name: lastNameParts.join(' '),
    email: request.contact.email,
    phone: request.contact.phone,
    company_name: request.contact.companyName,
    address: request.venue.siteAddress,
    city: request.venue.city,
    postal_code: request.venue.postalCode || null,
    lead_source: 'website_form' as const,
    requested_service_type: 'cloudwifi' as const,
    contact_preference: 'phone' as const,
    best_contact_time: request.contact.preferredContactTime,
    status: 'new' as const,
    follow_up_notes:
      `CloudWiFi site survey requested. Recommended tier: ${recommendation.tierDetails.name}.`,
    requirements: {
      venue_type: request.venue.venueType,
      floor_area_sqm: request.venue.floorArea,
      peak_users: request.venue.peakUsers,
      backhaul: request.venue.backhaul,
      floors: request.details.floors,
      wall_material: request.details.wallMaterial,
      networks: request.details.networks,
      add_ons: request.details.addOns,
    },
    metadata: {
      page_source: 'cloudwifi_product_page' as const,
      recommended_tier: recommendation.tier,
      recommendation_reasons: recommendation.reasons,
      backhaul_guidance: recommendation.backhaulGuidance,
      consented_at: request.contact.consentedAt,
      requirements_text: request.details.requirements,
      attribution,
    },
  };
}
