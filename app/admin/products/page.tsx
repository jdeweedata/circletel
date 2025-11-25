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
  Copy,
  AlertTriangle,
  TrendingDown,
  Archive,
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
type ManagementTab = 'all' | 'duplicates' | 'low-margin' | 'inactive';

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
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, any>>({});

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
  const [managementTab, setManagementTab] = useState<ManagementTab>('all');
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

  const fetchIntegrationStatus = async (productIds: string[]) => {
    try {
      const ids = productIds.join(',');
      const response = await fetch(`/api/admin/products/integration-status?ids=${ids}`);
      const result = await response.json();

      if (result.success) {
        setIntegrationStatus(result.data);
      } else {
        console.error('Failed to fetch integration status:', result.error);
      }
    } catch (err) {
      console.error('Error fetching integration status:', err);
    }
  };

  const handleResync = async (product: Product) => {
    try {
      // Show loading state (could add a toast/notification here)
      console.log('[Admin Products] Re-syncing product:', product.id);

      // Trigger publish with force flag to re-sync to Zoho
      const response = await fetch(`/api/admin/products/${product.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Refresh integration status for this product
        await fetchIntegrationStatus([product.id]);

        // Show success message (could use toast notification)
        alert(`Product "${product.name}" re-synced successfully to Zoho CRM!`);
      } else {
        throw new Error(result.error || 'Failed to re-sync product');
      }
    } catch (err) {
      console.error('Error re-syncing product:', err);
      alert(`Failed to re-sync product: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.page]);

  useEffect(() => {
    fetchStats();
  }, [products]);

  // Fetch integration status when products are loaded
  useEffect(() => {
    if (products.length > 0) {
      const productIds = products.map(p => p.id);
      fetchIntegrationStatus(productIds);
    }
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

  // Detect duplicate products (similar names or same SKU)
  const duplicateProducts = useMemo(() => {
    const duplicates: { product: Product; matches: Product[]; reason: string }[] = [];
    const seen = new Map<string, Product[]>();
    
    // Group by normalized name (lowercase, trimmed, remove common suffixes)
    products.forEach(product => {
      const normalizedName = product.name
        .toLowerCase()
        .trim()
        .replace(/\s+(package|plan|bundle|deal)$/i, '')
        .replace(/\s+/g, ' ');
      
      if (!seen.has(normalizedName)) {
        seen.set(normalizedName, []);
      }
      seen.get(normalizedName)!.push(product);
    });

    // Find name duplicates
    seen.forEach((prods, name) => {
      if (prods.length > 1) {
        prods.forEach(product => {
          const matches = prods.filter(p => p.id !== product.id);
          if (!duplicates.find(d => d.product.id === product.id)) {
            duplicates.push({ product, matches, reason: 'Similar name' });
          }
        });
      }
    });

    // Check for SKU duplicates
    const skuMap = new Map<string, Product[]>();
    products.forEach(product => {
      if (product.sku) {
        const sku = product.sku.toLowerCase().trim();
        if (!skuMap.has(sku)) {
          skuMap.set(sku, []);
        }
        skuMap.get(sku)!.push(product);
      }
    });

    skuMap.forEach((prods, sku) => {
      if (prods.length > 1) {
        prods.forEach(product => {
          const existing = duplicates.find(d => d.product.id === product.id);
          if (existing) {
            existing.reason = 'Same SKU & Similar name';
          } else {
            const matches = prods.filter(p => p.id !== product.id);
            duplicates.push({ product, matches, reason: 'Same SKU' });
          }
        });
      }
    });

    return duplicates;
  }, [products]);

  // Low margin products (margin < 10%)
  const lowMarginProducts = useMemo(() => {
    return products.filter(product => {
      const price = product.base_price_zar || product.pricing?.monthly || 0;
      const cost = product.cost_price_zar || 0;
      if (price <= 0 || cost <= 0) return false;
      const margin = ((price - cost) / price) * 100;
      return margin < 10 && margin >= 0;
    });
  }, [products]);

  // Inactive/Archived products
  const inactiveProducts = useMemo(() => {
    return products.filter(product => 
      !product.is_active || product.status === 'archived' || product.status === 'inactive'
    );
  }, [products]);

  // Filtered products based on management tab
  const filteredProducts = useMemo(() => {
    switch (managementTab) {
      case 'duplicates':
        return duplicateProducts.map(d => d.product);
      case 'low-margin':
        return lowMarginProducts;
      case 'inactive':
        return inactiveProducts;
      default:
        return products;
    }
  }, [managementTab, products, duplicateProducts, lowMarginProducts, inactiveProducts]);

  // Group filtered products by category
  const filteredProductsByCategory = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach(product => {
      const category = product.category || 'uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
    });
    return groups;
  }, [filteredProducts]);

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

  const handlePublish = async (product: Product) => {
    try {
      const adminProductId = product.source_admin_product_id ?? product.id;
      const response = await fetch(`/api/admin/products/${adminProductId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error || data.details || 'Failed to publish product';
        console.error('[Admin Products] Publish failed:', errorMsg);
        setError(errorMsg);
        alert(`Error: ${errorMsg}`);
        return;
      }

      await fetchProducts();
      await fetchStats();
      alert('Product published to catalogue successfully');
    } catch (err) {
      console.error('[Admin Products] Error publishing product:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to publish product';
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
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
        if (typeof window !== 'undefined') {
          window.alert(`Product ${newStatus ? 'activated' : 'deactivated'} successfully`);
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
    if (filteredProducts.length === 0) {
      alert('No products to export');
      return;
    }

    try {
      const csvContent = convertProductsToCSV(filteredProducts);
      const tabSuffix = managementTab !== 'all' ? `-${managementTab}` : '';
      const filename = generateCSVFilename(`circletel-products${tabSuffix}`);
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
    <div className="space-y-6 p-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <PackageBundle className="h-8 w-8 text-circleTel-orange" />
            Product Catalogue
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your CircleTel product offerings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchProducts();
              fetchStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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

      {/* STATS CARDS - Clickable to filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card 
          className={`hover:shadow-lg transition-all cursor-pointer ${!filters.status ? 'ring-2 ring-circleTel-orange ring-offset-2' : ''}`}
          onClick={() => {
            setFilters({});
            setManagementTab('all');
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Products
            </CardTitle>
            <div className="p-2 rounded-lg bg-gray-100">
              <PackageBundle className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-circleTel-darkNeutral">
              {productStats.total}
            </div>
            <p className="text-xs text-circleTel-secondaryNeutral mt-1">
              Click to show all
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`hover:shadow-lg transition-all cursor-pointer ${filters.status === 'active' ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
          onClick={() => {
            handleFilterChange('status', 'active');
            setManagementTab('all');
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-100">
              <Wifi className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {productStats.active}
            </div>
            <p className="text-xs text-circleTel-secondaryNeutral mt-1">
              Click to filter
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`hover:shadow-lg transition-all cursor-pointer ${filters.status === 'draft' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''}`}
          onClick={() => {
            handleFilterChange('status', 'draft');
            setManagementTab('all');
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Draft
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-100">
              <Code className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {productStats.draft}
            </div>
            <p className="text-xs text-circleTel-secondaryNeutral mt-1">
              Click to filter
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`hover:shadow-lg transition-all cursor-pointer ${filters.status === 'archived' ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
          onClick={() => {
            handleFilterChange('status', 'archived');
            setManagementTab('inactive');
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Archived
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-100">
              <HardDrive className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {productStats.archived}
            </div>
            <p className="text-xs text-circleTel-secondaryNeutral mt-1">
              Click to filter
            </p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-all cursor-pointer"
          onClick={() => {
            setManagementTab('duplicates');
            setFilters({});
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Duplicates
            </CardTitle>
            <div className={`p-2 rounded-lg ${duplicateProducts.length > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
              <Copy className={`h-5 w-5 ${duplicateProducts.length > 0 ? 'text-amber-600' : 'text-green-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${duplicateProducts.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {duplicateProducts.length}
            </div>
            <p className="text-xs text-circleTel-secondaryNeutral mt-1">
              {duplicateProducts.length > 0 ? 'Click to review' : 'No duplicates'}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-all cursor-pointer"
          onClick={() => {
            setManagementTab('low-margin');
            setFilters({});
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Low Margin
            </CardTitle>
            <div className={`p-2 rounded-lg ${lowMarginProducts.length > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <TrendingDown className={`h-5 w-5 ${lowMarginProducts.length > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${lowMarginProducts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {lowMarginProducts.length}
            </div>
            <p className="text-xs text-circleTel-secondaryNeutral mt-1">
              {lowMarginProducts.length > 0 ? 'Click to review' : 'All healthy'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH + FILTERS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-circleTel-orange" />
              Filter Products
              {(() => {
                const activeCount = Object.values(filters).filter(Boolean).length + (searchQuery ? 1 : 0);
                return activeCount > 0 ? (
                  <Badge className="bg-circleTel-orange">
                    {activeCount} active
                  </Badge>
                ) : null;
              })()}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full space-y-4">
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Management Tabs */}
      <Card className="border-2 border-gray-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-600 mr-2">View:</span>
            <Button
              variant={managementTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setManagementTab('all')}
              className={managementTab === 'all' ? 'bg-circleTel-orange hover:bg-circleTel-orange/90' : ''}
            >
              <PackageBundle className="h-4 w-4 mr-1.5" />
              All Products
              <Badge variant="secondary" className="ml-2 bg-gray-100">{products.length}</Badge>
            </Button>
            <Button
              variant={managementTab === 'duplicates' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setManagementTab('duplicates')}
              className={`${managementTab === 'duplicates' ? 'bg-amber-500 hover:bg-amber-600' : ''} ${duplicateProducts.length > 0 ? 'border-amber-300' : ''}`}
            >
              <Copy className="h-4 w-4 mr-1.5" />
              Duplicates
              {duplicateProducts.length > 0 ? (
                <Badge variant="destructive" className="ml-2 bg-amber-500">{duplicateProducts.length}</Badge>
              ) : (
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">0</Badge>
              )}
            </Button>
            <Button
              variant={managementTab === 'low-margin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setManagementTab('low-margin')}
              className={`${managementTab === 'low-margin' ? 'bg-red-500 hover:bg-red-600' : ''} ${lowMarginProducts.length > 0 ? 'border-red-300' : ''}`}
            >
              <TrendingDown className="h-4 w-4 mr-1.5" />
              Low Margin
              {lowMarginProducts.length > 0 ? (
                <Badge variant="destructive" className="ml-2">{lowMarginProducts.length}</Badge>
              ) : (
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">0</Badge>
              )}
            </Button>
            <Button
              variant={managementTab === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setManagementTab('inactive')}
              className={managementTab === 'inactive' ? 'bg-gray-500 hover:bg-gray-600' : ''}
            >
              <Archive className="h-4 w-4 mr-1.5" />
              Inactive
              <Badge variant="secondary" className="ml-2">{inactiveProducts.length}</Badge>
            </Button>
          </div>
          
          {/* Context message for special tabs */}
          {managementTab === 'duplicates' && duplicateProducts.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {duplicateProducts.length} potential duplicate{duplicateProducts.length !== 1 ? 's' : ''} detected
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Products with similar names or matching SKUs. Review and merge or archive duplicates to keep your catalogue clean.
                </p>
              </div>
            </div>
          )}
          
          {managementTab === 'low-margin' && lowMarginProducts.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <TrendingDown className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {lowMarginProducts.length} product{lowMarginProducts.length !== 1 ? 's' : ''} with margin below 10%
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Consider reviewing pricing or costs for these products to improve profitability.
                </p>
              </div>
            </div>
          )}
          
          {managementTab === 'inactive' && inactiveProducts.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-2">
              <Archive className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {inactiveProducts.length} inactive or archived product{inactiveProducts.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  These products are not visible to customers. Reactivate or permanently delete as needed.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                className="flex items-center gap-2 rounded-xl"
              >
                <Columns3 className="h-4 w-4" />
                Customize Columns
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredProducts.length === 0}
              className="flex items-center gap-2 rounded-xl"
            >
              <Download className="h-4 w-4" />
              Export CSV ({filteredProducts.length})
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
              {Object.entries(filteredProductsByCategory).map(([category, categoryProducts]) => {
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
                                    onPublish={handlePublish}
                                    onResync={handleResync}
                                    integrationStatus={integrationStatus[product.id]}
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
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>
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
                onPublish={handlePublish}
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

      {/* Pagination - Always visible */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left: Product count info */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{filteredProducts.length}</span>
                {managementTab !== 'all' && (
                  <span> of {products.length}</span>
                )}
                {' '}product{filteredProducts.length !== 1 ? 's' : ''}
                {managementTab !== 'all' && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {managementTab === 'duplicates' && 'Duplicates'}
                    {managementTab === 'low-margin' && 'Low Margin'}
                    {managementTab === 'inactive' && 'Inactive'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Center: Page size selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show:</span>
              <Select 
                value={pagination.per_page.toString()} 
                onValueChange={(value) => {
                  setPagination({ ...pagination, per_page: parseInt(value), page: 1 });
                }}
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

            {/* Right: Pagination controls */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination({ ...pagination, page: 1 })}
                  className="hidden sm:flex"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
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
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => setPagination({ ...pagination, page: pagination.total_pages })}
                  className="hidden sm:flex"
                >
                  Last
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
