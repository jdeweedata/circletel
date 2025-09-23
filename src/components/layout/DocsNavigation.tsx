/**
 * Internal Documentation Navigation Component
 *
 * Provides navigation specifically for the internal design system documentation.
 * Only visible in the documentation section.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Palette,
  Type,
  Move,
  Component,
  Layers,
  Users,
  Code,
  Shield,
  Zap,
  Eye,
  Home
} from 'lucide-react';

const DocsNavigation = () => {
  const location = useLocation();

  const navigationSections = [
    {
      title: "Overview",
      items: [
        {
          title: "Home",
          href: "/internal-docs",
          icon: Home,
        }
      ]
    },
    {
      title: "Foundations",
      items: [
        {
          title: "Design Tokens",
          href: "/internal-docs/tokens",
          icon: Palette,
          description: "Colors, spacing, typography"
        },
        {
          title: "Typography",
          href: "/internal-docs/typography",
          icon: Type,
          description: "Font families and text styles"
        },
        {
          title: "Spacing & Layout",
          href: "/internal-docs/spacing",
          icon: Move,
          description: "Grid systems and spacing"
        },
        {
          title: "Iconography",
          href: "/internal-docs/icons",
          icon: Eye,
          description: "Icon usage and guidelines"
        }
      ]
    },
    {
      title: "Components",
      items: [
        {
          title: "Atoms",
          href: "/internal-docs/atoms",
          icon: Component,
          description: "Basic building blocks"
        },
        {
          title: "Molecules",
          href: "/internal-docs/molecules",
          icon: Layers,
          description: "Simple combinations"
        },
        {
          title: "Organisms",
          href: "/internal-docs/organisms",
          icon: Users,
          description: "Complex sections",
          badge: "In Progress"
        }
      ]
    },
    {
      title: "Guidelines",
      items: [
        {
          title: "Code Examples",
          href: "/internal-docs/examples",
          icon: Code,
          description: "Implementation guides"
        },
        {
          title: "Accessibility",
          href: "/internal-docs/accessibility",
          icon: Shield,
          description: "WCAG compliance"
        },
        {
          title: "Performance",
          href: "/internal-docs/performance",
          icon: Zap,
          description: "Optimization guides",
          badge: "Draft"
        }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === "/internal-docs") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Card className="w-64 h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Documentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <h4 className="text-sm font-semibold mb-3 text-foreground">
              {section.title}
            </h4>
            <nav className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                    isActive(item.href)
                      ? "bg-circleTel-orange text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-2 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </nav>
            {section.title !== "Guidelines" && (
              <Separator className="mt-4" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DocsNavigation;