import { Book, Activity, Laptop, Wifi, DollarSign, Users, BookOpen, FileText, Cloud, Server, ShieldCheck, TrendingUp, Rocket, Network, Globe, Battery, Power, Package } from "lucide-react";
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
    name: "Connectivity Guide",
    href: "/resources/connectivity-guide",
    icon: Book,
    description: "Comprehensive guide to connectivity options"
  }
];

// Cloud Hosting section (updated)
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
    href: "/cloud/hosting",
    icon: Laptop,
    description: "Remote desktop solutions for flexible work"
  }
];

// About section (updated with new pages)
export const aboutItems: NavigationItem[] = [
  {
    name: "Our Story",
    href: "/about",
    icon: BookOpen,
    description: "Learn about CircleTel's journey"
  }, 
  {
    name: "Our Team",
    href: "/about/team",
    icon: Users,
    description: "Meet the experts behind CircleTel"
  }, 
  {
    name: "Certifications",
    href: "/about/certifications",
    icon: FileText,
    description: "Industry certifications and partnerships"
  }
];

// Resources section (updated with new pages)
export const resourcesItems: NavigationItem[] = [
  {
    name: "Resources Hub",
    href: "/resources",
    icon: Book,
    description: "Helpful guides and resources"
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
  },
  {
    name: "Blog",
    href: "/blog",
    icon: Book,
    description: "Latest news and insights"
  },
  {
    name: "Blog Archive",
    href: "/blog/archive",
    icon: Book,
    description: "Complete collection of articles"
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
  },
  {
    name: "About",
    items: aboutItems
  }
];

// Footer links (updated with new pages)
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
      { name: "About Us", href: "/about" },
      { name: "Our Team", href: "/about/team" },
      { name: "Certifications", href: "/about/certifications" },
      { name: "Case Studies", href: "/case-studies" },
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
      { name: "Wi-Fi Toolkit", href: "/resources/wifi-toolkit" },
      { name: "Blog Archive", href: "/blog/archive" }
    ]
  }
];
