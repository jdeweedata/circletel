"use client";

import React, { useMemo, useState } from "react";

import {
  type CloudWifiVenueSizeBucket,
  useCloudWifiSurvey,
} from "@/components/cloudwifi/CloudWifiSurveyProvider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { recommendCloudWifiTier } from "@/lib/cloudwifi/tier-recommendation";
import type { CloudWifiVenueType } from "@/lib/cloudwifi/types";

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

const SIZE_OPTIONS: ReadonlyArray<{
  value: Exclude<CloudWifiVenueSizeBucket, "">;
  label: string;
}> = [
  { value: "small", label: "Small (up to about 300 m²)" },
  { value: "medium", label: "Medium (about 300–800 m²)" },
  { value: "large", label: "Large (800 m² or more)" },
  { value: "unknown", label: "Not sure yet" },
];

/** Maps public size buckets to recommendation inputs (peak users stay internal). */
const SIZE_TO_ESTIMATE: Record<
  Exclude<CloudWifiVenueSizeBucket, "" | "unknown">,
  { floorArea: number; peakUsers: number; guideNote: string }
> = {
  small: {
    floorArea: 250,
    peakUsers: 30,
    guideNote: "A solid starting point for compact venues.",
  },
  medium: {
    floorArea: 550,
    peakUsers: 100,
    guideNote: "Fits most mid-size venues. Survey required before install.",
  },
  large: {
    floorArea: 1200,
    peakUsers: 250,
    guideNote: "Built for larger floors and higher capacity needs.",
  },
};

const controlClassName =
  "h-11 w-full rounded-md border border-circleTel-navy/20 bg-white px-3 text-base text-circleTel-navy outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2";

function formatMonthlyPrice(price: number): string {
  return `R${price.toLocaleString("en-US")}`;
}

export function CloudWifiTierEstimator() {
  const { requestSurvey } = useCloudWifiSurvey();
  const [venueType, setVenueType] = useState<CloudWifiVenueType | "">("");
  const [sizeBucket, setSizeBucket] = useState<CloudWifiVenueSizeBucket>("");

  const recommendation = useMemo(() => {
    if (!venueType || !sizeBucket || sizeBucket === "unknown") {
      return null;
    }

    const estimate = SIZE_TO_ESTIMATE[sizeBucket];
    if (!estimate) return null;

    const result = recommendCloudWifiTier({
      venueType,
      floorArea: estimate.floorArea,
      peakUsers: estimate.peakUsers,
      backhaul: "unknown",
    });

    return { ...result, guideNote: estimate.guideNote, sizeBucket };
  }, [sizeBucket, venueType]);

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
          Find a guide tier
        </h2>
        <p className="mt-1 text-base text-circleTel-secondaryNeutral">
          Two quick details. A site survey confirms the final design and price.
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
            htmlFor="cloudwifi-estimator-size"
            className="text-circleTel-navy"
          >
            Roughly how big is the space?
          </Label>
          <select
            id="cloudwifi-estimator-size"
            aria-label="Approximate venue size"
            className={controlClassName}
            value={sizeBucket}
            onChange={(event) =>
              setSizeBucket(event.target.value as CloudWifiVenueSizeBucket)
            }
          >
            <option value="">Select a size</option>
            {SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-circleTel-secondaryNeutral">
            A rough estimate is fine. We confirm this on site.
          </p>
        </div>
      </div>

      <div
        aria-live="polite"
        className="mt-6 border-t border-circleTel-navy/10 pt-5"
      >
        {!venueType || !sizeBucket ? (
          <p className="rounded-lg bg-circleTel-lightNeutral p-4 text-base font-medium text-circleTel-navy">
            Select your venue and size to see a guide tier
          </p>
        ) : sizeBucket === "unknown" ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-circleTel-orange-light p-4 text-base text-circleTel-navy">
              No problem. Request a site survey and we will size the network
              with you on site.
            </p>
            <Button
              type="button"
              data-cloudwifi-survey-opener="true"
              variant="cta"
              size="lg"
              className="w-full bg-circleTel-orange-accessible hover:bg-circleTel-orange-accessible hover:brightness-90 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2"
              onClick={(event) =>
                requestSurvey(
                  {
                    venueType: venueType as CloudWifiVenueType,
                    sizeBucket: "unknown",
                  },
                  event.currentTarget,
                )
              }
            >
              Request a site survey
            </Button>
          </div>
        ) : !recommendation ? (
          <p className="rounded-lg bg-circleTel-lightNeutral p-4 text-base font-medium text-circleTel-navy">
            Select your venue and size to see a guide tier
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#efd2b4] bg-circleTel-orange-light p-4 transition-colors">
              <p className="text-sm font-semibold uppercase tracking-wide text-circleTel-navy">
                Guide tier
              </p>
              <h3 className="mt-1 font-heading text-2xl font-bold text-circleTel-navy">
                {recommendation.tierDetails.name}
              </h3>
              <p className="mt-2 text-circleTel-navy">
                <span className="text-base text-circleTel-secondaryNeutral">
                  from{" "}
                </span>
                <span className="font-heading text-3xl font-bold">
                  {formatMonthlyPrice(recommendation.tierDetails.startingPrice)}
                </span>{" "}
                <span className="text-base text-circleTel-secondaryNeutral">
                  /mo excl. VAT
                </span>
              </p>
              <p className="mt-1 text-base font-semibold text-circleTel-navy">
                {recommendation.tierDetails.apRange}
              </p>
              <p className="mt-2 text-base text-circleTel-secondaryNeutral">
                {recommendation.guideNote}
              </p>
            </div>

            <Button
              type="button"
              data-cloudwifi-survey-opener="true"
              variant="cta"
              size="lg"
              className="w-full bg-circleTel-orange-accessible hover:bg-circleTel-orange-accessible hover:brightness-90 focus-visible:ring-circleTel-orange-accessible focus-visible:ring-offset-2"
              onClick={(event) =>
                requestSurvey(
                  {
                    venueType: recommendation.venueType,
                    floorArea: recommendation.floorArea,
                    sizeBucket: recommendation.sizeBucket,
                    backhaul: "unknown",
                  },
                  event.currentTarget,
                )
              }
            >
              Request a site survey
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
