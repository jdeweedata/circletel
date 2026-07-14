"use client";

import React, { useMemo, useState } from "react";

import { useCloudWifiSurvey } from "@/components/cloudwifi/CloudWifiSurveyProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recommendCloudWifiTier } from "@/lib/cloudwifi/tier-recommendation";
import {
  CLOUDWIFI_SURVEY_NUMERIC_LIMITS,
  type CloudWifiBackhaul,
  type CloudWifiVenueType,
} from "@/lib/cloudwifi/types";

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

const controlClassName =
  "h-11 w-full rounded-md border border-circleTel-navy/20 bg-white px-3 text-base text-circleTel-navy outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange focus-visible:ring-offset-2";

function positiveNumber(
  value: string,
  maximum: number,
  integer = false,
): number | undefined {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return undefined;

  const parsed = Number(normalized);
  if (
    !Number.isFinite(parsed) ||
    parsed <= 0 ||
    parsed > maximum ||
    (integer && !Number.isInteger(parsed))
  ) {
    return undefined;
  }

  return parsed;
}

function formatMonthlyPrice(price: number): string {
  return `R${price.toLocaleString("en-US")}`;
}

export function CloudWifiTierEstimator() {
  const { requestSurvey } = useCloudWifiSurvey();
  const [venueType, setVenueType] = useState<CloudWifiVenueType | "">("");
  const [floorAreaInput, setFloorAreaInput] = useState("");
  const [peakUsersInput, setPeakUsersInput] = useState("");
  const [backhaul, setBackhaul] = useState<CloudWifiBackhaul | "">("");
  const floorArea = positiveNumber(
    floorAreaInput,
    CLOUDWIFI_SURVEY_NUMERIC_LIMITS.floorArea,
  );
  const peakUsers = positiveNumber(
    peakUsersInput,
    CLOUDWIFI_SURVEY_NUMERIC_LIMITS.peakUsers,
    true,
  );

  const recommendation = useMemo(() => {
    if (
      !venueType ||
      floorArea === undefined ||
      peakUsers === undefined ||
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
  }, [backhaul, floorArea, peakUsers, venueType]);

  return (
    <section
      aria-labelledby="cloudwifi-estimator-heading"
      className="rounded-2xl border border-circleTel-navy/10 bg-white p-5 shadow-lg sm:p-6"
    >
      <header className="mb-5">
        <h2
          id="cloudwifi-estimator-heading"
          className="font-heading text-2xl font-bold text-circleTel-navy"
        >
          Estimate your tier
        </h2>
        <p className="mt-1 text-base text-circleTel-secondaryNeutral">
          Answer four questions to see the right range for your site.
        </p>
      </header>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="cloudwifi-estimator-venue"
            className="text-circleTel-navy"
          >
            Venue type
          </Label>
          <select
            id="cloudwifi-estimator-venue"
            aria-label="Venue type"
            className={controlClassName}
            value={venueType}
            onChange={(event) =>
              setVenueType(event.target.value as CloudWifiVenueType | "")
            }
          >
            <option value="">Select venue type</option>
            {VENUE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="cloudwifi-estimator-area"
            className="text-circleTel-navy"
          >
            Usable floor area
          </Label>
          <Input
            id="cloudwifi-estimator-area"
            aria-label="Usable floor area"
            inputMode="decimal"
            min="0.1"
            max={CLOUDWIFI_SURVEY_NUMERIC_LIMITS.floorArea}
            step="0.1"
            type="number"
            value={floorAreaInput}
            onChange={(event) => setFloorAreaInput(event.target.value)}
            className="h-11 border-circleTel-navy/20 focus-visible:ring-circleTel-orange md:text-base"
          />
          <p className="text-sm text-circleTel-secondaryNeutral">
            Approximate square metres
          </p>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="cloudwifi-estimator-users"
            className="text-circleTel-navy"
          >
            Expected peak concurrent users
          </Label>
          <Input
            id="cloudwifi-estimator-users"
            aria-label="Expected peak concurrent users"
            inputMode="numeric"
            min="1"
            max={CLOUDWIFI_SURVEY_NUMERIC_LIMITS.peakUsers}
            step="1"
            type="number"
            value={peakUsersInput}
            onChange={(event) => setPeakUsersInput(event.target.value)}
            className="h-11 border-circleTel-navy/20 focus-visible:ring-circleTel-orange md:text-base"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="cloudwifi-estimator-backhaul"
            className="text-circleTel-navy"
          >
            Internet backhaul
          </Label>
          <select
            id="cloudwifi-estimator-backhaul"
            aria-label="Internet backhaul"
            className={controlClassName}
            value={backhaul}
            onChange={(event) =>
              setBackhaul(event.target.value as CloudWifiBackhaul | "")
            }
          >
            <option value="">Select backhaul</option>
            {BACKHAUL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        aria-live="polite"
        className="mt-6 border-t border-circleTel-navy/10 pt-5"
      >
        {!recommendation ? (
          <p className="rounded-lg bg-circleTel-lightNeutral p-4 text-base font-medium text-circleTel-navy">
            Select your details to see a recommendation
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-circleTel-navy">
                Your recommended tier
              </p>
              <h3 className="mt-1 font-heading text-2xl font-bold text-circleTel-navy">
                {recommendation.tierDetails.name}
              </h3>
              <p className="mt-2 text-circleTel-navy">
                <span className="font-heading text-3xl font-bold">
                  {formatMonthlyPrice(recommendation.tierDetails.startingPrice)}
                </span>{" "}
                <span className="text-base text-circleTel-secondaryNeutral">
                  /mo
                </span>
              </p>
              <p className="mt-1 text-base font-semibold text-circleTel-navy">
                {recommendation.tierDetails.apRange}
              </p>
            </div>

            <ul className="space-y-2 text-base text-circleTel-secondaryNeutral">
              {recommendation.reasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>

            {recommendation.backhaulGuidance ? (
              <p className="rounded-lg bg-circleTel-lightNeutral p-3 text-base text-circleTel-secondaryNeutral">
                {recommendation.backhaulGuidance}
              </p>
            ) : null}

            <Button
              type="button"
              variant="cta"
              size="lg"
              className="w-full bg-circleTel-orange-accessible hover:bg-circleTel-orange-accessible hover:brightness-90 focus-visible:ring-circleTel-orange focus-visible:ring-offset-2"
              onClick={() =>
                requestSurvey({
                  venueType: recommendation.venueType,
                  floorArea: recommendation.floorArea,
                  peakUsers: recommendation.peakUsers,
                  backhaul: recommendation.backhaul,
                })
              }
            >
              Use this recommendation
            </Button>
            <p className="text-sm text-circleTel-secondaryNeutral">
              A site survey confirms the final tier and price.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
