'use client';

import { PiEyeBold, PiEyeSlashBold } from 'react-icons/pi';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { clearSupabaseSession, createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  ModernistLoginShell,
  type AccountLane,
} from '@/components/auth/ModernistLoginShell';

const emailLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const otpLoginSchema = z.object({
  phone: z
    .string()
    .min(10, 'Please enter a valid phone number')
    .regex(/^[0-9+\s()-]+$/, 'Please enter a valid phone number'),
});

type EmailLoginFormValues = z.infer<typeof emailLoginSchema>;
type OtpLoginFormValues = z.infer<typeof otpLoginSchema>;
type LoginMethod = 'password' | 'otp';

const PERSONAL_REDIRECTS = [
  '/dashboard',
  '/order/checkout',
  '/packages',
  '/partners',
];

function parseAccount(raw: string | null): AccountLane {
  return raw === 'business' ? 'business' : 'personal';
}

function safePersonalRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard';
  if (PERSONAL_REDIRECTS.some((p) => raw.startsWith(p))) return raw;
  return '/dashboard';
}

function safeBusinessRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/portal';
  if (raw.startsWith('/portal')) return raw;
  return '/portal';
}

async function assertPortalAccess(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('b2b_portal_users')
    .select('id')
    .eq('auth_user_id', userId)
    .maybeSingle();
  return Boolean(data);
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle } = useCustomerAuth();

  const [account, setAccount] = React.useState<AccountLane>(() =>
    parseAccount(searchParams.get('account'))
  );
  const [method, setMethod] = React.useState<LoginMethod>('password');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [keepSignedIn, setKeepSignedIn] = React.useState(true);
  const [formError, setFormError] = React.useState<string | null>(null);

  const redirectParam = searchParams.get('redirect');
  const personalRedirect = safePersonalRedirect(redirectParam);
  const businessRedirect = safeBusinessRedirect(redirectParam);

  React.useEffect(() => {
    const next = parseAccount(searchParams.get('account'));
    setAccount(next);
  }, [searchParams]);

  React.useEffect(() => {
    const checkExistingSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      if (account === 'business') {
        const ok = await assertPortalAccess(session.user.id);
        if (ok) {
          router.replace(businessRedirect);
          return;
        }
        await supabase.auth.signOut();
        setFormError(
          'No business portal access for this account. Ask your Super User to invite you, or request business access.'
        );
        return;
      }

      router.replace(personalRedirect);
    };
    checkExistingSession();
  }, [router, account, personalRedirect, businessRedirect]);

  React.useEffect(() => {
    const authError =
      searchParams.get('error') || searchParams.get('auth_error');
    if (authError) {
      clearSupabaseSession();
      if (authError === 'no_portal_access') {
        setFormError(
          'No portal access found for this account. Please contact your administrator.'
        );
      }
    }
  }, [searchParams]);

  const emailForm = useForm<EmailLoginFormValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const otpForm = useForm<OtpLoginFormValues>({
    resolver: zodResolver(otpLoginSchema),
    defaultValues: { phone: '' },
  });

  function switchAccount(next: AccountLane) {
    setAccount(next);
    setFormError(null);
    setMethod('password');
    const url = new URL(window.location.href);
    if (next === 'business') url.searchParams.set('account', 'business');
    else url.searchParams.delete('account');
    window.history.replaceState({}, '', url.toString());
  }

  const onEmailSubmit = async (data: EmailLoginFormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await signIn(data.email, data.password);
      if (result.error) {
        setFormError(result.error);
        toast.error(result.error);
        return;
      }

      if (account === 'business') {
        const userId = result.user?.id;
        if (!userId || !(await assertPortalAccess(userId))) {
          const supabase = createClient();
          await supabase.auth.signOut();
          const msg =
            'No business portal access for this account. Ask your Super User to invite you.';
          setFormError(msg);
          toast.error(msg);
          return;
        }
        toast.success('Welcome back');
        await new Promise((r) => setTimeout(r, 300));
        router.push(businessRedirect);
        router.refresh();
        return;
      }

      toast.success('Welcome back!');
      await new Promise((r) => setTimeout(r, 300));
      router.push(personalRedirect);
      router.refresh();
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOtpSubmit = async (data: OtpLoginFormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const otpResponse = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone }),
      });
      const otpResult = await otpResponse.json();

      if (!otpResult.success) {
        toast.error('Failed to send verification code. Please try again.');
        return;
      }

      toast.success('Verification code sent to your phone!');
      const dest =
        account === 'business' ? businessRedirect : personalRedirect;
      const params = new URLSearchParams({
        phone: data.phone,
        redirect: dest,
        account,
      });
      router.push(`/auth/verify-otp?${params.toString()}`);
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (account === 'business') return;
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle({ redirectTo: personalRedirect });
      if (result.error) {
        toast.error(result.error);
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  const emailLabel = account === 'business' ? 'Work email' : 'Email';
  const emailPlaceholder =
    account === 'business' ? 'you@company.co.za' : 'you@example.co.za';
  const passwordHint =
    account === 'business'
      ? 'Use the address your account admin invited.'
      : '';
  const cta =
    account === 'business' ? 'Sign in to business portal' : 'Sign in';
  const methodPasswordLabel =
    account === 'business' ? 'Work email & password' : 'Email & password';

  return (
    <ModernistLoginShell account={account}>
      <h2
        className="text-[28px] sm:text-[32px] font-extrabold m-0 mb-1.5 tracking-tight leading-tight"
        style={{
          color: '#13274A',
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
        }}
      >
        Sign in
      </h2>
      <p
        className="text-[13.5px] leading-[1.5] mb-6 sm:mb-[26px]"
        style={{
          color: 'color-mix(in srgb, #1F2937 62%, transparent)',
          fontFamily: 'var(--font-body)',
        }}
      >
        Use the account type your service is billed under.
      </p>

      {/* Account type tabs */}
      <div
        className="grid grid-cols-1 min-[420px]:grid-cols-2 mb-6 sm:mb-[26px]"
        style={{ border: '2px solid #13274A' }}
      >
        {(
          [
            {
              key: 'personal' as const,
              title: 'Personal',
              sub: 'Home fibre, LTE and mobile',
            },
            {
              key: 'business' as const,
              title: 'Business',
              sub: 'Companies, NPOs and multi-site',
            },
          ] as const
        ).map((tab, i) => {
          const on = account === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchAccount(tab.key)}
              className={
                i === 0
                  ? 'text-left px-[15px] py-[13px]'
                  : 'text-left px-[15px] py-[13px] border-t min-[420px]:border-t-0 min-[420px]:border-l border-[#13274A]'
              }
              style={{
                background: on ? '#13274A' : '#FFFFFF',
                color: on ? '#FFFFFF' : '#1F2937',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span
                className="block font-extrabold text-sm leading-tight whitespace-nowrap"
                style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}
              >
                {tab.title}
              </span>
              <span className="block text-[11px] leading-snug opacity-75 mt-[3px]">
                {tab.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* Method toggle */}
      <div className="flex flex-wrap mb-5 sm:mb-[22px]">
        {(
          [
            { key: 'password' as const, label: methodPasswordLabel },
            { key: 'otp' as const, label: 'Mobile OTP' },
          ] as const
        ).map((m, i) => {
          const on = method === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMethod(m.key)}
              className="px-[15px] py-2 text-[12.5px] leading-tight whitespace-nowrap"
              style={{
                background: on ? '#13274A' : 'transparent',
                color: on ? '#FFFFFF' : '#1F2937',
                border: '1px solid color-mix(in srgb, #13274A 28%, transparent)',
                borderLeftWidth: i === 0 ? 1 : 0,
                fontFamily: 'var(--font-body)',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {formError && (
        <div
          className="mb-5 px-4 py-3 text-sm"
          style={{
            borderLeft: '4px solid #DC2626',
            background: 'color-mix(in srgb, #DC2626 8%, #FFFFFF)',
            color: '#991B1B',
          }}
        >
          {formError}
        </div>
      )}

      {method === 'password' && (
        <form
          onSubmit={emailForm.handleSubmit(onEmailSubmit)}
          className="flex flex-col gap-4"
        >
          <div>
            <label
              className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5"
              style={{ color: 'color-mix(in srgb, #1F2937 65%, transparent)' }}
            >
              {emailLabel}
            </label>
            <Controller
              name="email"
              control={emailForm.control}
              render={({ field }) => (
                <input
                  {...field}
                  type="email"
                  placeholder={emailPlaceholder}
                  required
                  className="w-full px-3 min-h-[44px] text-sm bg-white"
                  style={{
                    border: '1px solid color-mix(in srgb, #13274A 28%, transparent)',
                    color: '#1F2937',
                  }}
                />
              )}
            />
            {passwordHint && (
              <p
                className="text-[11.5px] mt-1"
                style={{
                  color: 'color-mix(in srgb, #1F2937 52%, transparent)',
                }}
              >
                {passwordHint}
              </p>
            )}
            {emailForm.formState.errors.email && (
              <p className="text-xs text-red-600 mt-1">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5"
              style={{ color: 'color-mix(in srgb, #1F2937 65%, transparent)' }}
            >
              Password
            </label>
            <Controller
              name="password"
              control={emailForm.control}
              render={({ field }) => (
                <div className="relative">
                  <input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    required
                    className="w-full px-3 pr-10 min-h-[44px] text-sm bg-white"
                    style={{
                      border:
                        '1px solid color-mix(in srgb, #13274A 28%, transparent)',
                      color: '#1F2937',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <PiEyeSlashBold className="w-4 h-4" />
                    ) : (
                      <PiEyeBold className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            />
            {emailForm.formState.errors.password && (
              <p className="text-xs text-red-600 mt-1">
                {emailForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 my-1 sm:my-0 sm:mb-[6px] sm:mt-1">
            <label
              className="flex items-center gap-2 text-[12.5px] cursor-pointer"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="rounded-none accent-[#13274A]"
              />
              Keep me signed in
            </label>
            <Link
              href="/auth/forgot-password"
              className="font-extrabold text-[12.5px] no-underline whitespace-nowrap"
              style={{
                color: '#D76026',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
              }}
            >
              Forgot password
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full min-h-[46px] text-[15px] font-extrabold disabled:opacity-50"
            style={{
              background: '#F5841E',
              color: '#13274A',
              border: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
            }}
          >
            {isSubmitting ? 'Signing in…' : cta}
          </button>
        </form>
      )}

      {method === 'otp' && (
        <form
          onSubmit={otpForm.handleSubmit(onOtpSubmit)}
          className="flex flex-col gap-4"
        >
          <div>
            <label
              className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5"
              style={{ color: 'color-mix(in srgb, #1F2937 65%, transparent)' }}
            >
              Mobile number
            </label>
            <Controller
              name="phone"
              control={otpForm.control}
              render={({ field }) => (
                <input
                  {...field}
                  type="tel"
                  placeholder="082 000 0000"
                  required
                  className="w-full px-3 min-h-[44px] text-sm bg-white"
                  style={{
                    border:
                      '1px solid color-mix(in srgb, #13274A 28%, transparent)',
                    color: '#1F2937',
                  }}
                />
              )}
            />
            <p
              className="text-[11.5px] mt-1"
              style={{
                color: 'color-mix(in srgb, #1F2937 52%, transparent)',
              }}
            >
              {account === 'business'
                ? 'The number registered against your user on the account.'
                : 'We send a six-digit code, valid for five minutes.'}
            </p>
            {otpForm.formState.errors.phone && (
              <p className="text-xs text-red-600 mt-1">
                {otpForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full min-h-[46px] text-[15px] font-extrabold disabled:opacity-50"
            style={{
              background: '#F5841E',
              color: '#13274A',
              border: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
            }}
          >
            {isSubmitting ? 'Sending…' : 'Send me a code'}
          </button>
        </form>
      )}

      {account === 'personal' && method === 'password' && (
        <>
          <div className="flex items-center gap-3 my-5">
            <span
              className="flex-1 h-px"
              style={{
                background: 'color-mix(in srgb, #13274A 28%, transparent)',
              }}
            />
            <span
              className="text-[10px] font-semibold tracking-[0.14em] uppercase"
              style={{
                color: 'color-mix(in srgb, #1F2937 50%, transparent)',
              }}
            >
              or
            </span>
            <span
              className="flex-1 h-px"
              style={{
                background: 'color-mix(in srgb, #13274A 28%, transparent)',
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full min-h-[44px] font-extrabold text-sm disabled:opacity-50 bg-white"
            style={{
              border: '2px solid color-mix(in srgb, #13274A 28%, transparent)',
              color: '#13274A',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
            }}
          >
            {isGoogleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>
        </>
      )}

      <div
        className="mt-auto pt-6 sm:pt-[26px] flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between min-[480px]:gap-3.5 text-[12.5px] leading-snug"
        style={{
          borderTop: '2px solid color-mix(in srgb, #13274A 28%, transparent)',
          color: 'color-mix(in srgb, #1F2937 62%, transparent)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <Link
          href="/"
          className="no-underline whitespace-nowrap"
          style={{ color: 'inherit' }}
        >
          ← circletel.co.za
        </Link>
        <div className="min-[480px]:text-right">
          {account === 'business' ? (
            <>
              No login yet?{' '}
              <Link
                href="/contact"
                className="font-extrabold no-underline whitespace-nowrap"
                style={{
                  color: '#D76026',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                }}
              >
                Request business access
              </Link>
            </>
          ) : (
            <>
              New customer?{' '}
              <Link
                href="/auth/register"
                className="font-extrabold no-underline whitespace-nowrap"
                style={{
                  color: '#D76026',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                }}
              >
                Create an account
              </Link>
            </>
          )}
        </div>
      </div>
    </ModernistLoginShell>
  );
}
