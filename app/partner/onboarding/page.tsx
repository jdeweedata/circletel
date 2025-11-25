'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Loader2, Building2, User, MapPin, Check, 
  ArrowRight, ArrowLeft, Shield, Sparkles
} from 'lucide-react';

// Combined schema (Banking details collected later by admin)
const partnerRegistrationSchema = z.object({
  contactPerson: z.string().min(2, 'Your name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.enum(['individual', 'sole_proprietor', 'company', 'partnership']),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  streetAddress: z.string().min(5, 'Street address is required'),
  suburb: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
});

type FormData = z.infer<typeof partnerRegistrationSchema>;

const steps = [
  { id: 1, title: 'Your Details', icon: User },
  { id: 2, title: 'Business', icon: Building2 },
  { id: 3, title: 'Address', icon: MapPin },
  { id: 4, title: 'Review', icon: Check },
];

export default function PartnerOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, watch, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(partnerRegistrationSchema),
    defaultValues: {
      contactPerson: '',
      email: '',
      phone: '',
      businessName: '',
      businessType: undefined,
      registrationNumber: '',
      vatNumber: '',
      streetAddress: '',
      suburb: '',
      city: '',
      province: '',
      postalCode: '',
      agreeToTerms: false,
    },
    mode: 'onChange',
  });

  const formValues = watch();

  const validateStep = async (step: number): Promise<boolean> => {
    const fields: Record<number, (keyof FormData)[]> = {
      1: ['contactPerson', 'email', 'phone'],
      2: ['businessName', 'businessType'],
      3: ['streetAddress', 'city', 'province', 'postalCode'],
    };
    return fields[step] ? await trigger(fields[step]) : true;
  };

  const nextStep = async () => {
    if (await validateStep(currentStep) && currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/partners/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to submit registration');
        return;
      }
      toast.success('Registration submitted successfully!');
      router.push('/partner/onboarding/verify');
    } catch {
      toast.error('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 bg-circleTel-lightNeutral py-8">
        <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-circleTel-darkNeutral mb-2">
              Partner Registration
            </h1>
            <p className="text-circleTel-secondaryNeutral">
              Join the CircleTel Partner Programme and start earning commissions
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8 bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isActive ? 'bg-circleTel-orange text-white' :
                        'bg-white text-circleTel-secondaryNeutral border-2 border-gray-200'
                      }`}>
                        {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className={`text-xs mt-2 font-medium hidden sm:block ${
                        isCompleted ? 'text-green-600' :
                        isActive ? 'text-circleTel-orange' : 
                        'text-circleTel-secondaryNeutral'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 rounded ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 1: Your Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-circleTel-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-circleTel-orange" />
                      </div>
                      <h2 className="text-2xl font-bold text-circleTel-darkNeutral">Let's get to know you</h2>
                      <p className="text-circleTel-secondaryNeutral mt-2">We'll use this to set up your partner account</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Full Name *</Label>
                        <Controller name="contactPerson" control={control} render={({ field }) => (
                          <Input {...field} placeholder="e.g. Thabo Molefe" className="h-12 mt-1" />
                        )} />
                        {errors.contactPerson && <p className="text-xs text-red-600 mt-1">{errors.contactPerson.message}</p>}
                      </div>
                      <div>
                        <Label>Email Address *</Label>
                        <Controller name="email" control={control} render={({ field }) => (
                          <Input {...field} type="email" placeholder="e.g. thabo@email.com" className="h-12 mt-1" />
                        )} />
                        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                      </div>
                      <div>
                        <Label>Phone Number *</Label>
                        <Controller name="phone" control={control} render={({ field }) => (
                          <Input {...field} type="tel" placeholder="e.g. 082 123 4567" className="h-12 mt-1" />
                        )} />
                        {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Business */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-circleTel-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-circleTel-orange" />
                      </div>
                      <h2 className="text-2xl font-bold text-circleTel-darkNeutral">Business Information</h2>
                      <p className="text-circleTel-secondaryNeutral mt-2">Select Individual if you don't have a registered business</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Business Type *</Label>
                        <Controller name="businessType" control={control} render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-12 mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual (No Business)</SelectItem>
                              <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                              <SelectItem value="company">Company (PTY LTD)</SelectItem>
                              <SelectItem value="partnership">Partnership</SelectItem>
                            </SelectContent>
                          </Select>
                        )} />
                        {errors.businessType && <p className="text-xs text-red-600 mt-1">{errors.businessType.message}</p>}
                      </div>
                      <div>
                        <Label>Business / Trading Name *</Label>
                        <Controller name="businessName" control={control} render={({ field }) => (
                          <Input {...field} placeholder="e.g. Thabo Sales or your full name" className="h-12 mt-1" />
                        )} />
                        {errors.businessName && <p className="text-xs text-red-600 mt-1">{errors.businessName.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Registration Number</Label>
                          <Controller name="registrationNumber" control={control} render={({ field }) => (
                            <Input {...field} placeholder="Optional" className="h-12 mt-1" />
                          )} />
                        </div>
                        <div>
                          <Label>VAT Number</Label>
                          <Controller name="vatNumber" control={control} render={({ field }) => (
                            <Input {...field} placeholder="Optional" className="h-12 mt-1" />
                          )} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Address */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-circleTel-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-circleTel-orange" />
                      </div>
                      <h2 className="text-2xl font-bold text-circleTel-darkNeutral">Where are you based?</h2>
                      <p className="text-circleTel-secondaryNeutral mt-2">Your address for correspondence</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Street Address *</Label>
                        <Controller name="streetAddress" control={control} render={({ field }) => (
                          <Input {...field} placeholder="e.g. 123 Main Road" className="h-12 mt-1" />
                        )} />
                        {errors.streetAddress && <p className="text-xs text-red-600 mt-1">{errors.streetAddress.message}</p>}
                      </div>
                      <div>
                        <Label>Suburb</Label>
                        <Controller name="suburb" control={control} render={({ field }) => (
                          <Input {...field} placeholder="Optional" className="h-12 mt-1" />
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>City *</Label>
                          <Controller name="city" control={control} render={({ field }) => (
                            <Input {...field} placeholder="e.g. Johannesburg" className="h-12 mt-1" />
                          )} />
                          {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>}
                        </div>
                        <div>
                          <Label>Province *</Label>
                          <Controller name="province" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-12 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'].map(p => (
                                  <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )} />
                          {errors.province && <p className="text-xs text-red-600 mt-1">{errors.province.message}</p>}
                        </div>
                      </div>
                      <div className="w-32">
                        <Label>Postal Code *</Label>
                        <Controller name="postalCode" control={control} render={({ field }) => (
                          <Input {...field} placeholder="e.g. 2196" className="h-12 mt-1" />
                        )} />
                        {errors.postalCode && <p className="text-xs text-red-600 mt-1">{errors.postalCode.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-circleTel-darkNeutral">Almost there!</h2>
                      <p className="text-circleTel-secondaryNeutral mt-2">Review your details and submit</p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-circleTel-darkNeutral mb-2">Personal Details</h3>
                        <div className="text-sm text-circleTel-secondaryNeutral space-y-1">
                          <p><span className="font-medium">Name:</span> {formValues.contactPerson}</p>
                          <p><span className="font-medium">Email:</span> {formValues.email}</p>
                          <p><span className="font-medium">Phone:</span> {formValues.phone}</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-circleTel-darkNeutral mb-2">Business</h3>
                        <div className="text-sm text-circleTel-secondaryNeutral space-y-1">
                          <p><span className="font-medium">Name:</span> {formValues.businessName}</p>
                          <p><span className="font-medium">Type:</span> {formValues.businessType}</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-circleTel-darkNeutral mb-2">Address</h3>
                        <div className="text-sm text-circleTel-secondaryNeutral">
                          <p>{formValues.streetAddress}{formValues.suburb ? `, ${formValues.suburb}` : ''}</p>
                          <p>{formValues.city}, {formValues.province}, {formValues.postalCode}</p>
                        </div>
                      </div>
                    </div>

                    {/* Note about banking */}
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-blue-700">Banking details for commission payments will be collected during your onboarding call with our partner team.</span>
                    </div>

                    <div className="flex items-start gap-3 pt-4">
                      <Controller name="agreeToTerms" control={control} render={({ field }) => (
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} id="terms" />
                      )} />
                      <label htmlFor="terms" className="text-sm text-circleTel-secondaryNeutral">
                        I agree to the <Link href="/terms" className="text-circleTel-orange hover:underline">Terms & Conditions</Link> and <Link href="/privacy" className="text-circleTel-orange hover:underline">Privacy Policy</Link>
                      </label>
                    </div>
                    {errors.agreeToTerms && <p className="text-xs text-red-600">{errors.agreeToTerms.message}</p>}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                  {currentStep < 4 ? (
                    <Button type="button" onClick={nextStep} className="bg-circleTel-orange hover:bg-circleTel-orange/90 gap-2">
                      Continue <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="bg-circleTel-orange hover:bg-circleTel-orange/90 gap-2 min-w-[180px]">
                      {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>Submit Application <Check className="w-4 h-4" /></>}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Trust indicators */}
          <div className="flex justify-center gap-8 mt-8 text-circleTel-secondaryNeutral text-sm">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-600" /> Secure & Encrypted</div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> POPIA Compliant</div>
          </div>
        </div>
      </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
