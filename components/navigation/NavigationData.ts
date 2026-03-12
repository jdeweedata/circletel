import { PiBatteryFullBold, PiBookBold, PiBookOpenBold, PiClipboardTextBold, PiCloudBold, PiCurrencyDollarBold, PiDesktopTowerBold, PiDeviceMobileBold, PiFileTextBold, PiGlobeBold, PiGraphBold, PiHandshakeBold, PiLaptopBold, PiPackageBold, PiPowerBold, PiPulseBold, PiRocketBold, PiShieldCheckBold, PiSquaresFourBold, PiTrendUpBold, PiUsersBold, PiWifiHighBold } from 'react-icons/pi';
import type { IconType } from 'react-icons';

// Type definitions for proper typing
export type NavigationItem = {
  name: string;
  href: string;
  icon?: IconType;
  description?: string;
};

export type NavigationSection = {
  name: string;
  items: NavigationItem[];
  icon?: IconType;
};

// Updated managedITItems - now includes items from itSolutionsItems
// Note: "/services" overview link is added via prependItems in NavigationMenu.tsx
export const managedITItems: NavigationItem[] = [
  {
    name: "Small Business IT",
    href: "/services/small-business",
    icon: PiLaptopBold,
    description: "Tailored IT solutions for small businesses"
  },
  {
    name: "Mid-Size Business IT",
    href: "/services/mid-size",
    icon: PiTrendUpBold,
    description: "IT solutions for established mid-size companies"
  },
  {
    name: "Growth-Ready IT",
    href: "/services/growth-ready",
    icon: PiRocketBold,
    description: "Scalable IT solutions for rapidly growing businesses"
  },
  {
    name: "Security Solutions",
    href: "/services/security",
    icon: PiShieldCheckBold,
    description: "Protect your business with our security solutions"
  },
  {
    name: "Service Bundles",
    href: "/bundles",
    icon: PiPackageBold,
    description: "Combined IT and connectivity packages at discounted rates"
  },
  {
    name: "Value-Driven Pricing",
    href: "/pricing",
    icon: PiCurrencyDollarBold,
    description: "Transparent pricing plans for all services"
  }
];

// IT Solutions section is kept for reference but no longer used in navigation
export const itSolutionsItems: NavigationItem[] = [
  {
    name: "Small Business Recipes",
    href: "/services/small-business",
    icon: PiLaptopBold,
    description: "IT solutions tailored for small businesses"
  },
  {
    name: "Mid-Size Business Recipes",
    href: "/services/mid-size",
    icon: PiTrendUpBold,
    description: "IT solutions for growing mid-size companies"
  },
  {
    name: "Growth-Ready Recipes",
    href: "/services/growth-ready",
    icon: PiRocketBold,
    description: "Scalable IT solutions for rapid growth"
  },
  {
    name: "Service Bundles",
    href: "/bundles",
    icon: PiPackageBold,
    description: "Combined IT and connectivity packages at discounted rates"
  },
  {
    name: "Value-Driven Pricing",
    href: "/pricing",
    icon: PiCurrencyDollarBold,
    description: "Transparent pricing plans for all services"
  }
];

// Connectivity section - Product pages for SME/B2B offerings
export const connectivityItems: NavigationItem[] = [
  {
    name: "SkyFibre SMB",
    href: "/products/skyfibre-smb",
    icon: PiGraphBold,
    description: "Fixed Wireless Broadband for SMEs (50-200 Mbps)"
  },
  {
    name: "WorkConnect SOHO",
    href: "/products/workconnect-soho",
    icon: PiLaptopBold,
    description: "Internet for home workers and freelancers"
  },
  {
    name: "CloudWiFi",
    href: "/products/cloudwifi",
    icon: PiWifiHighBold,
    description: "Managed WiFi as a Service for venues"
  },
  {
    name: "BizFibreConnect",
    href: "/products/bizfibreconnect",
    icon: PiGlobeBold,
    description: "Enterprise fibre solutions"
  },
  {
    name: "Mobile Deals",
    href: "/deals",
    icon: PiDeviceMobileBold,
    description: "Mobile deals with devices and SIM-only options"
  },
  {
    name: "Connectivity Guide",
    href: "/resources/connectivity-guide",
    icon: PiBookBold,
    description: "Comprehensive guide to connectivity options"
  }
];

// Cloud Hosting section (updated with correct Virtual Desktops link)
export const cloudHostingItems: NavigationItem[] = [
  {
    name: "Cloud Migration",
    href: "/cloud/migration",
    icon: PiCloudBold,
    description: "Seamless transition to cloud infrastructure"
  },
  {
    name: "Hosting Solutions",
    href: "/cloud/hosting",
    icon: PiDesktopTowerBold,
    description: "Reliable hosting for your business applications"
  },
  {
    name: "Backup & Recovery",
    href: "/cloud/backup",
    icon: PiCloudBold,
    description: "Secure cloud backup and disaster recovery"
  },
  {
    name: "Virtual Desktops",
    href: "/cloud/virtual-desktops",
    icon: PiLaptopBold,
    description: "Remote desktop solutions for flexible work"
  }
];

// About section - removed since pages are deleted
export const aboutItems: NavigationItem[] = [];

// Resources section (removed blog references)
// Note: "/resources" overview link is added via prependItems in NavigationMenu.tsx
export const resourcesItems: NavigationItem[] = [
  {
    name: "Client Forms",
    href: "/forms",
    icon: PiClipboardTextBold,
    description: "Surveys and audit forms for clients"
  },
  {
    name: "IT Health Assessment",
    href: "/resources/it-health",
    icon: PiPulseBold,
    description: "Evaluate your IT infrastructure"
  },
  {
    name: "Power Backup Solutions",
    href: "/resources/power-backup",
    icon: PiBatteryFullBold,
    description: "UPS and power protection for your business"
  },
  {
    name: "Connectivity Guide",
    href: "/resources/connectivity-guide",
    icon: PiGlobeBold,
    description: "Guide to business connectivity options"
  },
  {
    name: "Wi-Fi Toolkit",
    href: "/resources/wifi-toolkit",
    icon: PiWifiHighBold,
    description: "Planning tools for Wi-Fi deployments"
  }
];

// Partner section
export const partnerItems: NavigationItem[] = [
  {
    name: "Become a Partner",
    href: "/become-a-partner",
    icon: PiHandshakeBold,
    description: "Join our partner program and earn recurring commissions"
  },
  {
    name: "Partner Portal",
    href: "/partner/login",
    icon: PiSquaresFourBold,
    description: "Access your partner dashboard and resources"
  }
];

// Main navigation structure for organization
export const mainNavigation: NavigationSection[] = [
  {
    name: "Managed IT",
    items: managedITItems
  },
  {
    name: "Connectivity",
    items: connectivityItems
  },
  {
    name: "Cloud & Hosting",
    items: cloudHostingItems
  },
  {
    name: "Resources",
    items: resourcesItems
  }
];

// Footer links (updated to remove deleted pages)
export const footerLinks = [
  {
    name: "Legal",
    items: [
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms of Service", href: "/terms-of-service" }
    ]
  },
  {
    name: "Company",
    items: [
      { name: "Contact", href: "/contact" }
    ]
  },
  {
    name: "Services",
    items: [
      { name: "Small Business IT", href: "/services/small-business" },
      { name: "Mid-Size Business IT", href: "/services/mid-size" },
      { name: "Growth-Ready IT", href: "/services/growth-ready" },
      { name: "Wi-Fi as a Service", href: "/connectivity/wifi-as-a-service" },
      { name: "Cloud Solutions", href: "/cloud/migration" },
      { name: "Service Bundles", href: "/bundles" }
    ]
  },
  {
    name: "Resources",
    items: [
      { name: "IT Health Assessment", href: "/resources/it-health" },
      { name: "Power Backup Solutions", href: "/resources/power-backup" },
      { name: "Connectivity Guide", href: "/resources/connectivity-guide" },
      { name: "Wi-Fi Toolkit", href: "/resources/wifi-toolkit" }
    ]
  }
];