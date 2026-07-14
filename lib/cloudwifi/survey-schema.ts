import { z, type ZodError } from "zod";

import { CLOUDWIFI_BACKHAUL_TYPES, CLOUDWIFI_VENUE_TYPES } from "./types";

const WALL_MATERIALS = [
  "drywall",
  "brick_concrete",
  "glass_metal",
  "mixed",
  "unknown",
] as const;

const NETWORKS = ["staff", "guest", "operations", "other"] as const;

const ADD_ONS = [
  "captive_portal",
  "analytics",
  "content_filtering",
  "failover",
  "bandwidth_shaping",
  "lan_wifi_optimisation",
  "multi_site_management",
  "integrations",
] as const;

const PREFERRED_CONTACT_TIMES = ["morning", "afternoon", "anytime"] as const;

const BASE_TEN_DECIMAL = /^\d+(?:\.\d+)?$/;
const BASE_TEN_INTEGER = /^\d+$/;
const MAX_FORMATTED_ERRORS = 20;
const MAX_RAW_SELECTIONS = 32;

const textSchema = (label: string) =>
  z.string({
    required_error: `${label} is required.`,
    invalid_type_error: `${label} must be text.`,
  });

const optionalAttribution = (label: string, maxLength: number) =>
  textSchema(label)
    .trim()
    .max(maxLength, `${label} must contain at most ${maxLength} characters.`)
    .transform((value) => value || undefined)
    .optional();

function strictPositiveNumber(
  label: string,
  maximum: number,
  integer: boolean,
) {
  const inputMessage = integer
    ? `${label} must be a base-10 whole number.`
    : `${label} must be a base-10 number.`;
  const numberSchema = z
    .number({
      required_error: inputMessage,
      invalid_type_error: inputMessage,
    })
    .finite(`${label} must be finite.`)
    .positive(`${label} must be greater than 0.`)
    .max(maximum, `${label} must be at most ${maximum}.`);
  const constrainedSchema = integer
    ? numberSchema.int(`${label} must be a whole number.`)
    : numberSchema;
  const stringPattern = integer ? BASE_TEN_INTEGER : BASE_TEN_DECIMAL;

  return z.preprocess((value) => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return stringPattern.test(trimmed) ? Number(trimmed) : value;
    }

    return value;
  }, constrainedSchema);
}

const uniqueValues = <T>(values: T[]): T[] => Array.from(new Set(values));

const phoneSchema = z
  .string({
    required_error: "Phone is required.",
    invalid_type_error: "Phone must be text.",
  })
  .max(32, "Phone must contain at most 32 characters.")
  .trim()
  .transform((phone) => phone.replace(/[\s-]/g, ""))
  .refine((phone) => /^(0\d{9}|\+27\d{9})$/.test(phone), {
    message: "Enter a valid South African phone number.",
  })
  .transform((phone) =>
    phone.startsWith("0") ? `+27${phone.slice(1)}` : phone,
  );

function parseHttpReferrer(value: string): URL | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

const referrerSchema = z
  .string({
    required_error: "Referrer is required.",
    invalid_type_error: "Referrer must be text.",
  })
  .max(2048, "Referrer must contain at most 2048 characters.")
  .trim()
  .refine((value) => value === "" || parseHttpReferrer(value) !== null, {
    message: "Referrer must be a valid HTTP or HTTPS URL.",
  })
  .transform((value) => {
    const url = parseHttpReferrer(value);
    return url ? `${url.origin}${url.pathname}` : undefined;
  })
  .optional();

export const cloudWifiSurveySchema = z.object({
  venue: z.object({
    venueType: z.enum(CLOUDWIFI_VENUE_TYPES, {
      errorMap: () => ({ message: "Select a supported venue type." }),
    }),
    floorArea: strictPositiveNumber("Floor area", 100000, false),
    peakUsers: strictPositiveNumber("Peak users", 100000, true),
    city: textSchema("City")
      .trim()
      .min(2, "City must contain at least 2 characters.")
      .max(100, "City must contain at most 100 characters."),
    siteAddress: textSchema("Site address")
      .trim()
      .min(5, "Site address must contain at least 5 characters.")
      .max(300, "Site address must contain at most 300 characters."),
    postalCode: textSchema("Postal code")
      .trim()
      .regex(/^(?:|\d{4})$/, "Postal code must be exactly four digits.")
      .optional(),
    backhaul: z.enum(CLOUDWIFI_BACKHAUL_TYPES, {
      errorMap: () => ({ message: "Select a supported backhaul type." }),
    }),
  }),
  details: z.object({
    floors: strictPositiveNumber("Floors", 100, true),
    wallMaterial: z.enum(WALL_MATERIALS, {
      errorMap: () => ({ message: "Select a supported wall material." }),
    }),
    networks: z
      .array(
        z.enum(NETWORKS, {
          errorMap: () => ({ message: "Select a supported network." }),
        }),
        {
          required_error: "Networks are required.",
          invalid_type_error: "Networks must be a list.",
        },
      )
      .min(1, "Select at least one network.")
      .max(MAX_RAW_SELECTIONS, "Select no more than 32 network entries.")
      .transform(uniqueValues)
      .refine((networks) => networks.length <= NETWORKS.length, {
        message: "Select no more than 4 unique networks.",
      }),
    addOns: z
      .array(
        z.enum(ADD_ONS, {
          errorMap: () => ({ message: "Select a supported add-on." }),
        }),
        { invalid_type_error: "Add-ons must be a list." },
      )
      .max(MAX_RAW_SELECTIONS, "Select no more than 32 add-on entries.")
      .transform(uniqueValues)
      .refine((addOns) => addOns.length <= ADD_ONS.length, {
        message: "Select no more than 8 unique add-ons.",
      })
      .optional()
      .default([]),
    requirements: textSchema("Requirements")
      .trim()
      .max(2000, "Requirements must contain at most 2000 characters.")
      .optional()
      .default(""),
  }),
  contact: z.object({
    fullName: textSchema("Full name")
      .trim()
      .max(120, "Full name must contain at most 120 characters.")
      .refine((name) => name.split(/\s+/).filter(Boolean).length >= 2, {
        message: "Enter your first name and surname.",
      }),
    companyName: textSchema("Company name")
      .trim()
      .min(2, "Company name must contain at least 2 characters.")
      .max(160, "Company name must contain at most 160 characters."),
    email: textSchema("Email")
      .trim()
      .email("Enter a valid email address.")
      .max(254, "Email must contain at most 254 characters.")
      .transform((email) => email.toLowerCase()),
    phone: phoneSchema,
    preferredContactTime: z.enum(PREFERRED_CONTACT_TIMES, {
      errorMap: () => ({ message: "Select a supported contact time." }),
    }),
    consent: z.literal(true, {
      errorMap: () => ({ message: "Consent is required." }),
    }),
    consentedAt: z
      .string({
        required_error: "Consent timestamp is required.",
        invalid_type_error: "Consent timestamp must be text.",
      })
      .max(64, "Consent timestamp must contain at most 64 characters.")
      .trim()
      .datetime({ offset: true, message: "Enter a valid ISO datetime." }),
  }),
  attribution: z.object({
    pageSource: z.literal("cloudwifi_product_page", {
      errorMap: () => ({ message: "Invalid survey page source." }),
    }),
    utmSource: optionalAttribution("UTM source", 200),
    utmMedium: optionalAttribution("UTM medium", 200),
    utmCampaign: optionalAttribution("UTM campaign", 200),
    referrer: referrerSchema,
  }),
});

export type CloudWifiSurveyRequest = z.infer<typeof cloudWifiSurveySchema>;

export function formatSurveyErrors(
  error: ZodError,
): Array<{ field: string; message: string }> {
  const formattedErrors: Array<{ field: string; message: string }> = [];
  const seenFields = new Set<string>();

  for (const issue of error.issues) {
    const field = issue.path
      .filter(
        (segment) => typeof segment !== "number" && !/^\d+$/.test(segment),
      )
      .join(".");

    if (seenFields.has(field)) {
      continue;
    }

    seenFields.add(field);
    formattedErrors.push({ field, message: issue.message });

    if (formattedErrors.length === MAX_FORMATTED_ERRORS) {
      break;
    }
  }

  return formattedErrors;
}
