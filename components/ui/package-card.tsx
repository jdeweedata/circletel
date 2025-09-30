"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HiShoppingBag } from 'react-icons/hi2';
import { cn } from '@/lib/utils';

export interface PackageCardProps {
  id: string;
  type: 'capped' | 'uncapped';
  speed?: string;
  dataAmount?: string;
  description: string;
  price: number;
  popular?: boolean;
  className?: string;
  onSelect?: (packageId: string) => void;
}

export function PackageCard({
  id,
  type,
  speed,
  dataAmount,
  description,
  price,
  popular = false,
  className,
  onSelect
}: PackageCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-circleTel-orange/10 hover:-translate-y-1",
      "border-circleTel-gray-200 bg-white min-h-[280px] flex flex-col",
      popular && "ring-2 ring-circleTel-orange ring-offset-2 shadow-lg",
      className
    )}>
      {popular && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-circleTel-orange to-circleTel-red text-white border-0 shadow-md">
          Most Popular
        </Badge>
      )}

      <CardHeader className="pb-4 flex-grow">
        {type === 'uncapped' && (
          <Badge variant="secondary" className="w-fit bg-gradient-to-r from-circleTel-blue-50 to-circleTel-gray-50 text-circleTel-blue-600 border border-circleTel-blue-200 font-medium">
            UNCAPPED
          </Badge>
        )}

        <div className="space-y-1">
          <dt className="text-lg font-bold text-circleTel-darkNeutral">
            {speed || dataAmount}
          </dt>
          <dd className="text-sm text-circleTel-secondaryNeutral">
            {description}
          </dd>
        </div>
      </CardHeader>

      <CardContent className="pt-0 mt-auto">
        <Button
          onClick={() => onSelect?.(id)}
          className="w-full bg-gradient-to-r from-circleTel-orange to-circleTel-red hover:from-circleTel-red hover:to-circleTel-red-dark text-white flex items-center justify-between group shadow-md hover:shadow-lg transition-all duration-200"
        >
          <span className="font-medium">
            <span className="text-lg">R{price}.</span>
            <span className="text-sm">00 pm</span>
          </span>
          <HiShoppingBag className="w-5 h-5 transition-transform group-hover:scale-110" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default PackageCard;