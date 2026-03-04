'use client';
import { PiArrowRightBold, PiBuildingsBold, PiCheckCircleBold, PiCopyBold, PiCurrencyDollarBold, PiEnvelopeBold, PiMapPinBold, PiShieldBold, PiSparkleBold, PiSpinnerBold, PiUserBold, PiWarningCircleBold, PiWifiHighBold } from 'react-icons/pi';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
// ============================================================================
// Types
// ============================================================================

interface ParsedLocation {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

interface ParsedRequirements {
  bandwidth_mbps?: number | null;
  budget_max_rands?: number | null;
  contention?: 'best-effort' | '10:1' | '5:1' | '2:1' | 'dia' | null;
  sla?: 'standard' | 'premium' | 'carrier_grade' | null;
  failover_needed?: boolean;
  failover_bandwidth_mbps?: number | null;
  special_notes?: string | null;
}

interface ParsedContact {
  name?: string | null;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
}

interface ParsedEmailData {
  locations: ParsedLocation[];
  requirements: ParsedRequirements;
  contact: ParsedContact;
  raw_summary: string;
}

interface ParseEmailApiResponse {
  success: boolean;
  data?: ParsedEmailData;
  error?: string;
}

interface ParsedFormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  speed: number;
  contention: string;
  budget: string;
  failover: boolean;
  sites: string;
}

interface EmailParseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (formData: ParsedFormData) => void;
}

// ============================================================================
// Speed mapping helper
// ============================================================================

function nearestSpeed(mbps: number | undefined | null): number {
  if (!mbps) return 100;
  const options = [100, 200, 500, 1000];
  return options.reduce((prev, curr) =>
    Math.abs(curr - mbps) < Math.abs(prev - mbps) ? curr : prev
  );
}

// ============================================================================
// Component
// ============================================================================

export function EmailParseModal({ open, onOpenChange, onApply }: EmailParseModalProps) {
  const [emailText, setEmailText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedEmailData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const reset = () => {
    setEmailText('');
    setIsParsing(false);
    setParseResult(null);
    setParseError(null);
  };

  const handleParse = async () => {
    if (!emailText.trim()) return;

    setIsParsing(true);
    setParseError(null);
    setParseResult(null);

    try {
      const response = await fetch('/api/admin/sales/feasibility/parse-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText: emailText.trim() }),
      });

      const result: ParseEmailApiResponse = await response.json();

      if (!result.success || !result.data) {
        setParseError(result.error || 'Failed to parse email');
        return;
      }

      setParseResult(result.data);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Network error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleApply = () => {
    if (!parseResult) return;

    // Build sites string - one per line, prefer coordinates then address
    const sites = parseResult.locations
      .map((loc: ParsedLocation) => {
        if (loc.latitude != null && loc.longitude != null) {
          return `${loc.latitude}, ${loc.longitude}`;
        }
        return loc.address;
      })
      .join('\n');

    // Map contention values
    const contention = parseResult.requirements.contention || 'best-effort';

    const formData: ParsedFormData = {
      companyName: parseResult.contact.company || '',
      contactName: parseResult.contact.name || '',
      email: parseResult.contact.email || '',
      phone: parseResult.contact.phone || '',
      speed: nearestSpeed(parseResult.requirements.bandwidth_mbps),
      contention,
      budget: parseResult.requirements.budget_max_rands?.toString() || '',
      failover: parseResult.requirements.failover_needed || false,
      sites,
    };

    onApply(formData);
    reset();
    onOpenChange(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setEmailText(text);
    } catch {
      // Clipboard API may fail - user can paste manually
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val: boolean) => { if (!val) reset(); onOpenChange(val); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-lg">
              <PiEnvelopeBold className="h-4 w-4 text-white" />
            </div>
            Parse Feasibility Email
          </DialogTitle>
          <DialogDescription>
            Paste a feasibility request email and AI will extract the locations, requirements, and contact details.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Email Input */}
        {!parseResult && (
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder={`Paste the feasibility request email here...

Example:
"Hi Jeffrey,

Can you please check feasibility for the following locations:
1. -33.992024, 18.766900 (Stellenbosch office)
2. 5 Libertas Road, Karindal, Stellenbosch

We need 100Mb/s DIA with failover. Budget under R5000/mo.

Regards,
Erhard
Acme Corp"`}
                value={emailText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailText(e.target.value)}
                rows={12}
                className="font-mono text-sm resize-none"
                disabled={isParsing}
              />
              {!emailText && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePaste}
                  className="absolute top-2 right-2 gap-1.5 text-xs"
                >
                  <PiCopyBold className="h-3 w-3" />
                  Paste
                </Button>
              )}
            </div>

            {parseError && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <PiWarningCircleBold className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Parsing failed</p>
                  <p className="text-sm text-red-600 mt-0.5">{parseError}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
                Cancel
              </Button>
              <Button
                onClick={handleParse}
                disabled={!emailText.trim() || isParsing}
                className="bg-gradient-to-r from-circleTel-orange to-orange-500 hover:from-circleTel-orange/90 hover:to-orange-500/90 text-white gap-2"
              >
                {isParsing ? (
                  <>
                    <PiSpinnerBold className="h-4 w-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <PiSparkleBold className="h-4 w-4" />
                    Parse Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Review Parsed Results */}
        {parseResult && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <PiCheckCircleBold className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Email parsed successfully</p>
                <p className="text-sm text-green-600 mt-0.5">{parseResult.raw_summary}</p>
              </div>
            </div>

            {/* Locations */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <PiMapPinBold className="h-4 w-4 text-green-500" />
                <span className="text-sm font-semibold text-slate-700">
                  {parseResult.locations.length} Location{parseResult.locations.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {parseResult.locations.map((loc: ParsedLocation, idx: number) => (
                  <div key={idx} className="px-4 py-2.5 flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{loc.address}</p>
                      {loc.latitude != null && loc.longitude != null && (
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {loc.latitude}, {loc.longitude}
                        </p>
                      )}
                      {loc.notes && (
                        <p className="text-xs text-slate-400 mt-0.5">{loc.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact & Requirements in a grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Contact */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <PiUserBold className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold text-slate-700">Contact</span>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  {parseResult.contact.company && (
                    <div className="flex items-center gap-2">
                      <PiBuildingsBold className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-700">{parseResult.contact.company}</span>
                    </div>
                  )}
                  {parseResult.contact.name && (
                    <div className="flex items-center gap-2">
                      <PiUserBold className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-700">{parseResult.contact.name}</span>
                    </div>
                  )}
                  {parseResult.contact.email && (
                    <div className="flex items-center gap-2">
                      <PiEnvelopeBold className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-700">{parseResult.contact.email}</span>
                    </div>
                  )}
                  {!parseResult.contact.company && !parseResult.contact.name && !parseResult.contact.email && (
                    <p className="text-slate-400 italic">No contact details found</p>
                  )}
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <PiWifiHighBold className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-semibold text-slate-700">Requirements</span>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  {parseResult.requirements.bandwidth_mbps && (
                    <div className="flex items-center gap-2">
                      <PiWifiHighBold className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-700">{parseResult.requirements.bandwidth_mbps} Mbps</span>
                    </div>
                  )}
                  {parseResult.requirements.contention && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 w-3.5 text-center">C</span>
                      <span className="text-slate-700 capitalize">
                        {parseResult.requirements.contention === 'dia' ? 'DIA' : parseResult.requirements.contention}
                      </span>
                    </div>
                  )}
                  {parseResult.requirements.budget_max_rands && (
                    <div className="flex items-center gap-2">
                      <PiCurrencyDollarBold className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-700">R{parseResult.requirements.budget_max_rands.toLocaleString()}/mo</span>
                    </div>
                  )}
                  {parseResult.requirements.failover_needed && (
                    <div className="flex items-center gap-2">
                      <PiShieldBold className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-slate-700">Failover required</span>
                    </div>
                  )}
                  {parseResult.requirements.special_notes && (
                    <p className="text-xs text-slate-500 pt-1 border-t border-slate-100">
                      {parseResult.requirements.special_notes}
                    </p>
                  )}
                  {!parseResult.requirements.bandwidth_mbps && !parseResult.requirements.contention && !parseResult.requirements.budget_max_rands && (
                    <p className="text-slate-400 italic">No specific requirements found</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setParseResult(null); setParseError(null); }}>
                Back to Email
              </Button>
              <Button
                onClick={handleApply}
                className="bg-gradient-to-r from-circleTel-orange to-orange-500 hover:from-circleTel-orange/90 hover:to-orange-500/90 text-white gap-2"
              >
                Apply to Form
                <PiArrowRightBold className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
