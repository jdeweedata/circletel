import { POST } from "@/app/api/leads/cloudwifi/route";
import { apiLogger } from "@/lib/logging";
import { sendCoverageLeadAlert } from "@/lib/notifications/sales-alerts";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/notifications/sales-alerts", () => ({
  sendCoverageLeadAlert: jest.fn(),
}));
jest.mock("@/lib/logging", () => ({
  apiLogger: {
    error: jest.fn(),
  },
}));

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockSendCoverageLeadAlert = sendCoverageLeadAlert as jest.MockedFunction<
  typeof sendCoverageLeadAlert
>;
const mockApiLogger = apiLogger as jest.Mocked<typeof apiLogger>;

const MAX_BODY_BYTES = 32 * 1024;
const SELECTED_LEAD_COLUMNS =
  "id, customer_type, first_name, last_name, email, phone, company_name, address, city, postal_code, requested_service_type, lead_source";

const validRequest = {
  venue: {
    venueType: "hospitality",
    floorArea: 450,
    peakUsers: 120,
    city: "Johannesburg",
    siteAddress: "10 Main Road, Sandton",
    postalCode: "2196",
    backhaul: "fibre",
  },
  details: {
    floors: 2,
    wallMaterial: "brick_concrete",
    networks: ["staff", "guest"],
    addOns: ["analytics"],
    requirements: "Separate point-of-sale traffic.",
  },
  contact: {
    fullName: "Naledi Mokoena",
    companyName: "Mokoena Hospitality",
    email: "naledi@example.co.za",
    phone: "082 123 4567",
    preferredContactTime: "morning",
    consent: true,
    consentedAt: "2025-01-01T00:00:00.000Z",
  },
  attribution: {
    pageSource: "cloudwifi_product_page",
    utmSource: "paid-search",
  },
};

const persistedLead = {
  id: "lead-cloudwifi-1",
  customer_type: "smme" as const,
  first_name: "Naledi",
  last_name: "Mokoena",
  email: "naledi@example.co.za",
  phone: "+27821234567",
  company_name: "Mokoena Hospitality",
  address: "10 Main Road, Sandton",
  city: "Johannesburg",
  postal_code: "2196",
  requested_service_type: "cloudwifi",
  lead_source: "website_form",
};

type InsertResult = {
  data: typeof persistedLead | null;
  error: { message: string } | null;
};

let from: jest.Mock;
let insert: jest.Mock;
let select: jest.Mock;
let insertSingle: jest.Mock<Promise<InsertResult>>;

function makeRequest(
  body: string = JSON.stringify(validRequest),
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/leads/cloudwifi", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

function expectNoPersistence(): void {
  expect(mockCreateClient).not.toHaveBeenCalled();
  expect(from).not.toHaveBeenCalled();
  expect(insert).not.toHaveBeenCalled();
  expect(mockSendCoverageLeadAlert).not.toHaveBeenCalled();
}

describe("POST /api/leads/cloudwifi", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-14T10:30:00.000Z"));

    insertSingle = jest.fn().mockResolvedValue({
      data: persistedLead,
      error: null,
    });
    select = jest.fn().mockReturnValue({ single: insertSingle });
    insert = jest.fn().mockReturnValue({ select });
    from = jest.fn().mockReturnValue({ insert });
    mockCreateClient.mockResolvedValue({ from } as never);
    mockSendCoverageLeadAlert.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns a bounded 400 response for malformed JSON", async () => {
    const response = await POST(makeRequest('{"venue":'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      error: "Invalid JSON request body.",
    });
    expectNoPersistence();
    expect(JSON.stringify(body).length).toBeLessThan(256);
  });

  it("returns field errors without touching persistence for invalid input", async () => {
    const response = await POST(
      makeRequest(
        JSON.stringify({
          ...validRequest,
          contact: { ...validRequest.contact, email: "not-an-email" },
        }),
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Check the highlighted fields.",
      fields: [
        { field: "contact.email", message: "Enter a valid email address." },
      ],
    });
    expectNoPersistence();
  });

  it("rejects a declared oversized body before reading it", async () => {
    const request = makeRequest(JSON.stringify(validRequest), {
      "content-length": String(MAX_BODY_BYTES + 1),
    });
    const textSpy = jest.spyOn(request, "text");

    const response = await POST(request);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Request body is too large.",
    });
    expect(textSpy).not.toHaveBeenCalled();
    expectNoPersistence();
  });

  it("rejects an actual oversized body without a content-length header", async () => {
    const response = await POST(makeRequest("x".repeat(MAX_BODY_BYTES + 1)));

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Request body is too large.",
    });
    expectNoPersistence();
  });

  it("measures UTF-8 bytes rather than JavaScript string length", async () => {
    const body = "😀".repeat(MAX_BODY_BYTES / 2);
    expect(body.length).toBe(MAX_BODY_BYTES);
    expect(new TextEncoder().encode(body).byteLength).toBeGreaterThan(
      MAX_BODY_BYTES,
    );

    const response = await POST(makeRequest(body));

    expect(response.status).toBe(413);
    expectNoPersistence();
  });

  it("does not trust a spoofed-small content-length header", async () => {
    const response = await POST(
      makeRequest("x".repeat(MAX_BODY_BYTES + 1), { "content-length": "10" }),
    );

    expect(response.status).toBe(413);
    expectNoPersistence();
  });

  it("persists exactly one validated lead with a server timestamp", async () => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      leadId: "lead-cloudwifi-1",
    });
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("coverage_leads");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_source: "website_form",
        requested_service_type: "cloudwifi",
        metadata: expect.objectContaining({
          consented_at: "2026-07-14T10:30:00.000Z",
          client_consented_at: "2025-01-01T00:00:00.000Z",
        }),
      }),
    );
    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith(SELECTED_LEAD_COLUMNS);
    expect(insertSingle).toHaveBeenCalledTimes(1);
  });

  it("alerts sales using only the returned persisted lead row", async () => {
    await POST(makeRequest());

    expect(mockSendCoverageLeadAlert).toHaveBeenCalledTimes(1);
    expect(mockSendCoverageLeadAlert).toHaveBeenCalledWith({
      ...persistedLead,
      company_name: "Mokoena Hospitality",
      city: "Johannesburg",
      postal_code: "2196",
      requested_service_type: "cloudwifi",
    });
  });

  it("returns a bounded 500 response and does not alert when insertion fails", async () => {
    insertSingle.mockResolvedValue({
      data: null,
      error: { message: "database unavailable" },
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "We could not save your request. Please try again.",
    });
    expect(mockSendCoverageLeadAlert).not.toHaveBeenCalled();
    expect(mockApiLogger.error).toHaveBeenCalledWith(
      "Failed to create CloudWiFi site survey lead",
      { error: "database unavailable" },
    );
  });

  it("treats a missing inserted lead as a persistence failure", async () => {
    insertSingle.mockResolvedValue({ data: null, error: null });

    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
    expect(mockSendCoverageLeadAlert).not.toHaveBeenCalled();
  });

  it("keeps the persisted lead successful when the alert rejects", async () => {
    mockSendCoverageLeadAlert.mockRejectedValue(
      new Error("notification offline"),
    );

    const response = await POST(makeRequest());
    await Promise.resolve();

    expect(response.status).toBe(201);
    expect(mockApiLogger.error).toHaveBeenCalledWith(
      "CloudWiFi sales alert failed",
      { leadId: "lead-cloudwifi-1", error: "notification offline" },
    );
  });
});
