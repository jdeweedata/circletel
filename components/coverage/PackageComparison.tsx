'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  X,
  Zap,
  Upload,
  Download,
  DollarSign,
  Clock,
  Router,
  Wrench,
  ArrowRight,
} from 'lucide-react';

interface ServicePackage {
  id: string;
  name: string;
  service_type: string;
  product_category: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  description: string;
  features: string[];
  installation_fee?: number;
  router_included?: boolean;
}

interface PackageComparisonProps {
  packages: ServicePackage[];
  onSelectPackage: (packageId: string) => void;
  onRemovePackage?: (packageId: string) => void;
}

export function PackageComparison({
  packages,
  onSelectPackage,
  onRemovePackage,
}: PackageComparisonProps) {
  if (packages.length === 0) {
    return null;
  }

  // Get all unique features across all packages
  const allFeatures = Array.from(
    new Set(packages.flatMap((pkg) => pkg.features))
  );

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-2">
          Package Comparison
        </h2>
        <p className="text-circleTel-secondaryNeutral">
          Compare features side-by-side to find your perfect match
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-4 pb-4 min-w-full">
          {packages.map((pkg, index) => (
            <Card
              key={pkg.id}
              className={`flex-1 min-w-[300px] border-2 ${
                index === 1
                  ? 'border-circleTel-orange shadow-lg scale-105'
                  : 'border-circleTel-lightNeutral'
              }`}
            >
              <CardHeader className="relative">
                {/* Remove Button */}
                {onRemovePackage && (
                  <button
                    onClick={() => onRemovePackage(pkg.id)}
                    className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    aria-label="Remove from comparison"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                )}

                {/* Popular Badge */}
                {index === 1 && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-circleTel-orange">
                    Most Popular
                  </Badge>
                )}

                <CardTitle className="text-xl mb-2">{pkg.name}</CardTitle>
                <Badge variant="secondary" className="w-fit">
                  {pkg.service_type}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-2">
                    {pkg.promotion_price ? (
                      <>
                        <span className="text-3xl font-bold text-circleTel-orange">
                          R{pkg.promotion_price}
                        </span>
                        <span className="text-lg text-gray-400 line-through">
                          R{pkg.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-circleTel-darkNeutral">
                        R{pkg.price}
                      </span>
                    )}
                    <span className="text-circleTel-secondaryNeutral">/month</span>
                  </div>
                  {pkg.promotion_price && pkg.promotion_months && (
                    <p className="text-sm text-circleTel-orange mt-1">
                      Special price for {pkg.promotion_months} months
                    </p>
                  )}
                </div>

                {/* Speed */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <Download className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600">Download</p>
                      <p className="font-bold text-circleTel-darkNeutral">
                        {pkg.speed_down}Mbps
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Upload</p>
                      <p className="font-bold text-circleTel-darkNeutral">
                        {pkg.speed_up}Mbps
                      </p>
                    </div>
                  </div>
                </div>

                {/* Installation & Router */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Wrench className="w-4 h-4" />
                      Installation
                    </span>
                    <span className="font-semibold">
                      {pkg.installation_fee
                        ? `R${pkg.installation_fee}`
                        : 'Free'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Router className="w-4 h-4" />
                      Router
                    </span>
                    <span className="font-semibold">
                      {pkg.router_included ? 'Included' : 'Not Included'}
                    </span>
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="font-semibold text-sm text-circleTel-darkNeutral mb-3">
                    Features Included:
                  </p>
                  <div className="space-y-2">
                    {allFeatures.map((feature) => {
                      const hasFeature = pkg.features.includes(feature);
                      return (
                        <div
                          key={feature}
                          className={`flex items-start gap-2 text-sm ${
                            hasFeature ? 'text-circleTel-darkNeutral' : 'text-gray-400'
                          }`}
                        >
                          {hasFeature ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                          )}
                          <span className={hasFeature ? '' : 'line-through'}>
                            {feature}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Select Button */}
                <Button
                  onClick={() => onSelectPackage(pkg.id)}
                  className={`w-full ${
                    index === 1
                      ? 'bg-circleTel-orange hover:bg-circleTel-orange/90'
                      : 'bg-circleTel-darkNeutral hover:bg-circleTel-darkNeutral/90'
                  }`}
                  size="lg"
                >
                  Select This Package
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Comparison Table (Desktop Alternative) */}
      <div className="hidden xl:block mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Detailed Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Feature</th>
                    {packages.map((pkg) => (
                      <th key={pkg.id} className="text-center p-3 font-semibold">
                        {pkg.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium">Monthly Price</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="text-center p-3">
                        <div className="font-bold text-circleTel-orange">
                          R{pkg.promotion_price || pkg.price}
                        </div>
                        {pkg.promotion_price && (
                          <div className="text-sm text-gray-400 line-through">
                            R{pkg.price}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Download Speed</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="text-center p-3 font-semibold">
                        {pkg.speed_down}Mbps
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium">Upload Speed</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="text-center p-3 font-semibold">
                        {pkg.speed_up}Mbps
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Installation Fee</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="text-center p-3">
                        {pkg.installation_fee ? `R${pkg.installation_fee}` : (
                          <span className="text-green-600 font-semibold">Free</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium">Router Included</td>
                    {packages.map((pkg) => (
                      <td key={pkg.id} className="text-center p-3">
                        {pkg.router_included ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                  {allFeatures.map((feature, idx) => (
                    <tr key={feature} className={idx % 2 === 0 ? 'border-b' : 'border-b bg-gray-50'}>
                      <td className="p-3">{feature}</td>
                      {packages.map((pkg) => (
                        <td key={pkg.id} className="text-center p-3">
                          {pkg.features.includes(feature) ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
