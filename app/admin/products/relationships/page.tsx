'use client';

import { useState, useEffect, useCallback } from 'react';
import { PiLinkBold, PiPlusBold, PiTrashBold, PiArrowRightBold, PiPackageBold, PiWarningBold, PiCheckCircleBold } from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { ProductRelationshipType, ProductRelationshipWithTarget } from '@/lib/types/product-relationships';

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
}

interface GroupedRelationships {
  addons: ProductRelationshipWithTarget[];
  prerequisites: ProductRelationshipWithTarget[];
  exclusions: ProductRelationshipWithTarget[];
  alternatives: ProductRelationshipWithTarget[];
  bundleComponents: ProductRelationshipWithTarget[];
}

const RELATIONSHIP_TYPES: { value: ProductRelationshipType; label: string; description: string; color: string }[] = [
  { value: 'addon', label: 'Add-on', description: 'Optional module that can be added', color: 'bg-blue-100 text-blue-800' },
  { value: 'requires', label: 'Prerequisite', description: 'Must have this product first', color: 'bg-amber-100 text-amber-800' },
  { value: 'excludes', label: 'Excludes', description: 'Cannot have both products', color: 'bg-red-100 text-red-800' },
  { value: 'alternative', label: 'Alternative', description: 'Can substitute for this product', color: 'bg-purple-100 text-purple-800' },
  { value: 'includes', label: 'Includes', description: 'Bundled component (included in price)', color: 'bg-green-100 text-green-800' },
];

export default function ProductRelationshipsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [relationships, setRelationships] = useState<GroupedRelationships | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false);

  // Add relationship dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRelationship, setNewRelationship] = useState({
    target_product_id: '',
    relationship_type: 'addon' as ProductRelationshipType,
    is_mandatory: false,
    price_modifier: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ProductRelationshipWithTarget | null>(null);

  // Fetch all products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          // Filter to only approved products from admin_products
          const approvedProducts = data.data
            .filter((p: Product) => p.status === 'approved' || p.status === 'active')
            .map((p: { id: string; name: string; slug?: string; category?: string; product_category?: string; status: string }) => ({
              id: p.id,
              name: p.name,
              slug: p.slug || p.id,
              category: p.category || p.product_category || 'connectivity',
              status: p.status,
            }));
          setProducts(approvedProducts);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [toast]);

  // Fetch relationships for selected product
  const fetchRelationships = useCallback(async (productId: string) => {
    setIsLoadingRelationships(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/relationships`);
      const data = await res.json();
      if (data.success) {
        setRelationships(data.grouped);
      }
    } catch (error) {
      console.error('Failed to fetch relationships:', error);
      toast({
        title: 'Error',
        description: 'Failed to load relationships',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRelationships(false);
    }
  }, [toast]);

  // When product is selected
  useEffect(() => {
    if (selectedProduct) {
      fetchRelationships(selectedProduct.id);
    } else {
      setRelationships(null);
    }
  }, [selectedProduct, fetchRelationships]);

  // Handle add relationship
  const handleAddRelationship = async () => {
    if (!selectedProduct || !newRelationship.target_product_id) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_product_id: newRelationship.target_product_id,
          relationship_type: newRelationship.relationship_type,
          is_mandatory: newRelationship.is_mandatory,
          price_modifier: newRelationship.price_modifier ? parseFloat(newRelationship.price_modifier) : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Relationship created',
        });
        setIsAddDialogOpen(false);
        setNewRelationship({
          target_product_id: '',
          relationship_type: 'addon',
          is_mandatory: false,
          price_modifier: '',
        });
        fetchRelationships(selectedProduct.id);
      } else {
        throw new Error(data.error || 'Failed to create relationship');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create relationship',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete relationship
  const handleDeleteRelationship = async () => {
    if (!selectedProduct || !deleteTarget) return;

    try {
      const res = await fetch(
        `/api/admin/products/${selectedProduct.id}/relationships?relationshipId=${deleteTarget.id}`,
        { method: 'DELETE' }
      );

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Relationship removed',
        });
        setDeleteTarget(null);
        fetchRelationships(selectedProduct.id);
      } else {
        throw new Error(data.error || 'Failed to delete relationship');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete relationship',
        variant: 'destructive',
      });
    }
  };

  // Get type config
  const getTypeConfig = (type: ProductRelationshipType) => {
    return RELATIONSHIP_TYPES.find(t => t.value === type) || RELATIONSHIP_TYPES[0];
  };

  // Available products for relationship (exclude self and already related)
  const availableProducts = products.filter(p => {
    if (!selectedProduct) return false;
    if (p.id === selectedProduct.id) return false;
    // Check if already has relationship of this type
    if (relationships) {
      const allRelated = [
        ...relationships.addons,
        ...relationships.prerequisites,
        ...relationships.exclusions,
        ...relationships.alternatives,
        ...relationships.bundleComponents,
      ];
      return !allRelated.some(r => r.target_product_id === p.id);
    }
    return true;
  });

  // Render relationship card
  const renderRelationshipSection = (
    title: string,
    items: ProductRelationshipWithTarget[],
    type: ProductRelationshipType
  ) => {
    const config = getTypeConfig(type);
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Badge className={config.color}>{title}</Badge>
          <span className="text-gray-400">({items.length})</span>
        </h4>
        <div className="space-y-2">
          {items.map(rel => (
            <div
              key={rel.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <PiPackageBold className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{rel.target_product?.name}</p>
                  <p className="text-xs text-gray-500">{rel.target_product?.category}</p>
                </div>
                {rel.is_mandatory && (
                  <Badge variant="outline" className="text-xs">Required</Badge>
                )}
                {rel.price_modifier && (
                  <Badge variant="secondary" className="text-xs">
                    R{rel.price_modifier.toFixed(2)} override
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(rel)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <PiTrashBold className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PiLinkBold className="h-6 w-6" />
            Product Relationships
          </h1>
          <p className="text-gray-600 mt-1">
            Manage add-ons, prerequisites, and bundle components
          </p>
        </div>
      </div>

      {/* Product Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Source Product</CardTitle>
          <CardDescription>
            Choose a product to manage its relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedProduct?.id || ''}
            onValueChange={(value) => {
              const product = products.find(p => p.id === value);
              setSelectedProduct(product || null);
            }}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a product..." />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex items-center gap-2">
                    <PiPackageBold className="h-4 w-4" />
                    <span>{product.name}</span>
                    <Badge variant="outline" className="text-xs ml-2">
                      {product.category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Relationships Panel */}
      {selectedProduct && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <PiArrowRightBold className="h-5 w-5" />
                Relationships for: {selectedProduct.name}
              </CardTitle>
              <CardDescription>
                Define how this product relates to other products
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PiPlusBold className="h-4 w-4 mr-2" />
              Add Relationship
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingRelationships ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : relationships ? (
              <div className="space-y-6">
                {renderRelationshipSection('Add-ons', relationships.addons, 'addon')}
                {renderRelationshipSection('Prerequisites', relationships.prerequisites, 'requires')}
                {renderRelationshipSection('Exclusions', relationships.exclusions, 'excludes')}
                {renderRelationshipSection('Alternatives', relationships.alternatives, 'alternative')}
                {renderRelationshipSection('Bundle Components', relationships.bundleComponents, 'includes')}

                {Object.values(relationships).every(arr => arr.length === 0) && (
                  <div className="text-center py-12 text-gray-500">
                    <PiLinkBold className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No relationships defined</p>
                    <p className="text-sm mt-1">Add relationships to define add-ons, prerequisites, or exclusions</p>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Add Relationship Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Relationship</DialogTitle>
            <DialogDescription>
              Create a new relationship from {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Relationship Type</Label>
              <Select
                value={newRelationship.relationship_type}
                onValueChange={(value) => setNewRelationship(prev => ({
                  ...prev,
                  relationship_type: value as ProductRelationshipType
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-gray-500">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Product</Label>
              <Select
                value={newRelationship.target_product_id}
                onValueChange={(value) => setNewRelationship(prev => ({
                  ...prev,
                  target_product_id: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableProducts.length === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <PiWarningBold className="h-3 w-3" />
                  All products already have relationships
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mandatory</Label>
                <p className="text-xs text-gray-500">Customer must select this</p>
              </div>
              <Switch
                checked={newRelationship.is_mandatory}
                onCheckedChange={(checked) => setNewRelationship(prev => ({
                  ...prev,
                  is_mandatory: checked
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Price Override (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Use default pricing"
                  className="pl-8"
                  value={newRelationship.price_modifier}
                  onChange={(e) => setNewRelationship(prev => ({
                    ...prev,
                    price_modifier: e.target.value
                  }))}
                />
              </div>
              <p className="text-xs text-gray-500">
                Override price when attached to this product
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddRelationship}
              disabled={!newRelationship.target_product_id || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Relationship'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Relationship</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the relationship with{' '}
              <strong>{deleteTarget?.target_product?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRelationship} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
