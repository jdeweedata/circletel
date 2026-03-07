'use client';

import { PiGridFourBold, PiListBold, PiColumnsBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { UnderlineTabs } from '@/components/admin/shared/UnderlineTabs';

export type ViewMode = 'grid' | 'list';
export type ManagementTab = 'all' | 'duplicates' | 'low-margin' | 'inactive';

const MANAGEMENT_TABS: Array<{ id: ManagementTab; label: string }> = [
  { id: 'all', label: 'All Products' },
  { id: 'duplicates', label: 'Duplicates' },
  { id: 'low-margin', label: 'Low Margin' },
  { id: 'inactive', label: 'Inactive' },
];

interface ProductsViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  managementTab: ManagementTab;
  onManagementTabChange: (tab: ManagementTab) => void;
  onColumnCustomization?: () => void;
  duplicateCount?: number;
  lowMarginCount?: number;
  inactiveCount?: number;
}

export function ProductsViewToggle({
  viewMode,
  onViewModeChange,
  managementTab,
  onManagementTabChange,
  onColumnCustomization,
  duplicateCount = 0,
  lowMarginCount = 0,
  inactiveCount = 0,
}: ProductsViewToggleProps) {
  // Build tabs with counts
  const tabsWithCounts = MANAGEMENT_TABS.map((tab) => {
    let label = tab.label;
    if (tab.id === 'duplicates' && duplicateCount > 0) {
      label = `${tab.label} (${duplicateCount})`;
    } else if (tab.id === 'low-margin' && lowMarginCount > 0) {
      label = `${tab.label} (${lowMarginCount})`;
    } else if (tab.id === 'inactive' && inactiveCount > 0) {
      label = `${tab.label} (${inactiveCount})`;
    }
    return { id: tab.id, label };
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <UnderlineTabs
        tabs={tabsWithCounts}
        activeTab={managementTab}
        onTabChange={(tab) => onManagementTabChange(tab as ManagementTab)}
      />

      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="rounded-none border-0"
          >
            <PiGridFourBold className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-none border-0"
          >
            <PiListBold className="h-4 w-4" />
          </Button>
        </div>

        {viewMode === 'list' && onColumnCustomization && (
          <Button variant="outline" size="sm" onClick={onColumnCustomization}>
            <PiColumnsBold className="h-4 w-4 mr-2" />
            Columns
          </Button>
        )}
      </div>
    </div>
  );
}
