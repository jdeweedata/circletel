'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Minus } from 'lucide-react';
import type { Product } from '@/lib/types/products';
import { formatPrice, formatSpeed } from '@/lib/types/products';
import { cn } from '@/lib/utils';

interface ProductComparisonProps {
  products: Product[];
  onRemove?: (product: Product) => void;
  onClear?: () => void;
  className?: string;
}

export function ProductComparison({
  products,
  onRemove,
  onClear,
  className
}: ProductComparisonProps) {
  if (products.length === 0) {
    return null;
  }

  const allFeatures = Array.from(
    new Set(products.flatMap(p => p.features || []))
  );

  const compareSpecs = [
    { key: 'monthly_price', label: 'Monthly Price', format: (val: any) => formatPrice(val) },
    { key: 'setup_fee', label: 'Setup Fee', format: (val: any) => formatPrice(val) },
    { key: 'download_speed', label: 'Download Speed', format: (val: any) => val ? formatSpeed(val) : 'N/A' },
    { key: 'upload_speed', label: 'Upload Speed', format: (val: any) => val ? formatSpeed(val) : 'N/A' },
    { key: 'min_contract_months', label: 'Contract Length', format: (val: any) => `${val} months` },
  ];

  return (
    <Card className={cn("mt-6", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Product Comparison</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClear}>
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Feature</TableHead>
                {products.map((product) => (
                  <TableHead key={product.id} className="min-w-[200px]">
                    <div className="space-y-2">
                      <div className="font-semibold">{product.name}</div>
                      {product.is_featured && (
                        <Badge variant="default" className="text-xs">Featured</Badge>
                      )}
                      {onRemove && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemove(product)}
                          className="text-xs"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Specifications */}
              {compareSpecs.map((spec) => (
                <TableRow key={spec.key}>
                  <TableCell className="font-medium">{spec.label}</TableCell>
                  {products.map((product) => (
                    <TableCell key={product.id}>
                      {spec.format((product as any)[spec.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/* Promotions */}
              <TableRow>
                <TableCell className="font-medium">Current Promotion</TableCell>
                {products.map((product) => (
                  <TableCell key={product.id}>
                    {product.active_promotion ? (
                      <Badge variant="destructive">
                        {product.active_promotion.name}
                      </Badge>
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                ))}
              </TableRow>

              {/* Features */}
              <TableRow>
                <TableCell colSpan={products.length + 1} className="font-medium bg-muted/50">
                  Features
                </TableCell>
              </TableRow>
              {allFeatures.map((feature) => (
                <TableRow key={feature}>
                  <TableCell className="font-medium">{feature}</TableCell>
                  {products.map((product) => (
                    <TableCell key={product.id}>
                      {product.features?.includes(feature) ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/* Actions */}
              <TableRow>
                <TableCell className="font-medium">Action</TableCell>
                {products.map((product) => (
                  <TableCell key={product.id}>
                    <Button size="sm" className="w-full">
                      Select This Plan
                    </Button>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
