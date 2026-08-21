import { z } from "zod";

import { recommendCloudWifiTier } from "./tier-recommendation";
import type { CloudWifiSurveyRequest } from "./survey-schema";

type SurveyNetwork = CloudWifiSurveyRequest["details"]["networks"][number];
type SurveyAddOn = CloudWifiSurveyRequest["details"]["addOns"][number];

export interface CloudWifiLeadPayload {
  readonly customer_type: "smme";
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly phone: string;
  readonly company_name: string;
  readonly address: string;
  readonly city: string;
  readonly postal_code: string | null;
  readonly lead_source: "website_form";
  readonly requested_service_type: "cloudwifi";
  readonly contact_preference: "phone";
  readonly best_contact_time: CloudWifiSurveyRequest["contact"]["preferredContactTime"];
  readonly status: "new";
  readonly follow_up_notes: string;
  readonly requirements: {
    readonly venue_type: CloudWifiSurveyRequest["venue"]["venueType"];
    readonly floor_area_sqm: number;
    readonly peak_users: number;
    readonly backhaul: CloudWifiSurveyRequest["venue"]["backhaul"];
    readonly floors: number;
    readonly wall_material: CloudWifiSurveyRequest["details"]["wallMaterial"];
    readonly networks: readonly SurveyNetwork[];
    readonly add_ons: readonly SurveyAddOn[];
  };
  readonly metadata: {
    readonly page_source: "cloudwifi_product_page";
    readonly full_name: string;
    readonly recommended_tier: ReturnType<
      typeof recommendCloudWifiTier
    >["tier"];
    readonly recommendation_reasons: readonly string[];
    readonly backhaul_guidance: string | null;
    readonly consented_at: string;
    readonly client_consented_at: string;
    readonly requirements_text: string;
    readonly attribution: Readonly<{
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      referrer?: string;
    }>;
    readonly idempotency_key?: string;
  };
}

export interface CloudWifiLeadBuildContext {
  readonly receivedAt: string;
  /** Optional client-supplied key for retry-safe lead creation. */
  readonly idempotencyKey?: string;
}

const receivedAtSchema = z.string().max(64).datetime({ offset: true });

function validateReceivedAt(receivedAt: string): string {
  const result = receivedAtSchema.safeParse(receivedAt);
  if (!result.success) {
    throw new RangeError("Received timestamp must be a valid ISO datetime.");
  }

  return result.data;
}

export function buildCloudWifiLeadPayload(
  request: CloudWifiSurveyRequest,
  context: CloudWifiLeadBuildContext,
): CloudWifiLeadPayload {
  const receivedAt = validateReceivedAt(context.receivedAt);
  const recommendation = recommendCloudWifiTier({
    venueType: request.venue.venueType,
    floorArea: request.venue.floorArea,
    peakUsers: request.venue.peakUsers,
    backhaul: request.venue.backhaul,
  });
  const fullName = request.contact.fullName.trim();
  const [firstName, ...lastNameParts] = fullName.split(/\s+/);
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
  const venueSummary = [
    request.venue.venueType.replaceAll("_", " "),
    `${request.venue.floorArea} sqm`,
    `${request.venue.peakUsers} peak users`,
    `${request.venue.backhaul.replaceAll("_", " ")} backhaul`,
  ].join(", ");

  return {
    customer_type: "smme" as const,
    first_name: firstName,
    last_name: lastNameParts.join(" "),
    email: request.contact.email,
    phone: request.contact.phone,
    company_name: request.contact.companyName,
    address: request.venue.siteAddress,
    city: request.venue.city,
    postal_code: request.venue.postalCode || null,
    lead_source: "website_form" as const,
    requested_service_type: "cloudwifi" as const,
    contact_preference: "phone" as const,
    best_contact_time: request.contact.preferredContactTime,
    status: "new" as const,
    follow_up_notes: `CloudWiFi site survey requested. Recommended tier: ${recommendation.tierDetails.name}. Venue: ${venueSummary}.`,
    requirements: {
      venue_type: request.venue.venueType,
      floor_area_sqm: request.venue.floorArea,
      peak_users: request.venue.peakUsers,
      backhaul: request.venue.backhaul,
      floors: request.details.floors,
      wall_material: request.details.wallMaterial,
      networks: [...request.details.networks],
      add_ons: [...request.details.addOns],
    },
    metadata: {
      page_source: "cloudwifi_product_page" as const,
      full_name: fullName,
      recommended_tier: recommendation.tier,
      recommendation_reasons: [...recommendation.reasons],
      backhaul_guidance: recommendation.backhaulGuidance,
      consented_at: receivedAt,
      client_consented_at: request.contact.consentedAt,
      requirements_text: request.details.requirements,
      attribution,
      ...(context.idempotencyKey
        ? { idempotency_key: context.idempotencyKey }
        : {}),
    },
  };
}
