'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Product, ProductFilters } from '@/lib/types/products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Search,
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  Columns3,
  Download,
  Wifi,
  HardDrive,
  Code,
  Headphones,
  Package as PackageBundle,
  X,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { AdminProductCard } from '@/components/admin/products/AdminProductCard';
import { ProductsList, ColumnVisibility } from '@/components/admin/products/ProductsList';
import { CategorySection } from '@/components/admin/products/CategorySection';
import { BulkActionsToolbar } from '@/components/admin/products/BulkActionsToolbar';
import { ProductStatsWidget } from '@/components/admin/products/ProductStatsWidget';
import { PriceEditModal } from '@/components/admin/products/PriceEditModal';
import { AuditHistoryModal } from '@/components/admin/products/AuditHistoryModal';
import { ActiveFiltersChips } from '@/components/admin/products/ActiveFiltersChips';
import { FilterPresets } from '@/components/admin/products/FilterPresets';
import { QuickEditModal } from '@/components/admin/products/QuickEditModal';
import { ColumnCustomization } from '@/components/admin/products/ColumnCustomization';
import { convertProductsToCSV, downloadCSV, generateCSVFilename } from '@/lib/utils/export-csv';

type ViewMode = 'grid' | 'list';

export default function AdminProducts() {
  const { hasPermission } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [productStats, setProductStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    archived: 0,
    featured: 0,
    popular: 0
  });

  // Debug logging for permissions
  useEffect(() => {
    const canEdit = hasPermission(PERMISSIONS.PRODUCTS.EDIT);
    const canCreate = hasPermission(PERMISSIONS.PRODUCTS.CREATE);
    const canDelete = hasPermission(PERMISSIONS.PRODUCTS.DELETE);
    const canManagePricing = hasPermission(PERMISSIONS.PRODUCTS.MANAGE_PRICING);

    console.log('[AdminProducts] Permission checks:', {
      canEdit,
      canCreate,
      canDelete,
      canManagePricing,
      PERMISSIONS_EDIT: PERMISSIONS.PRODUCTS.EDIT
    });
  }, [hasPermission]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 100, // Increased for better category view
    total: 0,
    total_pages: 0
  });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [priceEditModalOpen, setPriceEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [auditHistoryModalOpen, setAuditHistoryModalOpen] = useState(false);
  const [productForAudit, setProductForAudit] = useState<Product | null>(null);
  const [quickEditModalOpen, setQuickEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFiltersExpanded, setAdvancedFiltersExpanded] = useState(false);
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

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('admin-products-view-mode') as ViewMode;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }

    // Load advanced filters expanded state
    const savedAdvancedFilters = localStorage.getItem('admin-products-advanced-filters-expanded');
    if (savedAdvancedFilters === 'true') {
      setAdvancedFiltersExpanded(true);
    }

    // Load column visibility preferences
    const savedColumnVisibility = localStorage.getItem('product-list-columns');
    if (savedColumnVisibility) {
      try {
        setColumnVisibility(JSON.parse(savedColumnVisibility));
      } catch (error) {
        console.error('Failed to load column visibility:', error);
      }
    }
  }, []);

  // Save view mode preference
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('admin-products-view-mode', mode);
  };

  // Toggle advanced filters
  const toggleAdvancedFilters = () => {
    const newState = !advancedFiltersExpanded;
    setAdvancedFiltersExpanded(newState);
    localStorage.setItem('admin-products-advanced-filters-expanded', String(newState));
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: pagination.per_page.toString()
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

      const response = await fetch(`/api/admin/products?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to fetch products');
      }

      setProducts(result.data.products);
      setPagination({
        page: result.data.page,
        per_page: result.data.per_page,
        total: result.data.total,
        total_pages: result.data.total_pages
      });
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setProductStats({
        total: products.length,
        active: products.filter(p => p.is_active).length,
        draft: products.filter(p => p.status === 'draft').length,
        archived: products.filter(p => p.status === 'archived').length,
        featured: products.filter(p => p.is_featured).length,
        popular: products.filter(p => p.is_popular).length
      });
    } catch (err) {
      console.error('Error fetching product stats:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.page]);

  useEffect(() => {
    fetchStats();
  }, [products]);

  // Debug permissions on mount
  useEffect(() => {
    console.log('[Admin Products] Permissions check:', {
      canEdit: hasPermission(PERMISSIONS.PRODUCTS.EDIT),
      canDelete: hasPermission(PERMISSIONS.PRODUCTS.DELETE),
      canManagePricing: hasPermission(PERMISSIONS.PRODUCTS.MANAGE_PRICING),
      canCreate: hasPermission(PERMISSIONS.PRODUCTS.CREATE)
    });
  }, [hasPermission]);

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search });
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterChange = (key: keyof ProductFilters, value: string | boolean) => {
    setFilters({ ...filters, [key]: (value === '' || value === 'all') ? undefined : value });
    setPagination({ ...pagination, page: 1 });
  };

  // Group products by category
  const productsByCategory = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach(product => {
      const category = product.category || 'uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
    });
    return groups;
  }, [products]);

  const categoryConfig = {
    connectivity: {
      label: 'Connectivity',
      description: 'Fibre and wireless internet packages',
      icon: <Wifi className="h-5 w-5" />,
      color: 'blue' as const,
    },
    hardware: {
      label: 'Hardware',
      description: 'Routers, switches, and network equipment',
      icon: <HardDrive className="h-5 w-5" />,
      color: 'green' as const,
    },
    software: {
      label: 'Software',
      description: 'Software licenses and subscriptions',
      icon: <Code className="h-5 w-5" />,
      color: 'purple' as const,
    },
    services: {
      label: 'Services',
      description: 'Support and managed services',
      icon: <Headphones className="h-5 w-5" />,
      color: 'orange' as const,
    },
    bundles: {
      label: 'Bundles',
      description: 'Combined product packages',
      icon: <PackageBundle className="h-5 w-5" />,
      color: 'gray' as const,
    },
  };

  // Selection handlers
  const handleSelectProduct = (productId: string, selected: boolean) => {
    setSelectedProductIds(prev =>
      selected
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  const handleClearSelection = () => {
    setSelectedProductIds([]);
  };

  const handleSelectAll = (category?: string) => {
    const productsToSelect = category
      ? productsByCategory[category] || []
      : products;
    setSelectedProductIds(productsToSelect.map(p => p.id));
  };

  // Bulk operations
  const handleBulkActivate = async () => {
    try {
      await Promise.all(
        selectedProductIds.map(id =>
          fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': 'admin@circletel.co.za',
              'x-user-name': 'Admin User'
            },
            body: JSON.stringify({
              is_active: true,
              change_reason: 'Bulk activation by admin'
            })
          })
        )
      );
      await fetchProducts();
      await fetchStats();
      handleClearSelection();
    } catch (err) {
      console.error('Error bulk activating:', err);
      setError('Failed to activate products');
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await Promise.all(
        selectedProductIds.map(id =>
          fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': 'admin@circletel.co.za',
              'x-user-name': 'Admin User'
            },
            body: JSON.stringify({
              is_active: false,
              change_reason: 'Bulk deactivation by admin'
            })
          })
        )
      );
      await fetchProducts();
      await fetchStats();
      handleClearSelection();
    } catch (err) {
      console.error('Error bulk deactivating:', err);
      setError('Failed to deactivate products');
    }
  };

  const handleBulkArchive = async () => {
    if (!confirm(`Are you sure you want to archive ${selectedProductIds.length} products?`)) {
      return;
    }
    try {
      await Promise.all(
        selectedProductIds.map(id =>
          fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: {
              'x-user-email': 'admin@circletel.co.za',
              'x-user-name': 'Admin User'
            }
          })
        )
      );
      await fetchProducts();
      await fetchStats();
      handleClearSelection();
    } catch (err) {
      console.error('Error bulk archiving:', err);
      setError('Failed to archive products');
    }
  };

  const handleBulkSetCategory = async (category: string) => {
    try {
      await Promise.all(
        selectedProductIds.map(id =>
          fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': 'admin@circletel.co.za',
              'x-user-name': 'Admin User'
            },
            body: JSON.stringify({
              category,
              change_reason: `Bulk category change to ${category} by admin`
            })
          })
        )
      );
      await fetchProducts();
      await fetchStats();
      handleClearSelection();
    } catch (err) {
      console.error('Error bulk setting category:', err);
      setError('Failed to update category');
    }
  };

  const handleBulkSetFeatured = async (featured: boolean) => {
    try {
      await Promise.all(
        selectedProductIds.map(id =>
          fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': 'admin@circletel.co.za',
              'x-user-name': 'Admin User'
            },
            body: JSON.stringify({
              is_featured: featured,
              change_reason: `Bulk featured update by admin`
            })
          })
        )
      );
      await fetchProducts();
      await fetchStats();
      handleClearSelection();
    } catch (err) {
      console.error('Error bulk setting featured:', err);
      setError('Failed to update featured status');
    }
  };

  const handleBulkSetPopular = async (popular: boolean) => {
    try {
      await Promise.all(
        selectedProductIds.map(id =>
          fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': 'admin@circletel.co.za',
              'x-user-name': 'Admin User'
            },
            body: JSON.stringify({
              is_popular: popular,
              change_reason: `Bulk popular update by admin`
            })
          })
        )
      );
      await fetchProducts();
      await fetchStats();
      handleClearSelection();
    } catch (err) {
      console.error('Error bulk setting popular:', err);
      setError('Failed to update popular status');
    }
  };

  const handleQuickEditSave = async (updates: Partial<Product>) => {
    try {
      await Promise.all(
        selectedProductIds.map(id =>
          fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': 'admin@circletel.co.za',
              'x-user-name': 'Admin User'
            },
            body: JSON.stringify(updates)
          })
        )
      );
      await fetchProducts();
      await fetchStats();
      handleClearSelection();
    } catch (err) {
      console.error('Error bulk updating products:', err);
      setError('Failed to update products');
      throw err; // Re-throw so modal can handle error state
    }
  };

  // Individual product handlers
  const handleToggleStatus = async (product: Product) => {
    console.log('[Admin Products] Toggle status called for product:', product.id, 'Current status:', product.is_active);
    try {
      const newStatus = !product.is_active;
      console.log('[Admin Products] Sending request to toggle status to:', newStatus);

      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'admin@circletel.co.za',
          'x-user-name': 'Admin User'
        },
        body: JSON.stringify({
          is_active: newStatus,
          change_reason: `Status ${newStatus ? 'activated' : 'deactivated'} by admin`
        })
      });

      const data = await response.json();
      console.log('[Admin Products] Toggle response:', data);

      if (data.success) {
        console.log('[Admin Products] Status toggle successful, refreshing products...');
        await fetchProducts();
        await fetchStats();
        // Show success toast if available
        if (window.alert) {
          alert(`Product ${newStatus ? 'activated' : 'deactivated'} successfully`);
        }
      } else {
        console.error('[Admin Products] Toggle failed:', data.error);
        const errorMsg = data.error || 'Failed to update product status';
        setError(errorMsg);
        alert(`Error: ${errorMsg}`);
      }
    } catch (err) {
      console.error('[Admin Products] Error toggling product status:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to update product status';
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      // TODO: Implement duplicate API endpoint
      console.log('Duplicate product:', product.id);
      await fetchProducts();
      await fetchStats();
    } catch (err) {
      console.error('Error duplicating product:', err);
      setError('Failed to duplicate product');
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': 'admin@circletel.co.za',
          'x-user-name': 'Admin User'
        }
      });

      const data = await response.json();
      if (data.success) {
        await fetchProducts();
        await fetchStats();
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      } else {
        setError(data.error || 'Failed to archive product');
      }
    } catch (err) {
      console.error('Error archiving product:', err);
      setError('Failed to archive product');
    }
  };

  const handlePriceEdit = (product: Product) => {
    setProductToEdit(product);
    setPriceEditModalOpen(true);
  };

  const handlePriceSave = async (productId: string, updates: { base_price_zar: number; cost_price_zar: number; change_reason: string }) => {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': 'admin@circletel.co.za',
        'x-user-name': 'Admin User'
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update price');
    }

    await fetchProducts();
    await fetchStats();
  };

  const handleViewAuditHistory = (product: Product) => {
    setProductForAudit(product);
    setAuditHistoryModalOpen(true);
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      alert('No products to export');
      return;
    }

    try {
      const csvContent = convertProductsToCSV(products);
      const filename = generateCSVFilename('circletel-products');
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  // Drag and drop handler
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(products);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setProducts(items);
    // TODO: Persist order to backend
  };

  if (loading && products.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Catalogue Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your CircleTel product offerings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchProducts();
              fetchStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <PermissionGate permissions={[PERMISSIONS.PRODUCTS.CREATE]}>
            <Button asChild className="bg-circleTel-orange hover:bg-circleTel-orange/90">
              <Link href="/admin/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Widget */}
      <ProductStatsWidget stats={productStats} />

      {/* Filters */}
      <Card>
        <CardHeader>
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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Row 1: Search (Full Width) */}
            <div className="relative">
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
                  className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => {
                    setSearchQuery('');
                    handleSearch('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Row 2: Primary Filters + More Filters Button */}
            <div className="flex gap-3 flex-wrap items-center">
              <Select onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="connectivity">Connectivity</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="bundles">Bundles</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleFilterChange('device_type', value)}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Device Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="sim_only">SIM-Only</SelectItem>
                  <SelectItem value="cpe">CPE/Router</SelectItem>
                  <SelectItem value="handset">Handset</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleAdvancedFilters}
                className="ml-auto"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {advancedFiltersExpanded ? 'Less' : 'More'} Filters
                {(() => {
                  const secondaryFilterCount = [filters.contract_term, filters.technology, filters.data_package].filter(Boolean).length;
                  return secondaryFilterCount > 0 ? ` (${secondaryFilterCount})` : '';
                })()}
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${advancedFiltersExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Row 3: Secondary Filters + Sort + Clear All (Collapsible) */}
            {advancedFiltersExpanded && (
              <div className="flex gap-3 flex-wrap items-center animate-in slide-in-from-top-2 border-t border-gray-200 pt-3">
              <Select onValueChange={(value) => handleFilterChange('contract_term', value)}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Contract Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="0">Month-to-Month</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                  <SelectItem value="24">24 Months</SelectItem>
                  <SelectItem value="36">36 Months</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleFilterChange('technology', value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Technology" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tech</SelectItem>
                  <SelectItem value="5g">5G</SelectItem>
                  <SelectItem value="lte">LTE</SelectItem>
                  <SelectItem value="fibre">Fibre</SelectItem>
                  <SelectItem value="wireless">Wireless</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => handleFilterChange('data_package', value)}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Data Package" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="0-10">0-10 GB</SelectItem>
                  <SelectItem value="10-50">10-50 GB</SelectItem>
                  <SelectItem value="50-100">50-100 GB</SelectItem>
                  <SelectItem value="100-500">100-500 GB</SelectItem>
                  <SelectItem value="500+">500+ GB</SelectItem>
                  <SelectItem value="uncapped">Uncapped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            )}

            {/* Row 4: Sort By + Presets + Clear All (Always Visible) */}
            <div className="flex gap-3 flex-wrap items-center">
              <FilterPresets
                currentFilters={filters}
                onApplyPreset={(presetFilters) => {
                  setFilters(presetFilters);
                  setPagination({ ...pagination, page: 1 });
                }}
              />

              <Select onValueChange={(value) => handleFilterChange('sort_by', value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">Newest</SelectItem>
                  <SelectItem value="updated_desc">Recently Updated</SelectItem>
                  <SelectItem value="name_asc">Name A-Z</SelectItem>
                  <SelectItem value="price_asc">Price Low-High</SelectItem>
                  <SelectItem value="price_desc">Price High-Low</SelectItem>
                </SelectContent>
              </Select>

              {(Object.keys(filters).some(key => filters[key as keyof ProductFilters]) || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({});
                    setSearchQuery('');
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="text-circleTel-orange border-circleTel-orange hover:bg-circleTel-orange hover:text-white ml-auto"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Filter Chips */}
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* View Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => handleViewModeChange(value as ViewMode)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TabsList>
              <TabsTrigger value="grid" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Grid View
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
            </TabsList>

            {viewMode === 'list' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setColumnCustomizationOpen(true)}
                className="flex items-center gap-2"
              >
                <Columns3 className="h-4 w-4" />
                Customize Columns
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={products.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV ({products.length})
            </Button>
          </div>

          {selectedProductIds.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedProductIds.length} {selectedProductIds.length === 1 ? 'product' : 'products'} selected
            </div>
          )}
        </div>

        {/* Grid View */}
        <TabsContent value="grid" className="mt-6">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-6">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => {
                const config = categoryConfig[category as keyof typeof categoryConfig] || {
                  label: category,
                  description: '',
                  icon: <PackageBundle className="h-5 w-5" />,
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
                    defaultExpanded={true}
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
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                >
                                  <AdminProductCard
                                    product={product}
                                    selected={selectedProductIds.includes(product.id)}
                                    onSelect={handleSelectProduct}
                                    onEdit={(p) => {
                                      console.log('[Admin Products] Edit button clicked for product:', p.id);
                                      window.location.href = `/admin/products/${p.id}/edit`;
                                    }}
                                    onView={(p) => {
                                      console.log('[Admin Products] View button clicked for product:', p.id);
                                      window.location.href = `/admin/products/${p.id}`;
                                    }}
                                    onToggleStatus={(p) => {
                                      console.log('[Admin Products] Toggle called from card for product:', p.id);
                                      handleToggleStatus(p);
                                    }}
                                    onDuplicate={handleDuplicate}
                                    onArchive={(p) => {
                                      setProductToDelete(p);
                                      setDeleteDialogOpen(true);
                                    }}
                                    onPriceEdit={handlePriceEdit}
                                    onViewAuditHistory={handleViewAuditHistory}
                                    hasEditPermission={hasPermission(PERMISSIONS.PRODUCTS.EDIT)}
                                    hasDeletePermission={hasPermission(PERMISSIONS.PRODUCTS.DELETE)}
                                    hasPricingPermission={hasPermission(PERMISSIONS.PRODUCTS.MANAGE_PRICING)}
                                    hasCreatePermission={hasPermission(PERMISSIONS.PRODUCTS.CREATE)}
                                    isDragging={snapshot.isDragging}
                                    dragHandleProps={provided.dragHandleProps}
                                    showStats={false}
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
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Catalogue</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductsList
                products={products}
                selectedIds={selectedProductIds}
                onSelect={handleSelectProduct}
                onEdit={(p) => {
                  console.log('[Admin Products] Edit button clicked (list view) for product:', p.id);
                  window.location.href = `/admin/products/${p.id}/edit`;
                }}
                onToggleStatus={(p) => {
                  console.log('[Admin Products] Toggle called (list view) for product:', p.id);
                  handleToggleStatus(p);
                }}
                onDuplicate={handleDuplicate}
                onArchive={(p) => {
                  setProductToDelete(p);
                  setDeleteDialogOpen(true);
                }}
                onPriceEdit={handlePriceEdit}
                onViewAuditHistory={handleViewAuditHistory}
                hasEditPermission={hasPermission(PERMISSIONS.PRODUCTS.EDIT)}
                hasDeletePermission={hasPermission(PERMISSIONS.PRODUCTS.DELETE)}
                hasPricingPermission={hasPermission(PERMISSIONS.PRODUCTS.MANAGE_PRICING)}
                hasCreatePermission={hasPermission(PERMISSIONS.PRODUCTS.CREATE)}
                columnVisibility={columnVisibility}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
            {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
            {pagination.total} products
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            >
              Previous
            </Button>
            <span className="px-3 py-2 text-sm text-gray-500">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

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

      {/* Delete Dialog */}
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
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Archive Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Price Edit Modal */}
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

      {/* Audit History Modal */}
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

      {/* Quick Edit Modal */}
      <QuickEditModal
        products={products.filter(p => selectedProductIds.includes(p.id))}
        open={quickEditModalOpen}
        onClose={() => setQuickEditModalOpen(false)}
        onSave={handleQuickEditSave}
      />

      {/* Column Customization Modal */}
      <ColumnCustomization
        open={columnCustomizationOpen}
        onClose={() => setColumnCustomizationOpen(false)}
        columns={columnVisibility}
        onColumnsChange={setColumnVisibility}
      />
    </div>
  );
}
