'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PricingBreakdown } from '@/components/mits-cpq/shared';
import { FileText, Download, Send } from 'lucide-react';
import { useMITSTiers } from '@/lib/mits-cpq/hooks';
import type { MITSStepData } from '@/lib/mits-cpq/types';

interface ReviewSubmitStepProps {
  stepData: MITSStepData;
  sessionId: string;
  onSubmit: () => Promise<void>;
}

export function ReviewSubmitStep({ stepData, sessionId, onSubmit }: ReviewSubmitStepProps) {
  const { tiers } = useMITSTiers();

  const [termsAccepted, setTermsAccepted] = useState(
    stepData.review?.terms_accepted ?? false
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const tierSelection = stepData.tier_selection;
  const m365Config = stepData.m365_config;
  const addOns = stepData.add_ons;
  const pricing = stepData.pricing;
  const customer = stepData.customer;

  const selectedTier = tiers.find((t) => t.tier_code === tierSelection?.selected_tier_code);
  const totalM365Licences =
    (selectedTier?.m365_included_licences ?? 0) + (m365Config?.additional_licences ?? 0);

  const handleSubmit = async () => {
    if (!termsAccepted) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewPDF = () => {
    // Open a new tab to the PDF preview endpoint
    window.open(`/api/mits-cpq/sessions/${sessionId}/pdf?preview=true`, '_blank');
  };

  const handleDownloadPDF = () => {
    window.open(`/api/mits-cpq/sessions/${sessionId}/pdf`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Quote Summary */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-slate-900">Quote Summary</h3>

        <div className="rounded-lg border border-slate-200 bg-slate-50 divide-y divide-slate-200">
          {/* Tier */}
          <div className="flex items-start justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Selected Tier
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {selectedTier?.tier_name ?? tierSelection?.selected_tier_code ?? '—'}
              </p>
              {tierSelection?.user_count && (
                <p className="text-sm text-slate-600">
                  {tierSelection.user_count} user{tierSelection.user_count !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {pricing && (
              <p className="font-bold text-orange">
                R{pricing.base_tier_price.toLocaleString('en-ZA', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}/mo
              </p>
            )}
          </div>

          {/* M365 */}
          <div className="flex items-start justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Microsoft 365
              </p>
              <p className="mt-1 text-slate-900">
                {totalM365Licences} licence{totalM365Licences !== 1 ? 's' : ''}
                {selectedTier && (
                  <span className="text-sm text-slate-600">
                    {' '}({selectedTier.m365_included_licences} included
                    {(m365Config?.additional_licences ?? 0) > 0 &&
                      ` + ${m365Config!.additional_licences} additional`}
                    )
                  </span>
                )}
              </p>
              {m365Config?.domain && (
                <p className="text-sm text-slate-600">Domain: {m365Config.domain}</p>
              )}
              {m365Config?.existing_tenant && (
                <p className="text-sm text-slate-600">Existing tenant migration required</p>
              )}
            </div>
            {pricing && pricing.additional_m365_price > 0 && (
              <p className="font-medium text-slate-900">
                +R{pricing.additional_m365_price.toLocaleString('en-ZA', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}/mo
              </p>
            )}
          </div>

          {/* Add-Ons */}
          {addOns?.selected_modules && addOns.selected_modules.length > 0 && (
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Add-On Modules
              </p>
              <ul className="mt-2 space-y-1">
                {addOns.selected_modules.map((mod) => (
                  <li key={mod.module_code} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      {mod.module_name}
                      {mod.quantity > 1 && (
                        <span className="text-slate-500"> x{mod.quantity}</span>
                      )}
                    </span>
                    <span className="font-medium text-slate-900">
                      R{mod.total_price.toLocaleString('en-ZA', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                      {mod.billing_type === 'once_off' ? ' once-off' : '/mo'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Customer */}
          {customer && (
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Customer
              </p>
              <p className="mt-1 font-semibold text-slate-900">{customer.company_name}</p>
              <p className="text-sm text-slate-600">{customer.contact_name}</p>
              <p className="text-sm text-slate-600">{customer.contact_email}</p>
              {customer.billing_address && (
                <p className="text-sm text-slate-600">
                  {customer.billing_address}, {customer.city}
                  {customer.province && `, ${customer.province}`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pricing Breakdown */}
      {pricing && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900">Pricing Breakdown</h3>
          <PricingBreakdown
            pricing={pricing}
            tierName={selectedTier?.tier_name}
            showMargin={false}
          />
        </div>
      )}

      {/* PDF Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={handlePreviewPDF} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Preview PDF
        </Button>
        <Button variant="outline" onClick={handleDownloadPDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      {/* Terms Acceptance */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms-accepted"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="terms-accepted"
            className="text-sm text-slate-700 cursor-pointer leading-relaxed"
          >
            I confirm that all information provided is accurate and I accept the{' '}
            <a
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange underline hover:text-orange/80"
            >
              Terms of Service
            </a>{' '}
            and agree that this quote is subject to site survey and final approval by CircleTel.
          </Label>
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!termsAccepted || submitting}
          className="flex items-center gap-2 bg-orange text-white hover:bg-orange/90 disabled:opacity-50"
          size="lg"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Submitting Quote...' : 'Submit Quote'}
        </Button>
      </div>
    </div>
  );
}
