'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Shield, 
  CheckCircle2, 
  ArrowLeft,
  Info,
  PhoneCall
} from 'lucide-react';

// Form validation schema
const accountFormSchema = z.object({
  accountType: z.enum(['personal', 'business'], {
    required_error: 'Please select an account type',
  }),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface CreateAccountPageProps {
  selectedPackage: {
    name: string;
    price: number;
    originalPrice: number;
    features: string[];
    downloadSpeed: string;
  };
}

export default function CreateAccountPage({ selectedPackage }: CreateAccountPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountType: 'personal',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
    },
  });

  async function onSubmit(data: AccountFormValues) {
    setIsLoading(true);
    try {
      // API call would go here
      console.log(data);
      // router.push('/verification');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Progress Steps */}
      <div className="bg-orange-500 text-white shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <StepIndicator step={1} label="Check Coverage" completed />
            <StepIndicator step={2} label="Choose Package" completed />
            <StepIndicator step={3} label="Create Account" active />
            <StepIndicator step={4} label="Verification" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Packages
        </Button>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Main Form - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardHeader className="space-y-1 bg-gradient-to-r from-orange-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Create Your Account</CardTitle>
                    <CardDescription className="text-base">
                      Just a few details to get you started with CircleTel
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <Alert className="mb-6 border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    This information helps us create your account, schedule installation, 
                    and send you important updates about your service.
                  </AlertDescription>
                </Alert>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Account Type */}
                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Account Type
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <RadioGroupItem
                                      value="personal"
                                      id="personal"
                                      className="peer sr-only"
                                    />
                                    <label
                                      htmlFor="personal"
                                      className="flex items-center justify-between rounded-lg border-2 border-gray-200 p-4 hover:border-orange-300 peer-checked:border-orange-500 peer-checked:bg-orange-50 cursor-pointer transition-all"
                                    >
                                      <div>
                                        <div className="font-semibold">Personal Account</div>
                                        <div className="text-sm text-gray-600">
                                          For home and personal use
                                        </div>
                                      </div>
                                    </label>
                                  </div>
                                </FormControl>
                              </FormItem>
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <RadioGroupItem
                                      value="business"
                                      id="business"
                                      className="peer sr-only"
                                    />
                                    <label
                                      htmlFor="business"
                                      className="flex items-center justify-between rounded-lg border-2 border-gray-200 p-4 hover:border-orange-300 peer-checked:border-orange-500 peer-checked:bg-orange-50 cursor-pointer transition-all"
                                    >
                                      <div>
                                        <div className="font-semibold">Business Account</div>
                                        <div className="text-sm text-gray-600">
                                          For business use
                                        </div>
                                      </div>
                                    </label>
                                  </div>
                                </FormControl>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Personal Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-orange-500" />
                        Personal Details
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Jeffrey" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="De Wee" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5 text-orange-500" />
                        Contact Information
                      </h3>
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="jeffrey@innergroup.co.za" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Order confirmations and updates will be sent here
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="0737288616" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              We'll contact you to schedule installation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Password */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Lock className="h-5 w-5 text-orange-500" />
                        Security
                      </h3>
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Must be at least 8 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Re-enter your password to confirm
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Alert className="border-green-200 bg-green-50">
                      <Shield className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-900">
                        <strong>Your information is secure.</strong> We use industry-standard 
                        encryption to protect your personal data. Your details will never be 
                        shared with third parties without your consent.
                      </AlertDescription>
                    </Alert>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => router.back()}
                      >
                        Back to Packages
                      </Button>
                      <Button
                        type="submit"
                        className="w-full sm:flex-1 bg-orange-500 hover:bg-orange-600"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating Account...' : 'Continue to Verification'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Security Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <SecurityBadge icon={<CheckCircle2 className="h-5 w-5" />} text="Secure Checkout" />
              <SecurityBadge icon={<Shield className="h-5 w-5" />} text="Data Protected" />
              <SecurityBadge icon={<Lock className="h-5 w-5" />} text="No Hidden Fees" />
              <SecurityBadge icon={<PhoneCall className="h-5 w-5" />} text="24/7 Support" />
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <CardTitle className="flex items-center justify-between">
                    Order Summary
                    <Badge variant="secondary" className="bg-white text-orange-600">
                      Selected
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Package Name */}
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      Selected Package
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedPackage.name}
                    </h3>
                  </div>

                  {/* Speed */}
                  <div className="flex items-center justify-between py-3 border-y">
                    <span className="text-gray-600">Download Speed</span>
                    <span className="font-semibold">{selectedPackage.downloadSpeed}</span>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-gray-600">Regular Price</span>
                      <span className="text-gray-400 line-through">
                        R{selectedPackage.originalPrice}/mo
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-semibold">Promotional Price</span>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-orange-500">
                          R{selectedPackage.price}
                        </div>
                        <div className="text-xs text-gray-500">per month for 3 months</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* What's Included */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900">What's Included</h4>
                    <ul className="space-y-2">
                      {selectedPackage.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* Help Section */}
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-blue-900 font-semibold">
                      <PhoneCall className="h-5 w-5" />
                      Need help?
                    </div>
                    <p className="text-sm text-blue-800">
                      Our team is here to assist!
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full border-blue-300 hover:bg-blue-100"
                      asChild
                    >
                      <a href="tel:0800123456">
                        <Phone className="mr-2 h-4 w-4" />
                        0800 123 456
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Supporting Components
function StepIndicator({ 
  step, 
  label, 
  active = false, 
  completed = false 
}: { 
  step: number; 
  label: string; 
  active?: boolean; 
  completed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
          ${completed ? 'bg-white text-orange-500' : ''}
          ${active ? 'bg-white text-orange-500 ring-2 ring-white ring-offset-2 ring-offset-orange-500' : ''}
          ${!active && !completed ? 'bg-orange-400 text-white' : ''}
        `}
      >
        {completed ? <CheckCircle2 className="h-5 w-5" /> : step}
      </div>
      <span className={`text-sm font-medium hidden sm:inline ${active ? 'text-white' : 'text-orange-100'}`}>
        {label}
      </span>
    </div>
  );
}

function SecurityBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white border rounded-lg hover:border-orange-200 hover:shadow-sm transition-all">
      <div className="text-green-600 mb-1">{icon}</div>
      <div className="text-xs text-center text-gray-700 font-medium">{text}</div>
    </div>
  );
}
