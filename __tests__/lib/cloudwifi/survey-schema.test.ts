import { buildCloudWifiLeadPayload } from "@/lib/cloudwifi/lead-payload";
import {
  cloudWifiSurveySchema,
  formatSurveyErrors,
} from "@/lib/cloudwifi/survey-schema";
import { ZodError, ZodIssueCode } from "zod";

const receivedContext = {
  receivedAt: "2026-07-14T10:05:00.000Z",
};

function buildLeadPayload(
  request: Parameters<typeof buildCloudWifiLeadPayload>[0],
  context = receivedContext,
): ReturnType<typeof buildCloudWifiLeadPayload> {
  return buildCloudWifiLeadPayload(request, context);
}

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
    requirements: "",
  },
  contact: {
    fullName: "Naledi Mokoena",
    companyName: "Mokoena Hospitality",
    email: "naledi@example.co.za",
    phone: "082 123 4567",
    preferredContactTime: "morning",
    consent: true,
    consentedAt: "2026-07-14T10:00:00.000Z",
  },
  attribution: {
    pageSource: "cloudwifi_product_page",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "cloudwifi",
    referrer: "https://www.google.com/",
  },
};

function requestWith(path: string, value: unknown): Record<string, unknown> {
  const request = structuredClone(validRequest) as Record<string, any>;
  const segments = path.split(".");
  const lastSegment = segments.pop();
  let target: Record<string, any> = request;

  for (const segment of segments) {
    target = target[segment];
  }

  if (lastSegment) {
    target[lastSegment] = value;
  }

  return request;
}

describe("CloudWiFi survey request schema", () => {
  it("trims human text, normalizes contact details, and coerces numeric strings", () => {
    const request = structuredClone(validRequest) as Record<string, any>;
    request.venue.floorArea = "450";
    request.venue.peakUsers = "120";
    request.venue.city = "  Johannesburg  ";
    request.venue.siteAddress = "  10 Main Road, Sandton  ";
    request.details.floors = "2";
    request.details.requirements = "  Outdoor courtyard coverage  ";
    request.contact.fullName = "  Naledi   Mokoena  ";
    request.contact.companyName = "  Mokoena Hospitality  ";
    request.contact.email = "  NALEDI@EXAMPLE.CO.ZA  ";
    request.contact.phone = "082-123-4567";
    request.attribution.utmSource = "  google  ";

    expect(cloudWifiSurveySchema.parse(request)).toEqual({
      ...validRequest,
      venue: {
        ...validRequest.venue,
        city: "Johannesburg",
        siteAddress: "10 Main Road, Sandton",
      },
      details: {
        ...validRequest.details,
        requirements: "Outdoor courtyard coverage",
      },
      contact: {
        ...validRequest.contact,
        fullName: "Naledi   Mokoena",
        companyName: "Mokoena Hospitality",
        email: "naledi@example.co.za",
        phone: "+27821234567",
      },
      attribution: {
        ...validRequest.attribution,
        utmSource: "google",
      },
    });
  });

  it.each([
    ["venue.venueType", "warehouse"],
    ["venue.backhaul", "satellite"],
    ["details.wallMaterial", "wood"],
    ["details.networks", ["customers"]],
    ["details.addOns", ["mesh"]],
    ["contact.preferredContactTime", "evening"],
    ["attribution.pageSource", "generic_contact_page"],
  ])("rejects an unsupported enum value for %s", (path, value) => {
    expect(
      cloudWifiSurveySchema.safeParse(requestWith(path, value)).success,
    ).toBe(false);
  });

  it.each([
    ["venue.floorArea", 0],
    ["venue.floorArea", -1],
    ["venue.floorArea", Number.NaN],
    ["venue.floorArea", Number.POSITIVE_INFINITY],
    ["venue.floorArea", 100001],
    ["venue.peakUsers", 0],
    ["venue.peakUsers", -1],
    ["venue.peakUsers", Number.NaN],
    ["venue.peakUsers", Number.POSITIVE_INFINITY],
    ["venue.peakUsers", 100001],
    ["venue.peakUsers", 1.5],
    ["details.floors", 0],
    ["details.floors", -1],
    ["details.floors", Number.NaN],
    ["details.floors", Number.POSITIVE_INFINITY],
    ["details.floors", 101],
    ["details.floors", 1.5],
  ])("rejects invalid numeric input for %s: %p", (path, value) => {
    expect(
      cloudWifiSurveySchema.safeParse(requestWith(path, value)).success,
    ).toBe(false);
  });

  it.each(
    [
      ["venue.floorArea", "Floor area must be a base-10 number."],
      ["venue.peakUsers", "Peak users must be a base-10 whole number."],
      ["details.floors", "Floors must be a base-10 whole number."],
    ].flatMap(([path, message]) =>
      [true, false, [], {}, " ", "0x10", "1e3"].map(
        (value): [string, unknown, string] => [path, value, message],
      ),
    ),
  )(
    "does not coerce unsafe numeric input for %s: %p",
    (path, value, message) => {
      const result = cloudWifiSurveySchema.safeParse(requestWith(path, value));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatSurveyErrors(result.error)).toContainEqual({
          field: path,
          message,
        });
      }
    },
  );

  it.each([
    ["contact.email", "not-an-email"],
    ["contact.phone", "12345"],
    ["venue.postalCode", "219"],
    ["venue.postalCode", "21960"],
    ["contact.consent", false],
    ["contact.consentedAt", "14 July 2026"],
    ["contact.fullName", "Naledi"],
  ])("rejects invalid %s input", (path, value) => {
    expect(
      cloudWifiSurveySchema.safeParse(requestWith(path, value)).success,
    ).toBe(false);
  });

  it("accepts an empty or omitted postal code and normalizes an empty value in the mapper", () => {
    const emptyPostalCode = cloudWifiSurveySchema.parse(
      requestWith("venue.postalCode", ""),
    );
    const withoutPostalCode = structuredClone(validRequest) as Record<
      string,
      any
    >;
    delete withoutPostalCode.venue.postalCode;

    expect(emptyPostalCode.venue.postalCode).toBe("");
    expect(buildLeadPayload(emptyPostalCode).postal_code).toBeNull();
    expect(
      cloudWifiSurveySchema.parse(withoutPostalCode).venue.postalCode,
    ).toBeUndefined();
  });

  it("preserves a valid international SA phone number", () => {
    const parsed = cloudWifiSurveySchema.parse(
      requestWith("contact.phone", "+27 82-123-4567"),
    );

    expect(parsed.contact.phone).toBe("+27821234567");
  });

  it("accepts a valid ISO datetime with an explicit timezone offset", () => {
    const parsed = cloudWifiSurveySchema.parse(
      requestWith("contact.consentedAt", "2026-07-14T12:00:00+02:00"),
    );

    expect(parsed.contact.consentedAt).toBe("2026-07-14T12:00:00+02:00");
  });

  it.each([
    [
      "details.networks",
      ["staff", "guest", "operations", "other", "staff"],
      "Select no more than 4 networks.",
    ],
    [
      "details.addOns",
      [
        "captive_portal",
        "analytics",
        "content_filtering",
        "failover",
        "bandwidth_shaping",
        "lan_wifi_optimisation",
        "multi_site_management",
        "integrations",
        "analytics",
      ],
      "Select no more than 8 add-ons.",
    ],
    [
      "contact.phone",
      "0".repeat(33),
      "Phone must contain at most 32 characters.",
    ],
    [
      "contact.consentedAt",
      `${validRequest.contact.consentedAt}${"0".repeat(64)}`,
      "Consent timestamp must contain at most 64 characters.",
    ],
    [
      "attribution.referrer",
      `https://example.com/${"a".repeat(2048)}`,
      "Referrer must contain at most 2048 characters.",
    ],
  ])("rejects oversized public input for %s", (path, value, message) => {
    const result = cloudWifiSurveySchema.safeParse(requestWith(path, value));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatSurveyErrors(result.error)).toContainEqual({
        field: path,
        message,
      });
    }
  });

  it("strips secrets from referrer query strings and fragments", () => {
    const parsed = cloudWifiSurveySchema.parse(
      requestWith(
        "attribution.referrer",
        "https://example.com/cloudwifi/offer?token=secret&utm_source=email#customer-data",
      ),
    );

    expect(parsed.attribution.referrer).toBe(
      "https://example.com/cloudwifi/offer",
    );
  });

  it.each(["javascript:alert(1)", "data:text/html,secret", "not a URL"])(
    "rejects unsafe or malformed referrer %p",
    (referrer) => {
      const result = cloudWifiSurveySchema.safeParse(
        requestWith("attribution.referrer", referrer),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatSurveyErrors(result.error)).toContainEqual({
          field: "attribution.referrer",
          message: "Referrer must be a valid HTTP or HTTPS URL.",
        });
      }
    },
  );

  it("requires at least one network", () => {
    expect(
      cloudWifiSurveySchema.safeParse(requestWith("details.networks", []))
        .success,
    ).toBe(false);
  });

  it("deduplicates networks and add-ons while preserving selection order", () => {
    const request = structuredClone(validRequest) as Record<string, any>;
    request.details.networks = ["staff", "guest", "staff"];
    request.details.addOns = ["analytics", "failover", "analytics"];

    const parsed = cloudWifiSurveySchema.parse(request);

    expect(parsed.details.networks).toEqual(["staff", "guest"]);
    expect(parsed.details.addOns).toEqual(["analytics", "failover"]);
  });

  it("defaults optional add-ons and requirements to empty values", () => {
    const request = structuredClone(validRequest) as Record<string, any>;
    delete request.details.addOns;
    delete request.details.requirements;

    const parsed = cloudWifiSurveySchema.parse(request);

    expect(parsed.details.addOns).toEqual([]);
    expect(parsed.details.requirements).toBe("");
  });

  it("formats validation errors with stable nested field paths and messages", () => {
    const request = structuredClone(validRequest) as Record<string, any>;
    request.venue.city = "J";
    request.details.networks = [];

    const result = cloudWifiSurveySchema.safeParse(request);
    expect(result.success).toBe(false);

    if (!result.success) {
      expect(formatSurveyErrors(result.error)).toEqual([
        {
          field: "venue.city",
          message: "City must contain at least 2 characters.",
        },
        {
          field: "details.networks",
          message: "Select at least one network.",
        },
      ]);
    }
  });

  it("normalizes indexed paths and keeps only the first issue for each field", () => {
    const result = cloudWifiSurveySchema.safeParse(
      requestWith("details.networks", ["unsupported-one", "unsupported-two"]),
    );
    expect(result.success).toBe(false);

    if (!result.success) {
      expect(formatSurveyErrors(result.error)).toEqual([
        {
          field: "details.networks",
          message: "Select a supported network.",
        },
      ]);
    }
  });

  it("caps formatted validation errors at 20 distinct fields", () => {
    const error = new ZodError(
      Array.from({ length: 25 }, (_, index) => ({
        code: ZodIssueCode.custom,
        path: [`field_${index}`],
        message: `Error ${index}`,
      })),
    );

    expect(formatSurveyErrors(error)).toHaveLength(20);
    expect(formatSurveyErrors(error)[19]).toEqual({
      field: "field_19",
      message: "Error 19",
    });
  });
});

describe("CloudWiFi coverage lead payload", () => {
  it("maps a parsed request to only verified coverage_leads columns", () => {
    const request = structuredClone(validRequest) as Record<string, any>;
    request.contact.fullName = "  Naledi van der Merwe  ";
    request.details.networks = ["staff", "guest", "staff"];
    request.details.addOns = ["analytics", "analytics"];
    request.details.requirements = "  Include the courtyard  ";
    const parsed = cloudWifiSurveySchema.parse(request);

    const payload = buildLeadPayload(parsed);

    expect(payload).toEqual({
      customer_type: "smme",
      first_name: "Naledi",
      last_name: "van der Merwe",
      email: "naledi@example.co.za",
      phone: "+27821234567",
      company_name: "Mokoena Hospitality",
      address: "10 Main Road, Sandton",
      city: "Johannesburg",
      postal_code: "2196",
      lead_source: "website_form",
      requested_service_type: "cloudwifi",
      contact_preference: "phone",
      best_contact_time: "morning",
      status: "new",
      follow_up_notes:
        "CloudWiFi site survey requested. Recommended tier: Professional.",
      requirements: {
        venue_type: "hospitality",
        floor_area_sqm: 450,
        peak_users: 120,
        backhaul: "fibre",
        floors: 2,
        wall_material: "brick_concrete",
        networks: ["staff", "guest"],
        add_ons: ["analytics"],
      },
      metadata: {
        page_source: "cloudwifi_product_page",
        recommended_tier: "professional",
        recommendation_reasons: [
          "Floor area and peak users both support the Professional tier.",
        ],
        backhaul_guidance: null,
        consented_at: "2026-07-14T10:05:00.000Z",
        client_consented_at: "2026-07-14T10:00:00.000Z",
        requirements_text: "Include the courtyard",
        attribution: {
          utm_source: "google",
          utm_medium: "cpc",
          utm_campaign: "cloudwifi",
          referrer: "https://www.google.com/",
        },
      },
    });
    expect(payload).not.toHaveProperty("service_interest");
    expect(payload).not.toHaveProperty("notes");
  });

  it("recomputes the recommendation and omits absent optional attribution keys", () => {
    const request = structuredClone(validRequest) as Record<string, any>;
    request.venue.floorArea = 2500;
    request.venue.peakUsers = 20;
    delete request.attribution.utmSource;
    delete request.attribution.utmMedium;
    delete request.attribution.utmCampaign;
    delete request.attribution.referrer;
    request.recommendedTier = "essential";

    const payload = buildLeadPayload(cloudWifiSurveySchema.parse(request));

    expect(payload.metadata.recommended_tier).toBe("campus");
    expect(payload.follow_up_notes).toContain("Recommended tier: Campus.");
    expect(payload.metadata.attribution).toEqual({});
  });

  it.each(["2000-01-01T00:00:00.000Z", "2099-12-31T23:59:59.000Z"])(
    "uses server receipt time instead of client consent time %s",
    (clientConsentedAt) => {
      const parsed = cloudWifiSurveySchema.parse(
        requestWith("contact.consentedAt", clientConsentedAt),
      );

      const payload = buildLeadPayload(parsed);

      expect(payload.metadata.consented_at).toBe(receivedContext.receivedAt);
      expect(payload.metadata.client_consented_at).toBe(clientConsentedAt);
    },
  );

  it("rejects an invalid authoritative receipt timestamp", () => {
    const parsed = cloudWifiSurveySchema.parse(validRequest);

    expect(() =>
      buildLeadPayload(parsed, { receivedAt: "not-an-iso-datetime" }),
    ).toThrow("Received timestamp must be a valid ISO datetime.");
  });

  it("copies selection arrays without mutating or sharing state with the request", () => {
    const parsed = cloudWifiSurveySchema.parse(validRequest);
    const requestBeforeMapping = structuredClone(parsed);

    const payload = buildLeadPayload(parsed);

    expect(parsed).toEqual(requestBeforeMapping);
    expect(payload.requirements.networks).not.toBe(parsed.details.networks);
    expect(payload.requirements.add_ons).not.toBe(parsed.details.addOns);

    (payload.requirements.networks as string[]).push("operations");
    expect(parsed.details.networks).toEqual(
      requestBeforeMapping.details.networks,
    );

    parsed.details.addOns.push("failover");
    expect(payload.requirements.add_ons).toEqual(["analytics"]);
  });

  it("is deterministic for the same parsed request", () => {
    const parsed = cloudWifiSurveySchema.parse(validRequest);

    expect(buildLeadPayload(parsed)).toEqual(buildLeadPayload(parsed));
  });
});
