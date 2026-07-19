import type { IconType } from "react-icons";
import {
  PiBlueprintBold,
  PiBuildingsBold,
  PiClipboardTextBold,
  PiCloudBold,
  PiDoorOpenBold,
  PiGraduationCapBold,
  PiHeartbeatBold,
  PiMapPinAreaBold,
  PiShieldCheckBold,
  PiStorefrontBold,
  PiUsersBold,
  PiUsersThreeBold,
  PiUserSwitchBold,
  PiWallBold,
  PiWifiHighBold,
  PiWrenchBold,
} from "react-icons/pi";

export interface VenueTypeContent {
  readonly title: string;
  readonly description: string;
  readonly imageBase: string;
  readonly imageAlt: string;
  readonly icon: IconType;
}

export interface PricingTierContent {
  readonly name: string;
  readonly guide: string;
  readonly apRange: string;
  readonly price: string;
  readonly capacity: string;
  readonly features: readonly string[];
  readonly accentClassName: string;
  readonly recommended?: boolean;
}

export interface IconContent {
  readonly title: string;
  readonly description: string;
  readonly icon: IconType;
}

export const primaryVenueTypes = [
  {
    title: "Hospitality",
    description:
      "Keep guests connected in rooms, lobbies and F&B without congesting staff systems.",
    imageBase: "/images/cloudwifi/venue-hospitality",
    imageAlt: "Guests dining in a warmly lit hospitality venue",
    icon: PiDoorOpenBold,
  },
  {
    title: "Retail",
    description:
      "Support denser floors, guest Wi-Fi and back-of-house devices from one managed design.",
    imageBase: "/images/cloudwifi/venue-retail",
    imageAlt: "Customers browsing a contemporary retail store",
    icon: PiStorefrontBold,
  },
  {
    title: "Property & offices",
    description:
      "Add reliable shared-space connectivity with clear ownership after handover.",
    imageBase: "/images/cloudwifi/venue-property",
    imageAlt: "Modern multi-storey residential property",
    icon: PiBuildingsBold,
  },
] as const satisfies readonly VenueTypeContent[];

export const secondaryVenueLabels = [
  "Healthcare",
  "Education",
  "Public venues",
] as const;

/** Full catalogue kept for image assets and broader references. */
export const venueTypes = [
  ...primaryVenueTypes,
  {
    title: "Healthcare",
    description: "Enable staff productivity and patient connectivity.",
    imageBase: "/images/cloudwifi/venue-healthcare",
    imageAlt: "Bright modern healthcare reception and waiting area",
    icon: PiHeartbeatBold,
  },
  {
    title: "Education",
    description: "Keep learning reliable, secure and simple to access.",
    imageBase: "/images/cloudwifi/venue-education",
    imageAlt: "Students learning together in a connected classroom",
    icon: PiGraduationCapBold,
  },
  {
    title: "Public venues",
    description: "Connect large crowds simply and securely.",
    imageBase: "/images/cloudwifi/venue-public",
    imageAlt: "Audience gathered in a large public venue",
    icon: PiUsersThreeBold,
  },
] as const satisfies readonly VenueTypeContent[];

export const pricingTiers = [
  {
    name: "Essential",
    guide: "Up to 300 sqm",
    apRange: "1–2 APs",
    price: "R1,499",
    capacity: "Up to 2 APs",
    features: [
      "High-speed Wi-Fi",
      "Guest network",
      "Cloud monitoring",
      "Standard support",
    ],
    accentClassName: "border-t-circleTel-orange-accessible",
  },
  {
    name: "Professional",
    guide: "300–800 sqm",
    apRange: "3–5 APs",
    price: "R3,499",
    capacity: "Up to 5 APs",
    features: [
      "Everything in Essential",
      "Guest and staff separation",
      "Multi-zone Wi-Fi design",
      "Priority support",
    ],
    accentClassName: "border-t-circleTel-orange",
    recommended: true,
  },
  {
    name: "Enterprise",
    guide: "800–2,000 sqm",
    apRange: "6–12 APs",
    price: "R7,999",
    capacity: "Up to 12 APs",
    features: [
      "Everything in Professional",
      "Higher-density AP design",
      "Advanced segmentation",
      "SLA-backed support",
    ],
    accentClassName: "border-t-circleTel-charcoal",
  },
  {
    name: "Campus",
    guide: "Large or multi-building sites",
    apRange: "12–30+ APs",
    price: "R14,999",
    capacity: "Up to 20 APs before custom expansion",
    features: [
      "Everything in Enterprise",
      "Multi-building design",
      "Phased rollout planning",
      "Dedicated support",
    ],
    accentClassName: "border-t-circleTel-navy",
  },
] as const satisfies readonly PricingTierContent[];

export const priceDrivers = [
  {
    title: "Floor area",
    description: "Usable square metres set the coverage footprint and AP count.",
    icon: PiMapPinAreaBold,
  },
  {
    title: "Walls and materials",
    description:
      "Dense walls and metal can reduce signal and add access points.",
    icon: PiWallBold,
  },
  {
    title: "How busy it gets",
    description: "Peak occupancy and device mix drive capacity, not just speed.",
    icon: PiUsersBold,
  },
] as const satisfies readonly IconContent[];

export const includedFeatureHighlights = [
  "Site survey and Wi-Fi design",
  "Professional installation",
  "24/7 monitoring and updates",
] as const;

export const includedFeatures = [
  ...includedFeatureHighlights,
  "Enterprise Wi-Fi 6 access points",
  "Guest network",
  "Proactive maintenance",
  "Monthly reporting",
] as const;

export const addOnHighlights = [
  "Captive portal",
  "Advanced analytics",
  "LTE/5G failover",
  "Content filtering",
] as const;

export const addOns = [
  ...addOnHighlights,
  "Bandwidth shaping",
  "LAN and Wi-Fi optimisation",
  "Multi-site management",
  "Custom integrations",
] as const;

export const whyCircleTel = [
  "South African team and support",
  "Vendor-agnostic advice",
  "Transparent, survey-led pricing",
] as const;

export const proofStripCopy =
  "Trusted by South African operators who need Wi-Fi that just works on busy days.";

export const processSteps = [
  {
    title: "Site survey",
    description: "We assess your venue, coverage needs and expected usage.",
    icon: PiClipboardTextBold,
  },
  {
    title: "Design",
    description: "We plan AP placement, segmentation and security.",
    icon: PiBlueprintBold,
  },
  {
    title: "Installation",
    description: "Our team installs, configures and validates the network.",
    icon: PiWrenchBold,
  },
  {
    title: "Manage",
    description: "We monitor, maintain and optimise the service for you.",
    icon: PiCloudBold,
  },
] as const satisfies readonly IconContent[];

export const serviceAssurances = [
  { title: "Wi-Fi 6 access points", icon: PiWifiHighBold },
  { title: "Guest and staff separation", icon: PiUserSwitchBold },
  { title: "Cloud management", icon: PiCloudBold },
  { title: "Managed support", icon: PiShieldCheckBold },
] as const satisfies readonly {
  readonly title: string;
  readonly icon: IconType;
}[];
