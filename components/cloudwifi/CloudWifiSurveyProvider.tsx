"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { CloudWifiSurveyRequest } from "@/lib/cloudwifi/survey-schema";
import type {
  CloudWifiBackhaul,
  CloudWifiVenueType,
} from "@/lib/cloudwifi/types";

type SurveyDetails = CloudWifiSurveyRequest["details"];
type SurveyContact = CloudWifiSurveyRequest["contact"];
type SurveyAttribution = CloudWifiSurveyRequest["attribution"];

export interface CloudWifiSurveyDraft {
  venue: {
    venueType: CloudWifiVenueType | "";
    floorArea: number | "";
    peakUsers: number | "";
    city: string;
    siteAddress: string;
    postalCode: string;
    backhaul: CloudWifiBackhaul | "";
  };
  details: {
    floors: number | "";
    wallMaterial: SurveyDetails["wallMaterial"] | "";
    networks: SurveyDetails["networks"];
    addOns: SurveyDetails["addOns"];
    requirements: string;
  };
  contact: {
    fullName: string;
    companyName: string;
    email: string;
    phone: string;
    preferredContactTime: SurveyContact["preferredContactTime"] | "";
    consent: boolean;
    consentedAt: string;
  };
  attribution: {
    pageSource: "cloudwifi_product_page";
    utmSource?: SurveyAttribution["utmSource"];
    utmMedium?: SurveyAttribution["utmMedium"];
    utmCampaign?: SurveyAttribution["utmCampaign"];
    referrer?: SurveyAttribution["referrer"];
  };
}

export interface CloudWifiSurveyContextValue {
  draft: CloudWifiSurveyDraft;
  setDraft: React.Dispatch<React.SetStateAction<CloudWifiSurveyDraft>>;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  requestSurvey: (prefill?: Partial<CloudWifiSurveyDraft["venue"]>) => void;
  resetSurvey: () => void;
}

function createSurveyDraft(): CloudWifiSurveyDraft {
  return {
    venue: {
      venueType: "",
      floorArea: "",
      peakUsers: "",
      city: "",
      siteAddress: "",
      postalCode: "",
      backhaul: "",
    },
    details: {
      floors: "",
      wallMaterial: "",
      networks: [],
      addOns: [],
      requirements: "",
    },
    contact: {
      fullName: "",
      companyName: "",
      email: "",
      phone: "",
      preferredContactTime: "",
      consent: false,
      consentedAt: "",
    },
    attribution: {
      pageSource: "cloudwifi_product_page",
    },
  };
}

const CloudWifiSurveyContext =
  createContext<CloudWifiSurveyContextValue | null>(null);

function matchesMedia(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return false;

  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

function focusSurveyHeading(): void {
  if (typeof document === "undefined") return;
  document.getElementById("cloudwifi-survey-heading")?.focus();
}

export function CloudWifiSurveyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState<CloudWifiSurveyDraft>(createSurveyDraft);
  const [mobileOpen, setMobileOpen] = useState(false);

  const requestSurvey = useCallback(
    (prefill?: Partial<CloudWifiSurveyDraft["venue"]>) => {
      if (prefill) {
        setDraft((current) => ({
          ...current,
          venue: { ...current.venue, ...prefill },
        }));
      }

      if (matchesMedia("(max-width: 767px)")) {
        setMobileOpen(true);
      } else if (typeof document !== "undefined") {
        document.getElementById("cloudwifi-survey")?.scrollIntoView({
          behavior: matchesMedia("(prefers-reduced-motion: reduce)")
            ? "auto"
            : "smooth",
          block: "start",
        });
      }

      if (
        typeof window !== "undefined" &&
        typeof window.requestAnimationFrame === "function"
      ) {
        window.requestAnimationFrame(focusSurveyHeading);
      } else if (typeof window !== "undefined") {
        window.setTimeout(focusSurveyHeading, 0);
      }
    },
    [],
  );

  const resetSurvey = useCallback(() => {
    setDraft(createSurveyDraft());
    setMobileOpen(false);
  }, []);

  const value = useMemo<CloudWifiSurveyContextValue>(
    () => ({
      draft,
      setDraft,
      mobileOpen,
      setMobileOpen,
      requestSurvey,
      resetSurvey,
    }),
    [draft, mobileOpen, requestSurvey, resetSurvey],
  );

  return (
    <CloudWifiSurveyContext.Provider value={value}>
      {children}
    </CloudWifiSurveyContext.Provider>
  );
}

export function useCloudWifiSurvey(): CloudWifiSurveyContextValue {
  const context = useContext(CloudWifiSurveyContext);

  if (!context) {
    throw new Error(
      "useCloudWifiSurvey must be used within a CloudWifiSurveyProvider.",
    );
  }

  return context;
}
