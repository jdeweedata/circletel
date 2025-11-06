'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Columns3 } from 'lucide-react';

export interface ColumnVisibility {
  provider: boolean;
  status: boolean;
  featuredPopular: boolean;
  description: boolean;
  sku: boolean;
  category: boolean;
  serviceType: boolean;
  speed: boolean;
  contract: boolean;
  updatedDate: boolean;
  costPrice: boolean;
}

const DEFAULT_COLUMNS: ColumnVisibility = {
  provider: true,
  status: true,
  featuredPopular: true,
  description: true,
  sku: true,
  category: true,
  serviceType: true,
  speed: true,
  contract: true,
  updatedDate: true,
  costPrice: true,
};

const COLUMN_LABELS: Record<keyof ColumnVisibility, string> = {
  provider: 'Provider Logo',
  status: 'Status Badge',
  featuredPopular: 'Featured/Popular Badges',
  description: 'Description',
  sku: 'SKU',
  category: 'Category',
  serviceType: 'Service Type',
  speed: 'Speed Info',
  contract: 'Contract Months',
  updatedDate: 'Updated Date',
  costPrice: 'Cost Price',
};

interface ColumnCustomizationProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnVisibility;
  onColumnsChange: (columns: ColumnVisibility) => void;
}

export function ColumnCustomization({
  open,
  onClose,
  columns,
  onColumnsChange,
}: ColumnCustomizationProps) {
  const [localColumns, setLocalColumns] = useState<ColumnVisibility>(columns);

  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleToggle = (key: keyof ColumnVisibility) => {
    setLocalColumns(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    onColumnsChange(localColumns);
    localStorage.setItem('product-list-columns', JSON.stringify(localColumns));
    onClose();
  };

  const handleReset = () => {
    setLocalColumns(DEFAULT_COLUMNS);
  };

  const visibleCount = Object.values(localColumns).filter(Boolean).length;
  const totalCount = Object.keys(localColumns).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Columns3 className="h-5 w-5" />
            Customize List View Columns
          </DialogTitle>
          <DialogDescription>
            Choose which columns to display in the list view. Name, Price, and Actions are always visible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg mb-4">
            <span className="text-sm font-medium text-gray-700">
              {visibleCount} of {totalCount} columns visible
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs"
            >
              Reset to Defaults
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(localColumns) as Array<keyof ColumnVisibility>).map((key) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Label
                  htmlFor={`column-${key}`}
                  className="cursor-pointer flex-1"
                >
                  {COLUMN_LABELS[key]}
                </Label>
                <Switch
                  id={`column-${key}`}
                  checked={localColumns[key]}
                  onCheckedChange={() => handleToggle(key)}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The following columns are always visible: Selection, Product Name, Base Price, and Actions.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
