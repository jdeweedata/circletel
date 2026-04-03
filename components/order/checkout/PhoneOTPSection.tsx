'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { PiDeviceMobileBold, PiCheckCircleBold, PiSpinnerBold, PiArrowLeftBold } from 'react-icons/pi';

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

interface PhoneOTPSectionProps {
  isSubmitting: boolean;
  onSignupComplete: (result: PhoneSignupResult) => void;
  onError: (message: string) => void;
}

type Step = 'enter_phone' | 'enter_otp' | 'enter_name';

const RESEND_COOLDOWN_SECONDS = 60;

export function PhoneOTPSection({ isSubmitting, onSignupComplete, onError }: PhoneOTPSectionProps) {
  const [step, setStep] = useState<Step>('enter_phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [nameError, setNameError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startResendCountdown() {
    setResendCountdown(RESEND_COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function normaliseSAPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('27') && digits.length === 11) return `+${digits}`;
    if (digits.startsWith('0') && digits.length === 10) return `+27${digits.slice(1)}`;
    return raw;
  }

  function validatePhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (!digits) return 'Phone number is required';
    if (digits.length < 10) return 'Enter a valid South African phone number';
    return '';
  }

  async function handleSendOTP() {
    const err = validatePhone(phone);
    if (err) { setPhoneError(err); return; }
    setPhoneError('');
    setLoading(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normaliseSAPhone(phone) }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setPhoneError(`Please wait ${data.retryAfter ?? 60} seconds before requesting a new code.`);
        } else {
          setPhoneError(data.error || 'Failed to send OTP. Please try again.');
        }
        return;
      }
      setStep('enter_otp');
      startResendCountdown();
    } catch {
      setPhoneError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(code: string) {
    if (code.length < 6) return;
    setOtpError('');
    setLoading(true);
    try {
      const normPhone = normaliseSAPhone(phone);
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normPhone, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Invalid code. Please try again.');
        setOtp('');
        return;
      }
      // OTP verified — proceed to name collection
      setVerifiedPhone(normPhone);
      setVerifiedOtp(code);
      setStep('enter_name');
    } catch {
      setOtpError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteSignup() {
    if (!firstName.trim() || !lastName.trim()) {
      setNameError('Please enter your first and last name.');
      return;
    }
    setNameError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/phone-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: verifiedPhone,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error || 'Sign up failed. Please try again.');
        return;
      }
      onSignupComplete(data as PhoneSignupResult);
    } catch {
      onError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOTP() {
    if (resendCountdown > 0) return;
    setOtp('');
    setOtpError('');
    await handleSendOTP();
  }

  const busy = loading || isSubmitting;

  // --- Step: Enter phone ---
  if (step === 'enter_phone') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="otp-phone" className="text-xs font-semibold text-circleTel-navy">
            Mobile number
          </Label>
          <div className="relative mt-1">
            <PiDeviceMobileBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="otp-phone"
              type="tel"
              placeholder="082 123 4567"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && !busy && handleSendOTP()}
              className="pl-9 h-11 text-sm"
              disabled={busy}
              autoComplete="tel"
            />
          </div>
          {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
          <p className="text-xs text-gray-400 mt-1">We&apos;ll send a 6-digit code to verify your number.</p>
        </div>
        <button
          type="button"
          onClick={handleSendOTP}
          disabled={busy}
          className="w-full bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-bold rounded-xl px-4 py-3.5 text-sm transition-all flex items-center justify-center gap-2 shadow"
        >
          {busy ? <PiSpinnerBold className="w-4 h-4 animate-spin" /> : <PiDeviceMobileBold className="w-4 h-4" />}
          {busy ? 'Sending…' : 'Send Verification Code'}
        </button>
      </div>
    );
  }

  // --- Step: Enter OTP ---
  if (step === 'enter_otp') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setStep('enter_phone'); setOtp(''); setOtpError(''); }}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Back to phone entry"
          >
            <PiArrowLeftBold className="w-4 h-4" />
          </button>
          <div>
            <p className="text-sm font-semibold text-circleTel-navy">Enter verification code</p>
            <p className="text-xs text-gray-500">Sent to {phone}</p>
          </div>
        </div>

        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setOtpError('');
              if (value.length === 6) handleVerifyOTP(value);
            }}
            disabled={busy}
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg border-gray-200" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {otpError && <p className="text-red-500 text-xs text-center">{otpError}</p>}
        {busy && <p className="text-xs text-center text-gray-400"><PiSpinnerBold className="inline w-3 h-3 animate-spin mr-1" />Verifying…</p>}

        <div className="text-center">
          {resendCountdown > 0 ? (
            <p className="text-xs text-gray-400">Resend code in {resendCountdown}s</p>
          ) : (
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={busy}
              className="text-xs text-circleTel-orange hover:text-orange-700 underline disabled:opacity-50"
            >
              Resend code
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Step: Enter name ---
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
        <PiCheckCircleBold className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800">Phone verified</p>
          <p className="text-xs text-green-600">{verifiedPhone}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-circleTel-navy mb-3">Your name</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="otp-firstName" className="text-xs font-semibold text-circleTel-navy">First name</Label>
            <Input
              id="otp-firstName"
              placeholder="Jane"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setNameError(''); }}
              className="mt-1 h-10 text-sm"
              disabled={busy}
              autoComplete="given-name"
            />
          </div>
          <div>
            <Label htmlFor="otp-lastName" className="text-xs font-semibold text-circleTel-navy">Last name</Label>
            <Input
              id="otp-lastName"
              placeholder="Smith"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setNameError(''); }}
              className="mt-1 h-10 text-sm"
              disabled={busy}
              autoComplete="family-name"
            />
          </div>
        </div>
        {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
      </div>

      <button
        type="button"
        onClick={handleCompleteSignup}
        disabled={busy}
        className="w-full bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-bold rounded-xl px-4 py-4 text-base shadow-lg transition-all flex items-center justify-center gap-2"
      >
        {busy ? <PiSpinnerBold className="w-5 h-5 animate-spin" /> : <PiCheckCircleBold className="w-5 h-5" />}
        {busy ? 'Creating account…' : 'Continue to Payment'}
      </button>
    </div>
  );
}
