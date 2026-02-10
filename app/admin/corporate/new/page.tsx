'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
import {
  ArrowLeft,
  Save,
  Building2,
  User,
  Phone,
  CreditCard,
  Wrench,
  MapPin,
  FileSignature,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CorporateFormData {
  corporateCode: string;
  companyName: string;
  tradingName: string;
  registrationNumber: string;
  vatNumber: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  primaryContactPosition: string;
  billingContactName: string;
  billingContactEmail: string;
  billingContactPhone: string;
  technicalContactName: string;
  technicalContactEmail: string;
  technicalContactPhone: string;
  physicalAddress: {
    street: string;
    city: string;
    province: string;
    postal_code: string;
  };
  industry: string;
  expectedSites: string;
  contractStartDate: string;
  contractEndDate: string;
  notes: string;
}

const INDUSTRIES = [
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Education',
  'Financial Services',
  'Hospitality',
  'Government',
  'Non-Profit',
  'Technology',
  'Agriculture',
  'Other',
];

const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

// Section configuration with icons and completion tracking
const SECTIONS = [
  { id: 'company', title: 'Company', icon: Building2, required: true },
  { id: 'primary', title: 'Primary Contact', icon: User, required: true },
  { id: 'billing', title: 'Billing', icon: CreditCard, required: false },
  { id: 'technical', title: 'Technical', icon: Wrench, required: false },
  { id: 'address', title: 'Address', icon: MapPin, required: false },
  { id: 'contract', title: 'Contract', icon: FileSignature, required: false },
];

// Styled form input component
function FormInput({
  label,
  required,
  hint,
  ...props
}: {
  label: string;
  required?: boolean;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
        {label}
        {required && <span className="text-orange-500 font-bold">*</span>}
      </Label>
      <Input
        {...props}
        className={cn(
          "h-11 border-slate-200 bg-white/80 backdrop-blur-sm",
          "focus:border-orange-400 focus:ring-orange-400/20 focus:ring-2",
          "placeholder:text-slate-400 transition-all duration-200",
          "hover:border-slate-300",
          props.className
        )}
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Collapsible section component
function FormSection({
  id,
  number,
  title,
  description,
  icon: Icon,
  required,
  isComplete,
  children,
  defaultOpen = true,
}: {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  isComplete: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div
      id={id}
      className={cn(
        "group relative rounded-2xl transition-all duration-300",
        "bg-white border border-slate-200/80",
        "hover:shadow-lg hover:shadow-slate-200/50",
        isOpen && "shadow-md shadow-slate-100"
      )}
    >
      {/* Section Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center gap-4 text-left"
      >
        {/* Number Badge */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
          "text-sm font-bold transition-all duration-300",
          isComplete
            ? "bg-emerald-500 text-white"
            : required
              ? "bg-orange-500 text-white"
              : "bg-slate-100 text-slate-500"
        )}>
          {isComplete ? <Check className="w-5 h-5" /> : number}
        </div>

        {/* Title & Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 font-serif">
              {title}
            </h3>
            {!required && (
              <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                Optional
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>

        {/* Toggle Indicator */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          "bg-slate-50 text-slate-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {/* Section Content */}
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-6 pb-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {children}
          </div>
        </div>
      </div>

      {/* Decorative accent line */}
      <div className={cn(
        "absolute left-0 top-0 w-1 h-full rounded-l-2xl transition-all duration-300",
        isComplete
          ? "bg-emerald-500"
          : required
            ? "bg-orange-500"
            : "bg-transparent group-hover:bg-slate-200"
      )} />
    </div>
  );
}

export default function NewCorporatePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<CorporateFormData>({
    corporateCode: '',
    companyName: '',
    tradingName: '',
    registrationNumber: '',
    vatNumber: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    primaryContactPosition: '',
    billingContactName: '',
    billingContactEmail: '',
    billingContactPhone: '',
    technicalContactName: '',
    technicalContactEmail: '',
    technicalContactPhone: '',
    physicalAddress: {
      street: '',
      city: '',
      province: '',
      postal_code: '',
    },
    industry: '',
    expectedSites: '',
    contractStartDate: '',
    contractEndDate: '',
    notes: '',
  });

  // Calculate section completion
  const sectionCompletion = React.useMemo(() => ({
    company: !!(formData.corporateCode && formData.companyName),
    primary: !!(formData.primaryContactName && formData.primaryContactEmail),
    billing: !!(formData.billingContactName || formData.billingContactEmail),
    technical: !!(formData.technicalContactName || formData.technicalContactEmail),
    address: !!(formData.physicalAddress.city),
    contract: !!(formData.expectedSites || formData.contractStartDate),
  }), [formData]);

  const completedSections = Object.values(sectionCompletion).filter(Boolean).length;
  const requiredComplete = sectionCompletion.company && sectionCompletion.primary;

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('physicalAddress.')) {
      const addressField = field.replace('physicalAddress.', '');
      setFormData((prev) => ({
        ...prev,
        physicalAddress: {
          ...prev.physicalAddress,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.corporateCode || !formData.companyName || !formData.primaryContactName || !formData.primaryContactEmail) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const payload = {
        corporateCode: formData.corporateCode.toUpperCase(),
        companyName: formData.companyName,
        tradingName: formData.tradingName || undefined,
        registrationNumber: formData.registrationNumber || undefined,
        vatNumber: formData.vatNumber || undefined,
        primaryContactName: formData.primaryContactName,
        primaryContactEmail: formData.primaryContactEmail,
        primaryContactPhone: formData.primaryContactPhone || undefined,
        primaryContactPosition: formData.primaryContactPosition || undefined,
        billingContactName: formData.billingContactName || undefined,
        billingContactEmail: formData.billingContactEmail || undefined,
        billingContactPhone: formData.billingContactPhone || undefined,
        technicalContactName: formData.technicalContactName || undefined,
        technicalContactEmail: formData.technicalContactEmail || undefined,
        technicalContactPhone: formData.technicalContactPhone || undefined,
        physicalAddress: formData.physicalAddress.city
          ? formData.physicalAddress
          : undefined,
        industry: formData.industry || undefined,
        expectedSites: formData.expectedSites ? parseInt(formData.expectedSites) : undefined,
        contractStartDate: formData.contractStartDate || undefined,
        contractEndDate: formData.contractEndDate || undefined,
        notes: formData.notes || undefined,
      };

      const response = await fetch('/api/admin/corporate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create corporate');
      }

      toast.success('Corporate account created successfully');
      router.push(`/admin/corporate/${data.id}`);
    } catch (error) {
      console.error('Error creating corporate:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create corporate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      {/* Subtle background pattern */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Corporate Clients</span>
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 font-serif tracking-tight">
                    New Corporate Client
                  </h1>
                  <p className="text-slate-500 mt-0.5">
                    Create an enterprise multi-site account
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold text-slate-900">{completedSections}</span>
                <span className="text-slate-400">/</span>
                <span className="text-lg text-slate-400">6</span>
              </div>
              <span className="text-xs text-slate-500">Sections complete</span>
              {/* Progress bar */}
              <div className="mt-2 w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500 rounded-full"
                  style={{ width: `${(completedSections / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Quick Navigation */}
        <nav className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {SECTIONS.map((section, idx) => {
              const isComplete = sectionCompletion[section.id as keyof typeof sectionCompletion];
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    isComplete
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : section.required
                        ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <section.icon className="w-4 h-4" />
                  {section.title}
                  {isComplete && <Check className="w-3.5 h-3.5" />}
                </a>
              );
            })}
          </div>
        </nav>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Company Information */}
          <FormSection
            id="company"
            number={1}
            title="Company Information"
            description="Basic company details and registration numbers"
            icon={Building2}
            required={true}
            isComplete={sectionCompletion.company}
            defaultOpen={true}
          >
            <FormInput
              label="Corporate Code"
              required
              placeholder="UNJ"
              value={formData.corporateCode}
              onChange={(e) => handleInputChange('corporateCode', e.target.value.toUpperCase())}
              maxLength={10}
              className="uppercase font-mono text-lg tracking-wider"
              hint="Used in account numbers: CT-UNJ-001"
            />
            <FormInput
              label="Company Name"
              required
              placeholder="Unjani Clinics NPC"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
            />
            <FormInput
              label="Trading Name"
              placeholder="Unjani Clinics"
              value={formData.tradingName}
              onChange={(e) => handleInputChange('tradingName', e.target.value)}
            />
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => handleInputChange('industry', value)}
              >
                <SelectTrigger className="h-11 border-slate-200 bg-white/80 hover:border-slate-300 focus:border-orange-400 focus:ring-orange-400/20">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormInput
              label="CIPC Registration Number"
              placeholder="2014/089277/08"
              value={formData.registrationNumber}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
            />
            <FormInput
              label="VAT Number"
              placeholder="4123456789"
              value={formData.vatNumber}
              onChange={(e) => handleInputChange('vatNumber', e.target.value)}
            />
          </FormSection>

          {/* Section 2: Primary Contact */}
          <FormSection
            id="primary"
            number={2}
            title="Primary Contact"
            description="Main point of contact at corporate headquarters"
            icon={User}
            required={true}
            isComplete={sectionCompletion.primary}
            defaultOpen={true}
          >
            <FormInput
              label="Full Name"
              required
              placeholder="Lynda Toussaint"
              value={formData.primaryContactName}
              onChange={(e) => handleInputChange('primaryContactName', e.target.value)}
            />
            <FormInput
              label="Position / Title"
              placeholder="Chief Executive Officer"
              value={formData.primaryContactPosition}
              onChange={(e) => handleInputChange('primaryContactPosition', e.target.value)}
            />
            <FormInput
              label="Email Address"
              required
              type="email"
              placeholder="ceo@company.co.za"
              value={formData.primaryContactEmail}
              onChange={(e) => handleInputChange('primaryContactEmail', e.target.value)}
            />
            <FormInput
              label="Phone Number"
              type="tel"
              placeholder="082 123 4567"
              value={formData.primaryContactPhone}
              onChange={(e) => handleInputChange('primaryContactPhone', e.target.value)}
            />
          </FormSection>

          {/* Section 3: Billing Contact */}
          <FormSection
            id="billing"
            number={3}
            title="Billing Contact"
            description="Finance department contact for invoices and payments"
            icon={CreditCard}
            required={false}
            isComplete={sectionCompletion.billing}
            defaultOpen={false}
          >
            <FormInput
              label="Contact Name"
              placeholder="Finance Manager"
              value={formData.billingContactName}
              onChange={(e) => handleInputChange('billingContactName', e.target.value)}
            />
            <FormInput
              label="Email Address"
              type="email"
              placeholder="finance@company.co.za"
              value={formData.billingContactEmail}
              onChange={(e) => handleInputChange('billingContactEmail', e.target.value)}
            />
            <FormInput
              label="Phone Number"
              type="tel"
              placeholder="082 123 4567"
              value={formData.billingContactPhone}
              onChange={(e) => handleInputChange('billingContactPhone', e.target.value)}
            />
          </FormSection>

          {/* Section 4: Technical Contact */}
          <FormSection
            id="technical"
            number={4}
            title="Technical Contact"
            description="IT department contact for installations and support"
            icon={Wrench}
            required={false}
            isComplete={sectionCompletion.technical}
            defaultOpen={false}
          >
            <FormInput
              label="Contact Name"
              placeholder="IT Manager"
              value={formData.technicalContactName}
              onChange={(e) => handleInputChange('technicalContactName', e.target.value)}
            />
            <FormInput
              label="Email Address"
              type="email"
              placeholder="it@company.co.za"
              value={formData.technicalContactEmail}
              onChange={(e) => handleInputChange('technicalContactEmail', e.target.value)}
            />
            <FormInput
              label="Phone Number"
              type="tel"
              placeholder="082 123 4567"
              value={formData.technicalContactPhone}
              onChange={(e) => handleInputChange('technicalContactPhone', e.target.value)}
            />
          </FormSection>

          {/* Section 5: Headquarters Address */}
          <FormSection
            id="address"
            number={5}
            title="Headquarters Address"
            description="Physical address of the corporate head office"
            icon={MapPin}
            required={false}
            isComplete={sectionCompletion.address}
            defaultOpen={false}
          >
            <div className="md:col-span-2">
              <FormInput
                label="Street Address"
                placeholder="123 Main Road, Building A"
                value={formData.physicalAddress.street}
                onChange={(e) => handleInputChange('physicalAddress.street', e.target.value)}
              />
            </div>
            <FormInput
              label="City"
              placeholder="Midrand"
              value={formData.physicalAddress.city}
              onChange={(e) => handleInputChange('physicalAddress.city', e.target.value)}
            />
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Province</Label>
              <Select
                value={formData.physicalAddress.province}
                onValueChange={(value) => handleInputChange('physicalAddress.province', value)}
              >
                <SelectTrigger className="h-11 border-slate-200 bg-white/80 hover:border-slate-300 focus:border-orange-400 focus:ring-orange-400/20">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormInput
              label="Postal Code"
              placeholder="1685"
              value={formData.physicalAddress.postal_code}
              onChange={(e) => handleInputChange('physicalAddress.postal_code', e.target.value)}
            />
          </FormSection>

          {/* Section 6: Contract Details */}
          <FormSection
            id="contract"
            number={6}
            title="Contract Details"
            description="Deployment scope and contract timeline"
            icon={FileSignature}
            required={false}
            isComplete={sectionCompletion.contract}
            defaultOpen={false}
          >
            <FormInput
              label="Expected Sites"
              type="number"
              placeholder="252"
              value={formData.expectedSites}
              onChange={(e) => handleInputChange('expectedSites', e.target.value)}
              hint="Total number of sites to deploy"
            />
            <div /> {/* Spacer */}
            <FormInput
              label="Contract Start Date"
              type="date"
              value={formData.contractStartDate}
              onChange={(e) => handleInputChange('contractStartDate', e.target.value)}
            />
            <FormInput
              label="Contract End Date"
              type="date"
              value={formData.contractEndDate}
              onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
            />
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Notes</Label>
              <Textarea
                placeholder="Additional notes about the corporate client, special requirements, or deployment details..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="border-slate-200 bg-white/80 focus:border-orange-400 focus:ring-orange-400/20 resize-none"
              />
            </div>
          </FormSection>

          {/* Submit Area */}
          <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-slate-50 via-white/95 to-transparent -mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-lg shadow-slate-200/50">
              {/* Status */}
              <div className="flex items-center gap-3">
                {requiredComplete ? (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">Ready to create</p>
                      <p className="text-xs text-slate-500">All required fields complete</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Complete required fields</p>
                      <p className="text-xs text-slate-500">Company info and primary contact</p>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 sm:flex-initial h-11 border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !requiredComplete}
                  className={cn(
                    "flex-1 sm:flex-initial h-11 gap-2 transition-all duration-300",
                    requiredComplete
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Corporate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
