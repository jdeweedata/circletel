'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ShoppingCart, FileText, Shield, Lock } from 'lucide-react';

interface ContractSelectionProps {
  product: {
    id: string;
    name: string;
    price?: number;
    base_price_zar?: number | string;
    promotion_price?: number;
    metadata?: {
      contract_months?: number;
    };
  };
  onProceed?: (data: { contractType: string; termsAccepted: boolean }) => void;
  className?: string;
  isLoading?: boolean;
}

interface TermsState {
  termsOfService: boolean;
  productTerms: boolean;
  privacyPolicy: boolean;
}

/**
 * ContractSelection Component
 *
 * Contract type selection and terms acceptance
 * Final step before proceeding to checkout/payment
 */
export function ContractSelection({
  product,
  onProceed,
  className,
  isLoading = false,
}: ContractSelectionProps) {
  const [contractType, setContractType] = useState<'new' | 'upgrade'>('new');
  const [termsAccepted, setTermsAccepted] = useState<TermsState>({
    termsOfService: false,
    productTerms: false,
    privacyPolicy: false,
  });

  const price = product.price || parseFloat(String(product.base_price_zar || 0));
  const hasPromo = product.promotion_price && product.promotion_price < price;
  const finalPrice = hasPromo ? product.promotion_price : price;
  const contractMonths = product.metadata?.contract_months || 12;

  const allTermsAccepted = Object.values(termsAccepted).every(Boolean);

  const handleTermChange = (term: keyof TermsState) => {
    setTermsAccepted((prev) => ({
      ...prev,
      [term]: !prev[term],
    }));
  };

  const handleProceed = () => {
    if (allTermsAccepted && onProceed) {
      onProceed({
        contractType,
        termsAccepted: true,
      });
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Contract Type Selection */}
      <div className="bg-white rounded-xl border p-4 md:p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          Contract Type
        </h3>

        <RadioGroup
          value={contractType}
          onValueChange={(value) => setContractType(value as 'new' | 'upgrade')}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 p-3 rounded-lg border hover:border-circleTel-orange/50 transition-colors cursor-pointer">
            <RadioGroupItem value="new" id="new-contract" />
            <Label htmlFor="new-contract" className="flex-1 cursor-pointer">
              <span className="font-semibold text-gray-900">New Contract</span>
              <p className="text-sm text-gray-500">Start a new {contractMonths}-month service agreement</p>
            </Label>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg border hover:border-circleTel-orange/50 transition-colors cursor-pointer">
            <RadioGroupItem value="upgrade" id="upgrade-contract" />
            <Label htmlFor="upgrade-contract" className="flex-1 cursor-pointer">
              <span className="font-semibold text-gray-900">Upgrade Existing</span>
              <p className="text-sm text-gray-500">Upgrade from your current CircleTel plan</p>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-white rounded-xl border p-4 md:p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-gray-500" />
          Terms & Conditions
        </h3>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms-of-service"
              checked={termsAccepted.termsOfService}
              onCheckedChange={() => handleTermChange('termsOfService')}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="terms-of-service" className="cursor-pointer">
                <span className="text-gray-900">
                  I accept the{' '}
                  <a
                    href="/terms-of-service"
                    target="_blank"
                    className="text-circleTel-orange hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms of Service
                  </a>
                </span>
              </Label>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="product-terms"
              checked={termsAccepted.productTerms}
              onCheckedChange={() => handleTermChange('productTerms')}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="product-terms" className="cursor-pointer">
                <span className="text-gray-900">
                  I accept the{' '}
                  <a
                    href="/product-terms"
                    target="_blank"
                    className="text-circleTel-orange hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Product Terms & Conditions
                  </a>
                </span>
              </Label>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacy-policy"
              checked={termsAccepted.privacyPolicy}
              onCheckedChange={() => handleTermChange('privacyPolicy')}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="privacy-policy" className="cursor-pointer">
                <span className="text-gray-900">
                  I have read and accept the{' '}
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    className="text-circleTel-orange hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </a>
                </span>
              </Label>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          By proceeding, you agree to a {contractMonths}-month contract at R{Math.round(finalPrice!)}/month.
          Early cancellation fees may apply.
        </p>
      </div>

      {/* CTA Button */}
      <Button
        onClick={handleProceed}
        disabled={!allTermsAccepted || isLoading}
        className={cn(
          "w-full h-14 text-lg font-bold transition-all",
          allTermsAccepted
            ? "bg-circleTel-orange hover:bg-circleTel-orange/90 shadow-lg hover:shadow-xl"
            : "bg-gray-300 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Buy Now - R{Math.round(finalPrice!)}/month
          </span>
        )}
      </Button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock className="h-3 w-3" />
        <span>Secure checkout powered by NetCash Pay Now</span>
      </div>
    </div>
  );
}

export default ContractSelection;
