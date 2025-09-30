'use client';

import { useState } from 'react';
import PricingCards from '@/components/pricing-cards/PricingCards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Wifi, Star, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function MTNPricingDemoPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'sim-only' | 'sim-router' | null>(null);

  const handlePlanSelect = (planId: string, planType: 'sim-only' | 'sim-router') => {
    setSelectedPlan(planId);
    setSelectedType(planType);
    console.log('Selected plan:', planId, 'Type:', planType);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">MTN Pricing Cards Demo</h1>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Wifi className="h-3 w-3" />
              Demo Mode
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Introduction */}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Integrated MTN Wireless Pricing
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              This demo showcases the integrated MTN pricing cards component that has been
              modernized with Tailwind CSS and shadcn/ui components for seamless integration
              into the CircleTel ecosystem.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Modern Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Updated with shadcn/ui components and Tailwind CSS for consistency
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Fully Responsive</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Works perfectly on all screen sizes with mobile-first design
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Wifi className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Interactive</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Includes callback functions for plan selection and integration
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Cards Component */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <PricingCards
              onPlanSelect={handlePlanSelect}
              className="mx-auto"
            />
          </div>

          {/* Selection Status */}
          {selectedPlan && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Plan Selected!</h3>
                    <p className="text-green-700">
                      Selected plan: <span className="font-medium">{selectedPlan}</span>
                      {' '}({selectedType})
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integration Notes */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl text-blue-900">Integration Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-blue-800">
              <div>
                <h4 className="font-semibold mb-2">Component Features:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Converted from CSS modules to Tailwind CSS classes</li>
                  <li>• Uses shadcn/ui components (Card, Button, Badge, Tabs)</li>
                  <li>• Added TypeScript props interface for customization</li>
                  <li>• Includes onPlanSelect callback for integration</li>
                  <li>• Maintains original MTN branding and functionality</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Usage:</h4>
                <code className="text-xs bg-blue-100 p-2 rounded block">
                  {`<PricingCards onPlanSelect={(planId, type) => console.log(planId, type)} />`}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}