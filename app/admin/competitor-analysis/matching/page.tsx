'use client';

/**
 * Product Matching Page
 *
 * Interface for matching CircleTel products to competitor products.
 * Allows manual matching with suggestion assistance.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  LinkIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  FunnelIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import type {
  CompetitorProduct,
  ProductCompetitorMatch,
  ProductType,
} from '@/lib/competitor-analysis/types';

interface MatchWithDetails extends ProductCompetitorMatch {
  competitor_products?: CompetitorProduct & {
    competitor_providers?: {
      id: string;
      name: string;
      slug: string;
      logo_url: string | null;
    };
  };
}

export default function MatchingPage() {
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [products, setProducts] = useState<CompetitorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterProductType, setFilterProductType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Create match modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CompetitorProduct | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [matchesRes, productsRes] = await Promise.all([
        fetch('/api/admin/competitor-analysis/matches?limit=100'),
        fetch('/api/admin/competitor-analysis/products?limit=200'),
      ]);

      if (!matchesRes.ok || !productsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const matchesData = await matchesRes.json();
      const productsData = await productsRes.json();

      setMatches(matchesData.data || []);
      setProducts(productsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function deleteMatch(matchId: string) {
    if (!confirm('Are you sure you want to delete this match?')) return;

    try {
      const res = await fetch(`/api/admin/competitor-analysis/matches/${matchId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete match');

      // Remove from local state
      setMatches(matches.filter((m) => m.id !== matchId));
    } catch (err) {
      alert('Failed to delete match: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  // Filter matches
  const filteredMatches = matches.filter((match) => {
    if (filterProductType && match.product_type !== filterProductType) {
      return false;
    }
    if (searchTerm) {
      const product = match.competitor_products;
      const searchLower = searchTerm.toLowerCase();
      if (
        !product?.product_name.toLowerCase().includes(searchLower) &&
        !product?.competitor_providers?.name.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    return true;
  });

  // Get unmapped products (products without matches)
  const matchedProductIds = new Set(matches.map((m) => m.competitor_product_id));
  const unmappedProducts = products.filter((p) => !matchedProductIds.has(p.id));

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin/competitor-analysis" className="hover:text-gray-700">
              Competitor Analysis
            </Link>
            <span>/</span>
            <span className="text-gray-900">Product Matching</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Product Matching</h1>
          <p className="text-gray-500 mt-1">
            Match CircleTel products to competitor equivalents for price comparison
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <LinkIcon className="w-5 h-5" />
          Create Match
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-3xl font-bold text-gray-900">{matches.length}</p>
          <p className="text-sm text-gray-500">Total Matches</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-3xl font-bold text-green-600">{matchedProductIds.size}</p>
          <p className="text-sm text-gray-500">Matched Products</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-3xl font-bold text-amber-600">{unmappedProducts.length}</p>
          <p className="text-sm text-gray-500">Unmatched Products</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search matches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <select
          value={filterProductType}
          onChange={(e) => setFilterProductType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="">All Product Types</option>
          <option value="mtn_dealer">MTN Dealer</option>
          <option value="fibre">Fibre</option>
          <option value="lte">LTE</option>
          <option value="product">Product</option>
          <option value="service_package">Service Package</option>
        </select>
      </div>

      {/* Matches List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Existing Matches ({filteredMatches.length})
        </h2>

        {filteredMatches.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg">
            No matches found. Create matches to start comparing prices.
          </div>
        ) : (
          filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onDelete={() => deleteMatch(match.id)}
            />
          ))
        )}
      </div>

      {/* Unmatched Products Section */}
      {unmappedProducts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Unmatched Competitor Products ({unmappedProducts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unmappedProducts.slice(0, 9).map((product) => (
              <UnmatchedProductCard
                key={product.id}
                product={product}
                onMatch={() => {
                  setSelectedProduct(product);
                  setShowCreateModal(true);
                }}
              />
            ))}
          </div>
          {unmappedProducts.length > 9 && (
            <p className="text-center text-gray-500 text-sm">
              And {unmappedProducts.length - 9} more unmatched products...
            </p>
          )}
        </div>
      )}

      {/* Create Match Modal */}
      {showCreateModal && (
        <CreateMatchModal
          products={products}
          selectedProduct={selectedProduct}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedProduct(null);
          }}
          onCreated={() => {
            setShowCreateModal(false);
            setSelectedProduct(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface MatchCardProps {
  match: MatchWithDetails;
  onDelete: () => void;
}

function MatchCard({ match, onDelete }: MatchCardProps) {
  const product = match.competitor_products;
  const provider = product?.competitor_providers;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* CircleTel Product */}
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-1">
              <span className="text-orange-600 font-bold text-sm">CT</span>
            </div>
            <p className="text-xs text-gray-500 capitalize">{match.product_type.replace('_', ' ')}</p>
          </div>

          {/* Arrow */}
          <LinkIcon className="w-5 h-5 text-gray-400" />

          {/* Competitor Product */}
          <div className="flex items-center gap-3">
            {provider?.logo_url ? (
              <img
                src={provider.logo_url}
                alt={provider.name}
                className="w-10 h-10 rounded object-contain"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{product?.product_name}</p>
              <p className="text-sm text-gray-500">{provider?.name}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Confidence */}
          {match.match_confidence && (
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                {Math.round(match.match_confidence * 100)}%
              </p>
              <p className="text-xs text-gray-500">Confidence</p>
            </div>
          )}

          {/* Price */}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {product?.monthly_price ? `R${product.monthly_price}` : '-'}
            </p>
            <p className="text-xs text-gray-500">Price</p>
          </div>

          {/* Method Badge */}
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              match.match_method === 'auto'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {match.match_method || 'manual'}
          </span>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface UnmatchedProductCardProps {
  product: CompetitorProduct;
  onMatch: () => void;
}

function UnmatchedProductCard({ product, onMatch }: UnmatchedProductCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{product.product_name}</p>
          <p className="text-sm text-gray-500">
            {product.monthly_price ? `R${product.monthly_price}/pm` : 'No price'}
            {product.data_bundle && ` • ${product.data_bundle}`}
          </p>
        </div>
        <button
          onClick={onMatch}
          className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
        >
          Match
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// CREATE MATCH MODAL
// =============================================================================

interface CreateMatchModalProps {
  products: CompetitorProduct[];
  selectedProduct: CompetitorProduct | null;
  onClose: () => void;
  onCreated: () => void;
}

function CreateMatchModal({
  products,
  selectedProduct,
  onClose,
  onCreated,
}: CreateMatchModalProps) {
  const [productType, setProductType] = useState<string>('mtn_dealer');
  const [productId, setProductId] = useState('');
  const [competitorProductId, setCompetitorProductId] = useState(
    selectedProduct?.id || ''
  );
  const [confidence, setConfidence] = useState(0.8);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!productId || !competitorProductId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch('/api/admin/competitor-analysis/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: productType,
          product_id: productId,
          competitor_product_id: competitorProductId,
          match_confidence: confidence,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create match');
      }

      onCreated();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Create Product Match</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* CircleTel Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CircleTel Product Type *
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="mtn_dealer">MTN Dealer</option>
              <option value="fibre">Fibre</option>
              <option value="lte">LTE</option>
              <option value="product">Product</option>
              <option value="service_package">Service Package</option>
            </select>
          </div>

          {/* CircleTel Product ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CircleTel Product ID *
            </label>
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Enter product UUID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              UUID of the CircleTel product from the relevant table
            </p>
          </div>

          {/* Competitor Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Competitor Product *
            </label>
            <select
              value={competitorProductId}
              onChange={(e) => setCompetitorProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name} - {p.monthly_price ? `R${p.monthly_price}` : 'No price'}
                </option>
              ))}
            </select>
          </div>

          {/* Confidence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Match Confidence: {Math.round(confidence * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about this match..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
