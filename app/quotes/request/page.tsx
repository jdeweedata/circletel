/**
 * Public Quote Request Form
 *
 * Route: /quotes/request?token=[optional_agent_token]
 *
 * Multi-step form with coverage check and package selection
 * Accessible to both public users and sales agents (authenticated or via token)
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, MapPin, Building2, Phone, Mail, User, FileText } from 'lucide-react';
import { AddressAutocomplete } from '@/components/coverage/AddressAutocomplete';

type Step = 'coverage' | 'details' | 'packages' | 'review' | 'success';

interface AgentInfo {
  id: string;
  name: string;
  email: string;
  type: string;
}

interface CoverageResult {
  lead_id: string;
  address: string;
  coordinates: { lat: number; lng: number };
  available: boolean;
  packages: any[];
}

interface PackageSelection {
  package_id: string;
  item_type: 'primary' | 'secondary' | 'additional';
  quantity: number;
  notes?: string;
}

function QuoteRequestFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');

  const [step, setStep] = useState<Step>('coverage');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  // Form data
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null);
  const [customerType, setCustomerType] = useState<'smme' | 'enterprise'>('smme');
  const [companyName, setCompanyName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contractTerm, setContractTerm] = useState<12 | 24 | 36>(24);
  const [selectedPackages, setSelectedPackages] = useState<PackageSelection[]>([]);
  const [customerNotes, setCustomerNotes] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');

  // Validate token on mount
  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/quotes/request/validate?token=${token}`);
      const data = await response.json();

      if (data.success && data.agent) {
        setAgentInfo(data.agent);
        setIsPublic(false);
      }
    } catch (err) {
      console.error('Token validation error:', err);
    }
  };

  const handleCoverageCheck = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call coverage API
      const response = await fetch('/api/coverage/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          coordinates: coordinates || undefined
        })
      });

      const data = await response.json();

      if (data.success && data.available) {
        setCoverageResult({
          lead_id: data.lead_id,
          address: data.formatted_address || address,
          coordinates: data.coordinates || coordinates,
          available: true,
          packages: data.packages || []
        });
        setStep('details');
      } else {
        setError(data.error || 'No coverage available at this address');
      }
    } catch (err) {
      setError('Failed to check coverage. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsNext = () => {
    if (!companyName || !contactName || !contactEmail || !contactPhone) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    setStep('packages');
  };

  const handlePackagesNext = () => {
    if (selectedPackages.length === 0) {
      setError('Please select at least one package');
      return;
    }
    setError(null);
    setStep('review');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quotes/request/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token || undefined,
          coverage_lead_id: coverageResult?.lead_id,
          customer_type: customerType,
          company_name: companyName,
          registration_number: registrationNumber || undefined,
          vat_number: vatNumber || undefined,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          service_address: coverageResult?.address || address,
          coordinates: coverageResult?.coordinates,
          contract_term: contractTerm,
          selected_packages: selectedPackages,
          customer_notes: customerNotes || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setQuoteNumber(data.quote.quote_number);
        setStep('success');
      } else {
        setError(data.error || 'Failed to submit quote request');
      }
    } catch (err) {
      setError('Failed to submit quote request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePackage = (packageId: string) => {
    const exists = selectedPackages.find(p => p.package_id === packageId);
    if (exists) {
      setSelectedPackages(prev => prev.filter(p => p.package_id !== packageId));
    } else {
      setSelectedPackages(prev => [...prev, {
        package_id: packageId,
        item_type: prev.length === 0 ? 'primary' : 'additional',
        quantity: 1
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-circleTel-orange mb-2">
            Request a Business Quote
          </h1>
          <p className="text-circleTel-secondaryNeutral text-lg">
            Get a customized quote for your business connectivity needs
          </p>
          {agentInfo && (
            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <AlertDescription>
                This quote will be managed by <strong>{agentInfo.name}</strong> ({agentInfo.email})
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {['coverage', 'details', 'packages', 'review'].map((s, index) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step === s ? 'bg-circleTel-orange text-white' :
                  index < ['coverage', 'details', 'packages', 'review'].indexOf(step) ? 'bg-green-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && <div className="w-12 h-1 bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step: Coverage Check */}
        {step === 'coverage' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Step 1: Check Coverage
              </CardTitle>
              <CardDescription>
                Enter your service address to check availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Service Address *</Label>
                <AddressAutocomplete
                  value={address}
                  onLocationSelect={(location) => {
                    setAddress(location.address);
                    if (location.latitude && location.longitude) {
                      setCoordinates({ lat: location.latitude, lng: location.longitude });
                    }
                  }}
                  placeholder="Enter street address, suburb, city"
                  className="w-full"
                  showLocationButton={true}
                />
              </div>
              <Button
                onClick={handleCoverageCheck}
                disabled={loading || !address.trim()}
                className="w-full bg-circleTel-orange hover:bg-orange-600"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Check Coverage
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Customer Details */}
        {step === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Step 2: Company & Contact Details
              </CardTitle>
              <CardDescription>
                Tell us about your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Customer Type *</Label>
                <RadioGroup value={customerType} onValueChange={(v: any) => setCustomerType(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="smme" id="smme" />
                    <Label htmlFor="smme">SMME / Small Business</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="enterprise" id="enterprise" />
                    <Label htmlFor="enterprise">Enterprise / Large Business</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company (Pty) Ltd"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reg">Registration Number</Label>
                  <Input
                    id="reg"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="2020/123456/07"
                  />
                </div>
                <div>
                  <Label htmlFor="vat">VAT Number</Label>
                  <Input
                    id="vat"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="4123456789"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contactName">Contact Person *</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="john@company.co.za"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+27 82 123 4567"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('coverage')}>
                  Back
                </Button>
                <Button
                  onClick={handleDetailsNext}
                  className="flex-1 bg-circleTel-orange hover:bg-orange-600"
                >
                  Continue to Packages
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Package Selection */}
        {step === 'packages' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Select Packages</CardTitle>
              <CardDescription>
                Choose the connectivity packages for your business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Coverage available at: <strong>{coverageResult?.address}</strong>
                </AlertDescription>
              </Alert>

              {coverageResult && coverageResult.packages.length > 0 ? (
                <div className="grid gap-4">
                  {coverageResult.packages.map((pkg: any) => (
                    <div
                      key={pkg.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                        selectedPackages.find(p => p.package_id === pkg.id)
                          ? 'border-circleTel-orange bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => togglePackage(pkg.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{pkg.name}</h3>
                          <p className="text-sm text-gray-600">{pkg.service_type}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {pkg.speed_down}Mbps down / {pkg.speed_up}Mbps up
                            {pkg.data_cap_gb ? ` • ${pkg.data_cap_gb}GB` : ' • Uncapped'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-circleTel-orange">
                            R{pkg.price?.toFixed(2) || '0.00'}/mo
                          </p>
                          {pkg.promotion_price && (
                            <p className="text-sm text-gray-500 line-through">
                              Was R{pkg.promotion_price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No packages available. Please contact support.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="contractTerm">Contract Term *</Label>
                <Select value={String(contractTerm)} onValueChange={(v) => setContractTerm(Number(v) as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 Months</SelectItem>
                    <SelectItem value="24">24 Months</SelectItem>
                    <SelectItem value="36">36 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special requirements or questions..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('details')}>
                  Back
                </Button>
                <Button
                  onClick={handlePackagesNext}
                  disabled={selectedPackages.length === 0}
                  className="flex-1 bg-circleTel-orange hover:bg-orange-600"
                >
                  Review Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Review & Submit</CardTitle>
              <CardDescription>
                Please review your quote request before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Company Details</h3>
                <p className="text-sm text-gray-600">
                  {companyName}<br />
                  {registrationNumber && `Reg: ${registrationNumber}`}
                  {vatNumber && ` • VAT: ${vatNumber}`}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Contact</h3>
                <p className="text-sm text-gray-600">
                  {contactName}<br />
                  {contactEmail} • {contactPhone}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Service Address</h3>
                <p className="text-sm text-gray-600">{coverageResult?.address}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Selected Packages</h3>
                <div className="space-y-2">
                  {selectedPackages.map(sel => {
                    const pkg = coverageResult?.packages.find(p => p.id === sel.package_id);
                    return pkg ? (
                      <div key={pkg.id} className="text-sm bg-gray-50 p-3 rounded">
                        <p className="font-medium">{pkg.name}</p>
                        <p className="text-gray-600">R{pkg.price}/mo x {sel.quantity}</p>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Contract Term</h3>
                <p className="text-sm text-gray-600">{contractTerm} Months</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('packages')}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-circleTel-orange hover:bg-orange-600"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Quote Request
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Quote Request Submitted!
              </CardTitle>
              <CardDescription>
                Your quote request has been successfully submitted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription>
                  <p className="font-semibold mb-2">Quote Number: {quoteNumber}</p>
                  <p className="text-sm">
                    {agentInfo
                      ? `Your assigned agent (${agentInfo.name}) will review your quote request and contact you shortly.`
                      : 'Our team will review your quote request and contact you shortly.'}
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Next Steps:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                  <li>An admin will review and approve your quote</li>
                  <li>You'll receive the final quote via email</li>
                  <li>Review and accept the quote to proceed</li>
                  <li>Schedule installation once accepted</li>
                </ul>
              </div>

              <Button
                onClick={() => router.push('/')}
                className="w-full bg-circleTel-orange hover:bg-orange-600"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function QuoteRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    }>
      <QuoteRequestFormContent />
    </Suspense>
  );
}
