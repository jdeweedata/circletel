"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  type CloudWifiSurveyDraft,
  useCloudWifiSurvey,
} from "@/components/cloudwifi/CloudWifiSurveyProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { getWhatsAppLink } from "@/lib/constants/contact";
import { recommendCloudWifiTier } from "@/lib/cloudwifi/tier-recommendation";
import {
  CLOUDWIFI_BACKHAUL_TYPES,
  CLOUDWIFI_EMAIL_PATTERN,
  CLOUDWIFI_SURVEY_NUMERIC_LIMITS,
  CLOUDWIFI_VENUE_TYPES,
  type CloudWifiBackhaul,
  type CloudWifiVenueType,
} from "@/lib/cloudwifi/types";

type WizardStep = 1 | 2 | 3 | 4;
type FieldErrors = Record<string, string>;

interface ApiFieldTarget {
  field: string;
  step: WizardStep;
  message: string;
}

const STEP_NAMES = ["Venue", "Details", "Contact", "Review"] as const;
const MAX_API_RESPONSE_BYTES = 16 * 1024;
const MAX_API_FIELDS = 20;
const SAFE_LEAD_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

const API_FIELD_TARGETS: Readonly<Record<string, ApiFieldTarget>> =
  Object.freeze({
    "venue.venueType": {
      field: "venueType",
      step: 1,
      message: "Select the type of venue.",
    },
    "venue.floorArea": {
      field: "floorArea",
      step: 1,
      message: "Enter the usable floor area in square metres.",
    },
    "venue.city": {
      field: "city",
      step: 1,
      message: "Enter the city where the venue is located.",
    },
    "venue.peakUsers": {
      field: "peakUsers",
      step: 1,
      message: "Enter the expected number of users at peak.",
    },
    "venue.backhaul": {
      field: "backhaul",
      step: 1,
      message: "Select the venue's current internet connection.",
    },
    "venue.siteAddress": {
      field: "siteAddress",
      step: 2,
      message: "Enter the full site address for the survey.",
    },
    "venue.postalCode": {
      field: "postalCode",
      step: 2,
      message: "Enter a four-digit postal code.",
    },
    "details.floors": {
      field: "floors",
      step: 2,
      message: "Enter the number of floors.",
    },
    "details.wallMaterial": {
      field: "wallMaterial",
      step: 2,
      message: "Select the main wall or building material.",
    },
    "details.networks": {
      field: "networks",
      step: 2,
      message: "Select at least one network requirement.",
    },
    "details.addOns": {
      field: "addOns",
      step: 2,
      message: "Select only the supported add-ons.",
    },
    "details.requirements": {
      field: "requirements",
      step: 2,
      message: "Check the additional requirements.",
    },
    "contact.fullName": {
      field: "fullName",
      step: 3,
      message: "Enter your first and last name.",
    },
    "contact.companyName": {
      field: "companyName",
      step: 3,
      message: "Enter the venue or company name.",
    },
    "contact.email": {
      field: "email",
      step: 3,
      message: "Enter a valid email such as name@company.co.za.",
    },
    "contact.phone": {
      field: "phone",
      step: 3,
      message: "Enter a valid South African phone number.",
    },
    "contact.preferredContactTime": {
      field: "preferredContactTime",
      step: 3,
      message: "Select a preferred contact time.",
    },
    "contact.consent": {
      field: "consent",
      step: 3,
      message: "Consent is required so CircleTel can arrange the survey.",
    },
    "contact.consentedAt": {
      field: "consent",
      step: 3,
      message: "Consent is required so CircleTel can arrange the survey.",
    },
  });

const VENUE_OPTIONS: ReadonlyArray<{
  value: CloudWifiVenueType;
  label: string;
}> = [
  { value: "hospitality", label: "Hospitality" },
  { value: "retail", label: "Retail" },
  { value: "property", label: "Property" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "public_venue", label: "Public venue" },
];

const BACKHAUL_OPTIONS: ReadonlyArray<{
  value: CloudWifiBackhaul;
  label: string;
}> = [
  { value: "fibre", label: "Fibre" },
  { value: "licensed_wireless", label: "Licensed wireless" },
  { value: "fixed_wireless", label: "Fixed wireless" },
  { value: "5g", label: "5G" },
  { value: "lte", label: "LTE" },
  { value: "unknown", label: "Not sure" },
];

const WALL_OPTIONS = [
  { value: "drywall", label: "Drywall" },
  { value: "brick_concrete", label: "Brick or concrete" },
  { value: "glass_metal", label: "Glass or metal" },
  { value: "mixed", label: "Mixed materials" },
  { value: "unknown", label: "Not sure" },
] as const;

const NETWORK_OPTIONS = [
  { value: "staff", label: "Staff network" },
  { value: "guest", label: "Guest network" },
  { value: "operations", label: "Operations/POS network" },
  { value: "other", label: "Other network" },
] as const;

const ADD_ON_OPTIONS = [
  { value: "captive_portal", label: "Captive portal" },
  { value: "analytics", label: "Analytics" },
  { value: "content_filtering", label: "Content filtering" },
  { value: "failover", label: "LTE/5G failover" },
  { value: "bandwidth_shaping", label: "Bandwidth shaping" },
  { value: "lan_wifi_optimisation", label: "LAN and Wi-Fi optimisation" },
  { value: "multi_site_management", label: "Multi-site management" },
  { value: "integrations", label: "Custom integrations" },
] as const;

const CONTACT_TIME_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "anytime", label: "Any time" },
] as const;

const controlClassName =
  "h-11 w-full rounded-md border border-circleTel-navy/20 bg-white px-3 text-base text-circleTel-navy outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2";
const textAreaClassName =
  "min-h-24 w-full rounded-md border border-circleTel-navy/20 bg-white px-3 py-2 text-base text-circleTel-navy outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2";

function isPositiveNumber(value: number | ""): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validateStep(
  step: WizardStep,
  draft: CloudWifiSurveyDraft,
): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 1) {
    if (
      !draft.venue.venueType ||
      !CLOUDWIFI_VENUE_TYPES.includes(draft.venue.venueType)
    ) {
      errors.venueType = "Select the type of venue.";
    }
    if (!isPositiveNumber(draft.venue.floorArea)) {
      errors.floorArea = "Enter the usable floor area in square metres.";
    } else if (
      draft.venue.floorArea > CLOUDWIFI_SURVEY_NUMERIC_LIMITS.floorArea
    ) {
      errors.floorArea = `Enter no more than ${CLOUDWIFI_SURVEY_NUMERIC_LIMITS.floorArea.toLocaleString("en-ZA")} square metres.`;
    }
    if (
      !draft.venue.city.trim() ||
      draft.venue.city.trim().length < 2 ||
      draft.venue.city.length > 100
    ) {
      errors.city = "Enter the city where the venue is located.";
    }
    if (
      !isPositiveNumber(draft.venue.peakUsers) ||
      !Number.isInteger(draft.venue.peakUsers)
    ) {
      errors.peakUsers = "Enter the expected number of users at peak.";
    } else if (
      draft.venue.peakUsers > CLOUDWIFI_SURVEY_NUMERIC_LIMITS.peakUsers
    ) {
      errors.peakUsers = `Enter no more than ${CLOUDWIFI_SURVEY_NUMERIC_LIMITS.peakUsers.toLocaleString("en-ZA")} peak users.`;
    }
    if (
      !draft.venue.backhaul ||
      !CLOUDWIFI_BACKHAUL_TYPES.includes(draft.venue.backhaul)
    ) {
      errors.backhaul = "Select the venue's current internet connection.";
    }
  }

  if (step === 2) {
    const siteAddress = draft.venue.siteAddress.trim();
    if (!siteAddress || siteAddress.length < 5) {
      errors.siteAddress = "Enter the full site address for the survey.";
    } else if (siteAddress.length > 300) {
      errors.siteAddress = "Keep the site address to 300 characters or fewer.";
    }
    if (
      draft.venue.postalCode &&
      !/^\d{4}$/.test(draft.venue.postalCode.trim())
    ) {
      errors.postalCode = "Enter a four-digit postal code.";
    }
    if (
      !isPositiveNumber(draft.details.floors) ||
      !Number.isInteger(draft.details.floors)
    ) {
      errors.floors = "Enter the number of floors.";
    } else if (draft.details.floors > 100) {
      errors.floors = "Enter no more than 100 floors.";
    }
    if (!draft.details.wallMaterial) {
      errors.wallMaterial = "Select the main wall or building material.";
    }
    if (draft.details.networks.length === 0) {
      errors.networks = "Select at least one network requirement.";
    } else if (
      draft.details.networks.length > NETWORK_OPTIONS.length ||
      draft.details.networks.some(
        (network) =>
          !NETWORK_OPTIONS.some((option) => option.value === network),
      )
    ) {
      errors.networks = "Select only the supported network requirements.";
    }
    if (
      draft.details.addOns.length > ADD_ON_OPTIONS.length ||
      draft.details.addOns.some(
        (addOn) => !ADD_ON_OPTIONS.some((option) => option.value === addOn),
      )
    ) {
      errors.addOns = "Select only the supported add-ons.";
    }
    if (draft.details.requirements.length > 2000) {
      errors.requirements =
        "Keep additional requirements to 2,000 characters or fewer.";
    }
  }

  if (step === 3) {
    const fullName = draft.contact.fullName.trim();
    if (fullName.split(/\s+/).filter(Boolean).length < 2) {
      errors.fullName = "Enter your first and last name.";
    } else if (fullName.length > 120) {
      errors.fullName = "Keep your full name to 120 characters or fewer.";
    }
    const companyName = draft.contact.companyName.trim();
    if (companyName.length < 2) {
      errors.companyName = "Enter the venue or company name.";
    } else if (companyName.length > 160) {
      errors.companyName =
        "Keep the venue or company name to 160 characters or fewer.";
    }
    if (
      !CLOUDWIFI_EMAIL_PATTERN.test(draft.contact.email.trim()) ||
      draft.contact.email.trim().length > 254
    ) {
      errors.email = "Enter a valid email such as name@company.co.za.";
    }
    const normalizedPhone = draft.contact.phone.trim().replace(/[\s-]/g, "");
    if (!/^(0\d{9}|\+27\d{9})$/.test(normalizedPhone)) {
      errors.phone = "Enter a valid South African phone number.";
    }
    if (!draft.contact.preferredContactTime) {
      errors.preferredContactTime = "Select a preferred contact time.";
    }
    if (!draft.contact.consent || !draft.contact.consentedAt) {
      errors.consent =
        "Consent is required so CircleTel can arrange the survey.";
    }
  }

  return errors;
}

function validateDraft(draft: CloudWifiSurveyDraft): {
  errors: FieldErrors;
  step: WizardStep | null;
  field: string | null;
} {
  const errors: FieldErrors = {};
  let firstStep: WizardStep | null = null;
  let firstField: string | null = null;

  for (const currentStep of [1, 2, 3] as const) {
    const stepErrors = validateStep(currentStep, draft);
    for (const [field, message] of Object.entries(stepErrors)) {
      errors[field] = message;
      if (firstStep === null) {
        firstStep = currentStep;
        firstField = field;
      }
    }
  }

  return { errors, step: firstStep, field: firstField };
}

async function readBoundedJson(response: Response): Promise<unknown> {
  const declaredLength = response.headers.get("content-length");
  if (
    declaredLength &&
    /^\d+$/.test(declaredLength) &&
    Number(declaredLength) > MAX_API_RESPONSE_BYTES
  ) {
    return null;
  }

  if (!response.body) return null;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let byteLength = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      byteLength += value.byteLength;
      if (byteLength > MAX_API_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } catch {
    await reader.cancel().catch(() => undefined);
    return null;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

function mapApiFieldErrors(
  result: unknown,
  draft: CloudWifiSurveyDraft,
): { errors: FieldErrors; step: WizardStep; field: string } | null {
  if (
    !result ||
    typeof result !== "object" ||
    !("fields" in result) ||
    !Array.isArray(result.fields)
  ) {
    return null;
  }

  const localErrorsByStep = {
    1: validateStep(1, draft),
    2: validateStep(2, draft),
    3: validateStep(3, draft),
  } as const;
  const targets: ApiFieldTarget[] = [];
  const seenFields = new Set<string>();

  for (const item of result.fields.slice(0, MAX_API_FIELDS)) {
    if (
      !item ||
      typeof item !== "object" ||
      !("field" in item) ||
      typeof item.field !== "string" ||
      item.field.length > 100
    ) {
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(API_FIELD_TARGETS, item.field)) {
      continue;
    }
    const target = API_FIELD_TARGETS[item.field];
    if (!target || seenFields.has(target.field)) continue;
    seenFields.add(target.field);
    targets.push(target);
  }

  if (targets.length === 0) return null;
  targets.sort((first, second) => first.step - second.step);
  const earliestStep = targets[0].step;
  const errors: FieldErrors = {};
  for (const target of targets) {
    errors[target.field] =
      localErrorsByStep[target.step as 1 | 2 | 3][target.field] ??
      target.message;
  }
  const firstTarget = targets.find((target) => target.step === earliestStep)!;

  return { errors, step: earliestStep, field: firstTarget.field };
}

function FieldError({ field, errors }: { field: string; errors: FieldErrors }) {
  const message = errors[field];
  if (!message) return null;

  return (
    <p
      id={`cloudwifi-${field}-error`}
      className="mt-1 text-base font-medium text-red-700"
      role="alert"
    >
      {message}
    </p>
  );
}

function describedBy(field: string, errors: FieldErrors): string | undefined {
  return errors[field] ? `cloudwifi-${field}-error` : undefined;
}

function numberValue(value: string): number | "" {
  if (!value.trim()) return "";
  return Number(value);
}

function humanLabel<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T | "",
): string {
  return (
    options.find((option) => option.value === value)?.label ?? "Not provided"
  );
}

function formatPrice(price: number): string {
  return `R${price.toLocaleString("en-US")}`;
}

function shouldDisableFormSubmit(
  submitting: boolean,
  submitError: string,
): boolean {
  return submitting || submitError.length > 0;
}

export function CloudWifiSurveyWizard() {
  const {
    draft,
    setDraft,
    mobileOpen,
    setMobileOpen,
    restoreSurveyFocus,
    resetSurvey,
  } = useCloudWifiSurvey();
  const isMobile = useIsMobile();
  const [step, setStep] = useState<WizardStep>(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [leadId, setLeadId] = useState("");
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const successHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const controlRefs = useRef<Record<string, HTMLElement | null>>({});
  const submittingRef = useRef(false);
  const formSubmissionLockedRef = useRef(false);
  /** Stable per-attempt key so retries after a lost 201 do not double-create leads. */
  const idempotencyKeyRef = useRef<string | null>(null);
  /** Honeypot — left empty by humans; bots often autofill `website`. */
  const [honeypot, setHoneypot] = useState("");

  const recommendation = useMemo(() => {
    const { venueType, floorArea, peakUsers, backhaul } = draft.venue;
    if (
      !venueType ||
      !isPositiveNumber(floorArea) ||
      !isPositiveNumber(peakUsers) ||
      !Number.isInteger(peakUsers) ||
      !backhaul
    ) {
      return null;
    }

    return recommendCloudWifiTier({
      venueType,
      floorArea,
      peakUsers,
      backhaul,
    });
  }, [draft.venue]);

  function onNextFrame(action: () => void): void {
    if (
      typeof window !== "undefined" &&
      typeof window.requestAnimationFrame === "function"
    ) {
      window.requestAnimationFrame(action);
    } else if (typeof window !== "undefined") {
      window.setTimeout(action, 0);
    } else {
      action();
    }
  }

  useEffect(() => {
    if (leadId) onNextFrame(() => successHeadingRef.current?.focus());
  }, [leadId]);

  function registerControl(field: string) {
    return (node: HTMLElement | null) => {
      controlRefs.current[field] = node;
    };
  }

  function retainErrorUntilValid(
    field: string,
    fieldStep: WizardStep,
    nextDraft: CloudWifiSurveyDraft,
  ): void {
    if (!errors[field]) return;

    const nextMessage = validateStep(fieldStep, nextDraft)[field];
    setErrors((current) => {
      const nextErrors = { ...current };
      if (nextMessage) nextErrors[field] = nextMessage;
      else delete nextErrors[field];
      return nextErrors;
    });
  }

  function updateVenue<Key extends keyof CloudWifiSurveyDraft["venue"]>(
    field: Key,
    value: CloudWifiSurveyDraft["venue"][Key],
  ): void {
    const nextDraft: CloudWifiSurveyDraft = {
      ...draft,
      venue: { ...draft.venue, [field]: value },
    };
    setDraft(nextDraft);
    retainErrorUntilValid(
      String(field),
      field === "siteAddress" || field === "postalCode" ? 2 : 1,
      nextDraft,
    );
  }

  function updateDetails<Key extends keyof CloudWifiSurveyDraft["details"]>(
    field: Key,
    value: CloudWifiSurveyDraft["details"][Key],
  ): void {
    const nextDraft: CloudWifiSurveyDraft = {
      ...draft,
      details: { ...draft.details, [field]: value },
    };
    setDraft(nextDraft);
    retainErrorUntilValid(String(field), 2, nextDraft);
  }

  function updateContact<Key extends keyof CloudWifiSurveyDraft["contact"]>(
    field: Key,
    value: CloudWifiSurveyDraft["contact"][Key],
  ): void {
    const nextDraft: CloudWifiSurveyDraft = {
      ...draft,
      contact: { ...draft.contact, [field]: value },
    };
    setDraft(nextDraft);
    retainErrorUntilValid(String(field), 3, nextDraft);
  }

  function toggleNetwork(
    value: CloudWifiSurveyDraft["details"]["networks"][number],
    checked: boolean,
  ) {
    const next = checked
      ? Array.from(new Set([...draft.details.networks, value]))
      : draft.details.networks.filter((network) => network !== value);
    updateDetails("networks", next);
  }

  function toggleAddOn(
    value: CloudWifiSurveyDraft["details"]["addOns"][number],
    checked: boolean,
  ) {
    const next = checked
      ? Array.from(new Set([...draft.details.addOns, value]))
      : draft.details.addOns.filter((addOn) => addOn !== value);
    updateDetails("addOns", next);
  }

  function continueToNextStep(): void {
    const nextErrors = validateStep(step, draft);
    setErrors(nextErrors);
    setSubmitError("");

    const firstInvalidField = Object.keys(nextErrors)[0];
    if (firstInvalidField) {
      onNextFrame(() => controlRefs.current[firstInvalidField]?.focus());
      return;
    }

    if (step < 4) {
      formSubmissionLockedRef.current = false;
      setStep((step + 1) as WizardStep);
      onNextFrame(() => headingRef.current?.focus());
    }
  }

  function goBack(): void {
    if (submitting || step === 1) return;
    formSubmissionLockedRef.current = false;
    setErrors({});
    setSubmitError("");
    setStep((step - 1) as WizardStep);
    onNextFrame(() => headingRef.current?.focus());
  }

  function editStep(nextStep: WizardStep): void {
    if (submitting) return;
    formSubmissionLockedRef.current = false;
    setErrors({});
    setSubmitError("");
    setStep(nextStep);
    onNextFrame(() => headingRef.current?.focus());
  }

  function ensureIdempotencyKey(): string {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `cw-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    }
    return idempotencyKeyRef.current;
  }

  async function submitDraft(): Promise<void> {
    if (submittingRef.current) return;

    const validation = validateDraft(draft);
    if (validation.step !== null && validation.field !== null) {
      setErrors(validation.errors);
      setSubmitError("");
      setStep(validation.step);
      onNextFrame(() => controlRefs.current[validation.field!]?.focus());
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    const idempotencyKey = ensureIdempotencyKey();

    try {
      const response = await fetch("/api/leads/cloudwifi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          ...draft,
          website: honeypot,
        }),
      });

      if (!response.ok) {
        const result = await readBoundedJson(response);
        const mappedErrors = mapApiFieldErrors(result, draft);
        if (mappedErrors) {
          setErrors(mappedErrors.errors);
          setStep(mappedErrors.step);
          setSubmitError("Check the highlighted fields and try again.");
          onNextFrame(() => controlRefs.current[mappedErrors.field]?.focus());
        } else {
          setSubmitError(
            "We could not send your request. Please try again, or contact us on WhatsApp.",
          );
        }
        return;
      }

      const result = await readBoundedJson(response);

      const responseLeadId =
        result &&
        typeof result === "object" &&
        "success" in result &&
        result.success === true &&
        "leadId" in result &&
        typeof result.leadId === "string"
          ? result.leadId.trim()
          : "";

      if (!SAFE_LEAD_ID_PATTERN.test(responseLeadId)) {
        setSubmitError(
          "We could not confirm your request. Please try again, or contact us on WhatsApp.",
        );
        return;
      }

      idempotencyKeyRef.current = null;
      setLeadId(responseLeadId);
    } catch {
      setSubmitError(
        "We could not send your request. Please try again, or contact us on WhatsApp.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (step !== 4) {
      continueToNextStep();
      return;
    }
    if (formSubmissionLockedRef.current) return;
    formSubmissionLockedRef.current = true;
    await submitDraft();
  }

  function reset(): void {
    resetSurvey();
    setStep(1);
    setErrors({});
    setSubmitError("");
    setLeadId("");
    setHoneypot("");
    setSubmitting(false);
    submittingRef.current = false;
    formSubmissionLockedRef.current = false;
    idempotencyKeyRef.current = null;
    if (!isMobile) onNextFrame(() => headingRef.current?.focus());
  }

  const progress = (
    <ol aria-label="Survey progress" className="grid grid-cols-4 gap-2">
      {STEP_NAMES.map((name, index) => {
        const itemStep = (index + 1) as WizardStep;
        const current = itemStep === step;
        return (
          <li
            key={name}
            aria-current={current ? "step" : undefined}
            aria-label={`Step ${itemStep}: ${name}${current ? ", current step" : ""}`}
            className={`rounded-md border px-2 py-3 text-center text-base font-semibold ${
              current
                ? "border-circleTel-orange bg-circleTel-orange-light text-circleTel-navy"
                : itemStep < step
                  ? "border-circleTel-navy bg-circleTel-navy text-white"
                  : "border-circleTel-navy/15 bg-white text-circleTel-secondaryNeutral"
            }`}
          >
            {name}
          </li>
        );
      })}
    </ol>
  );

  const venueStep = (
    <div className="space-y-5">
      <div>
        <Label
          htmlFor="cloudwifi-venueType"
          className="text-base text-circleTel-navy"
        >
          Venue type
        </Label>
        <select
          ref={registerControl("venueType")}
          id="cloudwifi-venueType"
          name="venue.venueType"
          aria-label="Venue type"
          aria-required="true"
          required
          aria-invalid={Boolean(errors.venueType)}
          aria-describedby={describedBy("venueType", errors)}
          className={`${controlClassName} mt-2`}
          value={draft.venue.venueType}
          onChange={(event) =>
            updateVenue(
              "venueType",
              event.target.value as CloudWifiVenueType | "",
            )
          }
        >
          <option value="">Select venue type</option>
          {VENUE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError field="venueType" errors={errors} />
      </div>

      <div>
        <Label
          htmlFor="cloudwifi-floorArea"
          className="text-base text-circleTel-navy"
        >
          Usable floor area (sqm)
        </Label>
        <Input
          ref={registerControl("floorArea")}
          id="cloudwifi-floorArea"
          name="venue.floorArea"
          aria-label="Usable floor area in square metres"
          aria-required="true"
          required
          autoComplete="off"
          aria-invalid={Boolean(errors.floorArea)}
          aria-describedby={describedBy("floorArea", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
          type="number"
          inputMode="decimal"
          min="0.1"
          max={CLOUDWIFI_SURVEY_NUMERIC_LIMITS.floorArea}
          step="0.1"
          value={draft.venue.floorArea}
          onChange={(event) =>
            updateVenue("floorArea", numberValue(event.target.value))
          }
        />
        <FieldError field="floorArea" errors={errors} />
      </div>

      <div>
        <Label
          htmlFor="cloudwifi-city"
          className="text-base text-circleTel-navy"
        >
          City
        </Label>
        <Input
          ref={registerControl("city")}
          id="cloudwifi-city"
          name="venue.city"
          aria-label="City"
          aria-required="true"
          required
          autoComplete="address-level2"
          aria-invalid={Boolean(errors.city)}
          aria-describedby={describedBy("city", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
          maxLength={100}
          value={draft.venue.city}
          onChange={(event) => updateVenue("city", event.target.value)}
        />
        <FieldError field="city" errors={errors} />
      </div>

      <div>
        <Label
          htmlFor="cloudwifi-peakUsers"
          className="text-base text-circleTel-navy"
        >
          Expected concurrent users (peak)
        </Label>
        <Input
          ref={registerControl("peakUsers")}
          id="cloudwifi-peakUsers"
          name="venue.peakUsers"
          aria-label="Expected peak concurrent users"
          aria-required="true"
          required
          autoComplete="off"
          aria-invalid={Boolean(errors.peakUsers)}
          aria-describedby={describedBy("peakUsers", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
          type="number"
          inputMode="numeric"
          min="1"
          max={CLOUDWIFI_SURVEY_NUMERIC_LIMITS.peakUsers}
          step="1"
          value={draft.venue.peakUsers}
          onChange={(event) =>
            updateVenue("peakUsers", numberValue(event.target.value))
          }
        />
        <FieldError field="peakUsers" errors={errors} />
      </div>

      <div>
        <Label
          htmlFor="cloudwifi-backhaul"
          className="text-base text-circleTel-navy"
        >
          Internet backhaul
        </Label>
        <select
          ref={registerControl("backhaul")}
          id="cloudwifi-backhaul"
          name="venue.backhaul"
          aria-label="Internet backhaul"
          aria-required="true"
          required
          aria-invalid={Boolean(errors.backhaul)}
          aria-describedby={describedBy("backhaul", errors)}
          className={`${controlClassName} mt-2`}
          value={draft.venue.backhaul}
          onChange={(event) =>
            updateVenue(
              "backhaul",
              event.target.value as CloudWifiBackhaul | "",
            )
          }
        >
          <option value="">Select backhaul</option>
          {BACKHAUL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError field="backhaul" errors={errors} />
      </div>
    </div>
  );

  const detailsStep = (
    <div className="space-y-5">
      <div>
        <Label
          htmlFor="cloudwifi-siteAddress"
          className="text-base text-circleTel-navy"
        >
          Site address
        </Label>
        <Input
          ref={registerControl("siteAddress")}
          id="cloudwifi-siteAddress"
          name="venue.siteAddress"
          aria-label="Site address"
          aria-required="true"
          required
          autoComplete="street-address"
          aria-invalid={Boolean(errors.siteAddress)}
          aria-describedby={describedBy("siteAddress", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
          maxLength={300}
          value={draft.venue.siteAddress}
          onChange={(event) => updateVenue("siteAddress", event.target.value)}
        />
        <FieldError field="siteAddress" errors={errors} />
      </div>

      <div>
        <Label
          htmlFor="cloudwifi-postalCode"
          className="text-base text-circleTel-navy"
        >
          Postal code (optional)
        </Label>
        <Input
          ref={registerControl("postalCode")}
          id="cloudwifi-postalCode"
          name="venue.postalCode"
          aria-label="Postal code (optional)"
          autoComplete="postal-code"
          aria-invalid={Boolean(errors.postalCode)}
          aria-describedby={describedBy("postalCode", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
          inputMode="numeric"
          maxLength={4}
          value={draft.venue.postalCode}
          onChange={(event) => updateVenue("postalCode", event.target.value)}
        />
        <FieldError field="postalCode" errors={errors} />
      </div>

      <div>
        <Label
          htmlFor="cloudwifi-floors"
          className="text-base text-circleTel-navy"
        >
          Number of floors
        </Label>
        <Input
          ref={registerControl("floors")}
          id="cloudwifi-floors"
          name="details.floors"
          aria-label="Number of floors"
          aria-required="true"
          required
          autoComplete="off"
          aria-invalid={Boolean(errors.floors)}
          aria-describedby={describedBy("floors", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
          type="number"
          inputMode="numeric"
          min="1"
          max="100"
          step="1"
          value={draft.details.floors}
          onChange={(event) =>
            updateDetails("floors", numberValue(event.target.value))
          }
        />
        <FieldError field="floors" errors={errors} />
      </div>

      <div>
        <Label
          htmlFor="cloudwifi-wallMaterial"
          className="text-base text-circleTel-navy"
        >
          Main wall or building material
        </Label>
        <select
          ref={registerControl("wallMaterial")}
          id="cloudwifi-wallMaterial"
          name="details.wallMaterial"
          aria-label="Main wall or building material"
          aria-required="true"
          required
          aria-invalid={Boolean(errors.wallMaterial)}
          aria-describedby={describedBy("wallMaterial", errors)}
          className={`${controlClassName} mt-2`}
          value={draft.details.wallMaterial}
          onChange={(event) =>
            updateDetails(
              "wallMaterial",
              event.target
                .value as CloudWifiSurveyDraft["details"]["wallMaterial"],
            )
          }
        >
          <option value="">Select material</option>
          {WALL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError field="wallMaterial" errors={errors} />
      </div>

      <fieldset
        ref={registerControl("networks")}
        tabIndex={-1}
        aria-required="true"
        aria-invalid={Boolean(errors.networks)}
        aria-describedby={describedBy("networks", errors)}
        className="space-y-2"
      >
        <legend className="text-base font-medium text-circleTel-navy">
          Networks required
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {NETWORK_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-circleTel-navy/15 px-3 text-base text-circleTel-navy"
            >
              <input
                type="checkbox"
                name="details.networks"
                aria-label={option.label}
                aria-invalid={Boolean(errors.networks)}
                aria-describedby={describedBy("networks", errors)}
                checked={draft.details.networks.includes(option.value)}
                onChange={(event) =>
                  toggleNetwork(option.value, event.target.checked)
                }
                className="h-5 w-5 accent-circleTel-orange"
              />
              {option.label}
            </label>
          ))}
        </div>
        <FieldError field="networks" errors={errors} />
      </fieldset>

      <fieldset
        ref={registerControl("addOns")}
        tabIndex={-1}
        aria-invalid={Boolean(errors.addOns)}
        aria-describedby={describedBy("addOns", errors)}
        className="space-y-2"
      >
        <legend className="text-base font-medium text-circleTel-navy">
          Optional add-ons
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ADD_ON_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-circleTel-navy/15 px-3 text-base text-circleTel-navy"
            >
              <input
                type="checkbox"
                name="details.addOns"
                aria-label={option.label}
                aria-invalid={Boolean(errors.addOns)}
                aria-describedby={describedBy("addOns", errors)}
                checked={draft.details.addOns.includes(option.value)}
                onChange={(event) =>
                  toggleAddOn(option.value, event.target.checked)
                }
                className="h-5 w-5 accent-circleTel-orange"
              />
              {option.label}
            </label>
          ))}
        </div>
        <FieldError field="addOns" errors={errors} />
      </fieldset>

      <div>
        <Label
          htmlFor="cloudwifi-requirements"
          className="text-base text-circleTel-navy"
        >
          Additional requirements (optional)
        </Label>
        <textarea
          ref={registerControl("requirements")}
          id="cloudwifi-requirements"
          name="details.requirements"
          aria-label="Additional requirements (optional)"
          aria-invalid={Boolean(errors.requirements)}
          aria-describedby={describedBy("requirements", errors)}
          className={`${textAreaClassName} mt-2`}
          maxLength={2000}
          value={draft.details.requirements}
          onChange={(event) =>
            updateDetails("requirements", event.target.value)
          }
        />
        <FieldError field="requirements" errors={errors} />
      </div>
    </div>
  );

  const contactStep = (
    <div className="space-y-5">
      <div>
        <Label
          htmlFor="cloudwifi-fullName"
          className="text-base text-circleTel-navy"
        >
          Full name
        </Label>
        <Input
          ref={registerControl("fullName")}
          id="cloudwifi-fullName"
          name="contact.fullName"
          aria-label="Full name"
          aria-required="true"
          required
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={describedBy("fullName", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
          autoComplete="name"
          maxLength={120}
          value={draft.contact.fullName}
          onChange={(event) => updateContact("fullName", event.target.value)}
        />
        <FieldError field="fullName" errors={errors} />
      </div>

      <div>
        <Label
          htmlFor="cloudwifi-companyName"
          className="text-base text-circleTel-navy"
        >
          Venue or company name
        </Label>
        <Input
          ref={registerControl("companyName")}
          id="cloudwifi-companyName"
          name="contact.companyName"
          aria-label="Venue or company name"
          aria-required="true"
          required
          aria-invalid={Boolean(errors.companyName)}
          aria-describedby={describedBy("companyName", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
          autoComplete="organization"
          maxLength={160}
          value={draft.contact.companyName}
          onChange={(event) => updateContact("companyName", event.target.value)}
        />
        <FieldError field="companyName" errors={errors} />
      </div>

      <div>
        <Label
          htmlFor="cloudwifi-email"
          className="text-base text-circleTel-navy"
        >
          Email address
        </Label>
        <Input
          ref={registerControl("email")}
          id="cloudwifi-email"
          name="contact.email"
          aria-label="Email address"
          aria-required="true"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("email", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
          type="email"
          autoComplete="email"
          maxLength={254}
          value={draft.contact.email}
          onChange={(event) => updateContact("email", event.target.value)}
        />
        <FieldError field="email" errors={errors} />
      </div>

      <div>
        <Label
          htmlFor="cloudwifi-phone"
          className="text-base text-circleTel-navy"
        >
          South African phone number
        </Label>
        <Input
          ref={registerControl("phone")}
          id="cloudwifi-phone"
          name="contact.phone"
          aria-label="South African phone number"
          aria-required="true"
          required
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={describedBy("phone", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
          type="tel"
          autoComplete="tel"
          maxLength={32}
          value={draft.contact.phone}
          onChange={(event) => updateContact("phone", event.target.value)}
        />
        <FieldError field="phone" errors={errors} />
      </div>

      <div>
        <Label
          htmlFor="cloudwifi-preferredContactTime"
          className="text-base text-circleTel-navy"
        >
          Preferred contact time
        </Label>
        <select
          ref={registerControl("preferredContactTime")}
          id="cloudwifi-preferredContactTime"
          name="contact.preferredContactTime"
          aria-label="Preferred contact time"
          aria-required="true"
          required
          aria-invalid={Boolean(errors.preferredContactTime)}
          aria-describedby={describedBy("preferredContactTime", errors)}
          className={`${controlClassName} mt-2`}
          value={draft.contact.preferredContactTime}
          onChange={(event) =>
            updateContact(
              "preferredContactTime",
              event.target
                .value as CloudWifiSurveyDraft["contact"]["preferredContactTime"],
            )
          }
        >
          <option value="">Select contact time</option>
          {CONTACT_TIME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError field="preferredContactTime" errors={errors} />
      </div>

      <div>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-circleTel-navy/15 p-3 text-base text-circleTel-navy">
          <input
            ref={registerControl("consent") as React.Ref<HTMLInputElement>}
            type="checkbox"
            name="contact.consent"
            aria-label="Consent to contact"
            aria-required="true"
            required
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={describedBy("consent", errors)}
            checked={draft.contact.consent}
            onChange={(event) => {
              const consent = event.target.checked;
              const nextDraft: CloudWifiSurveyDraft = {
                ...draft,
                contact: {
                  ...draft.contact,
                  consent,
                  consentedAt: consent ? new Date().toISOString() : "",
                },
              };
              setDraft(nextDraft);
              setErrors((current) => {
                const nextErrors = { ...current };
                if (consent) delete nextErrors.consent;
                else {
                  nextErrors.consent =
                    "Consent is required so CircleTel can arrange the survey.";
                }
                return nextErrors;
              });
            }}
            className="mt-0.5 h-5 w-5 shrink-0 accent-circleTel-orange"
          />
          <span>
            I agree that CircleTel may contact me to arrange a site survey and
            discuss this request.
          </span>
        </label>
        <FieldError field="consent" errors={errors} />
      </div>
    </div>
  );

  const reviewStep = (
    <div
      data-testid="cloudwifi-review"
      className="min-w-0 space-y-5 break-words text-base text-circleTel-navy [overflow-wrap:anywhere] [&_dd]:min-w-0 [&_div]:min-w-0 [&_dl]:min-w-0 [&_section]:min-w-0"
    >
      {recommendation ? (
        <section className="rounded-lg border border-circleTel-orange/40 bg-circleTel-orange-light p-4">
          <p className="font-semibold">Current recommendation</p>
          <p className="mt-1 font-heading text-2xl font-bold">
            {recommendation.tierDetails.name} ·{" "}
            {formatPrice(recommendation.tierDetails.startingPrice)}/mo
          </p>
          <p className="mt-1">{recommendation.tierDetails.apRange}</p>
          <ul className="mt-2 space-y-1 text-circleTel-secondaryNeutral">
            {recommendation.reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="cloudwifi-review-venue">
        <div className="flex items-center justify-between gap-3">
          <h3
            id="cloudwifi-review-venue"
            className="font-heading text-xl font-bold"
          >
            Venue
          </h3>
          <Button
            type="button"
            variant="link"
            disabled={submitting}
            onClick={() => editStep(1)}
          >
            Edit venue
          </Button>
        </div>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Venue type</dt>
            <dd>{humanLabel(VENUE_OPTIONS, draft.venue.venueType)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Floor area</dt>
            <dd>{draft.venue.floorArea} sqm</dd>
          </div>
          <div>
            <dt className="font-semibold">City</dt>
            <dd>{draft.venue.city}</dd>
          </div>
          <div>
            <dt className="font-semibold">Peak users</dt>
            <dd>{draft.venue.peakUsers}</dd>
          </div>
          <div>
            <dt className="font-semibold">Backhaul</dt>
            <dd>{humanLabel(BACKHAUL_OPTIONS, draft.venue.backhaul)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Site address</dt>
            <dd>{draft.venue.siteAddress}</dd>
          </div>
          {draft.venue.postalCode ? (
            <div>
              <dt className="font-semibold">Postal code</dt>
              <dd>{draft.venue.postalCode}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section aria-labelledby="cloudwifi-review-details">
        <div className="flex items-center justify-between gap-3">
          <h3
            id="cloudwifi-review-details"
            className="font-heading text-xl font-bold"
          >
            Network details
          </h3>
          <Button
            type="button"
            variant="link"
            disabled={submitting}
            onClick={() => editStep(2)}
          >
            Edit details
          </Button>
        </div>
        <dl className="mt-2 space-y-2">
          <div>
            <dt className="font-semibold">Floors and materials</dt>
            <dd>
              {draft.details.floors} floors ·{" "}
              {humanLabel(WALL_OPTIONS, draft.details.wallMaterial)}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Networks</dt>
            <dd>
              {draft.details.networks
                .map((value) => humanLabel(NETWORK_OPTIONS, value))
                .join(", ")}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Add-ons</dt>
            <dd>
              {draft.details.addOns.length
                ? draft.details.addOns
                    .map((value) => humanLabel(ADD_ON_OPTIONS, value))
                    .join(", ")
                : "None selected"}
            </dd>
          </div>
          {draft.details.requirements ? (
            <div>
              <dt className="font-semibold">Requirements</dt>
              <dd>{draft.details.requirements}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section aria-labelledby="cloudwifi-review-contact">
        <div className="flex items-center justify-between gap-3">
          <h3
            id="cloudwifi-review-contact"
            className="font-heading text-xl font-bold"
          >
            Contact
          </h3>
          <Button
            type="button"
            variant="link"
            disabled={submitting}
            onClick={() => editStep(3)}
          >
            Edit contact
          </Button>
        </div>
        <dl className="mt-2 space-y-2">
          <div>
            <dt className="font-semibold">Contact</dt>
            <dd>
              {draft.contact.fullName} · {draft.contact.companyName}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Preferred time</dt>
            <dd>
              {humanLabel(
                CONTACT_TIME_OPTIONS,
                draft.contact.preferredContactTime,
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Email</dt>
            <dd>{draft.contact.email}</dd>
          </div>
          <div>
            <dt className="font-semibold">Phone</dt>
            <dd>{draft.contact.phone}</dd>
          </div>
          <div>
            <dt className="font-semibold">Consent</dt>
            <dd>Confirmed for this survey request</dd>
          </div>
        </dl>
      </section>

      <p className="rounded-lg bg-circleTel-lightNeutral p-4 text-circleTel-secondaryNeutral">
        A site survey confirms the final tier and price. Prices exclude VAT,
        fair usage applies, and additional access points may cost extra.
      </p>
    </div>
  );

  const stepHeadings: Record<
    WizardStep,
    { title: string; description: string }
  > = {
    1: {
      title: "Tell us about your venue",
      description:
        "Share the site basics so we can size your managed Wi-Fi service.",
    },
    2: {
      title: "Site and network details",
      description: "Tell us what the survey team should plan for.",
    },
    3: {
      title: "How should we contact you?",
      description:
        "We will use these details only to arrange and discuss your survey.",
    },
    4: {
      title: "Review your site survey request",
      description: "Check the details before sending them to CircleTel.",
    },
  };

  const success = (
    <div className="space-y-5 p-5 sm:p-6">
      <h2
        ref={successHeadingRef}
        id="cloudwifi-survey-heading"
        tabIndex={-1}
        className="rounded-md font-heading text-2xl font-bold text-circleTel-navy outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2"
      >
        Request received
      </h2>
      <p className="text-base text-circleTel-secondaryNeutral">
        Thanks. A CircleTel specialist will contact you within one business day.
      </p>
      <p className="rounded-lg bg-circleTel-lightNeutral p-4 text-base text-circleTel-navy">
        Your lead reference is <strong>{leadId}</strong>.
      </p>
      <a
        href={getWhatsAppLink(
          `Hi CircleTel, I need help with CloudWiFi survey request ${leadId}.`,
        )}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border-2 border-circleTel-orange px-4 text-base font-semibold text-circleTel-orange-accessible transition-colors hover:bg-circleTel-orange-light hover:text-circleTel-orange-accessible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2"
        target="_blank"
        rel="noopener noreferrer"
      >
        Contact us on WhatsApp
      </a>
      <Button
        type="button"
        variant="cta-navy"
        size="lg"
        className="w-full text-base"
        onClick={reset}
      >
        Reset survey
      </Button>
    </div>
  );

  const form = (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="relative space-y-6 p-5 sm:p-6"
    >
      {/* Honeypot: hidden from assistive tech; bots often autofill `website`. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10000px] h-px w-px overflow-hidden opacity-0"
      >
        <label htmlFor="cloudwifi-website">Company website</label>
        <input
          id="cloudwifi-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>
      {progress}
      <header>
        <h2
          ref={headingRef}
          id="cloudwifi-survey-heading"
          tabIndex={-1}
          className="rounded-md font-heading text-2xl font-bold text-circleTel-navy outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2"
        >
          {stepHeadings[step].title}
        </h2>
        <p className="mt-2 text-base text-circleTel-secondaryNeutral">
          {stepHeadings[step].description}
        </p>
      </header>

      {step === 1 ? venueStep : null}
      {step === 2 ? detailsStep : null}
      {step === 3 ? contactStep : null}
      {step === 4 ? reviewStep : null}

      {submitError ? (
        <div className="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4">
          <p role="alert" className="text-base font-medium text-red-800">
            {submitError}
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={submitting}
            onClick={() => submitDraft()}
            className="w-full bg-circleTel-orange-accessible text-base text-white hover:bg-circleTel-orange-accessible hover:text-white hover:brightness-90"
          >
            Retry submission
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full text-base"
            disabled={submitting}
            onClick={goBack}
          >
            Back
          </Button>
        ) : null}
        {step < 4 ? (
          <Button
            key="continue"
            type="button"
            variant="cta"
            size="lg"
            className="w-full bg-circleTel-orange-accessible text-base hover:bg-circleTel-orange-accessible hover:brightness-90"
            disabled={submitting}
            onClick={(event) => {
              event.preventDefault();
              continueToNextStep();
            }}
          >
            Continue
          </Button>
        ) : (
          <Button
            key="submit"
            type="submit"
            variant="cta"
            size="lg"
            className="w-full bg-circleTel-orange-accessible text-base hover:bg-circleTel-orange-accessible hover:brightness-90"
            disabled={shouldDisableFormSubmit(submitting, submitError)}
          >
            {submitting ? "Sending request…" : "Submit site survey request"}
          </Button>
        )}
      </div>
      <p className="text-center text-base text-circleTel-secondaryNeutral">
        Step {step} of 4
      </p>
    </form>
  );

  const panel = leadId ? success : form;

  // Wait for viewport measurement so mobile never paints the desktop sticky
  // form first (which would flash then collapse into a closed Sheet).
  if (isMobile === undefined) {
    return (
      <aside
        id="cloudwifi-survey"
        aria-labelledby="cloudwifi-survey-heading"
        aria-busy="true"
        className="self-start rounded-2xl border border-circleTel-navy/10 bg-white shadow-lg lg:sticky lg:top-24"
      >
        <div className="p-6 text-base text-circleTel-secondaryNeutral">
          Preparing site survey form…
        </div>
      </aside>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          onCloseAutoFocus={(event) => {
            if (restoreSurveyFocus()) event.preventDefault();
          }}
          className="w-full max-w-none overscroll-contain overflow-y-auto bg-white px-0 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top))] sm:max-w-none [&>button]:!right-[calc(1rem+env(safe-area-inset-right))] [&>button]:!top-[calc(1rem+env(safe-area-inset-top))] [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-circleTel-orange-accessible [&>button]:focus-visible:ring-offset-2"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Request a CloudWiFi site survey</SheetTitle>
            <SheetDescription>
              Complete four short steps so CircleTel can plan your venue survey.
            </SheetDescription>
          </SheetHeader>
          {panel}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      id="cloudwifi-survey"
      aria-labelledby="cloudwifi-survey-heading"
      className="self-start rounded-2xl border border-circleTel-navy/10 bg-white shadow-lg lg:sticky lg:top-24"
    >
      {panel}
    </aside>
  );
}
