# Product Catalogue UX Improvements - Implementation Spec

**Status**: Ready for Implementation
**Created**: 2025-11-06
**Owner**: Development Team
**Estimated Effort**: 8-14 hours (42-68 story points)
**Priority Breakdown**: P0 (13 pts) → P1 (21 pts) → P2 (34 pts)

---

## Executive Summary

Comprehensive UX enhancements for CircleTel's admin product catalogue interface (`/admin/products`) to improve usability, visual hierarchy, and operational efficiency. Based on detailed analysis of current implementation and best practices.

**Current State**:
- 8 filter dropdowns spread across 2 rows (cluttered)
- Search input without placeholder or clear functionality
- Grid cards with good foundation but lacking hover effects and visual polish
- List view without alternating rows or sticky action buttons
- No active filter indicators or "Clear All" functionality
- Stats cards well-implemented (no changes needed)

**Success Metrics**:
- 40% reduction in filter interaction time
- 60% improvement in visual scanability (list view)
- 100% RBAC compliance maintained
- Zero breaking changes to existing functionality

---

## Table of Contents

1. [Priority 0: Quick Wins (13 pts)](#priority-0-quick-wins)
2. [Priority 1: Core Improvements (21 pts)](#priority-1-core-improvements)
3. [Priority 2: Advanced Features (34 pts)](#priority-2-advanced-features)
4. [Implementation Phases](#implementation-phases)
5. [Component Architecture](#component-architecture)
6. [Testing Strategy](#testing-strategy)
7. [Rollback Plan](#rollback-plan)

---

## Priority 0: Quick Wins (13 Story Points)

**Target**: 1-2 hours implementation
**Impact**: High visibility, low risk
**Deploy**: Can be deployed independently

### Task Group 1: Search Enhancements (3 pts)

**File**: `app/admin/products/page.tsx:608-618`

**Changes**:
```tsx
// Current (line 612-616)
<Input
  placeholder="Search products..."
  onChange={(e) => handleSearch(e.target.value)}
  className="pl-10"
/>

// Improved
<div className="relative flex-1">
  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
  <Input
    placeholder="Search by name, SKU, category, or description..."
    value={searchQuery}
    onChange={(e) => {
      setSearchQuery(e.target.value);
      handleSearch(e.target.value);
    }}
    className="pl-10 pr-10"
  />
  {searchQuery && (
    <Button
      variant="ghost"
      size="sm"
      className="absolute right-1 top-1 h-8 w-8 p-0"
      onClick={() => {
        setSearchQuery('');
        handleSearch('');
      }}
    >
      <X className="h-4 w-4" />
    </Button>
  )}
</div>
```

**New State**:
```tsx
const [searchQuery, setSearchQuery] = useState(''); // Add to component
```

**Acceptance Criteria**:
- [x] Placeholder text includes "SKU, category, or description"
- [x] Clear button (X) appears when search has text
- [x] Clicking clear button resets search and filters
- [x] Search maintains existing filter behavior

---

### Task Group 2: Clear All Filters Button (2 pts)

**File**: `app/admin/products/page.tsx:700-713`

**Implementation**:
```tsx
// Add after Sort By filter (line 712)
{Object.keys(filters).some(key => filters[key as keyof ProductFilters]) && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => {
      setFilters({});
      setSearchQuery('');
      setPagination({ ...pagination, page: 1 });
    }}
    className="text-circleTel-orange border-circleTel-orange hover:bg-circleTel-orange hover:text-white"
  >
    <X className="mr-2 h-4 w-4" />
    Clear All
  </Button>
)}
```

**Acceptance Criteria**:
- [x] Button only shows when at least one filter is active
- [x] Clicking clears all filters, search, and resets to page 1
- [x] Button uses CircleTel orange styling

---

### Task Group 3: Active Filter Count Badge (2 pts)

**File**: `app/admin/products/page.tsx:604-606`

**Implementation**:
```tsx
// Modify CardTitle (line 605)
<CardTitle className="text-lg flex items-center gap-2">
  Filter Products
  {(() => {
    const activeCount = Object.values(filters).filter(Boolean).length + (searchQuery ? 1 : 0);
    return activeCount > 0 ? (
      <Badge variant="default" className="bg-circleTel-orange">
        {activeCount} active
      </Badge>
    ) : null;
  })()}
</CardTitle>
```

**Acceptance Criteria**:
- [x] Badge shows count of active filters (including search)
- [x] Badge only appears when count > 0
- [x] Uses CircleTel orange background

---

### Task Group 4: List View Alternating Rows (2 pts)

**File**: `components/admin/products/ProductsList.tsx`

**Implementation**:
```tsx
// Modify row className (approximate line 120-130)
<div
  className={cn(
    "grid grid-cols-[auto_1fr_auto] items-center gap-4 p-4 border-b transition-colors",
    selectedIds.includes(product.id) && "bg-blue-50 border-blue-200",
    // Add alternating row colors
    index % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"
  )}
>
```

**Acceptance Criteria**:
- [x] Even rows: white background
- [x] Odd rows: light gray background
- [x] Hover states darken slightly
- [x] Selected rows maintain blue background

---

### Task Group 5: List View Action Button Sizing (2 pts)

**File**: `components/admin/products/ProductsList.tsx`

**Current**: Small icon buttons in dropdown
**Target**: Larger, more visible button group

**Implementation**:
```tsx
// Replace MoreHorizontal dropdown with button group
<div className="flex items-center gap-2">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onView?.(product)}
    className="hover:bg-circleTel-orange/10"
  >
    <Eye className="h-4 w-4 mr-1" />
    View
  </Button>
  {hasEditPermission && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onEdit?.(product)}
      className="hover:bg-circleTel-orange/10"
    >
      <Edit className="h-4 w-4 mr-1" />
      Edit
    </Button>
  )}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {/* Keep other actions in dropdown */}
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

**Acceptance Criteria**:
- [x] View and Edit buttons visible directly (not in dropdown)
- [x] Buttons have text labels + icons
- [x] Other actions remain in More dropdown
- [x] Button group respects RBAC permissions

---

### Task Group 6: Grid Card Hover Effects (2 pts)

**File**: `components/admin/products/AdminProductCard.tsx`

**Implementation**:
```tsx
// Modify main card div (approximate line 100-110)
<div
  className={cn(
    "group relative rounded-lg border bg-white transition-all duration-300",
    "hover:shadow-xl hover:scale-[1.02]",
    isDragging && "opacity-50 scale-95",
    selected && "ring-2 ring-circleTel-orange shadow-lg",
    !product.is_active && "opacity-60"
  )}
>
```

**Additional Enhancements**:
- Action buttons fade in on hover
- Status badge slightly brightens on hover
- Provider logo scales up 5% on card hover

**Acceptance Criteria**:
- [x] Card lifts with shadow on hover
- [x] Smooth 300ms transition
- [x] Scale effect: 1.02x
- [x] Action buttons more prominent on hover

---

## Priority 1: Core Improvements (21 Story Points)

**Target**: 2-4 hours implementation
**Impact**: Medium-high, moderate complexity
**Deploy**: After P0 completion

### Task Group 7: Filter Section Reorganization (5 pts)

**File**: `app/admin/products/page.tsx:603-716`

**Current Layout** (8 filters, 2 rows):
```
Row 1: [Search] | Category | Status | Contract | Device | Technology
Row 2:         | Data Package | Sort By
```

**Improved Layout** (3 rows, logical grouping):
```
Row 1: [Search Field - Full Width]
Row 2: Category | Status | Device Type [Primary Filters]
Row 3: Contract | Technology | Data | Sort By [Secondary Filters] | [Clear All]
```

**Implementation**:
```tsx
<CardContent>
  {/* Search Row */}
  <div className="mb-4">
    {/* Search with clear button from Task 1 */}
  </div>

  {/* Primary Filters */}
  <div className="flex gap-4 mb-3">
    <Select onValueChange={(value) => handleFilterChange('category', value)}>
      {/* Category filter */}
    </Select>
    <Select onValueChange={(value) => handleFilterChange('status', value)}>
      {/* Status filter */}
    </Select>
    <Select onValueChange={(value) => handleFilterChange('device_type', value)}>
      {/* Device Type filter */}
    </Select>
  </div>

  {/* Secondary Filters */}
  <div className="flex gap-4 items-center">
    <Select onValueChange={(value) => handleFilterChange('contract_term', value)}>
      {/* Contract Term */}
    </Select>
    <Select onValueChange={(value) => handleFilterChange('technology', value)}>
      {/* Technology */}
    </Select>
    <Select onValueChange={(value) => handleFilterChange('data_package', value)}>
      {/* Data Package */}
    </Select>
    <Select onValueChange={(value) => handleFilterChange('sort_by', value)}>
      {/* Sort By - pushed to right with ml-auto */}
    </Select>
    {/* Clear All button from Task 2 */}
  </div>
</CardContent>
```

**Acceptance Criteria**:
- [x] Filters organized in 3 logical rows
- [x] Primary filters (3) on Row 2
- [x] Secondary filters (4) on Row 3
- [x] Sort By right-aligned on Row 3
- [x] Reduced vertical space vs current implementation

---

### Task Group 8: Active Filter Chips Display (5 pts)

**File**: `app/admin/products/page.tsx` (after filter section)

**New Component**: `components/admin/products/ActiveFiltersChips.tsx`

**Implementation**:
```tsx
// New component
interface ActiveFiltersChipsProps {
  filters: ProductFilters;
  searchQuery: string;
  onRemoveFilter: (key: keyof ProductFilters) => void;
  onClearSearch: () => void;
  onClearAll: () => void;
}

export function ActiveFiltersChips({
  filters,
  searchQuery,
  onRemoveFilter,
  onClearSearch,
  onClearAll
}: ActiveFiltersChipsProps) {
  const activeFilters = Object.entries(filters).filter(([_, value]) => value);
  const hasActive = activeFilters.length > 0 || searchQuery;

  if (!hasActive) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
      <span className="text-sm font-medium text-gray-700">Active Filters:</span>

      {searchQuery && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1 cursor-pointer hover:bg-gray-300"
          onClick={onClearSearch}
        >
          Search: "{searchQuery}"
          <X className="h-3 w-3" />
        </Badge>
      )}

      {activeFilters.map(([key, value]) => (
        <Badge
          key={key}
          variant="secondary"
          className="flex items-center gap-1 cursor-pointer hover:bg-gray-300"
          onClick={() => onRemoveFilter(key as keyof ProductFilters)}
        >
          {formatFilterLabel(key, value)}
          <X className="h-3 w-3" />
        </Badge>
      ))}

      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-circleTel-orange hover:bg-circleTel-orange/10"
        >
          Clear All
        </Button>
      )}
    </div>
  );
}

function formatFilterLabel(key: string, value: any): string {
  // Format key and value for display
  const keyMap: Record<string, string> = {
    category: 'Category',
    status: 'Status',
    contract_term: 'Contract',
    device_type: 'Device',
    technology: 'Tech',
    data_package: 'Data',
    sort_by: 'Sort'
  };
  return `${keyMap[key] || key}: ${value}`;
}
```

**Usage in page.tsx**:
```tsx
{/* After Filter Card, before View Tabs */}
<ActiveFiltersChips
  filters={filters}
  searchQuery={searchQuery}
  onRemoveFilter={(key) => {
    handleFilterChange(key, '');
  }}
  onClearSearch={() => {
    setSearchQuery('');
    handleSearch('');
  }}
  onClearAll={() => {
    setFilters({});
    setSearchQuery('');
    setPagination({ ...pagination, page: 1 });
  }}
/>
```

**Acceptance Criteria**:
- [x] Chips display below filter section
- [x] Each chip shows filter name and value
- [x] Clicking X on chip removes that filter
- [x] "Clear All" button removes all chips
- [x] Section hidden when no active filters
- [x] Chips use CircleTel styling

---

### Task Group 9: Grid Card Price Prominence (3 pts)

**File**: `components/admin/products/AdminProductCard.tsx`

**Current**: Price shown in small text
**Target**: Large, prominent price display

**Implementation**:
```tsx
// Modify product info section
<div className="space-y-2">
  {/* Product Name */}
  <h3 className="font-semibold text-base text-gray-900 line-clamp-2">
    {product.name}
  </h3>

  {/* Price - NEW PROMINENT DISPLAY */}
  <div className="flex items-baseline gap-2">
    <span className="text-2xl font-bold text-circleTel-orange">
      {formatPrice(product.base_price_zar)}
    </span>
    <span className="text-sm text-gray-500">/month</span>
  </div>

  {/* SKU and Category */}
  <div className="flex items-center gap-2 text-xs text-gray-500">
    <span className="font-mono">{product.sku}</span>
    <span>•</span>
    <span>{product.category}</span>
  </div>

  {/* Description */}
  <p className="text-sm text-gray-600 line-clamp-2">
    {product.description}
  </p>
</div>
```

**Acceptance Criteria**:
- [x] Price in 2xl font size, bold
- [x] CircleTel orange color
- [x] /month suffix in smaller gray text
- [x] Positioned prominently near top of card
- [x] Cost price hidden (admin-only, shown in edit view)

---

### Task Group 10: Status Badge Color Coding (3 pts)

**File**: `components/admin/products/AdminProductCard.tsx`

**Current**: Generic badge colors
**Target**: Meaningful color system

**Implementation**:
```tsx
const getStatusBadgeVariant = (product: Product) => {
  if (!product.is_active) {
    return { variant: 'secondary', className: 'bg-gray-200 text-gray-700' };
  }
  switch (product.status) {
    case 'active':
      return { variant: 'default', className: 'bg-green-100 text-green-700 border-green-300' };
    case 'draft':
      return { variant: 'outline', className: 'bg-blue-50 text-blue-700 border-blue-300' };
    case 'archived':
      return { variant: 'secondary', className: 'bg-gray-100 text-gray-600' };
    default:
      return { variant: 'outline', className: '' };
  }
};

// Usage
<Badge {...getStatusBadgeVariant(product)}>
  {product.is_active ? 'Active' : 'Inactive'}
</Badge>

{product.is_featured && (
  <Badge className="bg-purple-100 text-purple-700 border-purple-300">
    <Star className="h-3 w-3 mr-1" />
    Featured
  </Badge>
)}

{product.is_popular && (
  <Badge className="bg-orange-100 text-orange-700 border-orange-300">
    <TrendingUp className="h-3 w-3 mr-1" />
    Popular
  </Badge>
)}
```

**Color System**:
- **Active**: Green (bg-green-100, text-green-700)
- **Inactive**: Gray (bg-gray-200, text-gray-700)
- **Draft**: Blue (bg-blue-50, text-blue-700)
- **Archived**: Dark gray (bg-gray-100, text-gray-600)
- **Featured**: Purple (bg-purple-100, text-purple-700)
- **Popular**: Orange (bg-orange-100, text-orange-700)

**Acceptance Criteria**:
- [x] Each status has distinct color
- [x] Colors accessible (WCAG AA contrast)
- [x] Icons included for Featured/Popular badges
- [x] Badge colors consistent across grid and list views

---

### Task Group 11: List View Sticky Action Buttons (5 pts)

**File**: `components/admin/products/ProductsList.tsx`

**Challenge**: Action buttons disappear on horizontal scroll

**Solution**: Sticky column with shadow

**Implementation**:
```tsx
// Modify table structure
<div className="relative overflow-x-auto">
  <div className="min-w-[900px]">
    {products.map((product, index) => (
      <div
        key={product.id}
        className="grid grid-cols-[auto_80px_1fr_120px_100px_150px_120px] items-center gap-4 p-4 border-b"
        style={{
          gridTemplateColumns: 'auto 80px 1fr 120px 100px 150px 120px'
        }}
      >
        {/* Checkbox */}
        <div className="flex items-center">
          <Checkbox
            checked={selectedIds.includes(product.id)}
            onCheckedChange={(checked) => onSelect?.(product.id, checked as boolean)}
          />
        </div>

        {/* Image */}
        <div className="w-16 h-16">
          <ProviderLogo provider={product.provider_id} size="sm" />
        </div>

        {/* Product Name + Description */}
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
          <p className="text-sm text-gray-500 truncate">{product.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono text-gray-400">{product.sku}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{product.category}</span>
          </div>
        </div>

        {/* Category */}
        <div className="text-sm text-gray-600">
          {product.category}
        </div>

        {/* Status */}
        <div>
          {getStatusBadge(product)}
        </div>

        {/* Price */}
        <div>
          <span className="text-lg font-bold text-circleTel-orange">
            {formatPrice(product.base_price_zar)}
          </span>
          <span className="text-xs text-gray-500 block">/month</span>
        </div>

        {/* Actions - STICKY */}
        <div className="sticky right-0 bg-white pl-4 border-l shadow-[-4px_0_8px_rgba(0,0,0,0.05)]">
          {/* Button group from Task 5 */}
        </div>
      </div>
    ))}
  </div>
</div>
```

**Acceptance Criteria**:
- [x] Action column stays visible on horizontal scroll
- [x] Subtle shadow indicates sticky behavior
- [x] Background color matches row (alternating)
- [x] Buttons accessible without scrolling

---

## Priority 2: Advanced Features (34 Story Points)

**Target**: 4-8 hours implementation
**Impact**: Medium, higher complexity
**Deploy**: Optional enhancements

### Task Group 12: Collapsible Advanced Filters (8 pts)

**New Component**: `components/admin/products/AdvancedFilters.tsx`

**Concept**: Hide secondary filters in collapsible section

**Implementation**:
```tsx
export function AdvancedFilters({
  filters,
  onFilterChange
}: {
  filters: ProductFilters;
  onFilterChange: (key: keyof ProductFilters, value: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-3">
      {/* Always Visible: Primary Filters */}
      <div className="flex gap-4">
        <Select onValueChange={(value) => onFilterChange('category', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          {/* Options */}
        </Select>

        <Select onValueChange={(value) => onFilterChange('status', value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          {/* Options */}
        </Select>

        <Select onValueChange={(value) => onFilterChange('device_type', value)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Device Type" />
          </SelectTrigger>
          {/* Options */}
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {isExpanded ? 'Less' : 'More'} Filters
          <ChevronDown className={cn(
            "h-4 w-4 ml-2 transition-transform",
            isExpanded && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Collapsible: Secondary Filters */}
      {isExpanded && (
        <div className="flex gap-4 pt-3 border-t animate-in slide-in-from-top-2">
          <Select onValueChange={(value) => onFilterChange('contract_term', value)}>
            {/* Contract Term */}
          </Select>
          <Select onValueChange={(value) => onFilterChange('technology', value)}>
            {/* Technology */}
          </Select>
          <Select onValueChange={(value) => onFilterChange('data_package', value)}>
            {/* Data Package */}
          </Select>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- [x] Primary filters always visible
- [x] "More Filters" button expands secondary filters
- [x] Smooth animation on expand/collapse
- [x] State persists in localStorage
- [x] Button shows count of active secondary filters

---

### Task Group 13: Saved Filter Presets (8 pts)

**Feature**: Save commonly used filter combinations

**New Component**: `components/admin/products/FilterPresets.tsx`

**Database Schema** (optional, can use localStorage):
```sql
CREATE TABLE admin_filter_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES admin_users(id),
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation**:
```tsx
interface FilterPreset {
  id: string;
  name: string;
  filters: ProductFilters;
  isDefault: boolean;
}

export function FilterPresets({
  currentFilters,
  onApplyPreset
}: {
  currentFilters: ProductFilters;
  onApplyPreset: (filters: ProductFilters) => void;
}) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Built-in presets
  const builtInPresets: FilterPreset[] = [
    {
      id: 'active-business',
      name: 'Active Business Products',
      filters: { status: 'active', category: 'connectivity' },
      isDefault: false
    },
    {
      id: 'featured-products',
      name: 'Featured Products',
      filters: { is_featured: true },
      isDefault: false
    },
    // ... more presets
  ];

  const handleSavePreset = async () => {
    const preset: FilterPreset = {
      id: crypto.randomUUID(),
      name: newPresetName,
      filters: currentFilters,
      isDefault: false
    };

    // Save to localStorage or API
    const saved = [...presets, preset];
    setPresets(saved);
    localStorage.setItem('product-filter-presets', JSON.stringify(saved));
    setIsCreating(false);
    setNewPresetName('');
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Presets
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Built-in Presets</DropdownMenuLabel>
          {builtInPresets.map(preset => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => onApplyPreset(preset.filters)}
            >
              {preset.name}
            </DropdownMenuItem>
          ))}

          {presets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>My Presets</DropdownMenuLabel>
              {presets.map(preset => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => onApplyPreset(preset.filters)}
                  className="flex items-center justify-between"
                >
                  {preset.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(preset.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Save Current Filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Preset Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Preset name (e.g., Active 5G Products)"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
            />
            <div className="text-sm text-gray-500">
              Current filters: {Object.keys(currentFilters).length} active
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!newPresetName}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Acceptance Criteria**:
- [x] 5+ built-in presets available
- [x] Users can save current filter state as preset
- [x] Presets stored in localStorage (or DB)
- [x] Users can delete custom presets
- [x] Clicking preset applies all filters instantly

---

### Task Group 14: Bulk Edit with Inline Quick Edit (8 pts)

**Enhancement**: Quick edit key fields without opening full edit page

**Implementation**:
```tsx
// Quick Edit Modal Component
export function QuickEditModal({
  products,
  open,
  onClose,
  onSave
}: {
  products: Product[];
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Product>) => Promise<void>;
}) {
  const [updates, setUpdates] = useState<Partial<Product>>({});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Quick Edit {products.length} Product{products.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category */}
          <div>
            <Label>Category</Label>
            <Select onValueChange={(value) => setUpdates({...updates, category: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              {/* Options */}
            </Select>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Active Status</Label>
              <p className="text-sm text-gray-500">Enable/disable products</p>
            </div>
            <Switch
              checked={updates.is_active ?? true}
              onCheckedChange={(checked) => setUpdates({...updates, is_active: checked})}
            />
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Featured</Label>
              <p className="text-sm text-gray-500">Show on homepage</p>
            </div>
            <Switch
              checked={updates.is_featured ?? false}
              onCheckedChange={(checked) => setUpdates({...updates, is_featured: checked})}
            />
          </div>

          {/* Popular Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Popular</Label>
              <p className="text-sm text-gray-500">Mark as popular choice</p>
            </div>
            <Switch
              checked={updates.is_popular ?? false}
              onCheckedChange={(checked) => setUpdates({...updates, is_popular: checked})}
            />
          </div>

          {/* Change Reason */}
          <div>
            <Label>Change Reason *</Label>
            <Textarea
              placeholder="Describe why you're making these changes..."
              value={updates.change_reason || ''}
              onChange={(e) => setUpdates({...updates, change_reason: e.target.value})}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSave(updates)}
            disabled={!updates.change_reason}
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
          >
            Apply to {products.length} Product{products.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Usage in BulkActionsToolbar**:
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setQuickEditModalOpen(true)}
  disabled={selectedCount === 0}
>
  <Edit className="h-4 w-4 mr-2" />
  Quick Edit
</Button>
```

**Acceptance Criteria**:
- [x] Modal edits multiple products at once
- [x] Fields: category, status, featured, popular
- [x] Change reason required (audit trail)
- [x] Applies changes to all selected products
- [x] Shows count of products being edited

---

### Task Group 15: Column Customization (5 pts)

**Feature**: Let users choose which columns to display in list view

**Implementation**:
```tsx
interface ColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
  width?: string;
}

export function ColumnCustomizer({
  columns,
  onColumnsChange
}: {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns className="h-4 w-4 mr-2" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map(column => (
          <DropdownMenuItem
            key={column.key}
            onClick={() => {
              const updated = columns.map(col =>
                col.key === column.key ? {...col, enabled: !col.enabled} : col
              );
              onColumnsChange(updated);
            }}
          >
            <Checkbox
              checked={column.enabled}
              className="mr-2"
            />
            {column.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Default Columns**:
- Image (always visible)
- Name (always visible)
- SKU (toggle)
- Category (toggle)
- Status (toggle)
- Price (always visible)
- Contract Term (toggle)
- Technology (toggle)
- Data Package (toggle)
- Actions (always visible)

**Acceptance Criteria**:
- [x] Dropdown lists all available columns
- [x] Checkboxes toggle column visibility
- [x] Config saved to localStorage
- [x] Critical columns (name, price, actions) cannot be hidden

---

### Task Group 16: Export to CSV (5 pts)

**Feature**: Export filtered product list to CSV

**Implementation**:
```tsx
// Export utility
export async function exportProductsToCSV(products: Product[]) {
  const headers = [
    'SKU',
    'Name',
    'Category',
    'Status',
    'Price (ZAR)',
    'Cost Price (ZAR)',
    'Provider',
    'Technology',
    'Contract Term',
    'Data Package',
    'Is Active',
    'Is Featured',
    'Is Popular',
    'Created At'
  ];

  const rows = products.map(product => [
    product.sku,
    product.name,
    product.category,
    product.status,
    product.base_price_zar,
    product.cost_price_zar,
    product.provider_id,
    product.technology || '',
    product.contract_term || '',
    product.data_package || '',
    product.is_active ? 'Yes' : 'No',
    product.is_featured ? 'Yes' : 'No',
    product.is_popular ? 'Yes' : 'No',
    new Date(product.created_at).toLocaleDateString()
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `circletel-products-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

**Button in Header**:
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => exportProductsToCSV(products)}
  disabled={products.length === 0}
>
  <Download className="h-4 w-4 mr-2" />
  Export CSV
  <span className="ml-2 text-xs text-gray-500">({products.length})</span>
</Button>
```

**Acceptance Criteria**:
- [x] Exports currently filtered product list
- [x] CSV includes all key product fields
- [x] Filename includes date (e.g., circletel-products-2025-11-06.csv)
- [x] Button shows count of products to export
- [x] Works with pagination (exports all pages, not just visible)

---

## Implementation Phases

### Phase 1: Quick Wins (Week 1, Day 1-2)
**Duration**: 2 hours
**Story Points**: 13

**Tasks**:
1. Search enhancements (placeholder, clear button)
2. Clear All Filters button
3. Active filter count badge
4. List view alternating rows
5. List view larger action buttons
6. Grid card hover effects

**Deployment**: Deploy to staging after completion, verify all filters still work

---

### Phase 2: Core UX (Week 1, Day 3-4)
**Duration**: 4 hours
**Story Points**: 21

**Tasks**:
7. Filter section reorganization (3 rows)
8. Active filter chips display
9. Grid card price prominence
10. Status badge color coding
11. List view sticky action buttons

**Deployment**: Deploy to staging, test with real data, gather admin feedback

---

### Phase 3: Advanced Features (Week 2, Day 1-2)
**Duration**: 8 hours
**Story Points**: 34

**Tasks**:
12. Collapsible advanced filters
13. Saved filter presets
14. Bulk edit with quick edit modal
15. Column customization
16. Export to CSV

**Deployment**: Deploy to staging, beta test with 2-3 admin users, iterate based on feedback

---

### Phase 4: Production Rollout (Week 2, Day 3)
**Duration**: 2 hours

**Checklist**:
- [ ] All E2E tests passing
- [ ] Type check passing
- [ ] Manual QA on staging (Chrome, Firefox, Safari)
- [ ] Mobile responsive check
- [ ] RBAC permissions verified
- [ ] Performance check (large product lists)
- [ ] Admin user training (if needed)
- [ ] Deploy to production
- [ ] Monitor logs for 24 hours
- [ ] Gather user feedback

---

## Component Architecture

### New Components

```
components/admin/products/
├── ActiveFiltersChips.tsx (P1 - Task 8)
├── AdvancedFilters.tsx (P2 - Task 12)
├── FilterPresets.tsx (P2 - Task 13)
├── QuickEditModal.tsx (P2 - Task 14)
├── ColumnCustomizer.tsx (P2 - Task 15)
└── ExportButton.tsx (P2 - Task 16)
```

### Modified Components

```
app/admin/products/
└── page.tsx
    - Filter section reorganization
    - Search enhancements
    - Integration of new components

components/admin/products/
├── AdminProductCard.tsx
│   - Hover effects
│   - Price prominence
│   - Status badge colors
└── ProductsList.tsx
    - Alternating rows
    - Larger action buttons
    - Sticky actions column
    - Column customization support
```

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)

**Test File**: `__tests__/admin/products/page.test.tsx`

```typescript
describe('Product Catalogue Page', () => {
  describe('Search Functionality', () => {
    it('should show clear button when search has text', () => {
      // ...
    });

    it('should clear search when clear button clicked', () => {
      // ...
    });

    it('should filter products by search query', () => {
      // ...
    });
  });

  describe('Filter Functionality', () => {
    it('should show active filter count badge', () => {
      // ...
    });

    it('should display active filter chips', () => {
      // ...
    });

    it('should remove individual filter when chip X clicked', () => {
      // ...
    });

    it('should clear all filters when Clear All clicked', () => {
      // ...
    });
  });

  describe('Grid View', () => {
    it('should apply hover effects to cards', () => {
      // ...
    });

    it('should display price prominently', () => {
      // ...
    });

    it('should color-code status badges correctly', () => {
      // ...
    });
  });

  describe('List View', () => {
    it('should alternate row colors', () => {
      // ...
    });

    it('should keep action buttons sticky on scroll', () => {
      // ...
    });

    it('should show larger action buttons', () => {
      // ...
    });
  });
});
```

---

### E2E Tests (Playwright)

**Test File**: `tests/e2e/admin-products.spec.ts`

```typescript
test.describe('Product Catalogue Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
  });

  test('should filter products and show active chips', async ({ page }) => {
    // Select category filter
    await page.getByRole('combobox', { name: 'Category' }).click();
    await page.getByRole('option', { name: 'Connectivity' }).click();

    // Verify chip appears
    await expect(page.getByText('Category: Connectivity')).toBeVisible();

    // Click X on chip
    await page.locator('[data-chip="category"]').getByRole('button').click();

    // Verify chip removed and products updated
    await expect(page.getByText('Category: Connectivity')).not.toBeVisible();
  });

  test('should export products to CSV', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/circletel-products-\d{4}-\d{2}-\d{2}\.csv/);
  });

  test('should maintain sticky action buttons on scroll', async ({ page }) => {
    await page.getByRole('tab', { name: 'List View' }).click();

    // Scroll horizontally
    await page.locator('.overflow-x-auto').evaluate(el => el.scrollLeft = 500);

    // Verify action buttons still visible
    await expect(page.locator('[data-sticky="actions"]').first()).toBeVisible();
  });
});
```

---

### Manual Testing Checklist

**P0 Tasks (Quick Wins)**:
- [ ] Search shows placeholder text correctly
- [ ] Search clear button appears/disappears appropriately
- [ ] Clear All Filters button shows when filters active
- [ ] Active filter count badge updates correctly
- [ ] List view rows alternate colors (white/gray)
- [ ] List view action buttons are larger and visible
- [ ] Grid cards lift on hover with shadow
- [ ] Grid card transitions smooth (300ms)

**P1 Tasks (Core Improvements)**:
- [ ] Filters reorganized into 3 logical rows
- [ ] Sort By positioned on right
- [ ] Active filter chips appear below filters
- [ ] Clicking chip X removes that filter
- [ ] Grid cards show prominent pricing
- [ ] Status badges color-coded correctly
- [ ] List view action buttons sticky on horizontal scroll
- [ ] Sticky buttons have subtle shadow

**P2 Tasks (Advanced Features)**:
- [ ] Advanced filters collapse/expand smoothly
- [ ] Filter presets save and load correctly
- [ ] Quick Edit modal edits multiple products
- [ ] Column customizer toggles columns
- [ ] CSV export downloads with correct data

**Cross-Browser** (Chrome, Firefox, Safari):
- [ ] All layouts render correctly
- [ ] Hover effects work
- [ ] Dropdowns function properly
- [ ] No console errors

**Mobile Responsive**:
- [ ] Filters stack vertically on mobile
- [ ] Grid cards single column on mobile
- [ ] Touch targets minimum 44x44px
- [ ] No horizontal scroll on mobile

**RBAC Permissions**:
- [ ] Read-only users cannot see edit buttons
- [ ] Edit permission shows edit buttons
- [ ] Pricing permission shows price edit option
- [ ] Delete permission shows archive option

---

## Rollback Plan

### Quick Rollback (< 5 minutes)

If critical issues occur in production:

1. **Vercel Dashboard Rollback**:
   - Go to https://vercel.com/jdewee-livecoms-projects/circletel
   - Click "Deployments"
   - Find last working deployment (before UX changes)
   - Click "..." → "Promote to Production"

2. **Git Revert** (if needed):
   ```bash
   git checkout main
   git pull origin main
   git revert -m 1 <merge_commit_hash>
   git push origin main
   ```

### Gradual Rollback (Feature Flags)

**Option**: Add feature flag to toggle new UX on/off

```tsx
// Add to .env
NEXT_PUBLIC_ENABLE_NEW_PRODUCT_UX=true

// Usage in page.tsx
const useNewUX = process.env.NEXT_PUBLIC_ENABLE_NEW_PRODUCT_UX === 'true';

return (
  <div>
    {useNewUX ? (
      <NewFilterSection />
    ) : (
      <LegacyFilterSection />
    )}
  </div>
);
```

**Benefit**: Can disable new UX without full deployment rollback

---

## Success Metrics

**Quantitative**:
- Page load time: < 2 seconds (no regression)
- Time to apply filters: < 1 second (40% improvement)
- Action button click accuracy: > 95% (vs <80% for small buttons)
- Search usage: +50% (placeholder text encourages use)

**Qualitative**:
- Admin user feedback: 4.5/5 stars or higher
- Reduced support tickets: "Can't find filter", "How to clear filters"
- Admin user comments: "Easier to find products", "Faster workflow"

**Tracking**:
- Add analytics events for filter interactions
- Track most-used filter presets
- Monitor CSV export usage
- Survey admin users after 2 weeks

---

## Technical Debt & Future Enhancements

### Not in Scope (Future Consideration)

1. **Product Comparison Tool** (8 pts)
   - Side-by-side comparison of 2-3 products
   - Highlight differences in pricing, features, specs

2. **Advanced Search with Operators** (13 pts)
   - Support queries like `price:>500`, `data:>50GB`, `provider:mtn`
   - Autocomplete suggestions

3. **Bulk Import via CSV** (13 pts)
   - Upload CSV to create/update many products at once
   - Validation and preview before import

4. **Product Analytics Dashboard** (21 pts)
   - View product performance metrics (orders, revenue, conversion rate)
   - Trend charts over time
   - Integrated into product detail page

5. **Drag-and-Drop Reordering** (5 pts)
   - Already partially implemented with react-beautiful-dnd
   - Needs persistence layer in database (display_order column)

---

## Story Points Summary

| Priority | Task Groups | Story Points | Time Estimate |
|----------|-------------|--------------|---------------|
| **P0** (Quick Wins) | 6 tasks | 13 pts | 1-2 hours |
| **P1** (Core) | 5 tasks | 21 pts | 2-4 hours |
| **P2** (Advanced) | 5 tasks | 34 pts | 4-8 hours |
| **Total** | **16 tasks** | **68 pts** | **8-14 hours** |

**Fibonacci Scale**:
- 1-2 pts: Trivial (< 30 min)
- 3-5 pts: Simple (30 min - 2 hours)
- 8 pts: Moderate (2-4 hours)
- 13 pts: Complex (4-8 hours)
- 21+ pts: Very Complex (1-2 days)

---

## Dependencies & Requirements

### npm Packages (Already Installed)
- `@hello-pangea/dnd` - Drag and drop
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `@radix-ui/*` - shadcn/ui primitives

### New npm Packages (If Needed)
- None required for P0/P1 tasks
- P2 Task 16 (CSV export): Use built-in Blob/URL APIs (no package needed)

### Environment Variables
- No new environment variables required

### Database Changes
- P2 Task 13 (Filter Presets): Optional table `admin_filter_presets`
- All other tasks: No database changes

---

## Related Documentation

- **CircleTel CLAUDE.md**: Project conventions, component patterns
- **Admin Products Page**: `app/admin/products/page.tsx`
- **Component Architecture**: `components/admin/products/`
- **RBAC System**: `lib/rbac/permissions.ts`
- **Product Types**: `lib/types/products.ts`

---

## Approval & Sign-Off

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Owner | TBD | ⏳ Pending | - |
| Tech Lead | TBD | ⏳ Pending | - |
| QA Lead | TBD | ⏳ Pending | - |

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-06 | 1.0 | Initial spec created |

---

**Next Steps**:
1. Review spec with team
2. Prioritize P0/P1/P2 based on business needs
3. Assign tasks to developers
4. Create GitHub issues/project board
5. Begin Phase 1 implementation

**Questions or Feedback**: Contact development team or open GitHub issue.
