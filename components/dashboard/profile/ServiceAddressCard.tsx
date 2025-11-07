'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  ServiceAddress,
  SERVICE_TYPE_NAMES,
  getInstallationStatusBadge,
  SouthAfricanProvince,
} from '@/lib/types/profile';

interface ServiceAddressCardProps {
  address: ServiceAddress;
  onEdit: (address: ServiceAddress) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function ServiceAddressCard({
  address,
  onEdit,
  onDelete,
  isDeleting = false,
}: ServiceAddressCardProps) {
  const statusBadge = getInstallationStatusBadge(address.installation_status);

  const getBadgeStyles = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'gray':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (address.installation_status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'scheduled':
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'inactive':
      case 'cancelled':
      case 'suspended':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-circleTel-darkNeutral">
                {address.location_name}
              </h3>
              {address.is_primary && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-circleTel-orange text-white">
                  Primary
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-circleTel-secondaryNeutral">
                {SERVICE_TYPE_NAMES[address.service_type]}
              </span>
              <span className="text-gray-400">•</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getBadgeStyles(
                  statusBadge.color
                )}`}
              >
                {getStatusIcon()}
                {statusBadge.label}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(address)}
              className="text-circleTel-orange hover:bg-orange-50 border-circleTel-orange/20"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(address.id)}
              disabled={isDeleting}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Address Details */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-circleTel-orange mt-0.5 flex-shrink-0" />
            <div className="text-circleTel-secondaryNeutral">
              <p>{address.street_address}</p>
              {address.suburb && <p>{address.suburb}</p>}
              <p>
                {address.city}, {address.province}
              </p>
              <p>{address.postal_code}</p>
            </div>
          </div>

          {/* Installation Date */}
          {address.installation_date && (
            <div className="flex items-center gap-2 text-sm text-circleTel-secondaryNeutral">
              <Calendar className="h-4 w-4 text-circleTel-orange flex-shrink-0" />
              <span>
                Installed:{' '}
                {new Date(address.installation_date).toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {address.notes && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm text-circleTel-secondaryNeutral italic">
              {address.notes}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
