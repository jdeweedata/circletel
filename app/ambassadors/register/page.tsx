'use client';
import { PiCheckCircleBold, PiCurrencyDollarBold, PiMegaphoneBold, PiSpinnerBold, PiUsersBold, PiWarningCircleBold } from 'react-icons/pi';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const socialPlatforms = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'other', label: 'Other' },
];

export default function AmbassadorRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    socialPlatform: '',
    socialHandle: '',
    websiteUrl: '',
    audienceSize: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError(null);
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.fullName) {
      setError('Please enter your name');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    setError(null);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_type: 'ambassador',
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      // Create ambassador record
      const { error: ambassadorError } = await supabase
        .from('ambassadors')
        .insert({
          user_id: authData.user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          social_platform: formData.socialPlatform || null,
          social_handle: formData.socialHandle || null,
          website_url: formData.websiteUrl || null,
          audience_size: formData.audienceSize
            ? parseInt(formData.audienceSize)
            : null,
          status: 'pending',
        });

      if (ambassadorError) {
        console.error('Ambassador record error:', ambassadorError);
        // Don't throw - user is created, just show partial success
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message?.includes('already registered')) {
        setError('An account with this email already exists. Please log in instead.');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PiCheckCircleBold className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Application Submitted!
            </h1>
            <p className="text-gray-500 mb-6">
              Thanks for applying to become a CircleTel Ambassador! We&apos;ll
              review your application and get back to you within 1-2 business
              days.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Check your email for a confirmation link to verify your account.
            </p>
            <Link href="/ambassadors/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold text-circleTel-orange">
              CircleTel
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Become an Ambassador
          </h1>
          <p className="text-gray-500 mt-2 max-w-lg mx-auto">
            Earn money by promoting South Africa&apos;s fastest-growing ISP.
            Share your unique link and earn up to 15% commission on every sale.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 text-center border">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <PiCurrencyDollarBold className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Earn Commission</h3>
            <p className="text-sm text-gray-500 mt-1">
              5-15% on every sale you refer
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center border">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <PiMegaphoneBold className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Marketing Support</h3>
            <p className="text-sm text-gray-500 mt-1">
              Access branded assets & content
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center border">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <PiUsersBold className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Tier Up</h3>
            <p className="text-sm text-gray-500 mt-1">
              More sales = higher commission rates
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? 'text-circleTel-orange' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1
                    ? 'bg-circleTel-orange text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                1
              </div>
              <span className="hidden sm:inline font-medium">Account</span>
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? 'text-circleTel-orange' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2
                    ? 'bg-circleTel-orange text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                2
              </div>
              <span className="hidden sm:inline font-medium">Profile</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <PiWarningCircleBold className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleChange('confirmPassword', e.target.value)
                  }
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <Button
                className="w-full"
                onClick={() => validateStep1() && setStep(2)}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+27 12 345 6789"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="socialPlatform">Primary Platform</Label>
                  <Select
                    value={formData.socialPlatform}
                    onValueChange={(value) =>
                      handleChange('socialPlatform', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {socialPlatforms.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="socialHandle">Handle / Username</Label>
                  <Input
                    id="socialHandle"
                    value={formData.socialHandle}
                    onChange={(e) =>
                      handleChange('socialHandle', e.target.value)
                    }
                    placeholder="@yourhandle"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="websiteUrl">Website (Optional)</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => handleChange('websiteUrl', e.target.value)}
                    placeholder="https://yoursite.com"
                  />
                </div>

                <div>
                  <Label htmlFor="audienceSize">Estimated Audience Size</Label>
                  <Input
                    id="audienceSize"
                    type="number"
                    value={formData.audienceSize}
                    onChange={(e) =>
                      handleChange('audienceSize', e.target.value)
                    }
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <PiSpinnerBold className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Already have an account?</span>{' '}
            <Link
              href="/ambassadors/login"
              className="text-circleTel-orange hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
