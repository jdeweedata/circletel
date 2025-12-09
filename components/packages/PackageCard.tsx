'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Wifi, Zap, Info, TrendingUp, TrendingDown, Calendar, User, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PriceHistory {
  old_price: number;
  new_price: number;
  changed_by: string;
  changed_at: string;
  change_reason?: string;
}

// Installation warning info from base station validation
interface InstallationWarning {
  requiresElevatedInstall: boolean;
  installationNote: string | null;
  coverageConfidence?: 'high' | 'medium' | 'low' | 'none';
  nearestBaseStation?: {
    siteName: string;
    distanceKm: number;
  };
}

interface PackageCardProps {
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
  isPopular?: boolean;
  isSelected?: boolean;
  onSelect?: (packageId: string) => void;
  className?: string;
  // Audit trail props
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  priceHistory?: PriceHistory[];
  showAuditTrail?: boolean;
  // Installation requirements (from base station validation)
  installationWarning?: InstallationWarning;
}

export function PackageCard({
  id,
  name,
  service_type,
  speed_down,
  speed_up,
  price,
  promotion_price,
  promotion_months = 3,
  description,
  features,
  isPopular = false,
  isSelected = false,
  onSelect,
  className,
  lastUpdatedBy,
  lastUpdatedAt,
  priceHistory,
  showAuditTrail = false,
  installationWarning
}: PackageCardProps) {
  const hasPromotion = !!promotion_price && promotion_price < price;
  const savingsAmount = hasPromotion ? price - promotion_price : 0;
  const savingsPercent = hasPromotion ? Math.round((savingsAmount / price) * 100) : 0;
  const hasPriceHistory = priceHistory && priceHistory.length > 0;
  const hasInstallationWarning = installationWarning?.requiresElevatedInstall || installationWarning?.installationNote;

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-xl',
        isSelected && 'ring-2 ring-orange-500 shadow-xl',
        isPopular && 'border-orange-500 border-2',
        onSelect && 'cursor-pointer',
        className
      )}
      onClick={() => onSelect?.(id)}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 text-xs font-bold uppercase rounded-bl-lg shadow-md">
          <Zap className="inline h-3 w-3 mr-1" />
          Most Popular
        </div>
      )}

      {/* Promotion Badge - Tier 1 Urgency */}
      {hasPromotion && (
        <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-bold uppercase rounded-br-lg shadow-md">
          {promotion_months}-Month Promo
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Service Type Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            <Wifi className="h-3 w-3 mr-1" />
            {service_type}
          </Badge>
          {hasPromotion && (
            <Badge className="bg-red-500 text-white text-xs font-bold">
              Save {savingsPercent}%
            </Badge>
          )}
        </div>

        {/* Package Name */}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            {hasPromotion ? (
              <>
                <span className="text-3xl font-bold text-orange-500">
                  R{promotion_price}
                </span>
                <span className="text-lg text-gray-400 line-through">
                  R{price}
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-gray-900">
                R{price}
              </span>
            )}
            <span className="text-sm text-gray-600">per month*</span>

            {/* Audit Trail Popover */}
            {showAuditTrail && (lastUpdatedAt || hasPriceHistory) && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-gray-400 hover:text-orange-500 transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-900">Price Information</h4>

                    {/* Last Updated */}
                    {lastUpdatedAt && (
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>Last updated: {format(new Date(lastUpdatedAt), 'PPp')}</span>
                        </div>
                        {lastUpdatedBy && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-3 w-3" />
                            <span>By: {lastUpdatedBy}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price History */}
                    {hasPriceHistory && (
                      <div className="space-y-2 pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 uppercase">Recent Changes:</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {priceHistory!.slice(0, 3).map((change, index) => {
                            const priceIncreased = change.new_price > change.old_price;
                            const priceDiff = Math.abs(change.new_price - change.old_price);

                            return (
                              <div key={index} className="text-xs bg-gray-50 rounded p-2 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900">
                                    R{change.old_price} → R{change.new_price}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {priceIncreased ? (
                                      <TrendingUp className="h-3 w-3 text-red-500" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3 text-green-500" />
                                    )}
                                    <span className={priceIncreased ? 'text-red-600' : 'text-green-600'}>
                                      R{priceDiff.toFixed(0)}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-gray-600">
                                  {format(new Date(change.changed_at), 'PP')}
                                </div>
                                {change.changed_by && (
                                  <div className="text-gray-500">
                                    By: {change.changed_by}
                                  </div>
                                )}
                                {change.change_reason && (
                                  <div className="text-gray-600 italic">
                                    &quot;{change.change_reason}&quot;
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {hasPromotion && (
            <p className="text-xs text-orange-600 font-medium">
              Then R{price}/month from month {promotion_months + 1}
            </p>
          )}
        </div>

        {/* Speed Display */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-1 text-green-600">
              <span className="text-xl font-bold">↓</span>
              <span className="text-lg font-semibold">{speed_down}</span>
              <span className="text-xs text-gray-600">Mbps</span>
            </div>
            <p className="text-xs text-gray-500">Download</p>
          </div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div className="flex-1">
            <div className="flex items-center gap-1 text-blue-600">
              <span className="text-xl font-bold">↑</span>
              <span className="text-lg font-semibold">{speed_up}</span>
              <span className="text-xs text-gray-600">Mbps</span>
            </div>
            <p className="text-xs text-gray-500">Upload</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            What&apos;s Included:
          </p>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Installation Warning */}
        {hasInstallationWarning && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-800">
              {installationWarning?.installationNote || 'Special installation requirements may apply'}
              {installationWarning?.nearestBaseStation && (
                <span className="block mt-1 text-amber-600">
                  Nearest tower: {installationWarning.nearestBaseStation.siteName} ({installationWarning.nearestBaseStation.distanceKm.toFixed(1)}km)
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* CTA Button */}
        {onSelect && (
          <Button
            className={cn(
              'w-full font-semibold',
              isSelected
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-gray-900 hover:bg-gray-800'
            )}
            size="lg"
          >
            {isSelected ? 'Selected' : 'Select Package'}
          </Button>
        )}
      </div>

      {/* Bottom Promotion Notice */}
      {hasPromotion && (
        <div className="bg-orange-50 border-t border-orange-100 px-6 py-2">
          <p className="text-xs text-center text-orange-700">
            <span className="font-semibold">Limited Time:</span> Save R{savingsAmount}/month for {promotion_months} months!
          </p>
        </div>
      )}
    </Card>
  );
}
