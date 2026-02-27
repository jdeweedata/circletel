'use client';

/**
 * Step 7: Review & Submit
 *
 * Final review and quote creation
 */

import { useState, useCallback, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Edit,
  Building2,
  MapPin,
  Package,
  DollarSign,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { CPQStepProps } from '../CPQWizard';

interface ReviewSubmitStepProps extends CPQStepProps {
  onComplete?: (quoteId: string) => void;
}

export function ReviewSubmitStep({
  session,
  stepData,
  onUpdateStepData,
  isSaving,
  onComplete,
}: ReviewSubmitStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(
    stepData.review_summary?.summary_generated || false
  );
  const [finalNotes, setFinalNotes] = useState(stepData.review_summary?.final_review_notes || '');

  // Listen for submit event from parent
  useEffect(() => {
    const handleSubmit = () => {
      if (termsAccepted) {
        handleCreateQuote();
      } else {
        toast.error('Please accept the terms to continue');
      }
    };

    window.addEventListener('cpq-submit', handleSubmit);
    return () => window.removeEventListener('cpq-submit', handleSubmit);
  }, [termsAccepted]);

  // Calculate totals
  const selectedPackages = stepData.package_selection?.selected_packages || [];
  const configuration = stepData.configuration?.per_site_config || [];
  const locations = stepData.location_coverage?.sites || [];
  const pricing = stepData.pricing_discounts;
  const customer = stepData.customer_details;

  // Calculate monthly total
  let subtotal = 0;
  for (const pkg of selectedPackages) {
    subtotal += pkg.base_price * pkg.quantity;
  }
  for (const config of configuration) {
    for (const addOn of config.add_ons) {
      subtotal += addOn.price * addOn.quantity;
    }
  }

  const discountAmount = pricing?.total_discount_amount || 0;
  const total = subtotal - discountAmount;

  // Create quote
  const handleCreateQuote = useCallback(async () => {
    if (!session?.id) {
      toast.error('Session not found');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/cpq/sessions/${session.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          final_notes: finalNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to create quote');
        return;
      }

      // Update review summary
      onUpdateStepData('review_summary', {
        summary_generated: true,
        final_review_notes: finalNotes,
      });

      toast.success('Quote created successfully!');

      if (result.quote_id && onComplete) {
        onComplete(result.quote_id);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to create quote');
    } finally {
      setIsSubmitting(false);
    }
  }, [session?.id, finalNotes, onUpdateStepData, onComplete]);

  // Validation checks
  const validationErrors: string[] = [];

  if (!customer?.company_name) {
    validationErrors.push('Company name is required');
  }
  if (!customer?.primary_contact?.name) {
    validationErrors.push('Primary contact name is required');
  }
  if (!customer?.primary_contact?.email) {
    validationErrors.push('Primary contact email is required');
  }
  if (selectedPackages.length === 0) {
    validationErrors.push('At least one package must be selected');
  }
  if (locations.length === 0) {
    validationErrors.push('At least one location is required');
  }

  const hasErrors = validationErrors.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
        <p className="text-sm text-gray-500">
          Review your quote details before submission
        </p>
      </div>

      {/* Validation Errors */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
            <AlertCircle className="h-5 w-5" />
            Please fix the following errors:
          </div>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Customer Summary */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Customer</h3>
          </div>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Company</p>
            <p className="font-medium">{customer?.company_name || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-gray-500">Registration</p>
            <p className="font-medium">{customer?.registration_number || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-gray-500">Primary Contact</p>
            <p className="font-medium">{customer?.primary_contact?.name || 'Not specified'}</p>
            <p className="text-gray-600">{customer?.primary_contact?.email}</p>
            <p className="text-gray-600">{customer?.primary_contact?.phone}</p>
          </div>
          <div>
            <p className="text-gray-500">Billing Address</p>
            <p className="font-medium">{customer?.billing_address || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Locations Summary */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Locations ({locations.length})</h3>
          </div>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          {locations.map((loc) => (
            <div key={loc.index} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-circleTel-orange text-white text-xs font-medium rounded-full">
                  {loc.index + 1}
                </span>
                <span>{loc.address || 'No address'}</span>
              </div>
              {loc.coverage_result?.is_feasible ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Packages Summary */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Packages & Add-ons</h3>
          </div>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>

        <div className="space-y-3 text-sm">
          {selectedPackages.map((pkg) => (
            <div
              key={`${pkg.package_id}-${pkg.site_index}`}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div>
                <p className="font-medium">{pkg.package_name}</p>
                <p className="text-gray-500">
                  Site {pkg.site_index + 1} | {pkg.contract_term_months} months | Qty: {pkg.quantity}
                </p>
              </div>
              <span className="font-medium">
                R{(pkg.base_price * pkg.quantity).toLocaleString()}/mo
              </span>
            </div>
          ))}

          {/* Add-ons */}
          {configuration.map((config) =>
            config.add_ons.map((addOn) => (
              <div
                key={`${config.site_index}-${addOn.add_on_id}`}
                className="flex items-center justify-between py-2 border-b last:border-0 text-gray-600"
              >
                <div>
                  <p>{addOn.name}</p>
                  <p className="text-xs text-gray-500">
                    Site {config.site_index + 1} | Qty: {addOn.quantity}
                  </p>
                </div>
                <span>R{(addOn.price * addOn.quantity).toLocaleString()}/mo</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Pricing</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>R{subtotal.toLocaleString()}</span>
          </div>
          {(pricing?.total_discount_percent ?? 0) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({pricing?.total_discount_percent ?? 0}%)</span>
              <span>-R{discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Monthly Total</span>
            <span className="text-circleTel-orange">R{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Final Notes */}
      <div className="bg-white rounded-lg border p-6">
        <Label htmlFor="final-notes">Final Notes (Optional)</Label>
        <Textarea
          id="final-notes"
          className="mt-2"
          placeholder="Any final notes or special instructions..."
          rows={3}
          value={finalNotes}
          onChange={(e) => setFinalNotes(e.target.value)}
        />
      </div>

      {/* Terms Acceptance */}
      <div className="bg-gray-50 rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(!!checked)}
          />
          <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
            I confirm that all details are correct and I have authority to create this quote.
            The quote will be sent to the customer for review.
          </Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={isSubmitting}>
          <Download className="h-4 w-4 mr-2" />
          Preview PDF
        </Button>

        <Button
          onClick={handleCreateQuote}
          disabled={isSubmitting || hasErrors || !termsAccepted}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Quote...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Create Quote
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
