/**
 * Design Tokens Documentation Page
 */

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { colors, typography, spacing, borderRadius, shadows } from '@/design-system/tokens';

const DesignTokens = () => {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const ColorSwatch = ({ name, value, description }: { name: string; value: string; description?: string }) => (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div
        className="w-full h-16 rounded-md mb-3 border"
        style={{ backgroundColor: value }}
      />
      <div className="space-y-1">
        <div className="font-semibold text-sm">{name}</div>
        <div className="font-mono text-xs text-muted-foreground">{value}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => copyToClipboard(value)}
        >
          {copiedToken === value ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>
    </div>
  );

  const TokenCard = ({ title, value, description, cssVar }: {
    title: string;
    value: string;
    description?: string;
    cssVar?: string;
  }) => (
    <div className="p-4 border rounded-lg">
      <div className="font-semibold mb-1">{title}</div>
      <div className="font-mono text-sm text-circleTel-orange mb-1">{value}</div>
      {cssVar && (
        <div className="font-mono text-xs text-muted-foreground mb-2">{cssVar}</div>
      )}
      {description && (
        <div className="text-sm text-muted-foreground">{description}</div>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs mt-2"
        onClick={() => copyToClipboard(cssVar || value)}
      >
        {copiedToken === (cssVar || value) ? (
          <Check className="w-3 h-3" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            to="/internal-docs"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documentation
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4">Design Foundations</Badge>
          <h1 className="text-4xl font-bold font-inter mb-4">Design Tokens</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Design tokens are the visual design atoms of the design system. They store visual
            design attributes as data that defines the foundation of your design system.
          </p>
        </div>

        <Tabs defaultValue="colors" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="spacing">Spacing</TabsTrigger>
            <TabsTrigger value="elevation">Elevation</TabsTrigger>
            <TabsTrigger value="border">Border</TabsTrigger>
          </TabsList>

          {/* Colors */}
          <TabsContent value="colors" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Color Palette</h2>

              <div className="space-y-8">
                {/* Brand Colors */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Brand Colors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ColorSwatch
                      name="Primary Orange"
                      value={colors.brand.primary}
                      description="Main brand color"
                    />
                    <ColorSwatch
                      name="Brand White"
                      value={colors.brand.white}
                      description="Clean backgrounds"
                    />
                    <ColorSwatch
                      name="Dark Neutral"
                      value={colors.brand.darkNeutral}
                      description="Primary text"
                    />
                    <ColorSwatch
                      name="Secondary Neutral"
                      value={colors.brand.secondaryNeutral}
                      description="Secondary text"
                    />
                  </div>
                </div>

                {/* State Colors */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">State Colors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ColorSwatch
                      name="Success"
                      value={colors.states.success}
                      description="Success messages"
                    />
                    <ColorSwatch
                      name="Warning"
                      value={colors.states.warning}
                      description="Warning messages"
                    />
                    <ColorSwatch
                      name="Error"
                      value={colors.states.error}
                      description="Error messages"
                    />
                    <ColorSwatch
                      name="Info"
                      value={colors.states.info}
                      description="Info messages"
                    />
                  </div>
                </div>

                {/* Usage Guidelines */}
                <Card>
                  <CardHeader>
                    <CardTitle>Color Usage Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-circleTel-orange mb-2">Primary Orange (#F5831F)</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• Primary buttons and CTAs</li>
                        <li>• Active states and highlights</li>
                        <li>• Brand elements and logos</li>
                        <li>• Focus indicators</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">Success States</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• Form validation success</li>
                        <li>• Confirmation messages</li>
                        <li>• Status indicators</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Typography */}
          <TabsContent value="typography" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Typography Scale</h2>

              <div className="space-y-8">
                {/* Font Families */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Font Families</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TokenCard
                      title="Primary Font"
                      value="Inter"
                      cssVar="font-inter"
                      description="Used for all UI text, headings, and body copy"
                    />
                    <TokenCard
                      title="Monospace Font"
                      value="Space Mono"
                      cssVar="font-space-mono"
                      description="Used for code snippets and technical content"
                    />
                  </div>
                </div>

                {/* Font Sizes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Font Sizes</h3>
                  <div className="space-y-4">
                    {Object.entries(typography.fontSize).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm text-muted-foreground w-12">{key}</span>
                          <span className="font-mono text-sm text-circleTel-orange w-20">{value}</span>
                          <span style={{ fontSize: value }} className="font-inter">
                            Sample Text
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`text-${key}`)}
                        >
                          {copiedToken === `text-${key}` ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Font Weights */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Font Weights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(typography.fontWeight).map(([key, value]) => (
                      <div key={key} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold capitalize">{key}</span>
                          <span className="font-mono text-sm text-circleTel-orange">{value}</span>
                        </div>
                        <div
                          className="text-lg font-inter"
                          style={{ fontWeight: value }}
                        >
                          The quick brown fox jumps
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs mt-2"
                          onClick={() => copyToClipboard(`font-${key}`)}
                        >
                          {copiedToken === `font-${key}` ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Spacing */}
          <TabsContent value="spacing" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Spacing Scale</h2>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Spacing System</CardTitle>
                    <CardDescription>
                      Based on a consistent 4px scale for predictable layouts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(spacing).slice(0, 16).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-4 p-3 border rounded">
                          <div className="w-16 font-mono text-sm text-muted-foreground">
                            {key}
                          </div>
                          <div className="w-20 font-mono text-sm text-circleTel-orange">
                            {value}
                          </div>
                          <div className="flex-1">
                            <div
                              className="h-4 bg-circleTel-orange rounded"
                              style={{ width: value }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`space-${key}`)}
                          >
                            {copiedToken === `space-${key}` ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Elevation */}
          <TabsContent value="elevation" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Elevation & Shadows</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(shadows).map(([key, value]) => (
                  <div key={key} className="space-y-4">
                    <div
                      className="w-full h-24 bg-white rounded-lg border"
                      style={{ boxShadow: value }}
                    />
                    <div className="space-y-2">
                      <div className="font-semibold capitalize">{key}</div>
                      <div className="font-mono text-xs text-muted-foreground break-all">
                        {value}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`shadow-${key}`)}
                      >
                        {copiedToken === `shadow-${key}` ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Border Radius */}
          <TabsContent value="border" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Border Radius</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(borderRadius).map(([key, value]) => (
                  <div key={key} className="text-center space-y-3">
                    <div
                      className="w-20 h-20 bg-circleTel-orange mx-auto"
                      style={{ borderRadius: value }}
                    />
                    <div className="space-y-1">
                      <div className="font-semibold capitalize">{key}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {value}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`rounded-${key}`)}
                      >
                        {copiedToken === `rounded-${key}` ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default DesignTokens;