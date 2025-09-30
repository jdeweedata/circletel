'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Filter, X } from 'lucide-react';
import type { ProductCategory, ServiceType, ProductFilters } from '@/lib/types/products';
import { formatPrice } from '@/lib/types/products';

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  className?: string;
}

const categories: { value: ProductCategory; label: string }[] = [
  { value: 'connectivity', label: 'Connectivity' },
  { value: 'it_services', label: 'IT Services' },
  { value: 'bundle', label: 'Bundles' },
  { value: 'add_on', label: 'Add-ons' },
];

const serviceTypes: { value: ServiceType; label: string }[] = [
  { value: 'SkyFibre', label: 'SkyFibre Wireless' },
  { value: 'HomeFibreConnect', label: 'Home Fibre' },
  { value: 'BizFibreConnect', label: 'Business Fibre' },
  { value: 'IT_Support', label: 'IT Support' },
  { value: 'Cloud_Services', label: 'Cloud Services' },
];

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'speed_desc', label: 'Speed: Fastest First' },
  { value: 'speed_asc', label: 'Speed: Slowest First' },
  { value: 'name_asc', label: 'Name: A to Z' },
];

export function ProductFilters({
  filters,
  onFiltersChange,
  className
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [speedRange, setSpeedRange] = useState<[number, number]>([0, 1000]);

  useEffect(() => {
    setLocalFilters(filters);
    setPriceRange([filters.min_price || 0, filters.max_price || 5000]);
    setSpeedRange([filters.min_speed || 0, filters.max_speed || 1000]);
  }, [filters]);

  const handleCategoryChange = (category: ProductCategory | undefined) => {
    const newFilters = { ...localFilters, category };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleServiceTypeChange = (serviceType: ServiceType | undefined) => {
    const newFilters = { ...localFilters, service_type: serviceType };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value as [number, number]);
  };

  const handlePriceChangeEnd = (value: number[]) => {
    const newFilters = {
      ...localFilters,
      min_price: value[0],
      max_price: value[1],
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSpeedChange = (value: number[]) => {
    setSpeedRange(value as [number, number]);
  };

  const handleSpeedChangeEnd = (value: number[]) => {
    const newFilters = {
      ...localFilters,
      min_speed: value[0],
      max_speed: value[1],
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (sortBy: any) => {
    const newFilters = { ...localFilters, sort_by: sortBy };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: ProductFilters = {
      sort_by: 'popular'
    };
    setLocalFilters(resetFilters);
    setPriceRange([0, 5000]);
    setSpeedRange([0, 1000]);
    onFiltersChange(resetFilters);
  };

  const hasActiveFilters = () => {
    return !!(
      localFilters.category ||
      localFilters.service_type ||
      localFilters.min_price ||
      localFilters.max_price ||
      localFilters.min_speed ||
      localFilters.max_speed ||
      localFilters.is_featured ||
      localFilters.is_popular
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sort By */}
        <div className="space-y-3">
          <Label>Sort By</Label>
          <RadioGroup
            value={localFilters.sort_by || 'popular'}
            onValueChange={handleSortChange}
          >
            {sortOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label
                  htmlFor={option.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Category Filter */}
        <div className="space-y-3">
          <Label>Category</Label>
          <RadioGroup
            value={localFilters.category || ''}
            onValueChange={(value) => handleCategoryChange(value as ProductCategory || undefined)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="all-categories" />
              <Label
                htmlFor="all-categories"
                className="text-sm font-normal cursor-pointer"
              >
                All Categories
              </Label>
            </div>
            {categories.map((cat) => (
              <div key={cat.value} className="flex items-center space-x-2">
                <RadioGroupItem value={cat.value} id={cat.value} />
                <Label
                  htmlFor={cat.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  {cat.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Service Type Filter */}
        <div className="space-y-3">
          <Label>Service Type</Label>
          <RadioGroup
            value={localFilters.service_type || ''}
            onValueChange={(value) => handleServiceTypeChange(value as ServiceType || undefined)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="all-services" />
              <Label
                htmlFor="all-services"
                className="text-sm font-normal cursor-pointer"
              >
                All Services
              </Label>
            </div>
            {serviceTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <RadioGroupItem value={type.value} id={type.value} />
                <Label
                  htmlFor={type.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <Label>Price Range (per month)</Label>
          <div className="px-2">
            <Slider
              min={0}
              max={5000}
              step={100}
              value={priceRange}
              onValueChange={handlePriceChange}
              onValueCommit={handlePriceChangeEnd}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatPrice(priceRange[0])}</span>
              <span>{formatPrice(priceRange[1])}</span>
            </div>
          </div>
        </div>

        {/* Speed Range (for connectivity) */}
        {(localFilters.category === 'connectivity' || !localFilters.category) && (
          <div className="space-y-3">
            <Label>Speed Range (Mbps)</Label>
            <div className="px-2">
              <Slider
                min={0}
                max={1000}
                step={10}
                value={speedRange}
                onValueChange={handleSpeedChange}
                onValueCommit={handleSpeedChangeEnd}
                className="mb-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{speedRange[0]} Mbps</span>
                <span>{speedRange[1]} Mbps</span>
              </div>
            </div>
          </div>
        )}

        {/* Special Filters */}
        <div className="space-y-3">
          <Label>Special Offers</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={localFilters.is_featured || false}
                onCheckedChange={(checked) => {
                  const newFilters = { ...localFilters, is_featured: !!checked };
                  setLocalFilters(newFilters);
                  onFiltersChange(newFilters);
                }}
              />
              <Label
                htmlFor="featured"
                className="text-sm font-normal cursor-pointer"
              >
                Featured Products
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="popular"
                checked={localFilters.is_popular || false}
                onCheckedChange={(checked) => {
                  const newFilters = { ...localFilters, is_popular: !!checked };
                  setLocalFilters(newFilters);
                  onFiltersChange(newFilters);
                }}
              />
              <Label
                htmlFor="popular"
                className="text-sm font-normal cursor-pointer"
              >
                Popular Products
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
