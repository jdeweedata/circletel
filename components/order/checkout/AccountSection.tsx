'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneOTPSection } from './PhoneOTPSection';

type AuthMode = 'signin' | 'signup';

interface PhoneSignupSession {
  access_token: string;
  refresh_token: string;
}

interface PhoneSignupResult {
  session: PhoneSignupSession;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  isExistingUser: boolean;
}

interface AccountSectionProps {
  isSubmitting: boolean;
  onGoogleSignIn: () => Promise<void>;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<void>;
  onPhoneSignupComplete: (result: PhoneSignupResult) => void;
  onPhoneSignupError: (message: string) => void;
  signInError?: string;
}

export function AccountSection({
  isSubmitting,
  onGoogleSignIn,
  onSignIn,
  onSignUp,
  onPhoneSignupComplete,
  onPhoneSignupError,
  signInError,
}: AccountSectionProps) {
  const [mode, setMode] = useState<AuthMode>('signin');

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInLocalError, setSignInLocalError] = useState<string | undefined>();

  // Sign up state (email tab)
  const [signUpTab, setSignUpTab] = useState<'phone' | 'email'>('phone');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signUpError, setSignUpError] = useState<string | undefined>();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) return;
    setIsSigningIn(true);
    setSignInLocalError(undefined);
    try {
      await onSignIn(signInEmail, signInPassword);
    } catch (err) {
      setSignInLocalError(err instanceof Error ? err.message : 'Sign in failed. Please check your credentials.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !signUpFirstName || !signUpLastName || !signUpPhone) return;
    setIsSigningUp(true);
    setSignUpError(undefined);
    try {
      await onSignUp(signUpEmail, signUpPassword, signUpFirstName, signUpLastName, signUpPhone);
    } catch (err) {
      setSignUpError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const googleButton = (
    <button
      type="button"
      onClick={onGoogleSignIn}
      disabled={isSubmitting || isSigningIn || isSigningUp}
      className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  );

  const divider = (label: string) => (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-100" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-3 bg-white text-gray-400">{label}</span>
      </div>
    </div>
  );

  if (mode === 'signin') {
    return (
      <div>
        <p className="text-sm font-bold text-circleTel-navy mb-5">Sign in to your account</p>

        {googleButton}

        {divider('or sign in with')}

        {/* Email + password login */}
        <form onSubmit={handleSignIn} className="space-y-3">
          <div>
            <Label htmlFor="signInEmail" className="text-xs font-semibold text-circleTel-navy">Email</Label>
            <Input
              id="signInEmail"
              type="email"
              placeholder="jane@example.com"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              className="mt-1 h-10 text-sm"
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="signInPassword" className="text-xs font-semibold text-circleTel-navy">Password</Label>
            <div className="relative mt-1">
              <Input
                id="signInPassword"
                type={showSignInPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                className="h-10 text-sm pr-14"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowSignInPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {showSignInPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex justify-end mt-1">
              <a href="/auth/forgot-password" className="text-xs text-circleTel-orange hover:underline">
                Forgot password?
              </a>
            </div>
          </div>

          {(signInLocalError || signInError) && (
            <p className="text-red-500 text-xs">{signInLocalError || signInError}</p>
          )}

          <button
            type="submit"
            disabled={isSigningIn || !signInEmail || !signInPassword}
            className="w-full bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-bold rounded-xl px-4 py-3 text-sm shadow transition-all"
          >
            {isSigningIn ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {divider('or sign in with')}

        {/* Phone OTP */}
        <PhoneOTPSection
          isSubmitting={isSubmitting || isSigningIn}
          onSignupComplete={onPhoneSignupComplete}
          onError={onPhoneSignupError}
        />

        <p className="text-center text-xs text-gray-500 mt-5">
          New customer?{' '}
          <button
            type="button"
            onClick={() => setMode('signup')}
            className="text-circleTel-orange font-semibold hover:underline"
          >
            Create account
          </button>
        </p>
      </div>
    );
  }

  // Signup mode
  return (
    <div>
      <p className="text-sm font-bold text-circleTel-navy mb-5">Create your account</p>

      {googleButton}

      {divider('or sign up with')}

      {/* Tab toggle */}
      <div className="flex rounded-xl border border-gray-200 p-1 mb-5 bg-gray-50">
        {(['phone', 'email'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSignUpTab(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              signUpTab === tab
                ? 'bg-white text-circleTel-navy shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'phone' ? 'Phone (OTP)' : 'Email'}
          </button>
        ))}
      </div>

      {signUpTab === 'phone' && (
        <PhoneOTPSection
          isSubmitting={isSubmitting || isSigningUp}
          onSignupComplete={onPhoneSignupComplete}
          onError={onPhoneSignupError}
        />
      )}

      {signUpTab === 'email' && (
        <form onSubmit={handleSignUp} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="signUpFirstName" className="text-xs font-semibold text-circleTel-navy">First name</Label>
              <Input
                id="signUpFirstName"
                placeholder="Jane"
                value={signUpFirstName}
                onChange={(e) => setSignUpFirstName(e.target.value)}
                className="mt-1 h-10 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="signUpLastName" className="text-xs font-semibold text-circleTel-navy">Last name</Label>
              <Input
                id="signUpLastName"
                placeholder="Smith"
                value={signUpLastName}
                onChange={(e) => setSignUpLastName(e.target.value)}
                className="mt-1 h-10 text-sm"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="signUpEmail" className="text-xs font-semibold text-circleTel-navy">Email</Label>
            <Input
              id="signUpEmail"
              type="email"
              placeholder="jane@example.com"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              className="mt-1 h-10 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="signUpPassword" className="text-xs font-semibold text-circleTel-navy">Password</Label>
            <div className="relative mt-1">
              <Input
                id="signUpPassword"
                type={showSignUpPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                className="h-10 text-sm pr-14"
              />
              <button
                type="button"
                onClick={() => setShowSignUpPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {showSignUpPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="signUpPhone" className="text-xs font-semibold text-circleTel-navy">Phone number</Label>
            <Input
              id="signUpPhone"
              type="tel"
              placeholder="0821234567"
              value={signUpPhone}
              onChange={(e) => setSignUpPhone(e.target.value)}
              className="mt-1 h-10 text-sm"
            />
          </div>

          {signUpError && <p className="text-red-500 text-xs">{signUpError}</p>}

          <button
            type="submit"
            disabled={isSigningUp || !signUpEmail || !signUpPassword || !signUpFirstName || !signUpLastName || !signUpPhone}
            className="w-full bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-bold rounded-xl px-4 py-3 text-sm shadow transition-all"
          >
            {isSigningUp ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-gray-500 mt-5">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => setMode('signin')}
          className="text-circleTel-orange font-semibold hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
