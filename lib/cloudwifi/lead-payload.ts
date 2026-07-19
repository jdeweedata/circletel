import { z } from "zod";

import { recommendCloudWifiTier } from "./tier-recommendation";
import type { CloudWifiSurveyRequest } from "./survey-schema";

type SurveyNetwork = CloudWifiSurveyRequest["details"]["networks"][number];
type SurveyAddOn = CloudWifiSurveyRequest["details"]["addOns"][number];
type CloudWifiTierId = ReturnType<typeof recommendCloudWifiTier>["tier"];

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
    readonly recommended_tier: CloudWifiTierId | null;
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

const CONTACT_TIME_LABELS: Record<
  CloudWifiSurveyRequest["contact"]["preferredContactTime"],
  string
> = {
  morning: "morning",
  afternoon: "afternoon",
  anytime: "any time",
};

function tryRecommend(request: CloudWifiSurveyRequest) {
  try {
    return recommendCloudWifiTier({
      venueType: request.venue.venueType,
      floorArea: request.venue.floorArea,
      peakUsers: request.venue.peakUsers,
      backhaul: request.venue.backhaul,
    });
  } catch {
    return null;
  }
}

export function buildCloudWifiLeadPayload(
  request: CloudWifiSurveyRequest,
  context: CloudWifiLeadBuildContext,
): CloudWifiLeadPayload {
  const receivedAt = validateReceivedAt(context.receivedAt);
  const recommendation = tryRecommend(request);
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

  const venueTypeLabel = request.venue.venueType.replaceAll("_", " ");
  const contactTime =
    CONTACT_TIME_LABELS[request.contact.preferredContactTime] ??
    request.contact.preferredContactTime;
  const notes = request.details.requirements.trim();
  const noteClause = notes ? ` Notes: ${notes}` : "";
  const tierClause = recommendation
    ? ` Estimator hint: ${recommendation.tierDetails.name}.`
    : "";

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
    follow_up_notes: `CloudWiFi site survey requested. Preferred contact: ${contactTime}. Venue: ${venueTypeLabel} in ${request.venue.city}.${tierClause}${noteClause}`,
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
      recommended_tier: recommendation?.tier ?? null,
      recommendation_reasons: recommendation
        ? [...recommendation.reasons]
        : [],
      backhaul_guidance: recommendation?.backhaulGuidance ?? null,
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
