"use client";

import React, { useEffect, useRef, useState } from "react";

import {
  type CloudWifiSurveyDraft,
  type CloudWifiVenueSizeBucket,
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
import {
  CLOUDWIFI_EMAIL_PATTERN,
  CLOUDWIFI_VENUE_TYPES,
  type CloudWifiVenueType,
} from "@/lib/cloudwifi/types";

type WizardStep = 1 | 2;
type FieldErrors = Record<string, string>;

interface ApiFieldTarget {
  field: string;
  step: WizardStep;
  message: string;
}

const STEP_NAMES = ["About you", "About your venue"] as const;
const MAX_API_RESPONSE_BYTES = 16 * 1024;
const MAX_API_FIELDS = 20;
const SAFE_LEAD_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

const SIZE_TO_FLOOR_AREA: Record<
  Exclude<CloudWifiVenueSizeBucket, "">,
  number | undefined
> = {
  small: 250,
  medium: 550,
  large: 1200,
  unknown: undefined,
};

const SIZE_LABELS: Record<Exclude<CloudWifiVenueSizeBucket, "">, string> = {
  small: "Small (up to about 300 m²)",
  medium: "Medium (about 300–800 m²)",
  large: "Large (800 m² or more)",
  unknown: "Not sure yet",
};

const API_FIELD_TARGETS: Readonly<Record<string, ApiFieldTarget>> =
  Object.freeze({
    "contact.fullName": {
      field: "fullName",
      step: 1,
      message: "Enter your first and last name.",
    },
    "contact.companyName": {
      field: "companyName",
      step: 1,
      message: "Enter the venue or company name.",
    },
    "contact.email": {
      field: "email",
      step: 1,
      message: "Enter a valid email such as name@company.co.za.",
    },
    "contact.phone": {
      field: "phone",
      step: 1,
      message: "Enter a valid South African phone number.",
    },
    "contact.preferredContactTime": {
      field: "preferredContactTime",
      step: 1,
      message: "Select a preferred contact time.",
    },
    "contact.consent": {
      field: "consent",
      step: 1,
      message: "Consent is required so CircleTel can arrange the survey.",
    },
    "contact.consentedAt": {
      field: "consent",
      step: 1,
      message: "Consent is required so CircleTel can arrange the survey.",
    },
    "venue.venueType": {
      field: "venueType",
      step: 2,
      message: "Select the type of venue.",
    },
    "venue.city": {
      field: "city",
      step: 2,
      message: "Enter the city or area where the venue is located.",
    },
    "venue.floorArea": {
      field: "sizeBucket",
      step: 2,
      message: "Select an approximate venue size.",
    },
    "details.requirements": {
      field: "requirements",
      step: 2,
      message: "Keep your note to 2,000 characters or fewer.",
    },
  });

const VENUE_OPTIONS: ReadonlyArray<{
  value: CloudWifiVenueType;
  label: string;
}> = [
  { value: "hospitality", label: "Hospitality (hotel, lodge, restaurant)" },
  { value: "retail", label: "Retail (shop or centre)" },
  { value: "property", label: "Property / offices" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "public_venue", label: "Public venue / events" },
];

const CONTACT_TIME_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "anytime", label: "Any time" },
] as const;

const SIZE_OPTIONS = [
  { value: "small", label: SIZE_LABELS.small },
  { value: "medium", label: SIZE_LABELS.medium },
  { value: "large", label: SIZE_LABELS.large },
  { value: "unknown", label: SIZE_LABELS.unknown },
] as const;

const controlClassName =
  "h-11 w-full rounded-md border border-circleTel-navy/20 bg-white px-3 text-base text-circleTel-navy outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2";
const textAreaClassName =
  "min-h-24 w-full rounded-md border border-circleTel-navy/20 bg-white px-3 py-2 text-base text-circleTel-navy outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2";

function onNextFrame(callback: () => void): void {
  if (
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function"
  ) {
    window.requestAnimationFrame(() => callback());
    return;
  }
  callback();
}

function describedBy(field: string, errors: FieldErrors): string | undefined {
  return errors[field] ? `cloudwifi-${field}-error` : undefined;
}

function FieldError({
  field,
  errors,
}: {
  field: string;
  errors: FieldErrors;
}) {
  const message = errors[field];
  if (!message) return null;
  return (
    <p
      id={`cloudwifi-${field}-error`}
      role="alert"
      className="mt-1 text-sm text-red-700"
    >
      {message}
    </p>
  );
}

function validateStep(step: WizardStep, draft: CloudWifiSurveyDraft): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 1) {
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

  if (step === 2) {
    if (
      !draft.venue.venueType ||
      !CLOUDWIFI_VENUE_TYPES.includes(draft.venue.venueType)
    ) {
      errors.venueType = "Select the type of venue.";
    }
    if (
      !draft.venue.city.trim() ||
      draft.venue.city.trim().length < 2 ||
      draft.venue.city.length > 100
    ) {
      errors.city = "Enter the city or area where the venue is located.";
    }
    if (!draft.venue.sizeBucket) {
      errors.sizeBucket = "Select an approximate venue size.";
    }
    if (draft.details.requirements.length > 2000) {
      errors.requirements = "Keep your note to 2,000 characters or fewer.";
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

  for (const currentStep of [1, 2] as const) {
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
  const text = await response.text();
  if (text.length > MAX_API_RESPONSE_BYTES) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function mapApiFieldErrors(
  result: unknown,
  _draft: CloudWifiSurveyDraft,
): { errors: FieldErrors; step: WizardStep; field: string } | null {
  if (!result || typeof result !== "object" || !("fields" in result)) {
    return null;
  }
  const fields = (result as { fields?: unknown }).fields;
  if (!Array.isArray(fields)) return null;

  const targets: Array<{ step: WizardStep; field: string; message: string }> =
    [];
  for (const entry of fields.slice(0, MAX_API_FIELDS)) {
    if (!entry || typeof entry !== "object") continue;
    const fieldPath =
      "field" in entry && typeof entry.field === "string" ? entry.field : "";
    const target = API_FIELD_TARGETS[fieldPath];
    if (!target) continue;
    targets.push({
      step: target.step,
      field: target.field,
      message: target.message,
    });
  }
  if (targets.length === 0) return null;

  const earliestStep = targets.reduce(
    (min, target) => (target.step < min ? target.step : min),
    targets[0].step,
  );
  const errors: FieldErrors = {};
  for (const target of targets) {
    if (target.step === earliestStep) {
      errors[target.field] = target.message;
    }
  }
  const firstTarget = targets.find((target) => target.step === earliestStep)!;
  return { errors, step: earliestStep, field: firstTarget.field };
}

function buildSubmitPayload(draft: CloudWifiSurveyDraft) {
  const sizeBucket = draft.venue.sizeBucket || "unknown";
  const floorArea = SIZE_TO_FLOOR_AREA[sizeBucket];
  const city = draft.venue.city.trim();
  const sizeNote =
    sizeBucket !== "unknown" && sizeBucket
      ? `Approximate size: ${SIZE_LABELS[sizeBucket]}.`
      : "Approximate size: not sure yet.";
  const userNotes = draft.details.requirements.trim();
  const requirements = [sizeNote, userNotes].filter(Boolean).join(" ");

  return {
    venue: {
      venueType: draft.venue.venueType,
      city,
      ...(typeof floorArea === "number" ? { floorArea } : {}),
      ...(typeof draft.venue.peakUsers === "number"
        ? { peakUsers: draft.venue.peakUsers }
        : {}),
      ...(draft.venue.backhaul ? { backhaul: draft.venue.backhaul } : {}),
    },
    details: {
      requirements,
    },
    contact: draft.contact,
    attribution: draft.attribution,
  };
}

export function CloudWifiSurveyWizard() {
  const { draft, setDraft, mobileOpen, setMobileOpen, resetSurvey, restoreSurveyFocus } =
    useCloudWifiSurvey();
  const isMobile = useIsMobile();
  const [step, setStep] = useState<WizardStep>(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [leadId, setLeadId] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const controlRefs = useRef<Record<string, HTMLElement | null>>({});
  const submittingRef = useRef(false);
  const formSubmissionLockedRef = useRef(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  function registerControl(field: string) {
    return (node: HTMLElement | null) => {
      controlRefs.current[field] = node;
    };
  }

  function updateVenue<Key extends keyof CloudWifiSurveyDraft["venue"]>(
    key: Key,
    value: CloudWifiSurveyDraft["venue"][Key],
  ) {
    const nextDraft: CloudWifiSurveyDraft = {
      ...draft,
      venue: { ...draft.venue, [key]: value },
    };
    setDraft(nextDraft);
    if (errors[key as string]) {
      const nextMessage = validateStep(step, nextDraft)[key as string];
      setErrors((current) => {
        const next = { ...current };
        if (nextMessage) next[key as string] = nextMessage;
        else delete next[key as string];
        return next;
      });
    }
  }

  function updateContact<Key extends keyof CloudWifiSurveyDraft["contact"]>(
    key: Key,
    value: CloudWifiSurveyDraft["contact"][Key],
  ) {
    const nextDraft: CloudWifiSurveyDraft = {
      ...draft,
      contact: { ...draft.contact, [key]: value },
    };
    setDraft(nextDraft);
    const errorKey =
      key === "consent" || key === "consentedAt" ? "consent" : (key as string);
    if (errors[errorKey] || errors[key as string]) {
      const nextMessage = validateStep(1, nextDraft)[errorKey];
      setErrors((current) => {
        const next = { ...current };
        if (nextMessage) next[errorKey] = nextMessage;
        else delete next[errorKey];
        return next;
      });
    }
  }

  function updateRequirements(value: string) {
    const nextDraft: CloudWifiSurveyDraft = {
      ...draft,
      details: { ...draft.details, requirements: value },
    };
    setDraft(nextDraft);
    if (errors.requirements) {
      const nextMessage = validateStep(2, nextDraft).requirements;
      setErrors((current) => {
        const next = { ...current };
        if (nextMessage) next.requirements = nextMessage;
        else delete next.requirements;
        return next;
      });
    }
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

    if (step < 2) {
      formSubmissionLockedRef.current = false;
      setStep(2);
      onNextFrame(() => headingRef.current?.focus());
    }
  }

  function goBack(): void {
    if (submitting || step === 1) return;
    formSubmissionLockedRef.current = false;
    setErrors({});
    setSubmitError("");
    setStep(1);
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
      formSubmissionLockedRef.current = false;
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
          ...buildSubmitPayload(draft),
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
    if (step !== 2) {
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
    <ol aria-label="Survey progress" className="grid grid-cols-2 gap-2">
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
                ? "border-circleTel-orange-accessible bg-circleTel-orange-light text-circleTel-navy"
                : itemStep < step
                  ? "border-circleTel-navy/20 bg-circleTel-lightNeutral text-circleTel-navy"
                  : "border-circleTel-navy/15 text-circleTel-secondaryNeutral"
            }`}
          >
            {name}
          </li>
        );
      })}
    </ol>
  );

  const contactStep = (
    <div className="space-y-5">
      <div>
        <Label htmlFor="cloudwifi-fullName" className="text-base text-circleTel-navy">
          Full name
        </Label>
        <Input
          ref={registerControl("fullName")}
          id="cloudwifi-fullName"
          name="contact.fullName"
          aria-label="Full name"
          aria-required="true"
          required
          autoComplete="name"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={describedBy("fullName", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
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
          autoComplete="organization"
          aria-invalid={Boolean(errors.companyName)}
          aria-describedby={describedBy("companyName", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
          maxLength={160}
          value={draft.contact.companyName}
          onChange={(event) => updateContact("companyName", event.target.value)}
        />
        <FieldError field="companyName" errors={errors} />
      </div>

      <div>
        <Label htmlFor="cloudwifi-email" className="text-base text-circleTel-navy">
          Email address
        </Label>
        <Input
          ref={registerControl("email")}
          id="cloudwifi-email"
          name="contact.email"
          aria-label="Email address"
          aria-required="true"
          required
          autoComplete="email"
          inputMode="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("email", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
          maxLength={254}
          value={draft.contact.email}
          onChange={(event) => updateContact("email", event.target.value)}
        />
        <FieldError field="email" errors={errors} />
      </div>

      <div>
        <Label htmlFor="cloudwifi-phone" className="text-base text-circleTel-navy">
          Phone number
        </Label>
        <Input
          ref={registerControl("phone")}
          id="cloudwifi-phone"
          name="contact.phone"
          aria-label="South African phone number"
          aria-required="true"
          required
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={describedBy("phone", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange-accessible md:text-base"
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
          Best time to call
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
          <option value="">Select a time</option>
          {CONTACT_TIME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError field="preferredContactTime" errors={errors} />
      </div>

      <div className="rounded-lg border border-circleTel-navy/10 bg-circleTel-lightNeutral/60 p-4">
        <label className="flex cursor-pointer items-start gap-3 text-base text-circleTel-navy">
          <input
            ref={registerControl("consent")}
            type="checkbox"
            name="contact.consent"
            aria-label="Consent to contact"
            aria-required="true"
            required
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={describedBy("consent", errors)}
            className="mt-1 h-5 w-5 rounded border-circleTel-navy/30 text-circleTel-orange-accessible focus:ring-circleTel-orange-accessible"
            checked={draft.contact.consent}
            onChange={(event) => {
              const checked = event.target.checked;
              const nextDraft: CloudWifiSurveyDraft = {
                ...draft,
                contact: {
                  ...draft.contact,
                  consent: checked,
                  consentedAt: checked ? new Date().toISOString() : "",
                },
              };
              setDraft(nextDraft);
              if (errors.consent) {
                const nextMessage = validateStep(1, nextDraft).consent;
                setErrors((current) => {
                  const next = { ...current };
                  if (nextMessage) next.consent = nextMessage;
                  else delete next.consent;
                  return next;
                });
              }
            }}
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

  const venueStep = (
    <div className="space-y-5">
      <div>
        <Label
          htmlFor="cloudwifi-venueType"
          className="text-base text-circleTel-navy"
        >
          What kind of venue is it?
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
        <Label htmlFor="cloudwifi-city" className="text-base text-circleTel-navy">
          City or area
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
          htmlFor="cloudwifi-sizeBucket"
          className="text-base text-circleTel-navy"
        >
          Roughly how big is the space?
        </Label>
        <select
          ref={registerControl("sizeBucket")}
          id="cloudwifi-sizeBucket"
          name="venue.sizeBucket"
          aria-label="Approximate venue size"
          aria-required="true"
          required
          aria-invalid={Boolean(errors.sizeBucket)}
          aria-describedby={describedBy("sizeBucket", errors)}
          className={`${controlClassName} mt-2`}
          value={draft.venue.sizeBucket}
          onChange={(event) => {
            const value = event.target.value as CloudWifiVenueSizeBucket;
            const floorArea = value ? SIZE_TO_FLOOR_AREA[value] : undefined;
            setDraft((current) => ({
              ...current,
              venue: {
                ...current.venue,
                sizeBucket: value,
                floorArea:
                  typeof floorArea === "number" ? floorArea : current.venue.floorArea,
              },
            }));
            if (errors.sizeBucket) {
              setErrors((current) => {
                const next = { ...current };
                delete next.sizeBucket;
                return next;
              });
            }
          }}
        >
          <option value="">Select a size</option>
          {SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-circleTel-secondaryNeutral">
          A rough estimate is fine. We confirm this during the site survey.
        </p>
        <FieldError field="sizeBucket" errors={errors} />
      </div>

      <div>
        <Label
          htmlFor="cloudwifi-requirements"
          className="text-base text-circleTel-navy"
        >
          Anything we should know?{" "}
          <span className="font-normal text-circleTel-secondaryNeutral">
            (optional)
          </span>
        </Label>
        <textarea
          ref={registerControl("requirements")}
          id="cloudwifi-requirements"
          name="details.requirements"
          aria-label="Anything we should know (optional)"
          aria-invalid={Boolean(errors.requirements)}
          aria-describedby={describedBy("requirements", errors)}
          className={`${textAreaClassName} mt-2`}
          maxLength={2000}
          value={draft.details.requirements}
          onChange={(event) => updateRequirements(event.target.value)}
          placeholder="e.g. guest Wi-Fi for a 40-room lodge, or coverage for outdoor seating"
        />
        <FieldError field="requirements" errors={errors} />
      </div>
    </div>
  );

  const stepCopy: Record<
    WizardStep,
    { title: string; description: string }
  > = {
    1: {
      title: "How can we reach you?",
      description:
        "Share your details and we will call to schedule a free site survey.",
    },
    2: {
      title: "Where should we survey?",
      description:
        "A few simple details help us prepare. No technical knowledge needed.",
    },
  };

  const panel = leadId ? (
    <div className="space-y-5 p-6 sm:p-7">
      <h2
        id="cloudwifi-survey-heading"
        tabIndex={-1}
        className="rounded-md font-heading text-2xl font-bold text-circleTel-navy outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2"
      >
        Request received
      </h2>
      <p className="text-base leading-7 text-circleTel-secondaryNeutral">
        Thanks. A CircleTel specialist will contact you within one business day
        to schedule your site survey.
      </p>
      <p className="text-base text-circleTel-navy">
        Your lead reference is{" "}
        <span className="font-semibold break-all">{leadId}</span>.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" size="lg">
          <a
            href={getWhatsAppLink(
              "Hi CircleTel, I just requested a CloudWiFi site survey.",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact us on WhatsApp
          </a>
        </Button>
        <Button
          type="button"
          variant="cta"
          size="lg"
          className="bg-circleTel-orange-accessible hover:bg-circleTel-orange-accessible hover:brightness-90 focus-visible:ring-circleTel-orange-accessible"
          onClick={reset}
        >
          Reset form
        </Button>
      </div>
    </div>
  ) : (
    <form className="space-y-6 p-6 sm:p-7" onSubmit={handleSubmit} noValidate>
      <div className="space-y-3">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.12em] text-circleTel-orange-accessible">
          Site survey request
        </p>
        <h2
          ref={headingRef}
          id="cloudwifi-survey-heading"
          tabIndex={-1}
          className="rounded-md font-heading text-2xl font-bold text-circleTel-navy outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2"
        >
          {stepCopy[step].title}
        </h2>
        <p className="text-base leading-7 text-circleTel-secondaryNeutral">
          {stepCopy[step].description}
        </p>
      </div>

      {progress}

      <div
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="cloudwifi-website">Company website</label>
        <input
          id="cloudwifi-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {step === 1 ? contactStep : null}
      {step === 2 ? venueStep : null}

      {submitError ? (
        <div className="space-y-3" role="alert">
          <p className="text-sm text-red-700">{submitError}</p>
          {formSubmissionLockedRef.current ? (
            <Button
              type="button"
              variant="cta"
              size="lg"
              className="bg-circleTel-orange-accessible text-white hover:bg-circleTel-orange-accessible hover:brightness-90"
              disabled={submitting}
              onClick={() => {
                formSubmissionLockedRef.current = false;
                void submitDraft();
              }}
            >
              Retry submission
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={submitting}
            onClick={goBack}
          >
            Back
          </Button>
        ) : (
          <span />
        )}
        {step === 1 ? (
          <Button
            type="submit"
            variant="cta"
            size="lg"
            className="bg-circleTel-orange-accessible hover:bg-circleTel-orange-accessible hover:brightness-90 focus-visible:ring-circleTel-orange-accessible"
            onClick={(event) => {
              event.preventDefault();
              continueToNextStep();
            }}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            variant="cta"
            size="lg"
            className="bg-circleTel-orange-accessible hover:bg-circleTel-orange-accessible hover:brightness-90 focus-visible:ring-circleTel-orange-accessible"
            disabled={submitting}
          >
            {submitting ? "Sending request…" : "Request a site survey"}
          </Button>
        )}
      </div>
      <p className="text-sm text-circleTel-secondaryNeutral">
        Step {step} of 2 · Takes about two minutes
      </p>
    </form>
  );

  if (!hydrated) {
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
              Share your details so CircleTel can schedule a venue site survey.
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
