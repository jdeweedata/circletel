
import { Book, Activity, Home, Laptop, Wifi, DollarSign, Users, BookOpen, FileText, Cloud, Server, ShieldCheck } from "lucide-react";
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

// Updated organization of main services
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
    name: "Security Solutions",
    href: "/services/security",
    icon: ShieldCheck,
    description: "Protect your business with our security solutions"
  }
];

// IT Solutions section (was "Services")
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
    icon: Laptop,
    description: "IT solutions for growing mid-size companies"
  }, 
  {
    name: "Growth-Ready Recipes",
    href: "/services/growth-ready",
    icon: Laptop,
    description: "Scalable IT solutions for rapid growth"
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
    icon: Wifi,
    description: "Fast and reliable wireless internet connectivity"
  },
  {
    name: "Fibre",
    href: "/connectivity/fibre",
    icon: Wifi,
    description: "High-speed fibre internet solutions"
  }
];

// Cloud Hosting section (new)
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
  }
];

// About section
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

// Resources section (updated)
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
    name: "Blog",
    href: "/blog",
    icon: Book,
    description: "Latest news and insights"
  },
  {
    name: "Load Shedding Solutions",
    href: "/resources/load-shedding",
    icon: Activity,
    description: "IT solutions for power outages"
  }
];

// Main navigation structure for organization
export const mainNavigation: NavigationSection[] = [
  {
    name: "Managed IT",
    items: managedITItems
  },
  {
    name: "IT Solutions",
    items: itSolutionsItems
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

// Footer links
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
      { name: "Case Studies", href: "/case-studies" },
      { name: "Contact", href: "/contact" }
    ]
  },
  {
    name: "Services",
    items: [
      { name: "Managed IT", href: "/services" },
      { name: "Wi-Fi as a Service", href: "/connectivity/wifi-as-a-service" },
      { name: "Cloud Solutions", href: "/cloud/migration" }
    ]
  }
];
