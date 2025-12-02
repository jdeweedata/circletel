'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  RefreshCw,
  Upload,
  Download,
  Filter,
  Calculator,
  Smartphone,
  SimCard,
  Signal,
  Wifi,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  MTNDealerProduct,
  MTNDealerProductFilters,
  MTN_COMMISSION_TIERS,
  CONTRACT_TERM_OPTIONS,
  TECHNOLOGY_OPTIONS,
  DEVICE_STATUS_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
  calculateCommission,
} from '@/lib/types/mtn-dealer-products';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Stats Card Component
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  description?: string;
  trend?: { value: number; label: string };
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {description && (
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`h-3 w-3 ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-xs ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-orange-100 rounded-full">
            <Icon className="h-6 w-6 text-circleTel-orange" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Commission Tier Badge
function CommissionTierBadge({ tier }: { tier: string }) {
  const tierConfig = MTN_COMMISSION_TIERS.find(t => t.tier === tier);
  const rate = tierConfig?.effective_rate || 0;
  
  let colorClass = 'bg-gray-100 text-gray-700';
  if (rate >= 4) colorClass = 'bg-green-100 text-green-700';
  else if (rate >= 3) colorClass = 'bg-blue-100 text-blue-700';
  else if (rate >= 2) colorClass = 'bg-yellow-100 text-yellow-700';
  
  return (
    <Badge variant="outline" className={colorClass}>
      {tier} ({rate.toFixed(2)}%)
    </Badge>
  );
}

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
  
  // Commission calculator
  const [calcPrice, setCalcPrice] = useState<number>(500);
  const [calcTerm, setCalcTerm] = useState<number>(24);
  const [calcQuantity, setCalcQuantity] = useState<number>(1);
  
  const calculatedCommission = useMemo(() => {
    return calculateCommission(calcPrice, calcTerm, calcQuantity);
  }, [calcPrice, calcTerm, calcQuantity]);
  
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
        // If no import-data endpoint, show instructions
        setImportResult({
          error: 'Please upload the JSON file or configure the import endpoint',
        });
        return;
      }
      
      const jsonData = await jsonResponse.json();
      
      // Import the data
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
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MTN Dealer Products</h1>
          <p className="text-gray-500 mt-1">
            Manage MTN Business deals from Arlan Communications (Helios/iLula)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => { fetchProducts(); fetchStats(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import Deals
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Import MTN Dealer Products</DialogTitle>
                <DialogDescription>
                  Import products from the Helios/iLula Business Promos spreadsheet
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    This will import products from the JSON file at:<br />
                    <code className="text-xs bg-blue-100 px-1 rounded">
                      docs/products/helios-ilula-business-promos-nov-2025.json
                    </code>
                  </p>
                </div>
                {importResult && (
                  <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    {importResult.success ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Import Successful</span>
                        </div>
                        <div className="text-sm text-green-600 space-y-1">
                          <p>Imported: {importResult.data?.imported_records || 0} products</p>
                          <p>Skipped: {importResult.data?.skipped_records || 0} products</p>
                          <p>Errors: {importResult.data?.error_records || 0}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-700">
                        <XCircle className="h-5 w-5" />
                        <span>{importResult.error || 'Import failed'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Start Import
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Link href="/admin/mtn-dealer-products/new">
            <Button className="bg-circleTel-orange hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products ({total})</TabsTrigger>
          <TabsTrigger value="commission">Commission Calculator</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Products"
              value={stats?.stats?.total || 0}
              icon={Package}
              description={`${stats?.stats?.by_status?.active || 0} active`}
            />
            <StatsCard
              title="Current Deals"
              value={stats?.stats?.current_deals || 0}
              icon={Calendar}
              description="Within promo period"
            />
            <StatsCard
              title="With Device"
              value={stats?.stats?.by_device?.with_device || 0}
              icon={Smartphone}
              description={`${stats?.stats?.by_device?.sim_only || 0} SIM only`}
            />
            <StatsCard
              title="Price Range"
              value={stats?.stats?.price_range ? `${formatCurrency(stats.stats.price_range.min)} - ${formatCurrency(stats.stats.price_range.max)}` : '-'}
              icon={DollarSign}
              description={stats?.stats?.price_range ? `Avg: ${formatCurrency(stats.stats.price_range.avg)}` : ''}
            />
          </div>
          
          {/* Technology & Contract Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Signal className="h-5 w-5 text-circleTel-orange" />
                  By Technology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {TECHNOLOGY_OPTIONS.map(tech => (
                    <div key={tech.value} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{tech.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-circleTel-orange rounded-full"
                            style={{
                              width: `${((stats?.stats?.by_technology?.[tech.value] || 0) / (stats?.stats?.total || 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-12 text-right">
                          {stats?.stats?.by_technology?.[tech.value] || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-circleTel-orange" />
                  By Contract Term
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {CONTRACT_TERM_OPTIONS.map(term => {
                    const key = term.value === 0 ? 'month_to_month' : `${term.value}_months`;
                    return (
                      <div key={term.value} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{term.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{
                                width: `${((stats?.stats?.by_contract_term?.[key] || 0) / (stats?.stats?.total || 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-12 text-right">
                            {stats?.stats?.by_contract_term?.[key] || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Commission Tiers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-circleTel-orange" />
                Commission Structure (Arlan Contract)
              </CardTitle>
              <CardDescription>
                CircleTel receives 30% of MTN commissions from Arlan Communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subscription Tier</TableHead>
                    <TableHead className="text-right">MTN Rate</TableHead>
                    <TableHead className="text-right">CircleTel Share</TableHead>
                    <TableHead className="text-right">Effective Rate</TableHead>
                    <TableHead className="text-right">Products</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MTN_COMMISSION_TIERS.map(tier => (
                    <TableRow key={tier.tier}>
                      <TableCell className="font-medium">{tier.tier}</TableCell>
                      <TableCell className="text-right">{tier.mtn_rate}%</TableCell>
                      <TableCell className="text-right">{tier.circletel_share}%</TableCell>
                      <TableCell className="text-right font-semibold text-circleTel-orange">
                        {tier.effective_rate.toFixed(3)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {stats?.stats?.by_commission_tier?.[tier.tier] || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs text-gray-500">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by deal ID, price plan, device..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="w-[150px]">
                  <Label className="text-xs text-gray-500">Technology</Label>
                  <Select
                    value={filters.technology || 'all'}
                    onValueChange={(v) => handleFilterChange('technology', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {TECHNOLOGY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-[150px]">
                  <Label className="text-xs text-gray-500">Contract Term</Label>
                  <Select
                    value={filters.contract_term?.toString() || 'all'}
                    onValueChange={(v) => handleFilterChange('contract_term', v === 'all' ? undefined : parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {CONTRACT_TERM_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-[150px]">
                  <Label className="text-xs text-gray-500">Device</Label>
                  <Select
                    value={filters.has_device === undefined ? 'all' : filters.has_device.toString()}
                    onValueChange={(v) => handleFilterChange('has_device', v === 'all' ? undefined : v === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">With Device</SelectItem>
                      <SelectItem value="false">SIM Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-[150px]">
                  <Label className="text-xs text-gray-500">Status</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(v) => handleFilterChange('status', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {PRODUCT_STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="ghost" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Products Table */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12 text-red-500">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {error}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mb-4 text-gray-300" />
                  <p>No products found</p>
                  <p className="text-sm">Try adjusting your filters or import products</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Deal ID</TableHead>
                        <TableHead>Price Plan</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Technology</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead className="text-right">MTN Price</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map(product => {
                        const commission = calculateCommission(
                          product.mtn_price_incl_vat,
                          product.contract_term,
                          1,
                          product.circletel_commission_share
                        );
                        
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono text-xs">{product.deal_id}</TableCell>
                            <TableCell>
                              <div className="max-w-[200px]">
                                <p className="font-medium truncate">{product.price_plan}</p>
                                {product.data_bundle && (
                                  <p className="text-xs text-gray-500">{product.data_bundle} data</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {product.has_device ? (
                                <div className="flex items-center gap-1">
                                  <Smartphone className="h-4 w-4 text-gray-400" />
                                  <span className="text-xs max-w-[120px] truncate">{product.device_name}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-gray-400">
                                  <SimCard className="h-4 w-4" />
                                  <span className="text-xs">SIM Only</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                product.technology === '5G' ? 'bg-purple-50 text-purple-700' :
                                product.technology === 'LTE/5G' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-700'
                              }>
                                {product.technology}
                              </Badge>
                            </TableCell>
                            <TableCell>{product.contract_term_label}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(product.mtn_price_incl_vat)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(commission.circletel_commission)}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {commission.effective_rate.toFixed(2)}%
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                product.status === 'active' ? 'default' :
                                product.status === 'draft' ? 'secondary' :
                                'outline'
                              } className={
                                product.status === 'active' ? 'bg-green-100 text-green-700' : ''
                              }>
                                {product.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/admin/mtn-dealer-products/${product.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link href={`/admin/mtn-dealer-products/${product.id}/edit`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, total)} of {total} products
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Commission Calculator Tab */}
        <TabsContent value="commission" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-circleTel-orange" />
                  Commission Calculator
                </CardTitle>
                <CardDescription>
                  Calculate your commission for any deal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Monthly Subscription (Incl. VAT)</Label>
                  <Input
                    type="number"
                    value={calcPrice}
                    onChange={(e) => setCalcPrice(parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Contract Term</Label>
                  <Select
                    value={calcTerm.toString()}
                    onValueChange={(v) => setCalcTerm(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 Months</SelectItem>
                      <SelectItem value="24">24 Months</SelectItem>
                      <SelectItem value="36">36 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={calcQuantity}
                    onChange={(e) => setCalcQuantity(parseInt(e.target.value) || 1)}
                    min={1}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardHeader>
                <CardTitle className="text-circleTel-orange">Commission Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Commission Tier</p>
                    <p className="text-lg font-bold">{calculatedCommission.tier}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Effective Rate</p>
                    <p className="text-lg font-bold text-circleTel-orange">
                      {calculatedCommission.effective_rate.toFixed(3)}%
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Contract Value</span>
                    <span className="font-medium">{formatCurrency(calculatedCommission.total_contract_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MTN Commission ({calculatedCommission.mtn_rate}%)</span>
                    <span className="font-medium">{formatCurrency(calculatedCommission.mtn_commission)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CircleTel Share ({calculatedCommission.circletel_share}%)</span>
                    <span className="font-medium">{formatCurrency(calculatedCommission.circletel_commission)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Your Commission</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(calculatedCommission.total_circletel_commission)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Incl. VAT (15%)</span>
                    <span>{formatCurrency(calculatedCommission.circletel_commission_incl_vat * calcQuantity)}</span>
                  </div>
                </div>
                
                {calcQuantity > 1 && (
                  <div className="p-3 bg-green-100 rounded-lg text-center">
                    <p className="text-sm text-green-700">
                      Total for {calcQuantity} deals: <strong>{formatCurrency(calculatedCommission.total_circletel_commission)}</strong>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
