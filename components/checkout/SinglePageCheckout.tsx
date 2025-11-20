'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  User,
  MapPin,
  CreditCard,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Lock,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PaymentDisclaimerCard } from '@/components/payments/PaymentDisclaimerCard';
import { PaymentConsentCheckboxes, type PaymentConsents } from '@/components/payments/PaymentConsentCheckboxes';
import { validateConsents } from '@/lib/constants/policy-versions';

interface CheckoutSection {
  id: string;
  title: string;
  icon: any;
  completed: boolean;
}

interface Package {
  id: string;
  name: string;
  service_type: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
}

interface SinglePageCheckoutProps {
  packageData: Package;
  leadId: string;
  prefilledAddress?: {
    street?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  onComplete: (orderId: string) => void;
  className?: string;
}

export function SinglePageCheckout({
  packageData,
  leadId,
  prefilledAddress,
  onComplete,
  className
}: SinglePageCheckoutProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>('personal');

  // Form state
  const [formData, setFormData] = useState({
    // Personal Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idType: 'sa_id',
    idNumber: '',

    // Service Address
    addressType: 'freestanding',
    streetAddress: prefilledAddress?.street || '',
    suburb: prefilledAddress?.suburb || '',
    city: prefilledAddress?.city || '',
    province: prefilledAddress?.province || 'Gauteng',
    postalCode: prefilledAddress?.postalCode || '',

    // Delivery Address
    sameAsService: true,
    deliveryStreet: '',
    deliverySuburb: '',
    deliveryCity: '',
    deliveryProvince: 'Gauteng',
    deliveryPostalCode: '',

    // Payment Details
    bank: '',
    accountHolder: '',
    accountNumber: '',
    accountType: 'cheque',

    // Consents
    consents: {
      terms: false,
      privacy: false,
      paymentTerms: false,
      refundPolicy: false,
      recurringPayment: false,
      marketing: false,
    } as PaymentConsents,
  });

  const [consentErrors, setConsentErrors] = useState<string[]>([]);

  const [sections, setSections] = useState<CheckoutSection[]>([
    { id: 'personal', title: 'Personal Details', icon: User, completed: false },
    { id: 'service', title: 'Service Address', icon: MapPin, completed: false },
    { id: 'payment', title: 'Payment Details', icon: CreditCard, completed: false },
  ]);

  const provinces = [
    'Gauteng',
    'Western Cape',
    'KwaZulu-Natal',
    'Eastern Cape',
    'Free State',
    'Limpopo',
    'Mpumalanga',
    'Northern Cape',
    'North West'
  ];

  const banks = [
    'ABSA',
    'Standard Bank',
    'FNB',
    'Nedbank',
    'Capitec',
    'Discovery Bank',
    'TymeBank',
    'African Bank'
  ];

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConsentChange = (consents: PaymentConsents) => {
    setFormData((prev) => ({ ...prev, consents }));
    // Clear consent errors when user makes changes
    if (consentErrors.length > 0) {
      setConsentErrors([]);
    }
  };

  const validateSection = (sectionId: string): boolean => {
    switch (sectionId) {
      case 'personal':
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.phone &&
          formData.idNumber
        );
      case 'service':
        return !!(
          formData.streetAddress &&
          formData.suburb &&
          formData.city &&
          formData.province
        );
      case 'payment':
        const consentValidation = validateConsents(formData.consents);
        return !!(
          formData.bank &&
          formData.accountHolder &&
          formData.accountNumber &&
          consentValidation.valid
        );
      default:
        return false;
    }
  };

  const markSectionComplete = (sectionId: string) => {
    if (validateSection(sectionId)) {
      setSections(prev =>
        prev.map(s => (s.id === sectionId ? { ...s, completed: true } : s))
      );
      return true;
    }
    return false;
  };

  const handleSectionFocus = (sectionId: string) => {
    setCurrentSection(sectionId);
  };

  const calculateProgress = () => {
    const completed = sections.filter(s => s.completed).length;
    return (completed / sections.length) * 100;
  };

  const handleSubmit = async () => {
    // Validate all sections
    const allValid = sections.every(s => validateSection(s.id));

    if (!allValid) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          packageId: packageData.id,
          customer: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            idType: formData.idType,
            idNumber: formData.idNumber
          },
          serviceAddress: {
            type: formData.addressType,
            street: formData.streetAddress,
            suburb: formData.suburb,
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode
          },
          deliveryAddress: formData.sameAsService ? null : {
            street: formData.deliveryStreet,
            suburb: formData.deliverySuburb,
            city: formData.deliveryCity,
            province: formData.deliveryProvince,
            postalCode: formData.deliveryPostalCode
          },
          payment: {
            bank: formData.bank,
            accountHolder: formData.accountHolder,
            accountNumber: formData.accountNumber,
            accountType: formData.accountType
          },
          consents: formData.consents,
          marketing: formData.consents.marketing
        })
      });

      if (!response.ok) {
        throw new Error('Order creation failed');
      }

      const data = await response.json();
      toast.success('Order submitted successfully!');
      onComplete(data.orderId);
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPrice = packageData.promotion_price || packageData.price;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Checkout Progress</span>
              <span>{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
            <div className="flex justify-between gap-2 mt-4">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionFocus(section.id)}
                    className={cn(
                      'flex-1 flex items-center gap-2 p-2 rounded-lg transition-all text-sm',
                      currentSection === section.id
                        ? 'bg-orange-50 border-2 border-orange-500'
                        : 'bg-gray-50 border-2 border-transparent hover:border-gray-300',
                      section.completed && 'bg-green-50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{section.title}</span>
                    {section.completed && (
                      <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Details Section */}
          <Card id="personal" className={cn(currentSection === 'personal' && 'ring-2 ring-orange-500')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                Personal Details
                {sections[0].completed && (
                  <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    onFocus={() => handleSectionFocus('personal')}
                    onBlur={() => markSectionComplete('personal')}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    onFocus={() => handleSectionFocus('personal')}
                    onBlur={() => markSectionComplete('personal')}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  onFocus={() => handleSectionFocus('personal')}
                  onBlur={() => markSectionComplete('personal')}
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  onFocus={() => handleSectionFocus('personal')}
                  onBlur={() => markSectionComplete('personal')}
                  placeholder="082 123 4567"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idType">ID Type *</Label>
                  <Select value={formData.idType} onValueChange={(v) => updateField('idType', v)}>
                    <SelectTrigger onFocus={() => handleSectionFocus('personal')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sa_id">SA ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID/Passport Number *</Label>
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => updateField('idNumber', e.target.value)}
                    onFocus={() => handleSectionFocus('personal')}
                    onBlur={() => markSectionComplete('personal')}
                    placeholder="9001015009086"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Address Section */}
          <Card id="service" className={cn(currentSection === 'service' && 'ring-2 ring-orange-500')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                Service Address
                {sections[1].completed && (
                  <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addressType">Address Type *</Label>
                <Select value={formData.addressType} onValueChange={(v) => updateField('addressType', v)}>
                  <SelectTrigger onFocus={() => handleSectionFocus('service')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freestanding">Free Standing House</SelectItem>
                    <SelectItem value="complex">Complex/Estate</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="business">Business Premises</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address *</Label>
                <Input
                  id="streetAddress"
                  value={formData.streetAddress}
                  onChange={(e) => updateField('streetAddress', e.target.value)}
                  onFocus={() => handleSectionFocus('service')}
                  onBlur={() => markSectionComplete('service')}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="suburb">Suburb *</Label>
                  <Input
                    id="suburb"
                    value={formData.suburb}
                    onChange={(e) => updateField('suburb', e.target.value)}
                    onFocus={() => handleSectionFocus('service')}
                    onBlur={() => markSectionComplete('service')}
                    placeholder="Centurion"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    onFocus={() => handleSectionFocus('service')}
                    onBlur={() => markSectionComplete('service')}
                    placeholder="Pretoria"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <Select value={formData.province} onValueChange={(v) => updateField('province', v)}>
                    <SelectTrigger onFocus={() => handleSectionFocus('service')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((prov) => (
                        <SelectItem key={prov} value={prov}>
                          {prov}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    onFocus={() => handleSectionFocus('service')}
                    onBlur={() => markSectionComplete('service')}
                    placeholder="0157"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details Section */}
          <Card id="payment" className={cn(currentSection === 'payment' && 'ring-2 ring-orange-500')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-500" />
                Payment Details
                {sections[2].completed && (
                  <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold">Secure Payment</p>
                  <p className="text-blue-700">Your banking details are encrypted and secure. We use bank-level security.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank">Bank *</Label>
                <Select value={formData.bank} onValueChange={(v) => updateField('bank', v)}>
                  <SelectTrigger onFocus={() => handleSectionFocus('payment')}>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountHolder">Account Holder Name *</Label>
                <Input
                  id="accountHolder"
                  value={formData.accountHolder}
                  onChange={(e) => updateField('accountHolder', e.target.value)}
                  onFocus={() => handleSectionFocus('payment')}
                  onBlur={() => markSectionComplete('payment')}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => updateField('accountNumber', e.target.value)}
                  onFocus={() => handleSectionFocus('payment')}
                  onBlur={() => markSectionComplete('payment')}
                  placeholder="1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type *</Label>
                <RadioGroup value={formData.accountType} onValueChange={(v) => updateField('accountType', v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cheque" id="cheque" />
                    <Label htmlFor="cheque" className="font-normal cursor-pointer">
                      Cheque/Current Account
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="savings" id="savings" />
                    <Label htmlFor="savings" className="font-normal cursor-pointer">
                      Savings Account
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Payment Security Disclaimer */}
              <div className="pt-4 border-t">
                <PaymentDisclaimerCard variant="compact" />
              </div>

              {/* Legal Consents */}
              <div className="pt-4">
                <PaymentConsentCheckboxes
                  consents={formData.consents}
                  onConsentChange={handleConsentChange}
                  showRecurringPayment={true}
                  showMarketing={true}
                  errors={consentErrors}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary (Sticky) */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Package Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{packageData.name}</span>
                  <Badge variant="outline">{packageData.service_type}</Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Speed:</span>
                  <span>{packageData.speed_down}↓ / {packageData.speed_up}↑ Mbps</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Monthly subscription</span>
                  {packageData.promotion_price ? (
                    <div className="text-right">
                      <p className="font-semibold text-orange-500">R{packageData.promotion_price}</p>
                      <p className="text-xs text-gray-400 line-through">R{packageData.price}</p>
                    </div>
                  ) : (
                    <span className="font-semibold">R{packageData.price}</span>
                  )}
                </div>

                <div className="flex justify-between text-sm">
                  <span>Setup fee</span>
                  <div className="text-right">
                    <span className="text-green-600 font-semibold">FREE</span>
                    <p className="text-xs text-gray-400 line-through">R2799</p>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Order processing</span>
                  <span>R249</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="font-semibold">Due today:</span>
                  <span className="text-2xl font-bold text-orange-500">R249</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>First billing (next month):</span>
                  <span className="font-semibold">R{currentPrice}</span>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>POPIA Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Lock className="h-4 w-4 text-green-500" />
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-green-500" />
                  <span>Instant Confirmation</span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || calculateProgress() < 100}
                className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Complete Order'
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                By completing this order, you agree to our terms and authorize payment
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
