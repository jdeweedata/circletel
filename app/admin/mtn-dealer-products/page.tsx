'use client';
import { useState, useEffect } from 'react';
import { MTNDealerProduct, MTNDealerProductFilters } from '@/lib/types/mtn-dealer-products';
import { UnderlineTabs } from '@/components/admin/shared/UnderlineTabs';
import { MTNHeader } from '@/components/admin/mtn-dealer-products/list/MTNHeader';
import { MTNFilters } from '@/components/admin/mtn-dealer-products/list/MTNFilters';
import { MTNTable } from '@/components/admin/mtn-dealer-products/list/MTNTable';
import { MTNOverviewTab } from '@/components/admin/mtn-dealer-products/overview/MTNOverviewTab';
import { MTNCommissionTab } from '@/components/admin/mtn-dealer-products/commission/MTNCommissionTab';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function MTNDealerProductsPage() {
  const [products, setProducts] = useState<MTNDealerProduct[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filters
  const [filters, setFilters] = useState<MTNDealerProductFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });
      
      if (filters.technology) params.append('technology', filters.technology);
      if (filters.contract_term !== undefined) params.append('contract_term', filters.contract_term.toString());
      if (filters.has_device !== undefined) params.append('has_device', filters.has_device.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.commission_tier) params.append('commission_tier', filters.commission_tier);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/admin/mtn-dealer-products?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.data.products);
        setTotalPages(result.data.total_pages);
        setTotal(result.data.total);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/mtn-dealer-products/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };
  
  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [page, filters, searchQuery]);
  
  // Handle import
  const handleImport = async () => {
    try {
      setImporting(true);
      setImportResult(null);
      
      // Fetch the JSON file
      const jsonResponse = await fetch('/api/admin/mtn-dealer-products/import-data');
      
      if (!jsonResponse.ok) {
        setImportResult({
          error: 'Please upload the JSON file or configure the import endpoint',
        });
        return;
      }
      
      const jsonData = await jsonResponse.json();
      
      const importResponse = await fetch('/api/admin/mtn-dealer-products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promos: jsonData.promos,
          source_file: jsonData.metadata?.source || 'Manual Import',
          filters: {
            current_deals_only: true,
          },
        }),
      });
      
      const importResult = await importResponse.json();
      setImportResult(importResult);
      
      if (importResult.success) {
        fetchProducts();
        fetchStats();
      }
    } catch (err) {
      setImportResult({ error: 'Import failed' });
    } finally {
      setImporting(false);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (key: keyof MTNDealerProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
    setPage(1);
  };
  
  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: `Products (${total})` },
    { id: 'commission', label: 'Commission Calculator' },
  ];
  
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header component */}
      <MTNHeader 
        importDialogOpen={importDialogOpen}
        setImportDialogOpen={setImportDialogOpen}
        importResult={importResult}
        importing={importing}
        handleImport={handleImport}
        onRefresh={() => { fetchProducts(); fetchStats(); }}
      />
      
      {/* Tabs */}
      <UnderlineTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <MTNOverviewTab 
            stats={stats} 
            formatCurrency={formatCurrency} 
          />
        )}
        
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <MTNFilters 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filters={filters}
              handleFilterChange={handleFilterChange}
              clearFilters={clearFilters}
            />
            
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <MTNTable 
                loading={loading}
                error={error}
                products={products}
                page={page}
                perPage={perPage}
                total={total}
                totalPages={totalPages}
                setPage={setPage}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        )}
        
        {/* Commission Calculator Tab */}
        {activeTab === 'commission' && (
          <MTNCommissionTab 
            formatCurrency={formatCurrency} 
          />
        )}
      </div>
    </div>
  );
}
