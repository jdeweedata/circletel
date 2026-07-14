"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
type SurveyDraftAttribution = CloudWifiSurveyDraft["attribution"];

const UTM_VALUE_MAX_LENGTH = 200;
const REFERRER_MAX_LENGTH = 2048;

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
  requestSurvey: (
    prefill?: Partial<CloudWifiSurveyDraft["venue"]>,
    opener?: HTMLElement | null,
  ) => void;
  restoreSurveyFocus: () => boolean;
  resetSurvey: () => void;
}

function createSurveyDraft(
  attribution: SurveyDraftAttribution = {
    pageSource: "cloudwifi_product_page",
  },
): CloudWifiSurveyDraft {
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
    attribution: { ...attribution, pageSource: "cloudwifi_product_page" },
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

function focusSurveyOpener(target: HTMLElement | null): boolean {
  if (
    !target ||
    target.isConnected === false ||
    typeof target.focus !== "function"
  ) {
    return false;
  }

  try {
    target.focus({ preventScroll: true });
    return true;
  } catch {
    return false;
  }
}

function restoreStoredSurveyFocus(storedOpener: HTMLElement | null): boolean {
  if (focusSurveyOpener(storedOpener)) return true;

  if (
    typeof document === "undefined" ||
    typeof document.querySelector !== "function"
  ) {
    return false;
  }

  return focusSurveyOpener(
    document.querySelector<HTMLElement>(
      '[data-cloudwifi-survey-opener="true"]',
    ),
  );
}

function acquisitionAttribution(): Partial<SurveyDraftAttribution> {
  const attribution: Partial<SurveyDraftAttribution> = {};

  try {
    const search =
      typeof window.location?.search === "string" ? window.location.search : "";
    const searchParams = new URLSearchParams(search);
    const utmValues = [
      ["utm_source", "utmSource"],
      ["utm_medium", "utmMedium"],
      ["utm_campaign", "utmCampaign"],
    ] as const;

    for (const [parameter, field] of utmValues) {
      const value = searchParams.get(parameter)?.trim();
      if (value) attribution[field] = value.slice(0, UTM_VALUE_MAX_LENGTH);
    }
  } catch {
    // Browser privacy settings may make location unavailable.
  }

  try {
    const rawReferrer =
      typeof document.referrer === "string" ? document.referrer.trim() : "";
    if (rawReferrer) {
      const referrer = new URL(rawReferrer);
      if (referrer.protocol === "http:" || referrer.protocol === "https:") {
        attribution.referrer = `${referrer.origin}${referrer.pathname}`.slice(
          0,
          REFERRER_MAX_LENGTH,
        );
      }
    }
  } catch {
    // Ignore unavailable, malformed, and non-HTTP referrers.
  }

  return attribution;
}

export function CloudWifiSurveyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState<CloudWifiSurveyDraft>(createSurveyDraft);
  const [mobileOpen, setMobileOpen] = useState(false);
  const surveyOpenerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const captured = acquisitionAttribution();
    if (Object.keys(captured).length === 0) return;

    setDraft((current) => {
      const attribution = { ...current.attribution };
      if (!attribution.utmSource && captured.utmSource) {
        attribution.utmSource = captured.utmSource;
      }
      if (!attribution.utmMedium && captured.utmMedium) {
        attribution.utmMedium = captured.utmMedium;
      }
      if (!attribution.utmCampaign && captured.utmCampaign) {
        attribution.utmCampaign = captured.utmCampaign;
      }
      if (!attribution.referrer && captured.referrer) {
        attribution.referrer = captured.referrer;
      }

      return { ...current, attribution };
    });
  }, []);

  const requestSurvey = useCallback(
    (
      prefill?: Partial<CloudWifiSurveyDraft["venue"]>,
      opener?: HTMLElement | null,
    ) => {
      if (prefill) {
        setDraft((current) => ({
          ...current,
          venue: { ...current.venue, ...prefill },
        }));
      }

      if (matchesMedia("(max-width: 767px)")) {
        surveyOpenerRef.current = opener ?? null;
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

  const restoreSurveyFocus = useCallback((): boolean => {
    const storedOpener = surveyOpenerRef.current;
    surveyOpenerRef.current = null;
    return restoreStoredSurveyFocus(storedOpener);
  }, []);

  const resetSurvey = useCallback(() => {
    setDraft((current) => createSurveyDraft(current.attribution));
    setMobileOpen(false);
  }, []);

  const value = useMemo<CloudWifiSurveyContextValue>(
    () => ({
      draft,
      setDraft,
      mobileOpen,
      setMobileOpen,
      requestSurvey,
      restoreSurveyFocus,
      resetSurvey,
    }),
    [draft, mobileOpen, requestSurvey, resetSurvey, restoreSurveyFocus],
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
