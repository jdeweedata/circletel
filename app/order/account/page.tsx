'use client';

import React from 'react';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { OrderWizard } from '@/components/order/wizard/OrderWizard';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Phone, Building } from 'lucide-react';

// Form validation schema
const accountSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number').regex(/^[0-9+\s()-]+$/, 'Please enter a valid phone number'),
  accountType: z.enum(['personal', 'business'], {
    required_error: 'Please select an account type',
  }),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export default function AccountPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Set current stage to 2 when this page loads
  React.useEffect(() => {
    if (state.currentStage !== 2) {
      actions.setCurrentStage(2);
    }
  }, [state.currentStage, actions]);

  // Initialize form with existing data from OrderContext
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: state.orderData.account?.email || '',
      firstName: state.orderData.account?.firstName || '',
      lastName: state.orderData.account?.lastName || '',
      phone: state.orderData.account?.phone || '',
      accountType: state.orderData.account?.accountType || 'personal',
    },
  });

  const onSubmit = async (data: AccountFormValues) => {
    setIsSubmitting(true);

    try {
      // Save customer to database
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save customer');
      }

      // Save account data to OrderContext (including customer ID)
      actions.updateOrderData({
        account: {
          ...data,
          isAuthenticated: false,
        },
      });

      // Store customer ID for order creation
      if (result.customer?.id) {
        actions.updateOrderData({
          payment: {
            ...state.orderData.payment,
            customerId: result.customer.id,
          } as any,
        });
      }

      // Mark step 2 as complete
      actions.markStepComplete(2);

      // Move to next stage
      actions.setCurrentStage(3);

      // Navigate to contact page
      router.push('/order/contact');
    } catch (error) {
      console.error('Error saving account data:', error);
      actions.setErrors({
        account: ['Failed to save account information. Please try again.'],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Account Setup
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Create your account to continue with your order
        </p>
      </div>

      <OrderWizard
        onStageComplete={(stage) => {
          if (stage === 2) {
            router.push('/order/contact');
          }
        }}
        onOrderComplete={() => {
          router.push('/order/confirmation');
        }}
      >
        <div className="py-8">
          <Tabs defaultValue="new-account" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="new-account">Create Account</TabsTrigger>
              <TabsTrigger value="existing-account" disabled>
                Sign In
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new-account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    We'll use this information to create your account and send order updates.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Account Type Selection */}
                      <FormField
                        control={form.control}
                        name="accountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Account Type
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="personal">Personal Account</SelectItem>
                                <SelectItem value="business">Business Account</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose whether this is for personal or business use
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* First Name */}
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              First Name
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Last Name */}
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Last Name
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="john.doe@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              We'll send order confirmations and updates to this email
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Phone Number */}
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Phone Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="0821234567"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              We'll contact you for installation scheduling
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Form Actions */}
                      <div className="flex justify-between pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBack}
                          disabled={isSubmitting}
                        >
                          Back
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : 'Continue'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="existing-account">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Sign in to your existing CircleTel account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      🚧 Sign in functionality coming soon
                    </p>
                    <p className="text-sm text-gray-500">
                      For now, please use the "Create Account" tab to continue
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </OrderWizard>
    </div>
  );
}
