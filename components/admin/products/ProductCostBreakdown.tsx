'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Trash2,
  Edit2,
  Calculator,
  TrendingUp,
  Package,
  Server,
  Cpu,
  HardDrive,
  Headphones,
  Wrench,
  FileText,
  MoreHorizontal,
  Copy,
  Loader2,
} from 'lucide-react';

// Types
export interface CostComponent {
  id?: string;
  package_id: string;
  name: string;
  category: CostComponentCategory;
  cost_amount: number;
  recurrence: CostRecurrenceType;
  amortisation_months?: number;
  amortised_monthly_cost?: number;
  unit_count?: number;
  supplier_name?: string;
  supplier_reference?: string;
  hardware_model?: string;
  hardware_retail_value?: number;
  hardware_dealer_cost?: number;
  description?: string;
  notes?: string;
  sort_order?: number;
  is_optional?: boolean;
  is_visible_to_customer?: boolean;
  metadata?: Record<string, any>;
}

export type CostComponentCategory =
  | 'provider'
  | 'infrastructure'
  | 'platform'
  | 'hardware'
  | 'addon_service'
  | 'support'
  | 'installation'
  | 'licensing'
  | 'other';

export type CostRecurrenceType =
  | 'monthly'
  | 'once_off'
  | 'amortised'
  | 'annual'
  | 'per_user'
  | 'per_device';

export interface CostSummary {
  totalMonthlyCost: number;
  totalOnceOffCost: number;
  componentCount: number;
  byCategory: Record<CostComponentCategory, number>;
}

export interface CostComponentTemplate {
  id: string;
  name: string;
  description?: string;
  product_category?: string;
  service_type?: string;
  customer_type?: string;
  components: Partial<CostComponent>[];
  is_active: boolean;
}

interface ProductCostBreakdownProps {
  packageId: string;
  sellingPriceExclVat: number;
  onTotalCostChange?: (totalCost: number) => void;
}

// Category configuration
const CATEGORY_CONFIG: Record<CostComponentCategory, { label: string; icon: React.ReactNode; color: string }> = {
  provider: { label: 'Provider/Wholesale', icon: <Package className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  infrastructure: { label: 'Infrastructure', icon: <Server className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  platform: { label: 'Platform/BSS', icon: <Cpu className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-800' },
  hardware: { label: 'Hardware/CPE', icon: <HardDrive className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' },
  addon_service: { label: 'Add-on Service', icon: <Plus className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  support: { label: 'Support', icon: <Headphones className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
  installation: { label: 'Installation', icon: <Wrench className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  licensing: { label: 'Licensing', icon: <FileText className="h-4 w-4" />, color: 'bg-cyan-100 text-cyan-800' },
  other: { label: 'Other', icon: <MoreHorizontal className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' },
};

const RECURRENCE_LABELS: Record<CostRecurrenceType, string> = {
  monthly: 'Monthly',
  once_off: 'Once-off',
  amortised: 'Amortised',
  annual: 'Annual',
  per_user: 'Per User',
  per_device: 'Per Device',
};

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Calculate effective monthly cost for a component
const calculateEffectiveMonthly = (component: CostComponent): number => {
  switch (component.recurrence) {
    case 'monthly':
      return component.cost_amount;
    case 'amortised':
      if (component.amortisation_months && component.amortisation_months > 0) {
        return component.cost_amount / component.amortisation_months;
      }
      return component.cost_amount;
    case 'annual':
      return component.cost_amount / 12;
    case 'per_user':
    case 'per_device':
      return component.cost_amount * (component.unit_count || 1);
    case 'once_off':
      return 0; // Once-off costs don't contribute to monthly
    default:
      return component.cost_amount;
  }
};

export function ProductCostBreakdown({
  packageId,
  sellingPriceExclVat,
  onTotalCostChange,
}: ProductCostBreakdownProps) {
  const { toast } = useToast();
  const [components, setComponents] = useState<CostComponent[]>([]);
  const [templates, setTemplates] = useState<CostComponentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingComponent, setEditingComponent] = useState<CostComponent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  // Fetch cost components
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch components for this product
        const componentsRes = await fetch(`/api/admin/products/${packageId}/cost-components`);
        if (componentsRes.ok) {
          const data = await componentsRes.json();
          if (data.success) {
            setComponents(data.data || []);
          }
        }

        // Fetch templates
        const templatesRes = await fetch('/api/admin/cost-component-templates');
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          if (data.success) {
            setTemplates(data.data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching cost data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (packageId) {
      fetchData();
    }
  }, [packageId]);

  // Calculate summary
  const summary = useMemo<CostSummary>(() => {
    const byCategory = {} as Record<CostComponentCategory, number>;
    let totalMonthlyCost = 0;
    let totalOnceOffCost = 0;

    for (const component of components) {
      const effectiveMonthly = calculateEffectiveMonthly(component);
      totalMonthlyCost += effectiveMonthly;

      if (component.recurrence === 'once_off') {
        totalOnceOffCost += component.cost_amount;
      }

      byCategory[component.category] = (byCategory[component.category] || 0) + effectiveMonthly;
    }

    return {
      totalMonthlyCost,
      totalOnceOffCost,
      componentCount: components.length,
      byCategory,
    };
  }, [components]);

  // Notify parent of cost changes
  useEffect(() => {
    onTotalCostChange?.(summary.totalMonthlyCost);
  }, [summary.totalMonthlyCost, onTotalCostChange]);

  // Margin calculations
  const marginCalc = useMemo(() => {
    const grossProfit = sellingPriceExclVat - summary.totalMonthlyCost;
    const marginPercent = sellingPriceExclVat > 0 ? (grossProfit / sellingPriceExclVat) * 100 : 0;
    const markupPercent = summary.totalMonthlyCost > 0 ? (grossProfit / summary.totalMonthlyCost) * 100 : 0;

    return { grossProfit, marginPercent, markupPercent };
  }, [sellingPriceExclVat, summary.totalMonthlyCost]);

  // Save component
  const handleSaveComponent = async (component: CostComponent) => {
    try {
      setSaving(true);
      const isNew = !component.id;
      const url = isNew
        ? `/api/admin/products/${packageId}/cost-components`
        : `/api/admin/products/${packageId}/cost-components/${component.id}`;

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(component),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save component');
      }

      // Update local state
      if (isNew) {
        setComponents((prev) => [...prev, data.data]);
      } else {
        setComponents((prev) =>
          prev.map((c) => (c.id === component.id ? data.data : c))
        );
      }

      toast({
        title: 'Success',
        description: `Cost component ${isNew ? 'added' : 'updated'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingComponent(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save component',
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete component
  const handleDeleteComponent = async (componentId: string) => {
    if (!confirm('Are you sure you want to delete this cost component?')) return;

    try {
      const res = await fetch(
        `/api/admin/products/${packageId}/cost-components/${componentId}`,
        { method: 'DELETE' }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete component');
      }

      setComponents((prev) => prev.filter((c) => c.id !== componentId));

      toast({
        title: 'Success',
        description: 'Cost component deleted',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete component',
      });
    }
  };

  // Apply template
  const handleApplyTemplate = async (template: CostComponentTemplate) => {
    try {
      setSaving(true);

      // Create components from template
      const newComponents = template.components.map((tc, index) => ({
        package_id: packageId,
        name: tc.name || 'Unnamed',
        category: tc.category || 'other',
        cost_amount: (tc as any).default_cost || 0,
        recurrence: tc.recurrence || 'monthly',
        amortisation_months: tc.amortisation_months,
        supplier_name: tc.supplier_name,
        description: tc.description,
        sort_order: tc.sort_order || index,
        is_optional: tc.is_optional || false,
      }));

      const res = await fetch(`/api/admin/products/${packageId}/cost-components/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: newComponents }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to apply template');
      }

      setComponents(data.data || []);

      toast({
        title: 'Success',
        description: `Applied "${template.name}" template with ${newComponents.length} components`,
      });

      setIsTemplateDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to apply template',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Margin Summary Card */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <TrendingUp className="h-5 w-5" />
            Cost & Margin Analysis
          </CardTitle>
          <CardDescription>
            Based on {summary.componentCount} cost components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-white rounded-lg border border-green-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Cost</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalMonthlyCost)}
              </p>
              <p className="text-xs text-gray-400">Monthly</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-green-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Selling Price</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(sellingPriceExclVat)}
              </p>
              <p className="text-xs text-gray-400">Excl. VAT</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-green-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Gross Profit</p>
              <p className={`text-2xl font-bold ${marginCalc.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(marginCalc.grossProfit)}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-green-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Margin %</p>
              <p className={`text-2xl font-bold ${
                marginCalc.marginPercent >= 30 ? 'text-green-600' : 
                marginCalc.marginPercent >= 20 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {marginCalc.marginPercent.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-green-100 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Once-off Costs</p>
              <p className="text-2xl font-bold text-gray-700">
                {formatCurrency(summary.totalOnceOffCost)}
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          {Object.keys(summary.byCategory).length > 0 && (
            <div className="mt-4 pt-4 border-t border-green-100">
              <p className="text-sm font-medium text-gray-600 mb-2">Cost by Category</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.byCategory).map(([category, amount]) => (
                  <Badge
                    key={category}
                    variant="outline"
                    className={CATEGORY_CONFIG[category as CostComponentCategory]?.color}
                  >
                    {CATEGORY_CONFIG[category as CostComponentCategory]?.label}: {formatCurrency(amount)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Components Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                Cost Components
              </CardTitle>
              <CardDescription>
                Detailed breakdown of all costs for this product
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Apply Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Apply Cost Template</DialogTitle>
                    <DialogDescription>
                      Select a template to pre-populate cost components. This will replace existing components.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleApplyTemplate(template)}
                      >
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-500">{template.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {template.components.length} components
                        </p>
                      </div>
                    ))}
                    {templates.length === 0 && (
                      <p className="text-center text-gray-500 py-4">
                        No templates available
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-circleTel-orange hover:bg-[#e07018]"
                    onClick={() => {
                      setEditingComponent({
                        package_id: packageId,
                        name: '',
                        category: 'other',
                        cost_amount: 0,
                        recurrence: 'monthly',
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Component
                  </Button>
                </DialogTrigger>
                <CostComponentDialog
                  component={editingComponent}
                  onSave={handleSaveComponent}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingComponent(null);
                  }}
                  saving={saving}
                />
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {components.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No cost components defined yet.</p>
              <p className="text-sm">Add components or apply a template to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Monthly Effect</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                  .map((component) => (
                    <TableRow key={component.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{component.name}</p>
                          {component.supplier_name && (
                            <p className="text-xs text-gray-500">{component.supplier_name}</p>
                          )}
                          {component.notes && (
                            <p className="text-xs text-gray-400 italic">{component.notes}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={CATEGORY_CONFIG[component.category]?.color}
                        >
                          {CATEGORY_CONFIG[component.category]?.icon}
                          <span className="ml-1">
                            {CATEGORY_CONFIG[component.category]?.label}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {RECURRENCE_LABELS[component.recurrence]}
                          {component.recurrence === 'amortised' && component.amortisation_months && (
                            <span className="text-gray-400 ml-1">
                              ({component.amortisation_months} mo)
                            </span>
                          )}
                          {(component.recurrence === 'per_user' || component.recurrence === 'per_device') && (
                            <span className="text-gray-400 ml-1">
                              × {component.unit_count || 1}
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(component.cost_amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(calculateEffectiveMonthly(component))}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingComponent(component);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => component.id && handleDeleteComponent(component.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                {/* Total Row */}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell colSpan={4} className="text-right">
                    Total Monthly Cost:
                  </TableCell>
                  <TableCell className="text-right font-mono text-lg">
                    {formatCurrency(summary.totalMonthlyCost)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Cost Component Edit Dialog
interface CostComponentDialogProps {
  component: CostComponent | null;
  onSave: (component: CostComponent) => void;
  onCancel: () => void;
  saving: boolean;
}

function CostComponentDialog({ component, onSave, onCancel, saving }: CostComponentDialogProps) {
  const [formData, setFormData] = useState<CostComponent>(
    component || {
      package_id: '',
      name: '',
      category: 'other',
      cost_amount: 0,
      recurrence: 'monthly',
    }
  );

  useEffect(() => {
    if (component) {
      setFormData(component);
    }
  }, [component]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const showAmortisation = formData.recurrence === 'amortised';
  const showUnitCount = formData.recurrence === 'per_user' || formData.recurrence === 'per_device';
  const showHardwareFields = formData.category === 'hardware';

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {component?.id ? 'Edit Cost Component' : 'Add Cost Component'}
          </DialogTitle>
          <DialogDescription>
            Define the cost details for this component
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Component Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., MTN Wholesale"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as CostComponentCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost & Recurrence */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_amount">Cost Amount (R) *</Label>
              <Input
                id="cost_amount"
                type="number"
                step="0.01"
                value={formData.cost_amount}
                onChange={(e) =>
                  setFormData({ ...formData, cost_amount: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurrence">Recurrence *</Label>
              <Select
                value={formData.recurrence}
                onValueChange={(value) =>
                  setFormData({ ...formData, recurrence: value as CostRecurrenceType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECURRENCE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amortisation (conditional) */}
          {showAmortisation && (
            <div className="space-y-2">
              <Label htmlFor="amortisation_months">Amortisation Period (months)</Label>
              <Input
                id="amortisation_months"
                type="number"
                value={formData.amortisation_months || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amortisation_months: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 12"
              />
              {formData.amortisation_months && formData.amortisation_months > 0 && (
                <p className="text-sm text-gray-500">
                  Monthly effect: {formatCurrency(formData.cost_amount / formData.amortisation_months)}
                </p>
              )}
            </div>
          )}

          {/* Unit Count (conditional) */}
          {showUnitCount && (
            <div className="space-y-2">
              <Label htmlFor="unit_count">
                Number of {formData.recurrence === 'per_user' ? 'Users' : 'Devices'}
              </Label>
              <Input
                id="unit_count"
                type="number"
                value={formData.unit_count || 1}
                onChange={(e) =>
                  setFormData({ ...formData, unit_count: parseInt(e.target.value) || 1 })
                }
              />
              <p className="text-sm text-gray-500">
                Monthly effect: {formatCurrency(formData.cost_amount * (formData.unit_count || 1))}
              </p>
            </div>
          )}

          <Separator />

          {/* Supplier Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Supplier/Vendor</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name || ''}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                placeholder="e.g., MTN, Echo/IP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_reference">Supplier Reference</Label>
              <Input
                id="supplier_reference"
                value={formData.supplier_reference || ''}
                onChange={(e) => setFormData({ ...formData, supplier_reference: e.target.value })}
                placeholder="Product code or reference"
              />
            </div>
          </div>

          {/* Hardware Fields (conditional) */}
          {showHardwareFields && (
            <>
              <Separator />
              <p className="text-sm font-medium text-gray-700">Hardware Details</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hardware_model">Model</Label>
                  <Input
                    id="hardware_model"
                    value={formData.hardware_model || ''}
                    onChange={(e) => setFormData({ ...formData, hardware_model: e.target.value })}
                    placeholder="e.g., Reyee RG-EG105GW(T)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hardware_retail_value">Retail Value (R)</Label>
                  <Input
                    id="hardware_retail_value"
                    type="number"
                    step="0.01"
                    value={formData.hardware_retail_value || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hardware_retail_value: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="Incl. VAT"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hardware_dealer_cost">Dealer Cost (R)</Label>
                  <Input
                    id="hardware_dealer_cost"
                    type="number"
                    step="0.01"
                    value={formData.hardware_dealer_cost || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hardware_dealer_cost: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="Excl. VAT"
                  />
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Description & Notes */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this cost component"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Input
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g., July 2025 rate"
            />
          </div>

          {/* Options */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="is_optional"
                checked={formData.is_optional || false}
                onCheckedChange={(checked) => setFormData({ ...formData, is_optional: checked })}
              />
              <Label htmlFor="is_optional" className="text-sm">
                Optional (customer can opt out)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_visible_to_customer"
                checked={formData.is_visible_to_customer || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_visible_to_customer: checked })
                }
              />
              <Label htmlFor="is_visible_to_customer" className="text-sm">
                Visible to customer
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !formData.name}
            className="bg-circleTel-orange hover:bg-[#e07018]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Component'
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// Helper function to format currency (exported for use elsewhere)
export { formatCurrency, calculateEffectiveMonthly };
