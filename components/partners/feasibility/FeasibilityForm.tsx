'use client';
import { PiBuildingsBold, PiClockBold, PiGaugeBold, PiMapPinBold, PiPlusBold, PiShieldBold, PiTrashBold, PiWifiHighBold } from 'react-icons/pi';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  FeasibilityFormState,
  FormSite,
  ContentionType,
  SLALevel,
  CONTENTION_OPTIONS,
  SLA_OPTIONS,
  BANDWIDTH_OPTIONS,
  CONTRACT_TERMS,
} from '@/lib/partners/feasibility-types';

interface FeasibilityFormProps {
  formState: FeasibilityFormState;
  onChange: (state: FeasibilityFormState) => void;
  disabled?: boolean;
}

export function FeasibilityForm({
  formState,
  onChange,
  disabled = false,
}: FeasibilityFormProps) {
  const updateField = <K extends keyof FeasibilityFormState>(
    field: K,
    value: FeasibilityFormState[K]
  ) => {
    onChange({ ...formState, [field]: value });
  };

  const addSite = () => {
    const newSite: FormSite = {
      id: crypto.randomUUID(),
      address: '',
    };
    onChange({
      ...formState,
      sites: [...formState.sites, newSite],
    });
  };

  const removeSite = (id: string) => {
    if (formState.sites.length <= 1) return;
    onChange({
      ...formState,
      sites: formState.sites.filter((s) => s.id !== id),
    });
  };

  const updateSite = (id: string, field: keyof FormSite, value: string | number | undefined) => {
    onChange({
      ...formState,
      sites: formState.sites.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PiBuildingsBold className="w-5 h-5 text-circleTel-orange" />
          Feasibility Details
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-6">
        {/* Client Information */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Client Information
          </h3>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={formState.client_company_name}
                onChange={(e) =>
                  updateField('client_company_name', e.target.value)
                }
                placeholder="ABC Corporation"
                disabled={disabled}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact">Contact Name</Label>
                <Input
                  id="contact"
                  value={formState.client_contact_name}
                  onChange={(e) =>
                    updateField('client_contact_name', e.target.value)
                  }
                  placeholder="John Smith"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formState.client_phone}
                  onChange={(e) => updateField('client_phone', e.target.value)}
                  placeholder="082 123 4567"
                  disabled={disabled}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formState.client_email}
                onChange={(e) => updateField('client_email', e.target.value)}
                placeholder="john@company.co.za"
                disabled={disabled}
              />
            </div>
          </div>
        </section>

        {/* Bandwidth Selection */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <PiGaugeBold className="w-4 h-4" />
            Bandwidth Required
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {BANDWIDTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField('bandwidth_required', opt.value)}
                disabled={disabled}
                className={`p-3 text-sm rounded-lg border-2 transition-all ${
                  formState.bandwidth_required === opt.value
                    ? 'border-circleTel-orange bg-orange-50 text-circleTel-orange'
                    : 'border-gray-200 hover:border-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Contention Selection */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <PiWifiHighBold className="w-4 h-4" />
            Contention Ratio
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {CONTENTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField('contention', opt.value)}
                disabled={disabled}
                className={`p-3 text-left rounded-lg border-2 transition-all ${
                  formState.contention === opt.value
                    ? 'border-circleTel-orange bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.description}</div>
              </button>
            ))}
          </div>
        </section>

        {/* SLA Selection */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <PiShieldBold className="w-4 h-4" />
            SLA Level
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {SLA_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField('sla_level', opt.value)}
                disabled={disabled}
                className={`p-3 text-center rounded-lg border-2 transition-all ${
                  formState.sla_level === opt.value
                    ? 'border-circleTel-orange bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {opt.description}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Contract Term & Failover */}
        <section>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <PiClockBold className="w-4 h-4" />
                Contract Term
              </Label>
              <select
                value={formState.contract_term}
                onChange={(e) =>
                  updateField('contract_term', parseInt(e.target.value, 10))
                }
                disabled={disabled}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
              >
                {CONTRACT_TERMS.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2 block">Failover Required</Label>
              <div className="flex items-center gap-3 h-10">
                <Switch
                  checked={formState.failover_required}
                  onCheckedChange={(checked) =>
                    updateField('failover_required', checked)
                  }
                  disabled={disabled}
                />
                <span className="text-sm text-gray-600">
                  {formState.failover_required ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Sites */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <PiMapPinBold className="w-4 h-4" />
              Sites ({formState.sites.length})
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSite}
              disabled={disabled}
            >
              <PiPlusBold className="w-4 h-4 mr-1" />
              Add Site
            </Button>
          </div>
          <div className="space-y-3">
            {formState.sites.map((site, index) => (
              <div
                key={site.id}
                className="p-3 border rounded-lg bg-gray-50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Site {index + 1}
                  </span>
                  {formState.sites.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSite(site.id)}
                      disabled={disabled}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <PiTrashBold className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label htmlFor={`address-${site.id}`}>Address *</Label>
                  <Input
                    id={`address-${site.id}`}
                    value={site.address}
                    onChange={(e) =>
                      updateSite(site.id, 'address', e.target.value)
                    }
                    placeholder="123 Main St, Sandton, Johannesburg"
                    disabled={disabled}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`lat-${site.id}`}>Latitude</Label>
                    <Input
                      id={`lat-${site.id}`}
                      type="number"
                      step="any"
                      value={site.latitude ?? ''}
                      onChange={(e) =>
                        updateSite(
                          site.id,
                          'latitude',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="-26.1234"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`lng-${site.id}`}>Longitude</Label>
                    <Input
                      id={`lng-${site.id}`}
                      type="number"
                      step="any"
                      value={site.longitude ?? ''}
                      onChange={(e) =>
                        updateSite(
                          site.id,
                          'longitude',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="28.0123"
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
