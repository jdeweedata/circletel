'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Smartphone,
  SimCard,
  Signal,
  Database,
  Phone,
  MessageSquare,
  User,
  Building2,
  MapPin,
  CreditCard,
  Loader2,
  Gift,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { MTNDeal } from '@/components/deals/MTNDealCard';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Steps
const STEPS = [
  { id: 'deal', title: 'Deal Selection', icon: Smartphone },
  { id: 'customer', title: 'Your Details', icon: User },
  { id: 'delivery', title: 'Delivery', icon: MapPin },
  { id: 'review', title: 'Review & Pay', icon: CreditCard },
];

function MTNDealOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get('deal_id');
  
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [deal, setDeal] = useState<MTNDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [customerType, setCustomerType] = useState<'consumer' | 'business'>('consumer');
  const [formData, setFormData] = useState({
    // Personal
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    idNumber: '',
    
    // Business (optional)
    companyName: '',
    companyReg: '',
    vatNumber: '',
    
    // Delivery
    deliveryType: 'delivery',
    streetAddress: '',
    suburb: '',
    city: '',
    province: '',
    postalCode: '',
    
    // Preferences
    portNumber: false,
    existingNumber: '',
    acceptTerms: false,
    acceptRica: false,
  });
  
  // Fetch deal details
  useEffect(() => {
    const fetchDeal = async () => {
      if (!dealId) {
        router.push('/deals');
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/mtn-dealer-products/${dealId}`);
        const result = await response.json();
        
        if (result.success) {
          setDeal(result.data);
        } else {
          router.push('/deals');
        }
      } catch (err) {
        router.push('/deals');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeal();
  }, [dealId, router]);
  
  // Handle form change
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Validate current step
  const validateStep = () => {
    switch (currentStep) {
      case 0: // Deal
        return !!deal;
      case 1: // Customer
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.idNumber) {
          return false;
        }
        if (customerType === 'business' && !formData.companyName) {
          return false;
        }
        return true;
      case 2: // Delivery
        if (formData.deliveryType === 'delivery') {
          return formData.streetAddress && formData.city && formData.province && formData.postalCode;
        }
        return true;
      case 3: // Review
        return formData.acceptTerms && formData.acceptRica;
      default:
        return true;
    }
  };
  
  // Handle next step
  const handleNext = () => {
    if (validateStep() && currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  // Handle previous step
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // Handle submit
  const handleSubmit = async () => {
    if (!validateStep() || !deal) return;
    
    setSubmitting(true);
    try {
      // Create order
      const response = await fetch('/api/orders/mobile-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: deal.id,
          customer_type: customerType,
          ...formData,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Redirect to payment or confirmation
        router.push(`/order/confirmation/${result.order_id}`);
      } else {
        alert(result.error || 'Failed to create order');
      }
    } catch (err) {
      alert('Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }
  
  if (!deal) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Progress Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${index <= currentStep ? 'text-circleTel-orange' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index < currentStep ? 'bg-circleTel-orange text-white' :
                    index === currentStep ? 'border-2 border-circleTel-orange' :
                    'border-2 border-gray-300'
                  }`}>
                    {index < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-2 ${index < currentStep ? 'bg-circleTel-orange' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 0: Deal Confirmation */}
              {currentStep === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Confirm Your Deal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      {deal.has_device ? (
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <Smartphone className="h-8 w-8 text-gray-600" />
                        </div>
                      ) : (
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <SimCard className="h-8 w-8 text-circleTel-orange" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {deal.has_device ? deal.device_name : 'SIM Only Deal'}
                        </h3>
                        <p className="text-gray-500">{deal.price_plan}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">{deal.technology}</Badge>
                          <Badge variant="outline">{deal.contract_term_label}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Database className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="font-semibold">{deal.data_bundle}</p>
                        <p className="text-xs text-gray-500">Data</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <Phone className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="font-semibold">{deal.anytime_minutes || '0'}</p>
                        <p className="text-xs text-gray-500">Minutes</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                        <p className="font-semibold">{deal.sms_bundle || '0'}</p>
                        <p className="text-xs text-gray-500">SMS</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push('/deals')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Choose a Different Deal
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Step 1: Customer Details */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Customer Type */}
                    <div className="space-y-3">
                      <Label>I am ordering for</Label>
                      <RadioGroup
                        value={customerType}
                        onValueChange={(v) => setCustomerType(v as 'consumer' | 'business')}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="consumer" id="consumer" />
                          <Label htmlFor="consumer" className="flex items-center gap-2 cursor-pointer">
                            <User className="h-4 w-4" />
                            Personal Use
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="business" id="business" />
                          <Label htmlFor="business" className="flex items-center gap-2 cursor-pointer">
                            <Building2 className="h-4 w-4" />
                            Business
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {/* Personal Details */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name *</Label>
                        <Input
                          value={formData.firstName}
                          onChange={(e) => handleChange('firstName', e.target.value)}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name *</Label>
                        <Input
                          value={formData.lastName}
                          onChange={(e) => handleChange('lastName', e.target.value)}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number *</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="082 123 4567"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>SA ID Number *</Label>
                      <Input
                        value={formData.idNumber}
                        onChange={(e) => handleChange('idNumber', e.target.value)}
                        placeholder="8501015800088"
                        maxLength={13}
                      />
                      <p className="text-xs text-gray-500">Required for RICA registration</p>
                    </div>
                    
                    {/* Business Details */}
                    {customerType === 'business' && (
                      <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium">Business Details</h4>
                        <div className="space-y-2">
                          <Label>Company Name *</Label>
                          <Input
                            value={formData.companyName}
                            onChange={(e) => handleChange('companyName', e.target.value)}
                            placeholder="Acme Pty Ltd"
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Company Registration</Label>
                            <Input
                              value={formData.companyReg}
                              onChange={(e) => handleChange('companyReg', e.target.value)}
                              placeholder="2020/123456/07"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>VAT Number</Label>
                            <Input
                              value={formData.vatNumber}
                              onChange={(e) => handleChange('vatNumber', e.target.value)}
                              placeholder="4123456789"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Step 2: Delivery */}
              {currentStep === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <RadioGroup
                      value={formData.deliveryType}
                      onValueChange={(v) => handleChange('deliveryType', v)}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                          <p className="font-medium">Deliver to my address</p>
                          <p className="text-sm text-gray-500">Free delivery within 3-5 business days</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <RadioGroupItem value="collect" id="collect" />
                        <Label htmlFor="collect" className="flex-1 cursor-pointer">
                          <p className="font-medium">Collect from store</p>
                          <p className="text-sm text-gray-500">Ready within 24 hours</p>
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    {formData.deliveryType === 'delivery' && (
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Street Address *</Label>
                          <Input
                            value={formData.streetAddress}
                            onChange={(e) => handleChange('streetAddress', e.target.value)}
                            placeholder="123 Main Street"
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Suburb</Label>
                            <Input
                              value={formData.suburb}
                              onChange={(e) => handleChange('suburb', e.target.value)}
                              placeholder="Sandton"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>City *</Label>
                            <Input
                              value={formData.city}
                              onChange={(e) => handleChange('city', e.target.value)}
                              placeholder="Johannesburg"
                            />
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Province *</Label>
                            <Select
                              value={formData.province}
                              onValueChange={(v) => handleChange('province', v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select province" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gauteng">Gauteng</SelectItem>
                                <SelectItem value="western_cape">Western Cape</SelectItem>
                                <SelectItem value="kwazulu_natal">KwaZulu-Natal</SelectItem>
                                <SelectItem value="eastern_cape">Eastern Cape</SelectItem>
                                <SelectItem value="free_state">Free State</SelectItem>
                                <SelectItem value="limpopo">Limpopo</SelectItem>
                                <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
                                <SelectItem value="north_west">North West</SelectItem>
                                <SelectItem value="northern_cape">Northern Cape</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Postal Code *</Label>
                            <Input
                              value={formData.postalCode}
                              onChange={(e) => handleChange('postalCode', e.target.value)}
                              placeholder="2196"
                              maxLength={4}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Number Porting */}
                    <div className="pt-4 border-t space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="portNumber"
                          checked={formData.portNumber}
                          onCheckedChange={(v) => handleChange('portNumber', v)}
                        />
                        <Label htmlFor="portNumber" className="cursor-pointer">
                          I want to port my existing number
                        </Label>
                      </div>
                      
                      {formData.portNumber && (
                        <div className="space-y-2 pl-6">
                          <Label>Existing Number</Label>
                          <Input
                            value={formData.existingNumber}
                            onChange={(e) => handleChange('existingNumber', e.target.value)}
                            placeholder="082 123 4567"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Step 3: Review */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Order Summary */}
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Deal</h4>
                        <p className="text-lg font-semibold">{deal.has_device ? deal.device_name : deal.price_plan}</p>
                        <p className="text-gray-500">{deal.contract_term_label} contract</p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Customer</h4>
                        <p>{formData.firstName} {formData.lastName}</p>
                        <p className="text-gray-500">{formData.email}</p>
                        {customerType === 'business' && (
                          <p className="text-gray-500">{formData.companyName}</p>
                        )}
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Delivery</h4>
                        {formData.deliveryType === 'delivery' ? (
                          <p className="text-gray-500">
                            {formData.streetAddress}, {formData.suburb}, {formData.city}, {formData.postalCode}
                          </p>
                        ) : (
                          <p className="text-gray-500">Collect from store</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Terms */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="acceptTerms"
                          checked={formData.acceptTerms}
                          onCheckedChange={(v) => handleChange('acceptTerms', v)}
                        />
                        <Label htmlFor="acceptTerms" className="cursor-pointer text-sm">
                          I accept the Terms and Conditions and understand this is a {deal.contract_term_label} contract
                        </Label>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="acceptRica"
                          checked={formData.acceptRica}
                          onCheckedChange={(v) => handleChange('acceptRica', v)}
                        />
                        <Label htmlFor="acceptRica" className="cursor-pointer text-sm">
                          I consent to RICA registration and confirm my ID details are correct
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                
                {currentStep < STEPS.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!validateStep()}
                    className="bg-circleTel-orange hover:bg-orange-600"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!validateStep() || submitting}
                    className="bg-circleTel-orange hover:bg-orange-600"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    {deal.has_device ? (
                      <Smartphone className="h-8 w-8 text-gray-400" />
                    ) : (
                      <SimCard className="h-8 w-8 text-circleTel-orange" />
                    )}
                    <div>
                      <p className="font-medium text-sm line-clamp-2">
                        {deal.has_device ? deal.device_name : deal.price_plan}
                      </p>
                      <p className="text-xs text-gray-500">{deal.technology} • {deal.contract_term_label}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monthly</span>
                      <span>{formatCurrency(deal.selling_price_incl_vat)}</span>
                    </div>
                    {deal.once_off_pay_in_incl_vat > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Once-off</span>
                        <span>{formatCurrency(deal.once_off_pay_in_incl_vat)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Delivery</span>
                      <span className="text-green-600">Free</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold">
                      <span>Due Today</span>
                      <span className="text-circleTel-orange">
                        {formatCurrency(deal.once_off_pay_in_incl_vat || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Then {formatCurrency(deal.selling_price_incl_vat)}/month
                    </p>
                  </div>
                  
                  {/* Trust Badges */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>3-5 day delivery</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default function MTNDealOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    }>
      <MTNDealOrderContent />
    </Suspense>
  );
}
