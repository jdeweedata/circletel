'use client';

import { CheckCircle, Cable, Radio, Signal, Wifi, ArrowDown, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ServicePackage } from '@/lib/partners/feasibility-types';

interface BusinessPackageCardProps {
  pkg: ServicePackage;
  isSelected: boolean;
  onToggle: () => void;
}

const getTechIcon = (serviceType: string) => {
  const type = serviceType?.toLowerCase() || '';
  if (type.includes('fibre') || type.includes('fiber')) return Cable;
  if (type.includes('tarana') || type.includes('sky') || type.includes('wireless')) return Radio;
  if (type.includes('5g')) return Signal;
  if (type.includes('lte')) return Signal;
  return Wifi;
};

const getTechLabel = (serviceType: string) => {
  const type = serviceType?.toLowerCase() || '';
  if (type.includes('bizfibre')) return 'Fibre';
  if (type.includes('fibre') || type.includes('fiber')) return 'Fibre';
  if (type.includes('tarana') || type.includes('sky')) return 'Wireless';
  if (type.includes('5g')) return '5G';
  if (type.includes('lte')) return 'LTE';
  return 'Connectivity';
};

export function BusinessPackageCard({
  pkg,
  isSelected,
  onToggle,
}: BusinessPackageCardProps) {
  const Icon = getTechIcon(pkg.service_type);
  const techLabel = getTechLabel(pkg.service_type);
  const hasPromo = pkg.promotion_price && pkg.promotion_price < pkg.price;

  return (
    <div
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={`
        relative p-4 rounded-lg border-2 cursor-pointer transition-all
        ${
          isSelected
            ? 'border-circleTel-orange bg-orange-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 rounded-full bg-circleTel-orange flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Header: Tech Icon + Name */}
      <div className="flex items-start gap-3 mb-3 pr-8">
        <div
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${isSelected ? 'bg-circleTel-orange/20' : 'bg-gray-100'}
          `}
        >
          <Icon
            className={`w-5 h-5 ${
              isSelected ? 'text-circleTel-orange' : 'text-gray-600'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{pkg.name}</h4>
          <Badge
            variant="outline"
            className={`text-xs ${
              isSelected
                ? 'border-circleTel-orange text-circleTel-orange'
                : 'text-gray-500'
            }`}
          >
            {techLabel}
          </Badge>
        </div>
      </div>

      {/* Speed */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1 text-sm">
          <ArrowDown className="w-4 h-4 text-green-600" />
          <span className="font-bold text-gray-900">{pkg.speed_down}</span>
          <span className="text-gray-500">Mbps</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <ArrowUp className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-gray-900">{pkg.speed_up}</span>
          <span className="text-gray-500">Mbps</span>
        </div>
      </div>

      {/* Price */}
      <div className="mb-3">
        {hasPromo ? (
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-circleTel-orange">
              R{pkg.promotion_price?.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400 line-through">
              R{pkg.price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">/month</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-circleTel-orange">
              R{pkg.price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">/month</span>
          </div>
        )}
      </div>

      {/* Features */}
      {pkg.features && pkg.features.length > 0 && (
        <div className="space-y-1">
          {pkg.features.slice(0, 3).map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs text-gray-600"
            >
              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
              <span className="truncate">{feature}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <span
          className={`text-sm font-medium ${
            isSelected ? 'text-circleTel-orange' : 'text-gray-600'
          }`}
        >
          {isSelected ? 'Selected' : 'Click to select'}
        </span>
      </div>
    </div>
  );
}
