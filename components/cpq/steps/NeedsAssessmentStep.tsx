'use client';

/**
 * Step 1: Needs Assessment
 *
 * AI-powered requirements gathering with natural language input
 */

import { useState, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Edit3,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
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
import { toast } from 'sonner';
import type { CPQStepProps } from '../CPQWizard';
import type { NeedsAssessmentData, ContentionLevel, SLALevel } from '@/lib/cpq/types';

export function NeedsAssessmentStep({
  session,
  stepData,
  onUpdateStepData,
  isSaving,
}: CPQStepProps) {
  const [nlInput, setNlInput] = useState(stepData.needs_assessment?.raw_input || '');
  const [isParsing, setIsParsing] = useState(false);
  const [showManualForm, setShowManualForm] = useState(
    !stepData.needs_assessment?.ai_parsed && !!stepData.needs_assessment?.bandwidth_mbps
  );

  const data = stepData.needs_assessment || {};

  // Handle AI parse
  const handleParse = useCallback(async () => {
    if (!nlInput.trim()) {
      toast.error('Please enter your requirements');
      return;
    }

    setIsParsing(true);
    try {
      const response = await fetch('/api/cpq/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlInput }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to parse requirements');
        return;
      }

      // Update step data with parsed requirements
      onUpdateStepData('needs_assessment', {
        raw_input: nlInput,
        ...result.data,
        ai_parsed: true,
        ai_confidence: result.confidence,
      });

      toast.success(`Requirements parsed (${result.confidence}% confidence)`);
    } catch (error) {
      toast.error('Failed to parse requirements');
      console.error('Parse error:', error);
    } finally {
      setIsParsing(false);
    }
  }, [nlInput, onUpdateStepData]);

  // Handle manual field update
  const handleFieldUpdate = useCallback(
    (field: keyof NeedsAssessmentData, value: unknown) => {
      onUpdateStepData('needs_assessment', { [field]: value });
    },
    [onUpdateStepData]
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* AI Input Section */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-circleTel-orange" />
          <h2 className="text-lg font-semibold text-gray-900">
            Describe Your Requirements
          </h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Tell us what you need in plain English. Our AI will extract the key requirements.
        </p>

        <div className="space-y-4">
          <Textarea
            placeholder='e.g., "I need 100Mbps fibre for 3 sites in Johannesburg with 99.9% SLA and failover"'
            value={nlInput}
            onChange={(e) => setNlInput(e.target.value)}
            rows={3}
            className="bg-white"
          />
          <div className="flex items-center gap-2">
            <Button
              onClick={handleParse}
              disabled={isParsing || !nlInput.trim()}
              className="bg-circleTel-orange hover:bg-orange-600"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Parse with AI
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowManualForm(!showManualForm)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {showManualForm ? 'Hide Form' : 'Manual Entry'}
            </Button>
          </div>
        </div>

        {/* AI Confidence Indicator */}
        {data.ai_parsed && data.ai_confidence !== undefined && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-green-700">
              AI parsed with {data.ai_confidence}% confidence
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNlInput(data.raw_input || '');
                handleParse();
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-parse
            </Button>
          </div>
        )}
      </div>

      {/* Parsed/Manual Form */}
      {(showManualForm || data.ai_parsed) && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h3 className="font-semibold text-gray-900">Requirements Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bandwidth */}
            <div className="space-y-2">
              <Label htmlFor="bandwidth">Required Bandwidth (Mbps)</Label>
              <Input
                id="bandwidth"
                type="number"
                min={1}
                placeholder="e.g., 100"
                value={data.bandwidth_mbps || ''}
                onChange={(e) =>
                  handleFieldUpdate('bandwidth_mbps', parseInt(e.target.value) || undefined)
                }
              />
            </div>

            {/* Number of Sites */}
            <div className="space-y-2">
              <Label htmlFor="sites">Number of Sites</Label>
              <Input
                id="sites"
                type="number"
                min={1}
                placeholder="e.g., 3"
                value={data.num_sites || ''}
                onChange={(e) =>
                  handleFieldUpdate('num_sites', parseInt(e.target.value) || undefined)
                }
              />
            </div>

            {/* Budget Range */}
            <div className="space-y-2">
              <Label>Budget Range (ZAR)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={data.budget_min || ''}
                  onChange={(e) =>
                    handleFieldUpdate('budget_min', parseInt(e.target.value) || undefined)
                  }
                />
                <span className="self-center text-gray-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={data.budget_max || ''}
                  onChange={(e) =>
                    handleFieldUpdate('budget_max', parseInt(e.target.value) || undefined)
                  }
                />
              </div>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                placeholder="e.g., Johannesburg, Cape Town"
                value={data.region || ''}
                onChange={(e) => handleFieldUpdate('region', e.target.value || undefined)}
              />
            </div>

            {/* Contention */}
            <div className="space-y-2">
              <Label htmlFor="contention">Contention Level</Label>
              <Select
                value={data.contention || ''}
                onValueChange={(v) => handleFieldUpdate('contention', v as ContentionLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contention" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best-effort">Best Effort</SelectItem>
                  <SelectItem value="10:1">10:1</SelectItem>
                  <SelectItem value="5:1">5:1</SelectItem>
                  <SelectItem value="2:1">2:1</SelectItem>
                  <SelectItem value="dia">DIA (Uncontended)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SLA Level */}
            <div className="space-y-2">
              <Label htmlFor="sla">SLA Level</Label>
              <Select
                value={data.sla_level || ''}
                onValueChange={(v) => handleFieldUpdate('sla_level', v as SLALevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select SLA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (99%)</SelectItem>
                  <SelectItem value="premium">Premium (99.5%)</SelectItem>
                  <SelectItem value="carrier_grade">Carrier Grade (99.9%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Failover */}
            <div className="space-y-2">
              <Label htmlFor="failover">Failover Required</Label>
              <Select
                value={data.failover_needed ? 'yes' : 'no'}
                onValueChange={(v) => handleFieldUpdate('failover_needed', v === 'yes')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Failover needed?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Failover Bandwidth (conditional) */}
            {data.failover_needed && (
              <div className="space-y-2">
                <Label htmlFor="failover-bw">Failover Bandwidth (Mbps)</Label>
                <Input
                  id="failover-bw"
                  type="number"
                  min={1}
                  placeholder="e.g., 50"
                  value={data.failover_bandwidth_mbps || ''}
                  onChange={(e) =>
                    handleFieldUpdate(
                      'failover_bandwidth_mbps',
                      parseInt(e.target.value) || undefined
                    )
                  }
                />
              </div>
            )}

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., Finance, Retail, Healthcare"
                value={data.industry || ''}
                onChange={(e) => handleFieldUpdate('industry', e.target.value || undefined)}
              />
            </div>

            {/* Use Case */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="usecase">Use Case / Notes</Label>
              <Textarea
                id="usecase"
                placeholder="Describe how the connectivity will be used..."
                value={data.use_case || ''}
                onChange={(e) => handleFieldUpdate('use_case', e.target.value || undefined)}
                rows={2}
              />
            </div>
          </div>
        </div>
      )}

      {/* Helper text when no data */}
      {!showManualForm && !data.ai_parsed && (
        <div className="text-center text-gray-500 py-8">
          <p>Enter your requirements above and click &quot;Parse with AI&quot;</p>
          <p className="text-sm mt-1">or use &quot;Manual Entry&quot; to fill out the form directly</p>
        </div>
      )}
    </div>
  );
}
