'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Building2,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  Send,
  RotateCcw,
  Wifi,
  Radio,
  Globe,
  Phone,
  Mail,
  User,
  DollarSign,
  Shield,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

// Types
interface SiteResult {
  id: string;
  input: string;
  status: 'pending' | 'checking' | 'complete' | 'error';
  address?: string;
  coordinates?: { lat: number; lng: number };
  coverage: {
    fibre: { available: boolean; provider?: string; confidence: string };
    tarana: { available: boolean; confidence: string; zone?: string };
    fiveG: { available: boolean; provider?: string };
    lte: { available: boolean; provider?: string };
  } | null;
  recommendedPackages: Array<{
    id: string;
    name: string;
    speed: string;
    price: number;
    technology: string;
  }>;
  error?: string;
}

interface FormData {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  speedRequirement: '100' | '200' | '500' | '1000';
  contention: 'best-effort' | '10:1' | 'dia';
  budget: string;
  needFailover: boolean;
  sites: string;
}

// Helper to detect if input is GPS coordinates
function isGPSCoordinate(input: string): boolean {
  // Match formats: "-33.992024, 18.766900" or "-33.992024 18.766900" or "-33.992024° 18.766900°"
  const gpsPattern = /^-?\d{1,3}\.?\d*[°]?\s*[,\s]\s*-?\d{1,3}\.?\d*[°]?$/;
  return gpsPattern.test(input.trim());
}

// Parse GPS coordinates
function parseCoordinates(input: string): { lat: number; lng: number } | null {
  const cleaned = input.replace(/[°]/g, '').trim();
  const parts = cleaned.split(/[,\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

// Coverage status badge component
function CoverageBadge({ available, label, confidence }: {
  available: boolean;
  label: string;
  confidence?: string;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
      available
        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
        : "bg-gray-50 text-gray-400 border border-gray-200"
    )}>
      {available ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <XCircle className="w-4 h-4" />
      )}
      <span>{label}</span>
      {available && confidence && (
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded",
          confidence === 'high' ? "bg-emerald-100" :
          confidence === 'medium' ? "bg-amber-100 text-amber-700" :
          "bg-gray-100 text-gray-600"
        )}>
          {confidence}
        </span>
      )}
    </div>
  );
}

// Technology icon component
function TechIcon({ tech }: { tech: string }) {
  switch (tech.toLowerCase()) {
    case 'fibre':
      return <Globe className="w-4 h-4" />;
    case 'tarana':
    case 'wireless':
      return <Radio className="w-4 h-4" />;
    case '5g':
    case 'lte':
      return <Wifi className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
}

export default function FeasibilityPage() {
  const [step, setStep] = useState<'form' | 'checking' | 'results'>('form');
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    speedRequirement: '100',
    contention: '10:1',
    budget: '',
    needFailover: false,
    sites: ''
  });
  const [siteResults, setSiteResults] = useState<SiteResult[]>([]);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());

  // Parse sites from textarea
  const parseSites = (sitesText: string): string[] => {
    return sitesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  // Simulate feasibility check (replace with actual API call)
  const checkFeasibility = async () => {
    const sites = parseSites(formData.sites);
    if (sites.length === 0) return;

    setStep('checking');

    // Initialize all sites as pending
    const initialResults: SiteResult[] = sites.map((site, index) => ({
      id: `site-${index}`,
      input: site,
      status: 'pending',
      coverage: null,
      recommendedPackages: []
    }));
    setSiteResults(initialResults);
    setSelectedSites(new Set());

    // Process sites sequentially with staggered timing for visual effect
    for (let i = 0; i < sites.length; i++) {
      // Set current site to checking
      setSiteResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'checking' } : r
      ));

      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

      try {
        const site = sites[i];
        const isGPS = isGPSCoordinate(site);
        let coordinates = isGPS ? parseCoordinates(site) : null;
        let address = isGPS ? undefined : site;

        // Call actual coverage API
        // API requires address field; coordinates are optional enhancement
        const response = await fetch('/api/coverage/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Address is always required - use GPS string as address if no street address
            address: address || `${coordinates?.lat}, ${coordinates?.lng}`,
            // Include coordinates if available (for PostGIS geography storage)
            ...(coordinates && {
              coordinates: { lat: coordinates.lat, lng: coordinates.lng }
            })
          })
        });

        const result = await response.json();

        // Parse coverage response
        const coverage = {
          fibre: {
            available: result.data?.services?.some((s: any) => s.type === 'fibre') || false,
            provider: 'DFA',
            confidence: result.data?.confidence || 'medium'
          },
          tarana: {
            available: result.data?.services?.some((s: any) => s.type === 'uncapped_wireless') || false,
            confidence: result.data?.confidence || 'medium',
            zone: result.data?.metadata?.baseStationValidation?.nearestStation ? 'Zone 0' : undefined
          },
          fiveG: {
            available: result.data?.services?.some((s: any) => s.type === '5g') || false,
            provider: 'MTN'
          },
          lte: {
            available: result.data?.services?.some((s: any) => s.type === 'fixed_lte' || s.type === 'lte') || false,
            provider: 'MTN'
          }
        };

        // Generate recommended packages based on coverage and requirements
        const packages = generatePackageRecommendations(coverage, formData);

        setSiteResults(prev => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            status: 'complete',
            address: address || `${coordinates?.lat.toFixed(6)}, ${coordinates?.lng.toFixed(6)}`,
            coordinates: coordinates || undefined,
            coverage,
            recommendedPackages: packages
          } : r
        ));

        // Auto-select sites with coverage
        if (coverage.fibre.available || coverage.tarana.available || coverage.fiveG.available) {
          setSelectedSites(prev => new Set([...prev, `site-${i}`]));
        }

      } catch (error) {
        setSiteResults(prev => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            status: 'error',
            error: 'Failed to check coverage'
          } : r
        ));
      }
    }

    setStep('results');
  };

  // Generate package recommendations based on coverage and requirements
  const generatePackageRecommendations = (
    coverage: SiteResult['coverage'],
    form: FormData
  ): SiteResult['recommendedPackages'] => {
    if (!coverage) return [];

    const packages: SiteResult['recommendedPackages'] = [];
    const speedMap: Record<string, number> = { '100': 100, '200': 200, '500': 500, '1000': 1000 };
    const targetSpeed = speedMap[form.speedRequirement];

    // Fibre packages (highest priority)
    if (coverage.fibre.available) {
      if (targetSpeed <= 100) {
        packages.push({ id: 'fibre-100', name: 'Business Fibre 100', speed: '100/100 Mbps', price: 1499, technology: 'Fibre' });
      }
      if (targetSpeed <= 200) {
        packages.push({ id: 'fibre-200', name: 'Business Fibre 200', speed: '200/200 Mbps', price: 2499, technology: 'Fibre' });
      }
      if (targetSpeed <= 500) {
        packages.push({ id: 'fibre-500', name: 'Business Fibre 500', speed: '500/500 Mbps', price: 3999, technology: 'Fibre' });
      }
    }

    // Tarana packages (second priority - good for B2B)
    if (coverage.tarana.available) {
      packages.push({ id: 'tarana-100', name: 'SkyFibre Business 100', speed: '100/100 Mbps', price: 1299, technology: 'Tarana' });
      if (targetSpeed >= 200) {
        packages.push({ id: 'tarana-200', name: 'SkyFibre Business 200', speed: '200/200 Mbps', price: 1999, technology: 'Tarana' });
      }
    }

    // 5G packages
    if (coverage.fiveG.available) {
      packages.push({ id: '5g-100', name: 'Business 5G 100', speed: '100/50 Mbps', price: 999, technology: '5G' });
      if (targetSpeed >= 200) {
        packages.push({ id: '5g-200', name: 'Business 5G 200', speed: '200/100 Mbps', price: 1799, technology: '5G' });
      }
    }

    // LTE as fallback
    if (coverage.lte.available && packages.length === 0) {
      packages.push({ id: 'lte-50', name: 'Business LTE 50', speed: '50/25 Mbps', price: 699, technology: 'LTE' });
    }

    // Filter by budget if specified
    const budget = form.budget ? parseFloat(form.budget) : Infinity;
    return packages.filter(p => p.price <= budget).slice(0, 4);
  };

  // Generate quotes for selected sites
  const generateQuotes = async () => {
    const selectedResults = siteResults.filter(r => selectedSites.has(r.id));

    // TODO: Call quote generation API
    console.log('Generating quotes for:', selectedResults);

    // For now, redirect to quotes list
    window.location.href = '/admin/quotes/business';
  };

  // Reset form
  const resetForm = () => {
    setStep('form');
    setSiteResults([]);
    setSelectedSites(new Set());
  };

  return (
    <div className="min-h-screen">
      {/* Header with gradient */}
      <div className="relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-circleTel-navy via-circleTel-navy to-circleTel-orange/20" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-circleTel-orange/20 rounded-lg">
              <Zap className="w-6 h-6 text-circleTel-orange" />
            </div>
            <h1 className="text-2xl font-bold text-white">B2B Feasibility Check</h1>
          </div>
          <p className="text-white/70 max-w-2xl">
            Quickly check coverage for multiple business sites and generate quotes in seconds.
            Paste addresses or GPS coordinates, and we&apos;ll do the rest.
          </p>
        </div>
      </div>

      <div className="px-6 pb-8">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-3 gap-6"
            >
              {/* Client Details */}
              <Card className="lg:col-span-1 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-base">Client Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="companyName" className="text-sm font-medium">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Acme Corporation"
                      value={formData.companyName}
                      onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactName" className="text-sm font-medium">Contact Name</Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="contactName"
                        placeholder="John Smith"
                        value={formData.contactName}
                        onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contactEmail" className="text-sm font-medium">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="john@acme.co.za"
                        value={formData.contactEmail}
                        onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contactPhone" className="text-sm font-medium">Phone</Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="contactPhone"
                        placeholder="082 123 4567"
                        value={formData.contactPhone}
                        onChange={e => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card className="lg:col-span-1 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Zap className="w-4 h-4 text-purple-600" />
                    </div>
                    <CardTitle className="text-base">Requirements</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Speed Requirement</Label>
                    <RadioGroup
                      value={formData.speedRequirement}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, speedRequirement: v as any }))}
                      className="grid grid-cols-2 gap-2"
                    >
                      {[
                        { value: '100', label: 'Up to 100 Mbps' },
                        { value: '200', label: 'Up to 200 Mbps' },
                        { value: '500', label: 'Up to 500 Mbps' },
                        { value: '1000', label: '1 Gbps+' },
                      ].map(option => (
                        <div key={option.value} className="relative">
                          <RadioGroupItem
                            value={option.value}
                            id={`speed-${option.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`speed-${option.value}`}
                            className={cn(
                              "flex items-center justify-center px-3 py-2 rounded-lg border-2 cursor-pointer text-sm transition-all",
                              "hover:border-circleTel-orange/50",
                              formData.speedRequirement === option.value
                                ? "border-circleTel-orange bg-circleTel-orange/5 text-circleTel-orange font-medium"
                                : "border-gray-200 text-gray-600"
                            )}
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Contention Level</Label>
                    <RadioGroup
                      value={formData.contention}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, contention: v as any }))}
                      className="space-y-2"
                    >
                      {[
                        { value: 'best-effort', label: 'Best Effort', desc: 'Shared bandwidth' },
                        { value: '10:1', label: '10:1 Contention', desc: 'Business standard' },
                        { value: 'dia', label: 'DIA', desc: 'Dedicated internet' },
                      ].map(option => (
                        <div key={option.value} className="relative">
                          <RadioGroupItem
                            value={option.value}
                            id={`contention-${option.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`contention-${option.value}`}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all",
                              "hover:border-circleTel-orange/50",
                              formData.contention === option.value
                                ? "border-circleTel-orange bg-circleTel-orange/5"
                                : "border-gray-200"
                            )}
                          >
                            <span className={cn(
                              "font-medium text-sm",
                              formData.contention === option.value ? "text-circleTel-orange" : "text-gray-700"
                            )}>
                              {option.label}
                            </span>
                            <span className="text-xs text-gray-500">{option.desc}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget" className="text-sm font-medium">Max Budget</Label>
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R</span>
                        <Input
                          id="budget"
                          type="number"
                          placeholder="2999"
                          value={formData.budget}
                          onChange={e => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                          className="pl-7"
                        />
                      </div>
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={formData.needFailover}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needFailover: !!checked }))}
                        />
                        <span className="text-sm text-gray-700">Need failover</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sites Input */}
              <Card className="lg:col-span-1 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </div>
                    <CardTitle className="text-base">Sites to Check</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Paste addresses or GPS coordinates, one per line
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder={`5 Libertas Road, Karindal, Stellenbosch
-33.992024, 18.766900
20 Krige Road, Stellenbosch
95 Dorp Street, Stellenbosch`}
                    value={formData.sites}
                    onChange={e => setFormData(prev => ({ ...prev, sites: e.target.value }))}
                    className="min-h-[200px] font-mono text-sm resize-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {parseSites(formData.sites).length} site(s) detected
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        Address
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Globe className="w-3 h-3 mr-1" />
                        GPS
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Button */}
              <div className="lg:col-span-3 flex justify-end">
                <Button
                  size="lg"
                  onClick={checkFeasibility}
                  disabled={!formData.companyName || parseSites(formData.sites).length === 0}
                  className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white gap-2 px-8"
                >
                  <Sparkles className="w-4 h-4" />
                  Check Feasibility
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {(step === 'checking' || step === 'results') && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Summary Bar */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-900">{formData.companyName}</span>
                      </div>
                      <div className="h-6 w-px bg-gray-200" />
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{siteResults.length} sites</span>
                        <span>{siteResults.filter(r => r.status === 'complete').length} checked</span>
                        <span className="text-emerald-600 font-medium">
                          {siteResults.filter(r =>
                            r.coverage?.fibre.available ||
                            r.coverage?.tarana.available ||
                            r.coverage?.fiveG.available
                          ).length} with coverage
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={resetForm}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        New Check
                      </Button>
                      {step === 'results' && selectedSites.size > 0 && (
                        <Button
                          size="sm"
                          onClick={generateQuotes}
                          className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Generate {selectedSites.size} Quote{selectedSites.size > 1 ? 's' : ''}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Grid */}
              <div className="grid gap-4">
                {siteResults.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={cn(
                      "border-2 transition-all duration-200",
                      result.status === 'checking' && "border-circleTel-orange/50 bg-circleTel-orange/5",
                      result.status === 'complete' && selectedSites.has(result.id) && "border-circleTel-orange bg-circleTel-orange/5",
                      result.status === 'complete' && !selectedSites.has(result.id) && "border-gray-200",
                      result.status === 'error' && "border-red-200 bg-red-50",
                      result.status === 'pending' && "border-gray-100 bg-gray-50 opacity-60"
                    )}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          {/* Selection checkbox */}
                          {result.status === 'complete' && (
                            <Checkbox
                              checked={selectedSites.has(result.id)}
                              onCheckedChange={(checked) => {
                                setSelectedSites(prev => {
                                  const next = new Set(prev);
                                  if (checked) {
                                    next.add(result.id);
                                  } else {
                                    next.delete(result.id);
                                  }
                                  return next;
                                });
                              }}
                              className="mt-1"
                            />
                          )}
                          {result.status === 'checking' && (
                            <Loader2 className="w-5 h-5 text-circleTel-orange animate-spin mt-0.5" />
                          )}
                          {result.status === 'pending' && (
                            <div className="w-5 h-5 rounded border-2 border-gray-300 mt-0.5" />
                          )}
                          {result.status === 'error' && (
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          )}

                          {/* Site info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="font-medium text-gray-900 truncate">
                                {result.address || result.input}
                              </span>
                              {isGPSCoordinate(result.input) && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">GPS</Badge>
                              )}
                            </div>

                            {/* Status messages */}
                            {result.status === 'checking' && (
                              <p className="text-sm text-circleTel-orange">Checking coverage...</p>
                            )}
                            {result.status === 'pending' && (
                              <p className="text-sm text-gray-400">Waiting...</p>
                            )}
                            {result.status === 'error' && (
                              <p className="text-sm text-red-600">{result.error}</p>
                            )}

                            {/* Coverage badges */}
                            {result.status === 'complete' && result.coverage && (
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  <CoverageBadge
                                    available={result.coverage.fibre.available}
                                    label="Fibre"
                                    confidence={result.coverage.fibre.available ? result.coverage.fibre.confidence : undefined}
                                  />
                                  <CoverageBadge
                                    available={result.coverage.tarana.available}
                                    label={`Tarana${result.coverage.tarana.zone ? ` (${result.coverage.tarana.zone})` : ''}`}
                                    confidence={result.coverage.tarana.available ? result.coverage.tarana.confidence : undefined}
                                  />
                                  <CoverageBadge
                                    available={result.coverage.fiveG.available}
                                    label="5G"
                                  />
                                  <CoverageBadge
                                    available={result.coverage.lte.available}
                                    label="LTE"
                                  />
                                </div>

                                {/* Recommended packages */}
                                {result.recommendedPackages.length > 0 && (
                                  <div className="pt-2 border-t border-gray-100">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Recommended Packages</p>
                                    <div className="flex flex-wrap gap-2">
                                      {result.recommendedPackages.map(pkg => (
                                        <div
                                          key={pkg.id}
                                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                                        >
                                          <TechIcon tech={pkg.technology} />
                                          <span className="font-medium">{pkg.name}</span>
                                          <span className="text-gray-500">{pkg.speed}</span>
                                          <span className="text-circleTel-orange font-semibold">R{pkg.price}/m</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {result.recommendedPackages.length === 0 && (
                                  <p className="text-sm text-amber-600 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    No packages match requirements. Consider adjusting speed/budget.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Bottom action bar */}
              {step === 'results' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="sticky bottom-4 z-10"
                >
                  <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={selectedSites.size === siteResults.filter(r => r.status === 'complete').length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSites(new Set(siteResults.filter(r => r.status === 'complete').map(r => r.id)));
                                } else {
                                  setSelectedSites(new Set());
                                }
                              }}
                            />
                            <span className="text-sm font-medium">Select all</span>
                          </label>
                          <span className="text-sm text-gray-500">
                            {selectedSites.size} of {siteResults.filter(r => r.status === 'complete').length} selected
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" onClick={resetForm}>
                            Start Over
                          </Button>
                          <Button
                            onClick={generateQuotes}
                            disabled={selectedSites.size === 0}
                            className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Generate {selectedSites.size > 0 ? `${selectedSites.size} ` : ''}Quote{selectedSites.size !== 1 ? 's' : ''}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
