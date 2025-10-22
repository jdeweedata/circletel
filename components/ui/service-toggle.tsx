'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type ServiceType = 'fibre' | 'lte' | '5g' | 'wireless';

interface ServiceToggleProps {
  activeService: ServiceType;
  onServiceChange: (service: ServiceType) => void;
  className?: string;
  services?: {
    value: ServiceType;
    label: string;
    enabled?: boolean;
  }[];
}

const defaultServices = [
  { value: 'fibre' as ServiceType, label: 'Fibre', enabled: true },
  { value: 'lte' as ServiceType, label: 'Fixed LTE', enabled: true },
  { value: 'wireless' as ServiceType, label: 'Wireless', enabled: true },
];

/**
 * ServiceToggle Component
 *
 * A reusable toggle button group for switching between service types.
 * Based on WebAfrica's toggle pattern with CircleTel branding.
 *
 * @example
 * ```tsx
 * const [activeService, setActiveService] = useState<ServiceType>('fibre');
 *
 * <ServiceToggle
 *   activeService={activeService}
 *   onServiceChange={setActiveService}
 * />
 * ```
 */
export function ServiceToggle({
  activeService,
  onServiceChange,
  className,
  services = defaultServices,
}: ServiceToggleProps) {
  const enabledServices = services.filter((s) => s.enabled !== false);

  return (
    <div
      className={cn(
        'flex gap-2 justify-center items-center',
        className
      )}
      role="tablist"
      aria-label="Service type selection"
    >
      {enabledServices.map((service) => (
        <button
          key={service.value}
          type="button"
          role="tab"
          aria-selected={activeService === service.value}
          aria-controls={`${service.value}-panel`}
          className={cn(
            'px-6 py-3 rounded-full font-semibold text-base transition-all duration-200',
            'focus:outline-none focus:ring-4 focus:ring-circleTel-orange/30',
            'hover:shadow-md active:scale-95',
            activeService === service.value
              ? 'bg-circleTel-darkNeutral text-white shadow-lg'
              : 'bg-white text-circleTel-darkNeutral border-2 border-circleTel-darkNeutral hover:bg-gray-50'
          )}
          onClick={() => onServiceChange(service.value)}
        >
          {service.label}
        </button>
      ))}
    </div>
  );
}

/**
 * SubToggle Component
 *
 * Secondary toggle for additional options (e.g., router selection)
 * Used within service type sections.
 *
 * @example
 * ```tsx
 * <SubToggle
 *   options={[
 *     { value: 'with-router', label: 'SIM + New Router' },
 *     { value: 'free-router', label: 'SIM + Free Router' },
 *     { value: 'sim-only', label: 'SIM Only' },
 *   ]}
 *   activeOption="with-router"
 *   onOptionChange={(value) => console.log(value)}
 * />
 * ```
 */
interface SubToggleProps<T extends string> {
  options: {
    value: T;
    label: string;
    enabled?: boolean;
  }[];
  activeOption: T;
  onOptionChange: (option: T) => void;
  className?: string;
}

export function SubToggle<T extends string>({
  options,
  activeOption,
  onOptionChange,
  className,
}: SubToggleProps<T>) {
  const enabledOptions = options.filter((o) => o.enabled !== false);

  return (
    <div
      className={cn(
        'flex gap-2 flex-wrap justify-center items-center',
        className
      )}
      role="group"
      aria-label="Additional options"
    >
      {enabledOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            'px-5 py-2 rounded-full font-semibold text-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-circleTel-orange/50',
            'hover:shadow-sm active:scale-95',
            activeOption === option.value
              ? 'bg-circleTel-darkNeutral text-white'
              : 'bg-white text-circleTel-darkNeutral border-2 border-circleTel-secondaryNeutral hover:border-circleTel-darkNeutral'
          )}
          onClick={() => onOptionChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
