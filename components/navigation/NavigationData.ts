import { Book, Activity, Laptop, Wifi, DollarSign, Users, BookOpen, FileText, Cloud, Server, ShieldCheck, TrendingUp, Rocket, Network, Globe, Battery, Power, Package, ClipboardList, Handshake, LayoutDashboard, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Type definitions for proper typing
export type NavigationItem = {
  name: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
};

export type NavigationSection = {
  name: string;
  items: NavigationItem[];
  icon?: LucideIcon;
};

// Updated managedITItems - now includes items from itSolutionsItems
export const managedITItems: NavigationItem[] = [
  {
    name: "Complete IT Management",
    href: "/services",
    icon: Server,
    description: "Full-service IT management and support for your business"
  },
  {
    name: "Small Business IT",
    href: "/services/small-business",
    icon: Laptop,
    description: "Tailored IT solutions for small businesses"
  },
  {
    name: "Mid-Size Business IT",
    href: "/services/mid-size",
    icon: TrendingUp,
    description: "IT solutions for established mid-size companies"
  },
  {
    name: "Growth-Ready IT",
    href: "/services/growth-ready",
    icon: Rocket,
    description: "Scalable IT solutions for rapidly growing businesses"
  },
  {
    name: "Security Solutions",
    href: "/services/security",
    icon: ShieldCheck,
    description: "Protect your business with our security solutions"
  },
  {
    name: "Service Bundles",
    href: "/bundles",
    icon: Package,
    description: "Combined IT and connectivity packages at discounted rates"
  },
  {
    name: "Value-Driven Pricing",
    href: "/pricing",
    icon: DollarSign,
    description: "Transparent pricing plans for all services"
  }
];

// IT Solutions section is kept for reference but no longer used in navigation
export const itSolutionsItems: NavigationItem[] = [
  {
    name: "Small Business Recipes",
    href: "/services/small-business",
    icon: Laptop,
    description: "IT solutions tailored for small businesses"
  },
  {
    name: "Mid-Size Business Recipes",
    href: "/services/mid-size",
    icon: TrendingUp,
    description: "IT solutions for growing mid-size companies"
  },
  {
    name: "Growth-Ready Recipes",
    href: "/services/growth-ready",
    icon: Rocket,
    description: "Scalable IT solutions for rapid growth"
  },
  {
    name: "Service Bundles",
    href: "/bundles",
    icon: Package,
    description: "Combined IT and connectivity packages at discounted rates"
  },
  {
    name: "Value-Driven Pricing",
    href: "/pricing",
    icon: DollarSign,
    description: "Transparent pricing plans for all services"
  }
];

// Connectivity section
export const connectivityItems: NavigationItem[] = [
  {
    name: "Wi-Fi as a Service",
    href: "/connectivity/wifi-as-a-service",
    icon: Wifi,
    description: "Enterprise-grade Wi-Fi without capital expense"
  },
  {
    name: "Fixed Wireless",
    href: "/connectivity/fixed-wireless",
    icon: Network,
    description: "Fast and reliable wireless internet connectivity"
  },
  {
    name: "Fibre",
    href: "/connectivity/fibre",
    icon: Globe,
    description: "High-speed fibre internet solutions"
  },
  {
    name: "Mobile Deals",
    href: "/deals",
    icon: Smartphone,
    description: "Mobile deals with devices and SIM-only options"
  },
  {
    name: "Connectivity Guide",
    href: "/resources/connectivity-guide",
    icon: Book,
    description: "Comprehensive guide to connectivity options"
  }
];

// Cloud Hosting section (updated with correct Virtual Desktops link)
export const cloudHostingItems: NavigationItem[] = [
  {
    name: "Cloud Migration",
    href: "/cloud/migration",
    icon: Cloud,
    description: "Seamless transition to cloud infrastructure"
  },
  {
    name: "Hosting Solutions",
    href: "/cloud/hosting",
    icon: Server,
    description: "Reliable hosting for your business applications"
  },
  {
    name: "Backup & Recovery",
    href: "/cloud/backup",
    icon: Cloud,
    description: "Secure cloud backup and disaster recovery"
  },
  {
    name: "Virtual Desktops",
    href: "/cloud/virtual-desktops",
    icon: Laptop,
    description: "Remote desktop solutions for flexible work"
  }
];

// About section - removed since pages are deleted
export const aboutItems: NavigationItem[] = [];

// Resources section (removed blog references)
export const resourcesItems: NavigationItem[] = [
  {
    name: "Resources Hub",
    href: "/resources",
    icon: Book,
    description: "Helpful guides and resources"
  },
  {
    name: "Client Forms",
    href: "/forms",
    icon: ClipboardList,
    description: "Surveys and audit forms for clients"
  },
  {
    name: "IT Health Assessment",
    href: "/resources/it-health",
    icon: Activity,
    description: "Evaluate your IT infrastructure"
  },
  {
    name: "Power Backup Solutions",
    href: "/resources/power-backup",
    icon: Battery,
    description: "UPS and power protection for your business"
  },
  {
    name: "Connectivity Guide",
    href: "/resources/connectivity-guide",
    icon: Globe,
    description: "Guide to business connectivity options"
  },
  {
    name: "Wi-Fi Toolkit",
    href: "/resources/wifi-toolkit",
    icon: Wifi,
    description: "Planning tools for Wi-Fi deployments"
  }
];

// Partner section
export const partnerItems: NavigationItem[] = [
  {
    name: "Become a Partner",
    href: "/become-a-partner",
    icon: Handshake,
    description: "Join our partner program and earn recurring commissions"
  },
  {
    name: "Partner Portal",
    href: "/partner/login",
    icon: LayoutDashboard,
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