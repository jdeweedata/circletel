import { after, NextResponse } from "next/server";

import {
  cacheIdempotentLead,
  clientIpFromRequest,
  getCachedIdempotentLead,
  isHoneypotFilled,
  isIpLeadRequestAllowed,
  normalizeIdempotencyKey,
  recordIpLeadRequest,
} from "@/lib/cloudwifi/lead-abuse-guards";
import { buildCloudWifiLeadPayload } from "@/lib/cloudwifi/lead-payload";
import {
  cloudWifiSurveySchema,
  formatSurveyErrors,
} from "@/lib/cloudwifi/survey-schema";
import { apiLogger } from "@/lib/logging";
import { sendCoverageLeadAlert } from "@/lib/notifications/sales-alerts";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_BYTES = 32 * 1024;
const EMAIL_RATE_LIMIT_MAX = 5;
const EMAIL_RATE_LIMIT_WINDOW_MINUTES = 60;
const SELECTED_LEAD_COLUMNS =
  "id, customer_type, first_name, last_name, email, phone, company_name, address, city, postal_code, requested_service_type, lead_source, follow_up_notes";

const invalidJsonResponse = () =>
  NextResponse.json(
    { success: false, error: "Invalid JSON request body." },
    { status: 400 },
  );

const unsupportedMediaTypeResponse = () =>
  NextResponse.json(
    { success: false, error: "Content-Type must be application/json." },
    { status: 415 },
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

const rateLimitedResponse = () =>
  NextResponse.json(
    {
      success: false,
      error: "Too many requests. Please try again later.",
    },
    { status: 429, headers: { "Retry-After": "3600" } },
  );

function declaredBodyIsOversized(request: Request): boolean {
  const contentLength = request.headers.get("content-length");

  return contentLength !== null && /^\d+$/.test(contentLength.trim())
    ? Number(contentLength) > MAX_BODY_BYTES
    : false;
}

function hasJsonContentType(request: Request): boolean {
  const contentType = request.headers.get("content-type");
  const mediaType = contentType?.split(";", 1)[0].trim().toLowerCase();

  return mediaType === "application/json";
}

async function readBoundedBody(request: Request): Promise<string | null> {
  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let byteLength = 0;
  let bodyText = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      byteLength += value.byteLength;
      if (byteLength > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return null;
      }

      bodyText += decoder.decode(value, { stream: true });
    }

    return bodyText + decoder.decode();
  } catch {
    await reader.cancel().catch(() => undefined);
    throw new Error("request body could not be read");
  }
}

export async function POST(request: Request) {
  if (!hasJsonContentType(request)) {
    return unsupportedMediaTypeResponse();
  }

  if (declaredBodyIsOversized(request)) {
    return oversizedBodyResponse();
  }

  let bodyText: string;
  try {
    const boundedBody = await readBoundedBody(request);
    if (boundedBody === null) {
      return oversizedBodyResponse();
    }
    bodyText = boundedBody;
  } catch {
    return invalidJsonResponse();
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return invalidJsonResponse();
  }

  // Silent success for honeypot fills — do not teach bots the difference.
  if (isHoneypotFilled(body)) {
    return NextResponse.json(
      { success: true, leadId: "received" },
      { status: 201 },
    );
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

  // Consume IP budget only after the request is a well-formed survey (not on
  // invalid JSON, schema failures, or honeypot probes).
  const clientIp = clientIpFromRequest(request);
  if (!isIpLeadRequestAllowed(clientIp)) {
    apiLogger.error("CloudWiFi lead rate limited by IP", { ip: clientIp });
    return rateLimitedResponse();
  }
  recordIpLeadRequest(clientIp);

  const idempotencyKey = normalizeIdempotencyKey(
    request.headers.get("idempotency-key") ??
      request.headers.get("Idempotency-Key"),
  );
  if (idempotencyKey) {
    const cachedLeadId = getCachedIdempotentLead(idempotencyKey);
    if (cachedLeadId) {
      return NextResponse.json(
        { success: true, leadId: cachedLeadId },
        { status: 201 },
      );
    }
  }

  const leadPayload = buildCloudWifiLeadPayload(parsed.data, {
    receivedAt: new Date().toISOString(),
    ...(idempotencyKey ? { idempotencyKey } : {}),
  });

  try {
    const supabase = await createClient();

    const windowStart = new Date(
      Date.now() - EMAIL_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    ).toISOString();
    const { count: emailCount, error: emailCountError } = await supabase
      .from("coverage_leads")
      .select("id", { count: "exact", head: true })
      .eq("email", leadPayload.email)
      .eq("requested_service_type", "cloudwifi")
      .gte("created_at", windowStart);

    if (!emailCountError && (emailCount ?? 0) >= EMAIL_RATE_LIMIT_MAX) {
      apiLogger.error("CloudWiFi lead rate limited by email", {
        email: leadPayload.email,
      });
      return rateLimitedResponse();
    }

    const { data: lead, error } = await supabase
      .from("coverage_leads")
      .insert(leadPayload)
      .select(SELECTED_LEAD_COLUMNS)
      .single();

    if (error || !lead) {
      apiLogger.error("Failed to create CloudWiFi site survey lead", {
        error: error?.message ?? "insert returned no row",
      });
      return persistenceFailureResponse();
    }

    if (idempotencyKey) {
      cacheIdempotentLead(idempotencyKey, lead.id);
    }

    // Do not set coverage_available — no coverage check ran for this product
    // survey. The sales-alert helper treats missing as "Not assessed".
    const alertLead = {
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
      source_campaign: "cloudwifi_site_survey",
      follow_up_notes: lead.follow_up_notes || undefined,
    };

    after(async () => {
      try {
        const result = await sendCoverageLeadAlert(alertLead);
        if (!result.success) {
          apiLogger.error("CloudWiFi sales alert failed", {
            leadId: lead.id,
            errors: result.errors ?? [],
          });
        }
      } catch {
        apiLogger.error("CloudWiFi sales alert failed", {
          leadId: lead.id,
          error: "Sales alert request rejected",
        });
      }
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
