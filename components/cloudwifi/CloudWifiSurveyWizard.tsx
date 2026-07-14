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
  CLOUDWIFI_SURVEY_NUMERIC_LIMITS,
  CLOUDWIFI_VENUE_TYPES,
  type CloudWifiBackhaul,
  type CloudWifiVenueType,
} from "@/lib/cloudwifi/types";

type WizardStep = 1 | 2 | 3 | 4;
type FieldErrors = Record<string, string>;

const STEP_NAMES = ["Venue", "Details", "Contact", "Review"] as const;

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
  "h-11 w-full rounded-md border border-circleTel-navy/20 bg-white px-3 text-base text-circleTel-navy outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange focus-visible:ring-offset-2";
const textAreaClassName =
  "min-h-24 w-full rounded-md border border-circleTel-navy/20 bg-white px-3 py-2 text-base text-circleTel-navy outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange focus-visible:ring-offset-2";

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
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact.email.trim()) ||
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

export function CloudWifiSurveyWizard() {
  const { draft, setDraft, mobileOpen, setMobileOpen, resetSurvey } =
    useCloudWifiSurvey();
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
    if (!leadId) onNextFrame(() => headingRef.current?.focus());
  }, [step, leadId]);

  useEffect(() => {
    if (leadId) onNextFrame(() => successHeadingRef.current?.focus());
  }, [leadId]);

  function registerControl(field: string) {
    return (node: HTMLElement | null) => {
      controlRefs.current[field] = node;
    };
  }

  function updateVenue<Key extends keyof CloudWifiSurveyDraft["venue"]>(
    field: Key,
    value: CloudWifiSurveyDraft["venue"][Key],
  ): void {
    setDraft((current) => ({
      ...current,
      venue: { ...current.venue, [field]: value },
    }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: "" }));
    }
  }

  function updateDetails<Key extends keyof CloudWifiSurveyDraft["details"]>(
    field: Key,
    value: CloudWifiSurveyDraft["details"][Key],
  ): void {
    setDraft((current) => ({
      ...current,
      details: { ...current.details, [field]: value },
    }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: "" }));
    }
  }

  function updateContact<Key extends keyof CloudWifiSurveyDraft["contact"]>(
    field: Key,
    value: CloudWifiSurveyDraft["contact"][Key],
  ): void {
    setDraft((current) => ({
      ...current,
      contact: { ...current.contact, [field]: value },
    }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: "" }));
    }
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
      setStep((step + 1) as WizardStep);
    }
  }

  function goBack(): void {
    if (submitting || step === 1) return;
    setErrors({});
    setSubmitError("");
    setStep((step - 1) as WizardStep);
  }

  function editStep(nextStep: WizardStep): void {
    if (submitting) return;
    setErrors({});
    setSubmitError("");
    setStep(nextStep);
  }

  async function submitDraft(): Promise<void> {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/leads/cloudwifi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        setSubmitError(
          "We could not send your request. Please try again, or contact us on WhatsApp.",
        );
        return;
      }

      let result: unknown;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      const responseLeadId =
        result &&
        typeof result === "object" &&
        "leadId" in result &&
        typeof result.leadId === "string"
          ? result.leadId.trim()
          : "";

      if (!responseLeadId) {
        setSubmitError(
          "We could not confirm your request. Please try again, or contact us on WhatsApp.",
        );
        return;
      }

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
    await submitDraft();
  }

  function reset(): void {
    resetSurvey();
    setStep(1);
    setErrors({});
    setSubmitError("");
    setLeadId("");
    setSubmitting(false);
    submittingRef.current = false;
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
          aria-label="Venue type"
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
          aria-label="Usable floor area in square metres"
          aria-invalid={Boolean(errors.floorArea)}
          aria-describedby={describedBy("floorArea", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange md:text-base"
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
          aria-label="City"
          aria-invalid={Boolean(errors.city)}
          aria-describedby={describedBy("city", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange md:text-base"
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
          aria-label="Expected peak concurrent users"
          aria-invalid={Boolean(errors.peakUsers)}
          aria-describedby={describedBy("peakUsers", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange md:text-base"
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
          aria-label="Internet backhaul"
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
          aria-label="Site address"
          aria-invalid={Boolean(errors.siteAddress)}
          aria-describedby={describedBy("siteAddress", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange md:text-base"
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
          aria-label="Postal code (optional)"
          aria-invalid={Boolean(errors.postalCode)}
          aria-describedby={describedBy("postalCode", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange md:text-base"
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
          aria-label="Number of floors"
          aria-invalid={Boolean(errors.floors)}
          aria-describedby={describedBy("floors", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange md:text-base"
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
          aria-label="Main wall or building material"
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
          aria-label="Full name"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={describedBy("fullName", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange md:text-base"
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
          aria-label="Venue or company name"
          aria-invalid={Boolean(errors.companyName)}
          aria-describedby={describedBy("companyName", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange md:text-base"
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
          aria-label="Email address"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy("email", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange md:text-base"
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
          aria-label="South African phone number"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={describedBy("phone", errors)}
          className="mt-2 h-11 border-circleTel-navy/20 text-base focus-visible:ring-circleTel-orange md:text-base"
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
          aria-label="Preferred contact time"
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
            aria-label="Consent to contact"
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={describedBy("consent", errors)}
            checked={draft.contact.consent}
            onChange={(event) => {
              const consent = event.target.checked;
              setDraft((current) => ({
                ...current,
                contact: {
                  ...current.contact,
                  consent,
                  consentedAt: consent ? new Date().toISOString() : "",
                },
              }));
              if (errors.consent) {
                setErrors((current) => ({ ...current, consent: "" }));
              }
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
    <div className="space-y-5 text-base text-circleTel-navy">
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
        className="font-heading text-2xl font-bold text-circleTel-navy outline-none"
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
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border-2 border-circleTel-orange px-4 text-base font-semibold text-circleTel-orange"
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
    <form onSubmit={handleSubmit} noValidate className="space-y-6 p-5 sm:p-6">
      {progress}
      <header>
        <h2
          ref={headingRef}
          id="cloudwifi-survey-heading"
          tabIndex={-1}
          className="font-heading text-2xl font-bold text-circleTel-navy outline-none"
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
            className="w-full text-base"
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
            type="button"
            variant="cta"
            size="lg"
            className="w-full text-base"
            disabled={submitting}
            onClick={continueToNextStep}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            variant="cta"
            size="lg"
            className="w-full text-base"
            disabled={submitting}
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

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-none overflow-y-auto p-0 sm:max-w-none"
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
