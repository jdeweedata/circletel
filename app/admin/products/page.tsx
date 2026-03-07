'use client';

import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PiPackageBold, PiWarningBold, PiTrendDownBold, PiArchiveBold } from 'react-icons/pi';
import { Product, ProductFilters } from '@/lib/types/products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { AdminProductCard } from '@/components/admin/products/AdminProductCard';
import { ProductsList, ColumnVisibility } from '@/components/admin/products/ProductsList';
import { CategorySection } from '@/components/admin/products/CategorySection';
import { BulkActionsToolbar } from '@/components/admin/products/BulkActionsToolbar';
import { PriceEditModal } from '@/components/admin/products/PriceEditModal';
import { AuditHistoryModal } from '@/components/admin/products/AuditHistoryModal';
import { QuickEditModal } from '@/components/admin/products/QuickEditModal';
import { ColumnCustomization } from '@/components/admin/products/ColumnCustomization';
import { ActiveFiltersChips } from '@/components/admin/products/ActiveFiltersChips';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared/UnderlineTabs';
import {
  ProductsListHeader,
  ProductsStatCards,
  ProductsFilters,
  ProductsViewToggle,
  type ProductStats,
  type StatFilterType,
  type ViewMode,
  type ManagementTab,
} from '@/components/admin/products/list';
import { ProductPortfolioDashboard } from '@/components/admin/products/portfolio';
import { convertProductsToCSV, downloadCSV, generateCSVFilename } from '@/lib/utils/export-csv';

// Category display configuration
const categoryConfig = {
  connectivity: {
    label: 'Connectivity',
    description: 'Internet and network services',
    icon: <PiPackageBold className="h-5 w-5" />,
    color: 'blue' as const,
  },
  hardware: {
    label: 'Hardware',
    description: 'Network devices and equipment',
    icon: <PiPackageBold className="h-5 w-5" />,
    color: 'purple' as const,
  },
  software: {
    label: 'Software',
    description: 'Applications and licenses',
    icon: <PiPackageBold className="h-5 w-5" />,
    color: 'green' as const,
  },
  services: {
    label: 'Professional Services',
    description: 'IT support and consulting',
    icon: <PiPackageBold className="h-5 w-5" />,
    color: 'orange' as const,
  },
  bundles: {
    label: 'Bundles',
    description: 'Combined product offerings',
    icon: <PiPackageBold className="h-5 w-5" />,
    color: 'purple' as const,
  },
  it_services: {
    label: 'IT Services',
    description: 'Managed IT and support services',
    icon: <PiPackageBold className="h-5 w-5" />,
    color: 'gray' as const,
  },
};

const PAGE_TABS = [
  { id: 'products', label: 'Products' },
  { id: 'portfolio', label: 'Portfolio' },
] as const;

export default function AdminProducts() {
  const { hasPermission } = usePermissions();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [productStats, setProductStats] = useState<ProductStats>({
    total: 0,
    active: 0,
    draft: 0,
    archived: 0,
    lowMargin: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 100,
    total: 0,
    total_pages: 0,
  });

  // View state
  const [pageTab, setPageTab] = useState<string>('products');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [managementTab, setManagementTab] = useState<ManagementTab>('all');
  const [statFilter, setStatFilter] = useState<StatFilterType>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Selection & modals
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [priceEditModalOpen, setPriceEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [auditHistoryModalOpen, setAuditHistoryModalOpen] = useState(false);
  const [productForAudit, setProductForAudit] = useState<Product | null>(null);
  const [quickEditModalOpen, setQuickEditModalOpen] = useState(false);
  const [columnCustomizationOpen, setColumnCustomizationOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
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
  });

  // Load preferences from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('admin-products-view-mode') as ViewMode;
    if (savedViewMode) setViewMode(savedViewMode);

    const savedColumnVisibility = localStorage.getItem('product-list-columns');
    if (savedColumnVisibility) {
      try {
        setColumnVisibility(JSON.parse(savedColumnVisibility));
      } catch {
        // Use defaults
      }
    }
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: pagination.per_page.toString(),
      });

      if (filters.category) params.append('category', filters.category);
      if (filters.service_type) params.append('service_type', filters.service_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.contract_term) params.append('contract_term', filters.contract_term.toString());
      if (filters.device_type) params.append('device_type', filters.device_type);
      if (filters.technology) params.append('technology', filters.technology);
      if (filters.data_package) params.append('data_package', filters.data_package);

      const response = await fetch(`/api/admin/products?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch products');

      setProducts(data.products || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
        total_pages: data.total_pages || 1,
      }));
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from products
  useEffect(() => {
    if (products.length === 0) return;

    const active = products.filter((p) => p.status === 'active').length;
    const draft = products.filter((p) => p.status === 'draft').length;
    const archived = products.filter((p) => p.status === 'archived').length;
    const lowMargin = products.filter((p) => {
      const price = parseFloat(p.base_price_zar || '0');
      const cost = parseFloat(p.cost_price_zar || '0');
      if (price <= 0 || cost <= 0) return false;
      const margin = ((price - cost) / price) * 100;
      return margin < 25;
    }).length;

    setProductStats({
      total: products.length,
      active,
      draft,
      archived,
      lowMargin,
    });
  }, [products]);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, pagination.per_page, filters]);

  // Computed: filtered products based on management tab
  const duplicateProducts = useMemo(() => {
    const nameMap = new Map<string, Product[]>();
    products.forEach((p) => {
      const key = p.name.toLowerCase().trim();
      if (!nameMap.has(key)) nameMap.set(key, []);
      nameMap.get(key)!.push(p);
    });
    return Array.from(nameMap.values())
      .filter((group) => group.length > 1)
      .flat()
      .map((product) => ({ product }));
  }, [products]);

  const lowMarginProducts = useMemo(() => {
    return products.filter((p) => {
      const price = parseFloat(p.base_price_zar || '0');
      const cost = parseFloat(p.cost_price_zar || '0');
      if (price <= 0 || cost <= 0) return false;
      const margin = ((price - cost) / price) * 100;
      return margin < 25;
    });
  }, [products]);

  const inactiveProducts = useMemo(() => {
    return products.filter((p) => p.status === 'inactive' || p.status === 'archived');
  }, [products]);

  const filteredProducts = useMemo(() => {
    switch (managementTab) {
      case 'duplicates':
        return duplicateProducts.map((d) => d.product);
      case 'low-margin':
        return lowMarginProducts;
      case 'inactive':
        return inactiveProducts;
      default:
        return products;
    }
  }, [managementTab, products, duplicateProducts, lowMarginProducts, inactiveProducts]);

  // Group products by category
  const filteredProductsByCategory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    filteredProducts.forEach((product) => {
      const cat = product.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(product);
    });
    return grouped;
  }, [filteredProducts]);

  // Handlers
  const handleRefresh = () => {
    fetchProducts();
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('admin-products-view-mode', mode);
  };

  const handleFilterChange = (key: keyof ProductFilters | 'search', value: string) => {
    if (key === 'search') {
      setSearchQuery(value);
      setFilters((prev) => ({ ...prev, search: value || undefined }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setFilters((prev) => ({ ...prev, search: query || undefined }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setSearchQuery('');
    setStatFilter(null);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatFilterChange = (filter: StatFilterType) => {
    setStatFilter(filter);
    if (filter === 'all' || filter === null) {
      setFilters((prev) => ({ ...prev, status: undefined }));
    } else if (filter === 'lowMargin') {
      setManagementTab('low-margin');
      setFilters((prev) => ({ ...prev, status: undefined }));
    } else {
      setFilters((prev) => ({ ...prev, status: filter }));
    }
  };

  const handleExportCSV = () => {
    try {
      const csvContent = convertProductsToCSV(filteredProducts);
      const tabSuffix = managementTab !== 'all' ? `-${managementTab}` : '';
      const filename = generateCSVFilename(`circletel-products${tabSuffix}`);
      downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export CSV');
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleClearSelection = () => setSelectedProductIds([]);

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          id: undefined,
          name: `${product.name} (Copy)`,
          sku: `${product.sku}-COPY`,
          status: 'draft',
        }),
      });
      if (response.ok) fetchProducts();
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      const response = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      if (response.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error('Archive failed:', err);
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handlePriceEdit = (product: Product) => {
    setProductToEdit(product);
    setPriceEditModalOpen(true);
  };

  const handlePriceSave = async (
    productId: string,
    updates: { base_price_zar: number; cost_price_zar: number; change_reason: string }
  ) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) fetchProducts();
    } catch (err) {
      console.error('Price update failed:', err);
    } finally {
      setPriceEditModalOpen(false);
      setProductToEdit(null);
    }
  };

  const handleViewAuditHistory = (product: Product) => {
    setProductForAudit(product);
    setAuditHistoryModalOpen(true);
  };

  const handlePublish = async (product: Product) => {
    try {
      await fetch(`/api/admin/products/${product.id}/publish`, { method: 'POST' });
      fetchProducts();
    } catch (err) {
      console.error('Publish failed:', err);
    }
  };

  const handleQuickEditSave = async (updates: Partial<Product>) => {
    try {
      await Promise.all(
        selectedProductIds.map((id) =>
          fetch(`/api/admin/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          })
        )
      );
      fetchProducts();
      setSelectedProductIds([]);
    } catch (err) {
      console.error('Quick edit failed:', err);
    } finally {
      setQuickEditModalOpen(false);
    }
  };

  // Bulk actions
  const handleBulkActivate = async () => {
    await Promise.all(
      selectedProductIds.map((id) =>
        fetch(`/api/admin/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        })
      )
    );
    fetchProducts();
    setSelectedProductIds([]);
  };

  const handleBulkDeactivate = async () => {
    await Promise.all(
      selectedProductIds.map((id) =>
        fetch(`/api/admin/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'inactive' }),
        })
      )
    );
    fetchProducts();
    setSelectedProductIds([]);
  };

  const handleBulkArchive = async () => {
    await Promise.all(
      selectedProductIds.map((id) =>
        fetch(`/api/admin/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'archived' }),
        })
      )
    );
    fetchProducts();
    setSelectedProductIds([]);
  };

  const handleBulkSetCategory = async (category: string) => {
    await Promise.all(
      selectedProductIds.map((id) =>
        fetch(`/api/admin/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category }),
        })
      )
    );
    fetchProducts();
    setSelectedProductIds([]);
  };

  const handleBulkSetFeatured = async (isFeatured: boolean) => {
    await Promise.all(
      selectedProductIds.map((id) =>
        fetch(`/api/admin/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_featured: isFeatured }),
        })
      )
    );
    fetchProducts();
    setSelectedProductIds([]);
  };

  const handleBulkSetPopular = async (isPopular: boolean) => {
    await Promise.all(
      selectedProductIds.map((id) =>
        fetch(`/api/admin/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_popular: isPopular }),
        })
      )
    );
    fetchProducts();
    setSelectedProductIds([]);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(products);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setProducts(items);
  };

  const hasActiveFilters = Object.keys(filters).some((k) => filters[k as keyof ProductFilters]) || searchQuery !== '';

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="h-6 bg-slate-200 rounded w-32 animate-pulse mb-2" />
            <div className="h-9 bg-slate-200 rounded w-48 animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-10 w-10 bg-slate-200 rounded-lg mb-3" />
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-8 bg-slate-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <ProductsListHeader
        lastRefreshed={lastRefreshed}
        onRefresh={handleRefresh}
        onExport={handleExportCSV}
        isLoading={loading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        <ProductsStatCards
          stats={productStats}
          activeFilter={statFilter}
          onFilterChange={handleStatFilterChange}
        />

        <UnderlineTabs tabs={PAGE_TABS} activeTab={pageTab} onTabChange={setPageTab} />

        <TabPanel id="products" activeTab={pageTab} className="space-y-4">
          <ProductsFilters
            filters={filters}
            searchQuery={searchQuery}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            onClearAll={handleClearAllFilters}
            hasActiveFilters={hasActiveFilters}
            onApplyPreset={(preset) => {
              setFilters(preset);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          />

          <ActiveFiltersChips
            filters={filters}
            searchQuery={searchQuery}
            onRemoveFilter={(key) => handleFilterChange(key, '')}
            onClearSearch={() => handleSearchChange('')}
            onClearAll={handleClearAllFilters}
          />

          <ProductsViewToggle
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            managementTab={managementTab}
            onManagementTabChange={setManagementTab}
            onColumnCustomization={() => setColumnCustomizationOpen(true)}
            duplicateCount={duplicateProducts.length}
            lowMarginCount={lowMarginProducts.length}
            inactiveCount={inactiveProducts.length}
          />

          {/* Context messages for special tabs */}
          {managementTab === 'duplicates' && duplicateProducts.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <PiWarningBold className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {duplicateProducts.length} potential duplicate{duplicateProducts.length !== 1 ? 's' : ''} detected
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Products with similar names. Review and merge or archive duplicates.
                </p>
              </div>
            </div>
          )}

          {managementTab === 'low-margin' && lowMarginProducts.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <PiTrendDownBold className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {lowMarginProducts.length} product{lowMarginProducts.length !== 1 ? 's' : ''} with margin below 25%
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Review pricing or costs to improve profitability.
                </p>
              </div>
            </div>
          )}

          {managementTab === 'inactive' && inactiveProducts.length > 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-2">
              <PiArchiveBold className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {inactiveProducts.length} inactive or archived product{inactiveProducts.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  These products are not visible to customers.
                </p>
              </div>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-6">
                {Object.entries(filteredProductsByCategory).map(([category, categoryProducts]) => {
                  const config = categoryConfig[category as keyof typeof categoryConfig] || {
                    label: category,
                    description: '',
                    icon: <PiPackageBold className="h-5 w-5" />,
                    color: 'gray' as const,
                  };

                  return (
                    <CategorySection
                      key={category}
                      title={config.label}
                      description={config.description}
                      count={categoryProducts.length}
                      icon={config.icon}
                      color={config.color}
                      defaultExpanded
                    >
                      <Droppable droppableId={category}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                          >
                            {categoryProducts.map((product, index) => (
                              <Draggable key={product.id} draggableId={product.id} index={index}>
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps}>
                                    <AdminProductCard
                                      product={product}
                                      selected={selectedProductIds.includes(product.id)}
                                      onSelect={handleSelectProduct}
                                      onEdit={(p) => (window.location.href = `/admin/products/${p.id}/edit`)}
                                      onView={(p) => (window.location.href = `/admin/products/${p.id}`)}
                                      onToggleStatus={handleToggleStatus}
                                      onDuplicate={handleDuplicate}
                                      onArchive={(p) => {
                                        setProductToDelete(p);
                                        setDeleteDialogOpen(true);
                                      }}
                                      onPriceEdit={handlePriceEdit}
                                      onViewAuditHistory={handleViewAuditHistory}
                                      onPublish={handlePublish}
                                      hasEditPermission={hasPermission(PERMISSIONS.PRODUCTS.EDIT)}
                                      hasDeletePermission={hasPermission(PERMISSIONS.PRODUCTS.DELETE)}
                                      hasPricingPermission={hasPermission(PERMISSIONS.PRODUCTS.MANAGE_PRICING)}
                                      hasCreatePermission={hasPermission(PERMISSIONS.PRODUCTS.CREATE)}
                                      dragHandleProps={provided.dragHandleProps}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </CategorySection>
                  );
                })}
              </div>
            </DragDropContext>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {managementTab === 'all' && 'Product Catalogue'}
                  {managementTab === 'duplicates' && 'Duplicate Products'}
                  {managementTab === 'low-margin' && 'Low Margin Products'}
                  {managementTab === 'inactive' && 'Inactive Products'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductsList
                  products={filteredProducts}
                  selectedIds={selectedProductIds}
                  onSelect={handleSelectProduct}
                  onEdit={(p) => (window.location.href = `/admin/products/${p.id}/edit`)}
                  onToggleStatus={handleToggleStatus}
                  onDuplicate={handleDuplicate}
                  onArchive={(p) => {
                    setProductToDelete(p);
                    setDeleteDialogOpen(true);
                  }}
                  onPriceEdit={handlePriceEdit}
                  onViewAuditHistory={handleViewAuditHistory}
                  onPublish={handlePublish}
                  hasEditPermission={hasPermission(PERMISSIONS.PRODUCTS.EDIT)}
                  hasDeletePermission={hasPermission(PERMISSIONS.PRODUCTS.DELETE)}
                  hasPricingPermission={hasPermission(PERMISSIONS.PRODUCTS.MANAGE_PRICING)}
                  hasCreatePermission={hasPermission(PERMISSIONS.PRODUCTS.CREATE)}
                  columnVisibility={columnVisibility}
                />
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{filteredProducts.length}</span>
                  {managementTab !== 'all' && <span> of {products.length}</span>}
                  {' '}product{filteredProducts.length !== 1 ? 's' : ''}
                  {managementTab !== 'all' && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {managementTab === 'duplicates' && 'Duplicates'}
                      {managementTab === 'low-margin' && 'Low Margin'}
                      {managementTab === 'inactive' && 'Inactive'}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Show:</span>
                  <Select
                    value={pagination.per_page.toString()}
                    onValueChange={(value) => setPagination((prev) => ({ ...prev, per_page: parseInt(value), page: 1 }))}
                  >
                    <SelectTrigger className="w-[80px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">per page</span>
                </div>

                {pagination.total_pages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                      className="hidden sm:flex"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-sm font-medium">{pagination.page}</span>
                      <span className="text-sm text-gray-400">/</span>
                      <span className="text-sm text-gray-500">{pagination.total_pages}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.total_pages}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.total_pages}
                      onClick={() => setPagination((prev) => ({ ...prev, page: pagination.total_pages }))}
                      className="hidden sm:flex"
                    >
                      Last
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel id="portfolio" activeTab={pageTab}>
          <ProductPortfolioDashboard products={products} />
        </TabPanel>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedProductIds.length}
        onClearSelection={handleClearSelection}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
        onBulkArchive={handleBulkArchive}
        onBulkSetCategory={handleBulkSetCategory}
        onBulkSetFeatured={handleBulkSetFeatured}
        onBulkSetPopular={handleBulkSetPopular}
        onQuickEdit={() => setQuickEditModalOpen(true)}
        hasEditPermission={hasPermission(PERMISSIONS.PRODUCTS.EDIT)}
        hasDeletePermission={hasPermission(PERMISSIONS.PRODUCTS.DELETE)}
      />

      {/* Modals */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive &quot;{productToDelete?.name}&quot;? This will set the
              product status to archived and make it inactive. This action can be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Archive Product</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {productToEdit && (
        <PriceEditModal
          product={productToEdit}
          open={priceEditModalOpen}
          onClose={() => {
            setPriceEditModalOpen(false);
            setProductToEdit(null);
          }}
          onSave={handlePriceSave}
        />
      )}

      {productForAudit && (
        <AuditHistoryModal
          productId={productForAudit.id}
          productName={productForAudit.name}
          open={auditHistoryModalOpen}
          onClose={() => {
            setAuditHistoryModalOpen(false);
            setProductForAudit(null);
          }}
        />
      )}

      <QuickEditModal
        products={products.filter((p) => selectedProductIds.includes(p.id))}
        open={quickEditModalOpen}
        onClose={() => setQuickEditModalOpen(false)}
        onSave={handleQuickEditSave}
      />

      <ColumnCustomization
        open={columnCustomizationOpen}
        onClose={() => setColumnCustomizationOpen(false)}
        columns={columnVisibility}
        onColumnsChange={setColumnVisibility}
      />
    </div>
  );
}
