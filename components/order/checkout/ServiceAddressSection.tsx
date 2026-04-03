'use client';

import { useState } from 'react';
import { PiMapPinBold, PiPencilSimpleBold, PiCheckBold } from 'react-icons/pi';
import { AddressAutocomplete } from '@/components/coverage/AddressAutocomplete';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const RESIDENTIAL_PROPERTY_TYPES = [
  { value: 'freestanding_home', label: 'Freestanding Home (SDU)' },
  { value: 'gated_estate', label: 'Gated / Security Estate' },
  { value: 'apartment', label: 'Apartment / Flat Complex' },
  { value: 'townhouse', label: 'Townhouse' },
];

const BUSINESS_PROPERTY_TYPES = [
  { value: 'office_park', label: 'Office or Business Park' },
  { value: 'industrial', label: 'Industrial or Warehouse' },
  { value: 'educational', label: 'Educational Facility' },
  { value: 'healthcare', label: 'Healthcare Facility' },
  { value: 'freestanding_commercial', label: 'Free Standing Building' },
  { value: 'soho', label: 'SOHO (Small Office Home Office)' },
];

interface ServiceAddressSectionProps {
  serviceAddress: string;
  propertyType: string;
  coverageType: string;
  showDeliveryAddress: boolean;
  deliveryAddress: string;
  sameAsServiceAddress: boolean;
  propertyTypeError?: string;
  onServiceAddressChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  onPropertyTypeChange: (value: string) => void;
  onDeliveryAddressChange: (address: string) => void;
  onSameAsServiceAddressChange: (checked: boolean) => void;
}

export function ServiceAddressSection({
  serviceAddress,
  propertyType,
  coverageType,
  showDeliveryAddress,
  deliveryAddress,
  sameAsServiceAddress,
  propertyTypeError,
  onServiceAddressChange,
  onPropertyTypeChange,
  onDeliveryAddressChange,
  onSameAsServiceAddressChange,
}: ServiceAddressSectionProps) {
  const [editingAddress, setEditingAddress] = useState(false);

  const propertyTypeOptions =
    coverageType === 'business' ? BUSINESS_PROPERTY_TYPES : RESIDENTIAL_PROPERTY_TYPES;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 sm:p-8 mb-5">
      <p className="text-sm font-bold text-circleTel-navy mb-4">Service address</p>

      {/* Service address display / edit */}
      {editingAddress ? (
        <div>
          <AddressAutocomplete
            value={serviceAddress}
            onLocationSelect={(data) => {
              onServiceAddressChange(
                data.address,
                data.latitude !== undefined && data.longitude !== undefined
                  ? { lat: data.latitude!, lng: data.longitude! }
                  : undefined
              );
            }}
            placeholder="Enter your service address"
            showLocationButton={true}
            showMapButton={true}
          />
          {serviceAddress && (
            <button
              type="button"
              onClick={() => setEditingAddress(false)}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-circleTel-orange hover:text-orange-700 transition-colors"
            >
              <PiCheckBold className="w-3.5 h-3.5" />
              Done editing
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-start gap-2.5 min-w-0">
            <PiMapPinBold className="w-4 h-4 text-circleTel-orange flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-800 leading-snug break-words min-w-0">
              {serviceAddress || <span className="text-gray-400 italic">No address selected</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditingAddress(true)}
            className="flex items-center gap-1 text-xs font-medium text-circleTel-orange hover:text-orange-700 transition-colors flex-shrink-0"
          >
            <PiPencilSimpleBold className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      )}

      {/* Property type */}
      <div className="mt-4">
        <Label htmlFor="propertyType" className="text-xs font-medium text-gray-600">
          Property type <span className="text-red-500">*</span>
        </Label>
        <Select value={propertyType} onValueChange={onPropertyTypeChange}>
          <SelectTrigger id="propertyType" className="mt-1.5 h-10 text-sm">
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            {propertyTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {propertyTypeError && (
          <p className="text-red-500 text-xs mt-1">{propertyTypeError}</p>
        )}
      </div>

      {/* Delivery address (wireless/mobile packages only) */}
      {showDeliveryAddress && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-3">Delivery address</p>
          <div className="flex items-center gap-2 mb-3">
            <Checkbox
              id="sameAsServiceAddress"
              checked={sameAsServiceAddress}
              onCheckedChange={(checked) => onSameAsServiceAddressChange(checked === true)}
            />
            <label htmlFor="sameAsServiceAddress" className="text-xs text-gray-600 cursor-pointer">
              Same as service address
            </label>
          </div>
          {!sameAsServiceAddress && (
            <AddressAutocomplete
              value={deliveryAddress}
              onLocationSelect={(data) => onDeliveryAddressChange(data.address)}
              placeholder="Enter delivery address"
              showLocationButton={false}
              showMapButton={false}
            />
          )}
        </div>
      )}
    </div>
  );
}
