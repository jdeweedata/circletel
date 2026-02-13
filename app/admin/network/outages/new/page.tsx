'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const providers = [
  { id: 'interstellio', label: 'Interstellio' },
  { id: 'mtn', label: 'MTN' },
  { id: 'openserve', label: 'Openserve' },
  { id: 'telkom', label: 'Telkom' }
];

const regions = [
  { id: 'gauteng', label: 'Gauteng' },
  { id: 'western-cape', label: 'Western Cape' },
  { id: 'kwazulu-natal', label: 'KwaZulu-Natal' },
  { id: 'eastern-cape', label: 'Eastern Cape' },
  { id: 'nationwide', label: 'Nationwide' }
];

export default function NewOutagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'minor',
    affected_providers: [] as string[],
    affected_regions: [] as string[],
    affected_customer_count: 0
  });

  const handleProviderToggle = (providerId: string) => {
    setFormData(prev => ({
      ...prev,
      affected_providers: prev.affected_providers.includes(providerId)
        ? prev.affected_providers.filter(p => p !== providerId)
        : [...prev.affected_providers, providerId]
    }));
  };

  const handleRegionToggle = (regionId: string) => {
    setFormData(prev => ({
      ...prev,
      affected_regions: prev.affected_regions.includes(regionId)
        ? prev.affected_regions.filter(r => r !== regionId)
        : [...prev.affected_regions, regionId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/network/outages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create incident');
      }

      const data = await response.json();
      router.push(`/admin/network/outages/${data.outage.id}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/network/outages">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Declare Incident</h1>
          <p className="text-gray-500">Create a new network incident report</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Incident Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Incident Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Intermittent connectivity issues in Gauteng"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the incident and its impact..."
                rows={4}
              />
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Minor - Limited impact, workaround available
                    </span>
                  </SelectItem>
                  <SelectItem value="major">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Major - Significant impact, degraded service
                    </span>
                  </SelectItem>
                  <SelectItem value="critical">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Critical - Complete outage, urgent
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Affected Providers */}
            <div className="space-y-3">
              <Label>Affected Providers</Label>
              <div className="grid grid-cols-2 gap-3">
                {providers.map((provider) => (
                  <div key={provider.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`provider-${provider.id}`}
                      checked={formData.affected_providers.includes(provider.id)}
                      onCheckedChange={() => handleProviderToggle(provider.id)}
                    />
                    <label
                      htmlFor={`provider-${provider.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {provider.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Affected Regions */}
            <div className="space-y-3">
              <Label>Affected Regions</Label>
              <div className="grid grid-cols-2 gap-3">
                {regions.map((region) => (
                  <div key={region.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`region-${region.id}`}
                      checked={formData.affected_regions.includes(region.id)}
                      onCheckedChange={() => handleRegionToggle(region.id)}
                    />
                    <label
                      htmlFor={`region-${region.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {region.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Affected Customer Count */}
            <div className="space-y-2">
              <Label htmlFor="affected_count">Estimated Affected Customers</Label>
              <Input
                id="affected_count"
                type="number"
                min="0"
                value={formData.affected_customer_count}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  affected_customer_count: parseInt(e.target.value) || 0
                }))}
              />
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                className="bg-circleTel-orange hover:bg-orange-600"
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Declare Incident
              </Button>
              <Link href="/admin/network/outages">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
