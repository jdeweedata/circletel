import { POST } from "@/app/api/leads/cloudwifi/route";
import { apiLogger } from "@/lib/logging";
import { sendCoverageLeadAlert } from "@/lib/notifications/sales-alerts";
import { createClient } from "@/lib/supabase/server";
import { after } from "next/server";

jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  after: jest.fn(),
}));
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
const mockAfter = after as jest.MockedFunction<typeof after>;

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
  id: "persisted-cloudwifi-9",
  customer_type: "smme" as const,
  first_name: "Returned",
  last_name: "Record",
  email: "persisted@example.net",
  phone: "+27820000000",
  company_name: "Persisted Venue",
  address: "99 Saved Street",
  city: "Cape Town",
  postal_code: "8001",
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
let afterCallbacks: Array<() => unknown>;

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

function makeStreamRequest(
  chunks: Uint8Array[],
  {
    contentType = "application/json",
    onPull,
    onCancel,
  }: {
    contentType?: string | null;
    onPull?: () => void;
    onCancel?: () => void;
  } = {},
): Request {
  let chunkIndex = 0;
  const stream = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        onPull?.();
        const chunk = chunks[chunkIndex++];
        if (chunk) {
          controller.enqueue(chunk);
        } else {
          controller.close();
        }
      },
      cancel() {
        onCancel?.();
      },
    },
    { highWaterMark: 0 },
  );
  const headers = contentType === null ? {} : { "content-type": contentType };

  return new Request("http://localhost/api/leads/cloudwifi", {
    method: "POST",
    headers,
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

async function runAfterCallbacks(): Promise<void> {
  for (const callback of afterCallbacks) {
    await callback();
  }
}

function expectNoPersistence(): void {
  expect(mockCreateClient).not.toHaveBeenCalled();
  expect(from).not.toHaveBeenCalled();
  expect(insert).not.toHaveBeenCalled();
  expect(mockSendCoverageLeadAlert).not.toHaveBeenCalled();
  expect(mockAfter).not.toHaveBeenCalled();
}

describe("POST /api/leads/cloudwifi", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-14T10:30:00.000Z"));
    afterCallbacks = [];
    mockAfter.mockImplementation((task) => {
      if (typeof task !== "function") {
        throw new TypeError("Expected after() to receive a callback.");
      }
      afterCallbacks.push(task);
    });

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

  it.each([null, "text/plain", "application/ld+json"])(
    "returns a bounded 415 response for unsupported content type %p",
    async (contentType) => {
      const body = new TextEncoder().encode(JSON.stringify(validRequest));
      const response = await POST(makeStreamRequest([body], { contentType }));

      expect(response.status).toBe(415);
      await expect(response.json()).resolves.toEqual({
        success: false,
        error: "Content-Type must be application/json.",
      });
      expectNoPersistence();
    },
  );

  it("rejects a declared oversized body before reading it", async () => {
    const request = makeRequest(JSON.stringify(validRequest), {
      "content-length": String(MAX_BODY_BYTES + 1),
    });
    const getReaderSpy = jest.spyOn(request.body!, "getReader");

    const response = await POST(request);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Request body is too large.",
    });
    expect(getReaderSpy).not.toHaveBeenCalled();
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

  it("cancels a multi-chunk stream immediately after crossing the byte limit", async () => {
    const onPull = jest.fn();
    const onCancel = jest.fn();
    const response = await POST(
      makeStreamRequest(
        [
          new Uint8Array(20 * 1024),
          new Uint8Array(13 * 1024),
          new Uint8Array(8 * 1024),
        ],
        { onPull, onCancel },
      ),
    );

    expect(response.status).toBe(413);
    expect(onPull).toHaveBeenCalledTimes(2);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expectNoPersistence();
  });

  it("decodes valid JSON when a multi-byte character straddles chunks", async () => {
    const requirements = "Lobby 😀 coverage";
    const json = JSON.stringify({
      ...validRequest,
      details: { ...validRequest.details, requirements },
    });
    const emojiByteIndex = new TextEncoder().encode(
      json.slice(0, json.indexOf("😀")),
    ).byteLength;
    const encoded = new TextEncoder().encode(json);

    const response = await POST(
      makeStreamRequest(
        [
          encoded.slice(0, emojiByteIndex + 2),
          encoded.slice(emojiByteIndex + 2),
        ],
        { contentType: "Application/JSON; Charset=UTF-8" },
      ),
    );

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ requirements_text: requirements }),
      }),
    );
  });

  it("persists exactly one validated lead with a server timestamp", async () => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      leadId: "persisted-cloudwifi-9",
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
    expect(mockAfter).toHaveBeenCalledTimes(1);
    expect(mockSendCoverageLeadAlert).not.toHaveBeenCalled();
  });

  it("alerts sales using only the returned persisted lead row", async () => {
    await POST(makeRequest());
    await runAfterCallbacks();

    expect(mockSendCoverageLeadAlert).toHaveBeenCalledTimes(1);
    expect(mockSendCoverageLeadAlert).toHaveBeenCalledWith({
      ...persistedLead,
      company_name: "Persisted Venue",
      city: "Cape Town",
      postal_code: "8001",
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
    expect(mockAfter).not.toHaveBeenCalled();
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
    expect(mockApiLogger.error).toHaveBeenCalledWith(
      "Failed to create CloudWiFi site survey lead",
      { error: "insert returned no row" },
    );
  });

  it("keeps the persisted lead successful when the alert rejects", async () => {
    mockSendCoverageLeadAlert.mockRejectedValue(
      new Error("notification offline"),
    );

    const response = await POST(makeRequest());
    await runAfterCallbacks();

    expect(response.status).toBe(201);
    expect(mockApiLogger.error).toHaveBeenCalledWith(
      "CloudWiFi sales alert failed",
      {
        leadId: "persisted-cloudwifi-9",
        error: "Sales alert request rejected",
      },
    );
  });

  it("logs a failed sales-alert result without changing the response", async () => {
    mockSendCoverageLeadAlert.mockResolvedValue({
      success: false,
      errors: ["Email service unavailable"],
    });

    const response = await POST(makeRequest());
    await runAfterCallbacks();

    expect(response.status).toBe(201);
    expect(mockApiLogger.error).toHaveBeenCalledWith(
      "CloudWiFi sales alert failed",
      {
        leadId: "persisted-cloudwifi-9",
        errors: ["Email service unavailable"],
      },
    );
  });
});
