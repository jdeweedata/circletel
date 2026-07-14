import { NextResponse } from "next/server";

import { buildCloudWifiLeadPayload } from "@/lib/cloudwifi/lead-payload";
import {
  cloudWifiSurveySchema,
  formatSurveyErrors,
} from "@/lib/cloudwifi/survey-schema";
import { apiLogger } from "@/lib/logging";
import { sendCoverageLeadAlert } from "@/lib/notifications/sales-alerts";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_BYTES = 32 * 1024;
const SELECTED_LEAD_COLUMNS =
  "id, customer_type, first_name, last_name, email, phone, company_name, address, city, postal_code, requested_service_type, lead_source";

const invalidJsonResponse = () =>
  NextResponse.json(
    { success: false, error: "Invalid JSON request body." },
    { status: 400 },
  );

const oversizedBodyResponse = () =>
  NextResponse.json(
    { success: false, error: "Request body is too large." },
    { status: 413 },
  );

const persistenceFailureResponse = () =>
  NextResponse.json(
    {
      success: false,
      error: "We could not save your request. Please try again.",
    },
    { status: 500 },
  );

function declaredBodyIsOversized(request: Request): boolean {
  const contentLength = request.headers.get("content-length");

  return contentLength !== null && /^\d+$/.test(contentLength.trim())
    ? Number(contentLength) > MAX_BODY_BYTES
    : false;
}

export async function POST(request: Request) {
  if (declaredBodyIsOversized(request)) {
    return oversizedBodyResponse();
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return invalidJsonResponse();
  }

  if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
    return oversizedBodyResponse();
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return invalidJsonResponse();
  }

  const parsed = cloudWifiSurveySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Check the highlighted fields.",
        fields: formatSurveyErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  const leadPayload = buildCloudWifiLeadPayload(parsed.data, {
    receivedAt: new Date().toISOString(),
  });

  try {
    const supabase = await createClient();
    const { data: lead, error } = await supabase
      .from("coverage_leads")
      .insert(leadPayload)
      .select(SELECTED_LEAD_COLUMNS)
      .single();

    if (error || !lead) {
      apiLogger.error("Failed to create CloudWiFi site survey lead", {
        error: error?.message,
      });
      return persistenceFailureResponse();
    }

    void sendCoverageLeadAlert({
      id: lead.id,
      customer_type: lead.customer_type,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      company_name: lead.company_name || undefined,
      address: lead.address,
      city: lead.city || undefined,
      postal_code: lead.postal_code || undefined,
      requested_service_type: lead.requested_service_type || "cloudwifi",
      lead_source: lead.lead_source,
    }).catch((alertError: unknown) => {
      apiLogger.error("CloudWiFi sales alert failed", {
        leadId: lead.id,
        error:
          alertError instanceof Error ? alertError.message : String(alertError),
      });
    });

    return NextResponse.json(
      { success: true, leadId: lead.id },
      { status: 201 },
    );
  } catch (error) {
    apiLogger.error("Failed to create CloudWiFi site survey lead", {
      error: error instanceof Error ? error.message : String(error),
    });
    return persistenceFailureResponse();
  }
}
