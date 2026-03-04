'use client';
import { PiCheckCircleBold, PiCurrencyDollarBold, PiInfoBold, PiPercentBold, PiSparklesBold, PiSpinnerBold, PiTrendUpBold, PiWarningBold } from 'react-icons/pi';

/**
 * Step 5: Pricing & Discounts
 *
 * Apply discounts with role-based limits and approval workflow
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import type { CPQStepProps } from '../CPQWizard';
import type { DiscountLimitsResult, AnalyzePricingResult } from '@/lib/cpq/types';

export function PricingDiscountsStep({
  session,
  stepData,
  onUpdateStepData,
  isSaving,
}: CPQStepProps) {
  const [discountLimits, setDiscountLimits] = useState<DiscountLimitsResult | null>(null);
  const [isLoadingLimits, setIsLoadingLimits] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzePricingResult | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(
    stepData.pricing_discounts?.total_discount_percent || 0
  );

  const selectedPackages = stepData.package_selection?.selected_packages || [];
  const configuration = stepData.configuration?.per_site_config || [];

  // Calculate subtotal
  const calculateSubtotal = useCallback(() => {
    let subtotal = 0;

    // Sum package costs
    for (const pkg of selectedPackages) {
      subtotal += pkg.base_price * pkg.quantity;
    }

    // Sum add-ons
    for (const config of configuration) {
      for (const addOn of config.add_ons) {
        subtotal += addOn.price * addOn.quantity;
      }
    }

    return subtotal;
  }, [selectedPackages, configuration]);

  const subtotal = calculateSubtotal();
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;

  // Load discount limits on mount
  useEffect(() => {
    const loadLimits = async () => {
      setIsLoadingLimits(true);
      try {
        const response = await fetch('/api/cpq/rules/discount-limits');
        const result = await response.json();

        if (result.success) {
          setDiscountLimits(result.limits);
        }
      } catch (error) {
        console.error('Failed to load limits:', error);
        toast.error('Failed to load discount limits');
      } finally {
        setIsLoadingLimits(false);
      }
    };

    loadLimits();
  }, []);

  // Handle discount change
  const handleDiscountChange = useCallback(
    (value: number) => {
      setDiscountPercent(value);

      const requiresApproval = discountLimits
        ? value > discountLimits.approval_threshold
        : false;

      onUpdateStepData('pricing_discounts', {
        total_discount_percent: value,
        total_discount_amount: (subtotal * value) / 100,
        subtotal,
        total: subtotal - (subtotal * value) / 100,
        approval_requested: requiresApproval ? stepData.pricing_discounts?.approval_requested : false,
      });
    },
    [discountLimits, subtotal, onUpdateStepData, stepData.pricing_discounts?.approval_requested]
  );

  // Get AI pricing analysis
  const handleGetAnalysis = useCallback(async () => {
    setIsLoadingAnalysis(true);
    try {
      const response = await fetch('/api/cpq/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packages: selectedPackages,
          customer: stepData.customer_details,
          role_type: session?.owner_type || 'admin',
          role_name: 'sales_rep', // TODO: Get actual role
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to analyze pricing');
        return;
      }

      setAiAnalysis(result);

      // Update with AI analysis
      onUpdateStepData('pricing_discounts', {
        aiAnalysis: result,
      });

      toast.success('Pricing analysis complete');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze pricing');
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [selectedPackages, stepData.customer_details, session?.owner_type, onUpdateStepData]);

  // Request approval
  const handleRequestApproval = useCallback(async () => {
    try {
      // TODO: Implement approval request API
      onUpdateStepData('pricing_discounts', {
        approval_requested: true,
        approval_status: 'pending',
      });
      toast.success('Approval request submitted');
    } catch (error) {
      toast.error('Failed to request approval');
    }
  }, [onUpdateStepData]);

  const requiresApproval = discountLimits && discountPercent > discountLimits.approval_threshold;
  const exceedsMax = discountLimits && discountPercent > discountLimits.max_discount;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Pricing & Discounts</h2>
        <p className="text-sm text-gray-500">Review pricing and apply discounts within your limits</p>
      </div>

      {/* Pricing Summary */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Price Summary</h3>

        <div className="space-y-3">
          {/* Line Items */}
          {selectedPackages.map((pkg) => (
            <div
              key={`${pkg.package_id}-${pkg.site_index}`}
              className="flex justify-between text-sm"
            >
              <span className="text-gray-600">
                {pkg.package_name} (Site {pkg.site_index + 1}) x{pkg.quantity}
              </span>
              <span className="font-medium">
                R{(pkg.base_price * pkg.quantity).toLocaleString()}
              </span>
            </div>
          ))}

          {/* Add-ons */}
          {configuration.map((config) =>
            config.add_ons.map((addOn) => (
              <div
                key={`${config.site_index}-${addOn.add_on_id}`}
                className="flex justify-between text-sm"
              >
                <span className="text-gray-600">
                  {addOn.name} (Site {config.site_index + 1}) x{addOn.quantity}
                </span>
                <span className="font-medium">
                  R{(addOn.price * addOn.quantity).toLocaleString()}
                </span>
              </div>
            ))
          )}

          <div className="border-t pt-3 flex justify-between">
            <span className="font-medium text-gray-700">Subtotal</span>
            <span className="font-semibold text-gray-900">R{subtotal.toLocaleString()}</span>
          </div>

          {discountPercent > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({discountPercent}%)</span>
              <span>-R{discountAmount.toLocaleString()}</span>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between text-lg">
            <span className="font-bold text-gray-900">Total Monthly</span>
            <span className="font-bold text-circleTel-orange">R{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Discount Controls */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Apply Discount</h3>
          {discountLimits && (
            <span className="text-sm text-gray-500">
              Max: {discountLimits.max_discount}% | Approval at: {discountLimits.approval_threshold}%
            </span>
          )}
        </div>

        {isLoadingLimits ? (
          <div className="flex items-center justify-center py-4">
            <PiSpinnerBold className="h-5 w-5 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading limits...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Slider */}
            <div className="space-y-2">
              <Label>Discount Percentage</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[discountPercent]}
                  onValueChange={([v]) => handleDiscountChange(v)}
                  max={discountLimits?.max_discount || 50}
                  step={1}
                  className="flex-1"
                />
                <div className="flex items-center gap-1 w-24">
                  <Input
                    type="number"
                    min={0}
                    max={discountLimits?.max_discount || 50}
                    value={discountPercent}
                    onChange={(e) => handleDiscountChange(parseInt(e.target.value) || 0)}
                    className="w-16"
                  />
                  <PiPercentBold className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Approval Warning */}
            {requiresApproval && !exceedsMax && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <PiWarningBold className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Approval Required</p>
                  <p className="text-sm text-amber-700">
                    Discounts above {discountLimits?.approval_threshold}% require manager approval.
                  </p>
                  {!stepData.pricing_discounts?.approval_requested && (
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={handleRequestApproval}
                    >
                      Request Approval
                    </Button>
                  )}
                  {stepData.pricing_discounts?.approval_requested && (
                    <p className="text-sm text-amber-600 mt-2">
                      <PiCheckCircleBold className="h-4 w-4 inline mr-1" />
                      Approval requested - {stepData.pricing_discounts.approval_status}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Max Exceeded Warning */}
            {exceedsMax && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <PiWarningBold className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Discount Exceeds Limit</p>
                  <p className="text-sm text-red-700">
                    Your maximum discount is {discountLimits?.max_discount}%. Please reduce the
                    discount or contact your manager.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Analysis */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PiSparklesBold className="h-5 w-5 text-circleTel-orange" />
            <h3 className="font-semibold text-gray-900">AI Pricing Intelligence</h3>
          </div>
          <Button
            onClick={handleGetAnalysis}
            disabled={isLoadingAnalysis}
            variant="outline"
          >
            {isLoadingAnalysis ? (
              <>
                <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <PiSparklesBold className="h-4 w-4 mr-2" />
                Analyze Pricing
              </>
            )}
          </Button>
        </div>

        {aiAnalysis ? (
          <div className="space-y-4">
            {/* Optimal Discount */}
            <div className="flex items-center gap-4 bg-white rounded-lg p-4">
              <div className="flex-1">
                <p className="text-sm text-gray-500">AI Recommended Discount</p>
                <p className="text-2xl font-bold text-circleTel-orange">
                  {aiAnalysis.optimal_discount}%
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDiscountChange(aiAnalysis.optimal_discount || 0)}
              >
                Apply
              </Button>
            </div>

            {/* Close Probability */}
            {aiAnalysis.close_probability !== undefined && (
              <div className="flex items-center gap-4 bg-white rounded-lg p-4">
                <PiTrendUpBold className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Close Probability</p>
                  <p className="text-xl font-bold text-green-600">
                    {aiAnalysis.close_probability}%
                  </p>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Suggestions</p>
                <ul className="space-y-1">
                  {aiAnalysis.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <PiInfoBold className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Upsell Opportunities */}
            {aiAnalysis.upsell_opportunities && aiAnalysis.upsell_opportunities.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Upsell Opportunities</p>
                <div className="space-y-2">
                  {aiAnalysis.upsell_opportunities.map((upsell, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{upsell.product_name}</p>
                        <p className="text-xs text-gray-500">{upsell.value_proposition}</p>
                      </div>
                      <span className="text-green-600">+R{upsell.additional_monthly}/mo</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Get AI-powered pricing recommendations, close probability, and upsell opportunities.
          </p>
        )}
      </div>
    </div>
  );
}
