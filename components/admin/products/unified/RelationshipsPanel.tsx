'use client';

import { useState, useEffect, useCallback } from 'react';
import { PiTrashBold, PiPlusBold } from 'react-icons/pi';
import { SectionCard, StatusBadge, LoadingState, EmptyState, ErrorState } from '@/components/backend';
import type {
  ProductRelationshipType,
  ProductRelationshipWithTarget,
} from '@/lib/types/product-relationships';

interface Product {
  id: string;
  name: string;
}

const RELATIONSHIP_LABELS: Record<ProductRelationshipType, string> = {
  addon: 'Add-ons',
  requires: 'Prerequisites',
  excludes: 'Exclusions',
  alternative: 'Alternatives',
  includes: 'Bundle Components',
};

const RELATIONSHIP_TYPES: ProductRelationshipType[] = [
  'addon',
  'requires',
  'excludes',
  'alternative',
  'includes',
];

/**
 * Relationships panel for service_packages products.
 * Mounted in UnifiedProductDetailSidebar's detail tabs.
 */
export function RelationshipsPanel({ productId }: { productId: string }) {
  const [relationships, setRelationships] = useState<{
    addons: ProductRelationshipWithTarget[];
    prerequisites: ProductRelationshipWithTarget[];
    exclusions: ProductRelationshipWithTarget[];
    alternatives: ProductRelationshipWithTarget[];
    bundleComponents: ProductRelationshipWithTarget[];
  } | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [targetProductId, setTargetProductId] = useState('');
  const [relationshipType, setRelationshipType] = useState<ProductRelationshipType>('addon');
  const [isMandatory, setIsMandatory] = useState(false);
  const [priceModifier, setPriceModifier] = useState('');
  const [addingError, setAddingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Mapping from plural grouping keys to singular relationship types and labels
  const groupMapping: Array<{
    key: 'addons' | 'prerequisites' | 'exclusions' | 'alternatives' | 'bundleComponents';
    type: ProductRelationshipType;
    label: string;
  }> = [
    { key: 'addons', type: 'addon', label: 'Add-ons' },
    { key: 'prerequisites', type: 'requires', label: 'Prerequisites' },
    { key: 'exclusions', type: 'excludes', label: 'Exclusions' },
    { key: 'alternatives', type: 'alternative', label: 'Alternatives' },
    { key: 'bundleComponents', type: 'includes', label: 'Bundle Components' },
  ];

  // Fetch relationships
  const fetchRelationships = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/products/${productId}/relationships`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load relationships');
        return;
      }
      setRelationships(data.grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load relationships');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Fetch all products for search
  useEffect(() => {
    async function fetchAllProducts() {
      try {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAllProducts(
            data.data
              .filter((p: { id?: string; name?: string }) => p.id && p.name)
              .map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    }
    fetchAllProducts();
  }, []);

  // Load relationships on mount
  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  // Handle add relationship
  const handleAddRelationship = async () => {
    if (!targetProductId) {
      setAddingError('Target product required');
      return;
    }

    setIsSubmitting(true);
    setAddingError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_product_id: targetProductId,
          relationship_type: relationshipType,
          is_mandatory: isMandatory,
          price_modifier: priceModifier ? parseFloat(priceModifier) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAddingError(data.error || 'Failed to create relationship');
        return;
      }

      // Reset form and refetch
      setShowAddForm(false);
      setTargetProductId('');
      setRelationshipType('addon');
      setIsMandatory(false);
      setPriceModifier('');
      await fetchRelationships();
    } catch (err) {
      setAddingError(err instanceof Error ? err.message : 'Failed to create relationship');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete relationship
  const handleDeleteRelationship = async (relationshipId: string) => {
    setDeletingId(relationshipId);
    try {
      const res = await fetch(
        `/api/admin/products/${productId}/relationships?relationshipId=${relationshipId}`,
        { method: 'DELETE' }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to delete relationship');
        return;
      }

      await fetchRelationships();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete relationship');
    } finally {
      setDeletingId(null);
    }
  };

  // Available products for new relationships (exclude self and already related)
  const relatedIds = relationships
    ? groupMapping.flatMap((group) =>
        relationships[group.key]?.map((r) => r.target_product_id) || []
      )
    : [];
  const availableProducts = allProducts.filter((p) => p.id !== productId && !relatedIds.includes(p.id));

  if (loading) {
    return <LoadingState message="Loading relationships…" />;
  }

  if (error && !relationships) {
    return (
      <ErrorState
        title="Failed to load relationships"
        message={error}
        onRetry={fetchRelationships}
      />
    );
  }

  // Render relationship group
  const renderGroup = (
    groupKey: 'addons' | 'prerequisites' | 'exclusions' | 'alternatives' | 'bundleComponents',
    label: string
  ) => {
    const items = relationships?.[groupKey] || [];
    if (items.length === 0) return null;

    return (
      <div key={groupKey} className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">{label}</h4>
        <div className="space-y-2">
          {items.map((rel) => (
            <div
              key={rel.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{rel.target_product?.name}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {rel.is_mandatory && <StatusBadge status="Required" variant="info" />}
                  {rel.price_modifier && (
                    <span className="text-xs text-gray-500">R{rel.price_modifier.toFixed(2)} override</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteRelationship(rel.id)}
                disabled={deletingId === rel.id}
                className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                aria-label="Delete relationship"
              >
                <PiTrashBold className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Check if any relationships exist
  const hasAnyRelationships = relationships
    ? groupMapping.some((group) => relationships[group.key]?.length > 0)
    : false;

  return (
    <SectionCard
      title="Relationships"
      action={
        !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-md px-2 py-1 text-xs font-medium text-circleTel-orange hover:bg-orange-50 flex items-center gap-1"
          >
            <PiPlusBold className="h-3 w-3" />
            Add
          </button>
        )
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}

        {/* Add form */}
        {showAddForm && (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            {addingError && (
              <div className="rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700">{addingError}</div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Relationship Type</label>
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value as ProductRelationshipType)}
                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900"
              >
                {RELATIONSHIP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {RELATIONSHIP_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Target Product</label>
              <select
                value={targetProductId}
                onChange={(e) => setTargetProductId(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900"
              >
                <option value="">Select a product…</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {availableProducts.length === 0 && (
                <p className="text-xs text-amber-600">All products already have relationships</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">Mandatory</label>
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Price Override (optional)</label>
              <input
                type="number"
                step="0.01"
                placeholder="R0.00"
                value={priceModifier}
                onChange={(e) => setPriceModifier(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRelationship}
                disabled={!targetProductId || isSubmitting}
                className="flex-1 rounded-md bg-circleTel-orange px-2.5 py-1.5 text-xs font-medium text-white hover:bg-circleTel-orange-dark disabled:opacity-50"
              >
                {isSubmitting ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* Relationships list */}
        {hasAnyRelationships ? (
          <div className="space-y-4">
            {groupMapping.map((group) => renderGroup(group.key, group.label))}
          </div>
        ) : (
          <EmptyState
            icon={<span className="text-gray-300">🔗</span>}
            title="No relationships yet"
            description="Add relationships to define add-ons, prerequisites, or exclusions"
          />
        )}
      </div>
    </SectionCard>
  );
}
