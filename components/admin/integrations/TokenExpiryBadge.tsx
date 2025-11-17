'use client';

import { Badge } from '@/components/ui/badge';
import { differenceInDays, format } from 'date-fns';
import { Calendar, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface TokenExpiryBadgeProps {
  expiresAt: string | null;
}

export function TokenExpiryBadge({ expiresAt }: TokenExpiryBadgeProps) {
  if (!expiresAt) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-0">
        <Calendar className="h-3 w-3 mr-1" />
        No expiry
      </Badge>
    );
  }

  const expiryDate = new Date(expiresAt);
  const daysUntilExpiry = differenceInDays(expiryDate, new Date());
  const formattedDate = format(expiryDate, 'MMM d, yyyy');

  // Expired
  if (daysUntilExpiry < 0) {
    return (
      <div className="flex flex-col gap-1">
        <Badge className="bg-red-100 text-red-700 border-0">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
        <span className="text-xs text-gray-500">{formattedDate}</span>
      </div>
    );
  }

  // Expiring within 7 days (warning)
  if (daysUntilExpiry <= 7) {
    return (
      <div className="flex flex-col gap-1">
        <Badge className="bg-yellow-100 text-yellow-700 border-0">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {daysUntilExpiry === 0 ? 'Today' : `${daysUntilExpiry} days`}
        </Badge>
        <span className="text-xs text-gray-500">{formattedDate}</span>
      </div>
    );
  }

  // Expiring within 30 days (notice)
  if (daysUntilExpiry <= 30) {
    return (
      <div className="flex flex-col gap-1">
        <Badge className="bg-blue-100 text-blue-700 border-0">
          <Calendar className="h-3 w-3 mr-1" />
          {daysUntilExpiry} days
        </Badge>
        <span className="text-xs text-gray-500">{formattedDate}</span>
      </div>
    );
  }

  // Healthy (more than 30 days)
  return (
    <div className="flex flex-col gap-1">
      <Badge className="bg-green-100 text-green-700 border-0">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {daysUntilExpiry} days
      </Badge>
      <span className="text-xs text-gray-500">{formattedDate}</span>
    </div>
  );
}
