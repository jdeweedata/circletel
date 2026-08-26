import type { IconType } from "react-icons";
import {
  PiBlueprintBold,
  PiBuildingsBold,
  PiClipboardTextBold,
  PiCloudBold,
  PiDoorOpenBold,
  PiGaugeBold,
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

import type { CloudWifiBackhaul, CloudWifiVenueType } from "@/lib/cloudwifi/types";

export interface VenueTypeContent {
  readonly value: CloudWifiVenueType;
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
}

export interface IconContent {
  readonly title: string;
  readonly description: string;
  readonly icon: IconType;
}

export const venueTypes = [
  {
    value: "hospitality",
    title: "Hospitality",
    description: "Keep guests connected and encourage longer stays.",
    imageBase: "/images/cloudwifi/venue-hospitality",
    imageAlt: "Guests dining in a warmly lit hospitality venue",
    icon: PiDoorOpenBold,
  },
  {
    value: "retail",
    title: "Retail",
    description: "Support smoother visits and repeat engagement.",
    imageBase: "/images/cloudwifi/venue-retail",
    imageAlt: "Customers browsing a contemporary retail store",
    icon: PiStorefrontBold,
  },
  {
    value: "property",
    title: "Property",
    description: "Add managed connectivity to valuable shared spaces.",
    imageBase: "/images/cloudwifi/venue-property",
    imageAlt: "Modern multi-storey residential property",
    icon: PiBuildingsBold,
  },
  {
    value: "healthcare",
    title: "Healthcare",
    description: "Enable staff productivity and patient connectivity.",
    imageBase: "/images/cloudwifi/venue-healthcare",
    imageAlt: "Bright modern healthcare reception and waiting area",
    icon: PiHeartbeatBold,
  },
  {
    value: "education",
    title: "Education",
    description: "Keep learning reliable, secure and simple to access.",
    imageBase: "/images/cloudwifi/venue-education",
    imageAlt: "Students learning together in a connected classroom",
    icon: PiGraduationCapBold,
  },
  {
    value: "public_venue",
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
    accentClassName: "border-t-circleTel-navy",
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
    accentClassName: "border-t-circleTel-orange",
  },
] as const satisfies readonly PricingTierContent[];

export const priceDrivers = [
  {
    title: "Floor area",
    description: "Usable square metres determine the coverage footprint.",
    icon: PiMapPinAreaBold,
  },
  {
    title: "Walls and building materials",
    description:
      "Dense walls and metal reduce signal and can require more APs.",
    icon: PiWallBold,
  },
  {
    title: "User density",
    description: "More concurrent users raise capacity and performance needs.",
    icon: PiUsersBold,
  },
  {
    title: "Your internet connection",
    description:
      "How fast and reliable the internet coming into the building is. Fibre is usually strongest; wireless or mobile can work when the signal is good.",
    icon: PiGaugeBold,
  },
] as const satisfies readonly IconContent[];

export const includedFeatures = [
  "Site survey and Wi-Fi design",
  "Professional installation",
  "Enterprise Wi-Fi 6 access points",
  "Guest network",
  "Managed cloud platform",
  "Proactive monitoring",
  "Proactive maintenance",
  "Firmware and security updates",
  "Monthly reporting",
] as const;

export const addOns = [
  "Captive portal",
  "Advanced analytics and insights",
  "Content filtering",
  "LTE/5G failover",
  "Bandwidth shaping",
  "LAN and Wi-Fi optimisation",
  "Multi-site management",
  "Custom integrations",
] as const;

export const whyProvider = [
  "South African team and support",
  "Carrier-grade experience",
  "Vendor-agnostic advice",
  "Transparent, survey-led pricing",
  "Scales as your venue grows",
] as const;

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
  { title: "Managed cloud platform", icon: PiCloudBold },
  { title: "Managed support", icon: PiShieldCheckBold },
] as const satisfies readonly {
  readonly title: string;
  readonly icon: IconType;
}[];

export const internetConnectionOptions = [
  { value: "fibre", label: "Fibre" },
  { value: "licensed_wireless", label: "Dedicated wireless" },
  { value: "fixed_wireless", label: "Wireless antenna" },
  { value: "5g", label: "5G mobile" },
  { value: "lte", label: "LTE (4G)" },
  { value: "unknown", label: "Not sure" },
] as const satisfies ReadonlyArray<{
  readonly value: CloudWifiBackhaul;
  readonly label: string;
}>;

export const venueSelectOptions = [
  { value: "hospitality", label: "Hospitality" },
  { value: "retail", label: "Retail" },
  { value: "property", label: "Property" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "public_venue", label: "Public venue" },
] as const satisfies ReadonlyArray<{
  readonly value: CloudWifiVenueType;
  readonly label: string;
}>;
