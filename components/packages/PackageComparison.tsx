'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Package {
  id: string;
  name: string;
  service_type: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  description: string;
  features: string[];
}

interface PackageComparisonProps {
  packages: Package[];
  onSelect: (packageId: string) => void;
  selectedPackageId?: string;
  className?: string;
}

export function PackageComparison({
  packages,
  onSelect,
  selectedPackageId,
  className
}: PackageComparisonProps) {
  // Get all unique features across packages
  const allFeatures = Array.from(
    new Set(packages.flatMap((pkg) => pkg.features))
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Compare Packages</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-semibold text-gray-700 w-1/4">
                  Features
                </th>
                {packages.map((pkg) => (
                  <th key={pkg.id} className="p-4 text-center w-1/4">
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">
                        {pkg.service_type}
                      </Badge>
                      <p className="font-bold text-lg">{pkg.name}</p>
                      <div className="flex items-baseline justify-center gap-1">
                        {pkg.promotion_price ? (
                          <>
                            <span className="text-2xl font-bold text-orange-500">
                              R{pkg.promotion_price}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              R{pkg.price}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-gray-900">
                            R{pkg.price}
                          </span>
                        )}
                        <span className="text-xs text-gray-600">/mo</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Speed Row */}
              <tr className="border-b bg-gray-50">
                <td className="p-4 font-medium text-gray-700">Speed</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="p-4 text-center">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-center gap-1 text-green-600">
                        <span>↓</span>
                        <span className="font-semibold">{pkg.speed_down}</span>
                        <span className="text-xs">Mbps</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-blue-600">
                        <span>↑</span>
                        <span className="font-semibold">{pkg.speed_up}</span>
                        <span className="text-xs">Mbps</span>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Promotion Row */}
              <tr className="border-b">
                <td className="p-4 font-medium text-gray-700">Promotion</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="p-4 text-center">
                    {pkg.promotion_price ? (
                      <div className="text-sm">
                        <p className="font-semibold text-green-600">
                          {pkg.promotion_months}-Month Promo
                        </p>
                        <p className="text-xs text-gray-600">
                          Save R{pkg.price - pkg.promotion_price}/mo
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Feature Rows */}
              {allFeatures.map((feature, index) => (
                <tr key={index} className={cn('border-b', index % 2 === 0 && 'bg-gray-50')}>
                  <td className="p-4 text-sm text-gray-700">{feature}</td>
                  {packages.map((pkg) => (
                    <td key={pkg.id} className="p-4 text-center">
                      {pkg.features.includes(feature) ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* CTA Row */}
              <tr>
                <td className="p-4"></td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="p-4">
                    <Button
                      className={cn(
                        'w-full',
                        selectedPackageId === pkg.id
                          ? 'bg-orange-500 hover:bg-orange-600'
                          : 'bg-gray-900 hover:bg-gray-800'
                      )}
                      onClick={() => onSelect(pkg.id)}
                    >
                      {selectedPackageId === pkg.id ? (
                        'Selected'
                      ) : (
                        <>
                          Select
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
