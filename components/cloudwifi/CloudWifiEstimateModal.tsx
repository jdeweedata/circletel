"use client";

import React, { useRef, useState } from "react";

import {
  useCloudWifiSurvey,
  type CloudWifiSurveyDraft,
} from "@/components/cloudwifi/CloudWifiSurveyProvider";
import {
  CloudWifiTierEstimator,
  type CloudWifiTierEstimateValues,
} from "@/components/cloudwifi/CloudWifiTierEstimator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getWhatsAppLink } from "@/lib/constants/contact";
import { getTenantConfig } from "@/lib/tenant";

const SAFE_LEAD_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const RESERVED_LEAD_IDS = new Set(["received"]);

const controlClassName =
  "h-11 border-circleTel-navy/20 focus-visible:ring-circleTel-orange-accessible md:text-base";

const PLAN_INTEREST_PREFIX = "Pricing plan selected: CloudWiFi ";

function buildSimplePayload(draft: CloudWifiSurveyDraft, honeypot: string) {
  return {
    venue: {
      venueType: draft.venue.venueType,
      floorArea: draft.venue.floorArea,
      peakUsers: draft.venue.peakUsers,
      city: draft.venue.city,
      backhaul: draft.venue.backhaul,
    },
    details: {
      requirements: draft.details.requirements,
    },
    contact: {
      fullName: draft.contact.fullName,
      companyName: draft.contact.companyName,
      email: draft.contact.email,
      phone: draft.contact.phone,
      consent: draft.contact.consent,
      consentedAt: draft.contact.consentedAt,
    },
    attribution: draft.attribution,
    _hp: honeypot,
  };
}

export function CloudWifiEstimateModal() {
  const {
    draft,
    setDraft,
    mobileOpen,
    setMobileOpen,
    restoreSurveyFocus,
    resetSurvey,
  } = useCloudWifiSurvey();
  const [step, setStep] = useState<1 | 2>(1);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [leadId, setLeadId] = useState("");
  const idempotencyKeyRef = useRef<string | null>(null);
  const planInterest = draft.details.requirements.startsWith(
    PLAN_INTEREST_PREFIX,
  )
    ? draft.details.requirements.slice(PLAN_INTEREST_PREFIX.length)
    : "";

  function closeModal(open: boolean): void {
    if (open) {
      setMobileOpen(true);
      return;
    }
    setMobileOpen(false);
    setStep(1);
    setSubmitError("");
    setLeadId("");
    setHoneypot("");
    setSubmitting(false);
    restoreSurveyFocus();
  }

  function handleEstimateContinue(values: CloudWifiTierEstimateValues): void {
    setDraft((current) => ({
      ...current,
      venue: {
        ...current.venue,
        ...values,
      },
    }));
    setStep(2);
    setSubmitError("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (submitting || leadId) return;

    const consentedAt = new Date().toISOString();
    const nextDraft: CloudWifiSurveyDraft = {
      ...draft,
      contact: {
        ...draft.contact,
        consent: true,
        consentedAt,
      },
    };
    setDraft(nextDraft);
    setSubmitting(true);
    setSubmitError("");

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `cw-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    }

    try {
      const response = await fetch("/api/leads/cloudwifi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        body: JSON.stringify(buildSimplePayload(nextDraft, honeypot)),
      });
      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        leadId?: string;
      } | null;

      if (!response.ok) {
        setSubmitError(
          "Check the highlighted fields and try again, or contact us on WhatsApp.",
        );
        return;
      }

      const responseLeadId =
        result?.success === true && typeof result.leadId === "string"
          ? result.leadId.trim()
          : "";

      if (
        !SAFE_LEAD_ID_PATTERN.test(responseLeadId) ||
        RESERVED_LEAD_IDS.has(responseLeadId)
      ) {
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
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={mobileOpen} onOpenChange={closeModal}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById("cloudwifi-survey-heading")?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreSurveyFocus();
        }}
        onPointerDownOutside={(event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            target.closest('[data-cloudwifi-survey-opener="true"]')
          ) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            target.closest('[data-cloudwifi-survey-opener="true"]')
          ) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle
            id="cloudwifi-survey-heading"
            tabIndex={-1}
            className="font-heading text-2xl text-circleTel-navy"
          >
            {leadId
              ? "We have your site survey request"
              : step === 1
                ? "Find your recommended CloudWiFi plan"
                : "How should we reach you?"}
          </DialogTitle>
          <DialogDescription className="text-base text-circleTel-secondaryNeutral">
            {leadId
              ? `A ${getTenantConfig().branding.companyName} specialist will contact you to schedule the survey.`
              : step === 1
                ? "Answer 5 quick questions to see your starting Wi-Fi plan and monthly price, excluding internet connectivity. Then choose whether to request a site survey."
                : "Leave your details so we can book a site survey."}
          </DialogDescription>
        </DialogHeader>

        {leadId ? (
          <div className="space-y-4">
            <p className="text-base text-circleTel-navy">
              Reference: <span className="font-semibold">{leadId}</span>
            </p>
            <Button
              type="button"
              variant="cta"
              className="w-full bg-circleTel-orange-accessible"
              onClick={() => {
                resetSurvey();
                closeModal(false);
              }}
            >
              Close
            </Button>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            {planInterest ? (
              <p className="rounded-lg border border-circleTel-orange-accessible/30 bg-circleTel-orange-light px-4 py-3 text-base text-circleTel-navy">
                <span className="font-semibold">
                  Checking the {planInterest} plan.
                </span>{" "}
                We will compare it with your venue details and recommend a
                different plan if it is a better fit.
              </p>
            ) : null}
            <CloudWifiTierEstimator
              initialVenueType={draft.venue.venueType}
              initialCity={draft.venue.city}
              continueLabel="Continue to survey request"
              onContinue={handleEstimateContinue}
            />
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="_hp"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
              className="absolute -left-[9999px] h-px w-px overflow-hidden"
            />
            <div className="space-y-2">
              <Label htmlFor="cloudwifi-contact-name">Full name</Label>
              <Input
                id="cloudwifi-contact-name"
                required
                autoComplete="name"
                value={draft.contact.fullName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    contact: {
                      ...current.contact,
                      fullName: event.target.value,
                    },
                  }))
                }
                className={controlClassName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cloudwifi-contact-company">Company name</Label>
              <Input
                id="cloudwifi-contact-company"
                required
                autoComplete="organization"
                value={draft.contact.companyName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    contact: {
                      ...current.contact,
                      companyName: event.target.value,
                    },
                  }))
                }
                className={controlClassName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cloudwifi-contact-email">Email</Label>
              <Input
                id="cloudwifi-contact-email"
                required
                type="email"
                autoComplete="email"
                value={draft.contact.email}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    contact: { ...current.contact, email: event.target.value },
                  }))
                }
                className={controlClassName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cloudwifi-contact-phone">Phone</Label>
              <Input
                id="cloudwifi-contact-phone"
                required
                type="tel"
                autoComplete="tel"
                value={draft.contact.phone}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    contact: { ...current.contact, phone: event.target.value },
                  }))
                }
                className={controlClassName}
              />
            </div>
            <label className="flex items-start gap-3 text-base text-circleTel-navy">
              <input
                type="checkbox"
                required
                checked={draft.contact.consent}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    contact: {
                      ...current.contact,
                      consent: event.target.checked,
                    },
                  }))
                }
                className="mt-1 h-4 w-4"
              />
              <span>
                I agree that {getTenantConfig().branding.companyName} may
                contact me about this CloudWiFi site survey.
              </span>
            </label>
            {submitError ? (
              <p className="text-base text-red-700" role="alert">
                {submitError}{" "}
                <a
                  href={getWhatsAppLink(
                    `Hi ${getTenantConfig().branding.companyName}, I need help requesting a CloudWiFi site survey.`,
                  )}
                  className="underline"
                >
                  WhatsApp us
                </a>
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="sm:w-1/3"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="cta"
                disabled={submitting}
                className="bg-circleTel-orange-accessible sm:flex-1"
              >
                {submitting ? "Sending…" : "Request a site survey"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
