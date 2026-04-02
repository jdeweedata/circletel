'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const accountSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z
    .string()
    .regex(/^[0-9+\s()-]{10,}$/, 'Please enter a valid phone number'),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms & Conditions' }),
  }),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountSectionProps {
  onSubmit: (values: AccountFormValues) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  isSubmitting: boolean;
}

export function AccountSection({ onSubmit, onGoogleSignIn, isSubmitting }: AccountSectionProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
  });

  const termsAccepted = watch('termsAccepted');

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create your account</h2>

      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full mb-4"
        onClick={onGoogleSignIn}
        disabled={isSubmitting}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </Button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-400">Or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" placeholder="John" {...register('firstName')} />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" placeholder="Doe" {...register('lastName')} />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" {...register('email')} />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" type="tel" placeholder="0821234567" {...register('phone')} />
          <p className="text-xs text-gray-400 mt-1">
            We&apos;ll ask you to verify this after your order is placed.
          </p>
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="termsAccepted"
            checked={termsAccepted === true}
            onCheckedChange={(checked) =>
              setValue('termsAccepted', checked === true ? true : (undefined as unknown as true))
            }
          />
          <label htmlFor="termsAccepted" className="text-xs text-gray-600 leading-relaxed">
            I accept the{' '}
            <a href="/terms-of-service" target="_blank" className="text-orange-500 underline">
              Terms &amp; Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy-policy" target="_blank" className="text-orange-500 underline">
              Privacy Policy
            </a>
          </label>
        </div>
        {errors.termsAccepted && (
          <p className="text-red-500 text-xs">{errors.termsAccepted.message}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account...' : 'Continue to Payment →'}
        </Button>
      </form>
    </div>
  );
}
