'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  ProductHero,
  CoverageCheckBanner,
  ProductOrderCard,
  ContractSelection,
} from '@/components/products';

interface CoverageResult {
  available: boolean;
  services?: string[];
  address?: string;
  coordinates?: { lat: number; lng: number };
  leadId?: string;
}

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>('');
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverageConfirmed, setCoverageConfirmed] = useState(false);
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Fetch product data
  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Product not found');
          } else {
            setError('Failed to load product');
          }
          return;
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleCoverageConfirmed = (result: CoverageResult) => {
    setCoverageConfirmed(true);
    setCoverageResult(result);
  };

  const handleProceedToCheckout = async (contractData: { contractType: string; termsAccepted: boolean }) => {
    setIsProcessing(true);

    try {
      // Store order details in session/local storage for checkout page
      const orderData = {
        product,
        coverage: coverageResult,
        contract: contractData,
        timestamp: new Date().toISOString(),
      };

      sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));

      // Navigate to checkout with the lead ID if we have one
      const checkoutUrl = coverageResult?.leadId
        ? `/order/checkout?leadId=${coverageResult.leadId}&productId=${product.id}`
        : `/order/checkout?productId=${product.id}`;

      router.push(checkoutUrl);
    } catch (err) {
      console.error('Error proceeding to checkout:', err);
      setIsProcessing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-circleTel-orange mx-auto mb-4" />
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Product not found'}
            </h1>
            <p className="text-gray-600 mb-6">
              The product you're looking for doesn't exist or is no longer available.
            </p>
            <Button
              onClick={() => router.push('/5g-deals')}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              Browse All Deals
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Back Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Product Hero */}
      <ProductHero product={product} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Coverage & Order Summary */}
          <div className="space-y-6">
            {/* Coverage Check */}
            <CoverageCheckBanner
              productServiceType={product.service_type}
              onCoverageConfirmed={handleCoverageConfirmed}
            />

            {/* Order Card (shown after coverage confirmed) */}
            {coverageConfirmed && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <ProductOrderCard product={product} />
              </div>
            )}
          </div>

          {/* Right Column - Contract Selection */}
          <div>
            {coverageConfirmed ? (
              <div className="animate-in slide-in-from-bottom-4 duration-500 delay-150">
                <ContractSelection
                  product={product}
                  onProceed={handleProceedToCheckout}
                  isLoading={isProcessing}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-6 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Check Coverage First
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Enter your address above to confirm {product.service_type || '5G'} service
                    is available in your area before proceeding with your order.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
