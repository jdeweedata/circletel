/**
 * CircleTel Design System Documentation
 *
 * Internal documentation site for the CircleTel design system.
 * Accessible only to team members for component reference and guidelines.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Palette,
  Type,
  Move,
  Component,
  Layers,
  Code,
  Eye,
  Users,
  Shield,
  Zap
} from 'lucide-react';

const InternalDocs = () => {
  const location = useLocation();

  const documentationSections = [
    {
      category: "Foundations",
      items: [
        {
          title: "Design Tokens",
          description: "Colors, typography, spacing, and other design primitives",
          icon: Palette,
          href: "/internal-docs/tokens",
          status: "complete"
        },
        {
          title: "Typography",
          description: "Font families, scales, and text styling guidelines",
          icon: Type,
          href: "/internal-docs/typography",
          status: "complete"
        },
        {
          title: "Spacing & Layout",
          description: "Grid systems, spacing scales, and layout patterns",
          icon: Move,
          href: "/internal-docs/spacing",
          status: "complete"
        },
        {
          title: "Iconography",
          description: "Icon library, usage guidelines, and accessibility",
          icon: Eye,
          href: "/internal-docs/icons",
          status: "complete"
        }
      ]
    },
    {
      category: "Components",
      items: [
        {
          title: "Atoms",
          description: "Basic building blocks: buttons, inputs, text, icons",
          icon: Component,
          href: "/internal-docs/atoms",
          status: "complete"
        },
        {
          title: "Molecules",
          description: "Simple combinations: search fields, form fields, cards",
          icon: Layers,
          href: "/internal-docs/molecules",
          status: "complete"
        },
        {
          title: "Organisms",
          description: "Complex sections: headers, hero sections, contact forms",
          icon: Users,
          href: "/internal-docs/organisms",
          status: "in-progress"
        }
      ]
    },
    {
      category: "Guidelines",
      items: [
        {
          title: "Code Examples",
          description: "Implementation examples and best practices",
          icon: Code,
          href: "/internal-docs/examples",
          status: "complete"
        },
        {
          title: "Accessibility",
          description: "WCAG compliance, screen readers, keyboard navigation",
          icon: Shield,
          href: "/internal-docs/accessibility",
          status: "complete"
        },
        {
          title: "Performance",
          description: "Bundle optimization, lazy loading, best practices",
          icon: Zap,
          href: "/internal-docs/performance",
          status: "draft"
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'in-progress': return 'In Progress';
      case 'draft': return 'Draft';
      default: return 'Planned';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Internal Documentation
          </Badge>
          <h1 className="text-4xl font-bold font-inter mb-4">
            CircleTel Design System
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive documentation for our design system components, tokens, and guidelines.
            For internal team use only.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-circleTel-orange mb-2">12+</div>
              <div className="text-sm text-muted-foreground">Atom Components</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-circleTel-orange mb-2">8+</div>
              <div className="text-sm text-muted-foreground">Molecule Components</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-circleTel-orange mb-2">6+</div>
              <div className="text-sm text-muted-foreground">Organism Components</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-circleTel-orange mb-2">100%</div>
              <div className="text-sm text-muted-foreground">WCAG AA Compliant</div>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-12">
          {documentationSections.map((section) => (
            <div key={section.category}>
              <h2 className="text-2xl font-bold font-inter mb-6 flex items-center gap-3">
                {section.category}
                <Separator className="flex-1" />
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((item) => (
                  <Link key={item.href} to={item.href}>
                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-circleTel-orange/50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <item.icon className="w-8 h-8 text-circleTel-orange mb-2" />
                          <Badge
                            variant="secondary"
                            className={getStatusColor(item.status)}
                          >
                            {getStatusText(item.status)}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm">
                          {item.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-16 bg-muted rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/internal-docs/atoms"
              className="flex items-center gap-3 p-4 bg-background rounded-lg hover:bg-accent transition-colors"
            >
              <Component className="w-5 h-5 text-circleTel-orange" />
              <div>
                <div className="font-medium">Component Library</div>
                <div className="text-sm text-muted-foreground">Browse all components</div>
              </div>
            </Link>

            <Link
              to="/internal-docs/tokens"
              className="flex items-center gap-3 p-4 bg-background rounded-lg hover:bg-accent transition-colors"
            >
              <Palette className="w-5 h-5 text-circleTel-orange" />
              <div>
                <div className="font-medium">Design Tokens</div>
                <div className="text-sm text-muted-foreground">Colors, spacing, typography</div>
              </div>
            </Link>

            <Link
              to="/internal-docs/examples"
              className="flex items-center gap-3 p-4 bg-background rounded-lg hover:bg-accent transition-colors"
            >
              <Code className="w-5 h-5 text-circleTel-orange" />
              <div>
                <div className="font-medium">Code Examples</div>
                <div className="text-sm text-muted-foreground">Implementation guides</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Team Notice */}
        <div className="mt-16 p-6 border border-yellow-200 bg-yellow-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">Internal Use Only</h4>
              <p className="text-sm text-yellow-700">
                This documentation is for CircleTel team members only. Please do not share
                access credentials or documentation links with external parties.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InternalDocs;