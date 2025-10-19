'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Upload,
  DollarSign,
  Wrench,
  Router,
  Wifi,
  CheckCircle,
  Edit,
  Zap,
  Calendar,
} from 'lucide-react';

interface ServicePackage {
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
  installation_fee?: number;
  router_included?: boolean;
}

interface Step1PackageConfirmationProps {
  package: ServicePackage;
  onEdit?: () => void;
}

export function Step1PackageConfirmation({ package: pkg, onEdit }: Step1PackageConfirmationProps) {
  const monthlyPrice = pkg.promotion_price || pkg.price;
  const hasPromo = pkg.promotion_price && pkg.promotion_price < pkg.price;
  const savings = hasPromo ? pkg.price - pkg.promotion_price! : 0;
  const installationFee = pkg.installation_fee || 0;
  const firstMonthTotal = monthlyPrice + installationFee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{pkg.name}</CardTitle>
              <CardDescription className="text-lg mt-2">
                Review your selected package details
              </CardDescription>
            </div>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Change Package
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Package Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wifi className="w-5 h-5 text-circleTel-orange" />
              Package Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service Type */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Service Type</p>
              <Badge variant="secondary" className="text-sm">
                {pkg.service_type}
              </Badge>
            </div>

            {/* Speed */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <Download className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-gray-600">Download</p>
                </div>
                <p className="text-xl font-bold text-green-700">{pkg.speed_down}</p>
                <p className="text-xs text-gray-500">Mbps</p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-gray-600">Upload</p>
                </div>
                <p className="text-xl font-bold text-blue-700">{pkg.speed_up}</p>
                <p className="text-xs text-gray-500">Mbps</p>
              </div>
            </div>

            {/* Description */}
            {pkg.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">About this package</p>
                <p className="text-sm text-gray-700">{pkg.description}</p>
              </div>
            )}

            {/* Features */}
            <div>
              <p className="text-sm text-gray-500 mb-2">What's included</p>
              <ul className="space-y-2">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Installation & Router */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <Wrench className="w-4 h-4" />
                  Installation
                </span>
                {installationFee > 0 ? (
                  <span className="font-semibold">R{installationFee.toFixed(2)}</span>
                ) : (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Free
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <Router className="w-4 h-4" />
                  Router
                </span>
                {pkg.router_included ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Included
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-500">Not Included</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card className="border-circleTel-orange">
          <CardHeader className="bg-gradient-to-br from-orange-50 to-white">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-circleTel-orange" />
              Pricing Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Monthly Price */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Monthly Subscription</p>
              <div className="flex items-baseline gap-2">
                {hasPromo ? (
                  <>
                    <span className="text-3xl font-bold text-circleTel-orange">
                      R{monthlyPrice.toFixed(2)}
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      R{pkg.price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-circleTel-darkNeutral">
                    R{monthlyPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-gray-500">/month</span>
              </div>

              {hasPromo && pkg.promotion_months && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-green-700">
                        Special Offer - Save R{savings.toFixed(2)}/month
                      </p>
                      <p className="text-xs text-green-600">
                        Promotional price for {pkg.promotion_months} months, then R{pkg.price.toFixed(2)}/month
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly subscription</span>
                <span className="font-medium">R{monthlyPrice.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Installation fee</span>
                <span className="font-medium">
                  {installationFee > 0 ? `R${installationFee.toFixed(2)}` : 'Free'}
                </span>
              </div>

              {pkg.router_included && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Router</span>
                  <span className="font-medium text-green-600">Included</span>
                </div>
              )}
            </div>

            {/* First Month Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">First Month Total</p>
                  <p className="text-xs text-gray-400">One-time setup + first month</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-circleTel-orange">
                    R{firstMonthTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recurring */}
            <div className="pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium">Then each month</p>
                </div>
                <p className="text-lg font-bold text-gray-700">
                  R{monthlyPrice.toFixed(2)}
                </p>
              </div>
              {hasPromo && pkg.promotion_months && (
                <p className="text-xs text-gray-500 mt-1">
                  After {pkg.promotion_months} months: R{pkg.price.toFixed(2)}/month
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What Happens Next */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">What happens next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-sm font-bold">
                1
              </span>
              <div>
                <p className="font-medium">Complete your details</p>
                <p className="text-sm text-gray-600">
                  Provide your contact and installation address information
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-sm font-bold">
                2
              </span>
              <div>
                <p className="font-medium">Confirm your order</p>
                <p className="text-sm text-gray-600">
                  Review all details and submit your order
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-sm font-bold">
                3
              </span>
              <div>
                <p className="font-medium">Installation scheduling</p>
                <p className="text-sm text-gray-600">
                  We'll contact you within 24 hours to schedule installation
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-circleTel-orange text-white flex items-center justify-center text-sm font-bold">
                4
              </span>
              <div>
                <p className="font-medium">Get connected</p>
                <p className="text-sm text-gray-600">
                  Our technicians will install and activate your connection
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
