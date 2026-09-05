import type { IconBaseProps } from "react-icons";
import type { ReactNode } from "react";

// Original CloudWiFi artwork: a shared 32-unit grid and rounded, open silhouettes.
// currentColor keeps the outline readable on both navy and light page surfaces.
function icon(name: string, drawing: ReactNode) {
  function CloudWifiIcon({ size = "1em", color, title, children, ...props }: IconBaseProps) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size}
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        color={color} focusable="false" aria-hidden={title ? undefined : true} role={title ? "img" : undefined} {...props}>
        {title ? <title>{title}</title> : null}
        <rect x="3" y="3" width="26" height="26" rx="9" fill="#E87A1E" fillOpacity="0.14" stroke="none" />
        {drawing}{children}
      </svg>
    );
  }
  CloudWifiIcon.displayName = `CloudWifi${name}Icon`;
  return CloudWifiIcon;
}

const accent = { stroke: "#E87A1E", strokeWidth: 2.2 };
export const WifiIcon = icon("Wifi", <><path d="M5 11a17 17 0 0 1 22 0M9 16a11 11 0 0 1 14 0M13 21a5 5 0 0 1 6 0" /><circle cx="16" cy="26" r="1.5" fill="#E87A1E" stroke="none" /></>);
export const CloudIcon = icon("Cloud", <><path d="M10 23H8a5 5 0 0 1-1-10 9 9 0 0 1 17-2 6 6 0 0 1 0 12h-2" /><path {...accent} d="M16 16v12m-4-4 4 4 4-4" /></>);
export const NetworksIcon = icon("Networks", <><rect x="12" y="5" width="8" height="7" rx="2" /><path d="M16 12v6M8 22v-4h16v4" /><rect x="4" y="22" width="8" height="6" rx="2" /><rect {...accent} x="20" y="22" width="8" height="6" rx="2" /></>);
export const SupportIcon = icon("Support", <><path d="M6 19v-4a10 10 0 0 1 20 0v6c0 4-3 6-7 6" /><rect x="4" y="15" width="5" height="9" rx="2" /><rect x="23" y="15" width="5" height="9" rx="2" /><path {...accent} d="M14 27h5" /></>);
export const SurveyIcon = icon("Survey", <><rect x="7" y="6" width="18" height="23" rx="3" /><rect x="12" y="3" width="8" height="6" rx="2" /><path d="M12 14h8m-8 5h5" /><path {...accent} d="m15 24 3 3 6-7" /></>);
export const DesignIcon = icon("Design", <><rect x="4" y="5" width="24" height="23" rx="3" /><path d="M12 5v11H4m8 0h8v12m0-12h8" /><circle cx="21" cy="10" r="2" fill="#E87A1E" stroke="none" /><path {...accent} d="M8 23h5" /></>);
export const InstallIcon = icon("Install", <><path d="m7 27-3-3 13-13a7 7 0 0 1 9-8l-4 4 3 3 4-4a7 7 0 0 1-8 9Z" /><path {...accent} d="m8 23 4-4" /></>);
export const RetailIcon = icon("Retail", <><path d="M6 14v14h20V14M4 13l3-8h18l3 8" /><path d="M4 13c0 5 6 5 6 0 0 5 6 5 6 0 0 5 6 5 6 0 0 5 6 5 6 0" /><path {...accent} d="M13 28V20h6v8" /></>);
export const BuildingIcon = icon("Building", <><path d="M5 28V6h14v22M19 13h8v15M3 28h26" /><path d="M9 11h2m4 0h0m-6 5h2m4 0h0m8 2h0m0 5h0" /><path {...accent} d="M10 28v-6h4v6" /></>);
export const HospitalityIcon = icon("Hospitality", <><path d="M4 27V7m0 13h24v7M4 23h24M8 20v-8h7v8m0-6h9a4 4 0 0 1 4 4v2" /><path {...accent} d="M9 7h6" /></>);
export const HealthIcon = icon("Health", <><path d="M16 28 5 17C-3 8 9 0 16 9 23 0 35 8 27 17Z" /><path {...accent} d="M6 17h6l3-6 3 12 3-6h5" /></>);
export const EducationIcon = icon("Education", <><path d="m3 12 13-7 13 7-13 7ZM8 16v8c5 4 11 4 16 0v-8" /><path {...accent} d="M29 12v11" /></>);
export const UsersIcon = icon("Users", <><circle cx="12" cy="11" r="5" /><path d="M3 27v-3a9 9 0 0 1 18 0v3M22 7a5 5 0 0 1 0 10m2 3a7 7 0 0 1 5 7" /><path {...accent} d="M8 27h8" /></>);
export const CrowdIcon = icon("Crowd", <><circle cx="16" cy="10" r="4" /><circle cx="6" cy="15" r="3" /><circle cx="26" cy="15" r="3" /><path d="M9 27v-3a7 7 0 0 1 14 0v3M2 27v-3a4 4 0 0 1 4-4m24 7v-3a4 4 0 0 0-4-4" /><path {...accent} d="M13 27h6" /></>);
export const AreaIcon = icon("Area", <><path d="M4 12V5h7m10 0h7v7m0 9v7h-7m-10 0H4v-7" /><path {...accent} d="m11 21 10-10m-6 0h6v6m-10-2v6h6" /></>);
export const WallIcon = icon("Wall", <><rect x="4" y="6" width="24" height="21" rx="2" /><path d="M4 13h24M4 20h24M12 6v7m9 0v7M12 20v7" /><path {...accent} d="M5 13h7" /></>);
export const SpeedIcon = icon("Speed", <><path d="M6 25a13 13 0 1 1 20 0ZM7 15l3 1m6-9v3m9 5-3 1" /><path {...accent} d="m16 22 5-10" /><circle cx="16" cy="22" r="2" fill="#E87A1E" stroke="none" /></>);
export const ShieldIcon = icon("Shield", <><path d="m16 3 11 4v9c0 7-11 13-11 13S5 23 5 16V7Z" /><path {...accent} d="m10 16 4 4 8-9" /></>);
export const MapIcon = icon("Map", <><path d="m3 8 8-4 10 4 8-4v21l-8 4-10-4-8 4ZM11 4v21m10-17v21" /><path {...accent} d="m7 17 7-4 10 5" /></>);
export const GlobeIcon = icon("Globe", <><circle cx="16" cy="16" r="13" /><ellipse cx="16" cy="16" rx="6" ry="13" /><path d="M4 12h24M4 20h24" /><path {...accent} d="M16 3v26" /></>);
