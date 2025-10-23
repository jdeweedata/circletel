/**
 * Email Availability Checker Component
 * Provides real-time validation if email already exists
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EmailAvailabilityProps {
  email: string;
  className?: string;
  onAvailabilityChange?: (available: boolean) => void;
}

export function EmailAvailability({
  email,
  className,
  onAvailabilityChange
}: EmailAvailabilityProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Don't check if email is empty or invalid format
    if (!email || !email.includes('@')) {
      setStatus('idle');
      setMessage('');
      onAvailabilityChange?.(true);
      return;
    }

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      setStatus('checking');

      try {
        // Check if email exists in customers table
        const { data, error } = await supabase
          .from('customers')
          .select('email')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (error) {
          console.error('Error checking email:', error);
          setStatus('idle');
          setMessage('');
          onAvailabilityChange?.(true);
          return;
        }

        if (data) {
          setStatus('taken');
          setMessage('This email is already registered');
          onAvailabilityChange?.(false);
        } else {
          setStatus('available');
          setMessage('Email is available');
          onAvailabilityChange?.(true);
        }
      } catch (err) {
        console.error('Error checking email:', err);
        setStatus('idle');
        setMessage('');
        onAvailabilityChange?.(true);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [email, onAvailabilityChange]);

  if (status === 'idle') return null;

  return (
    <div className={cn('flex items-center gap-2 text-sm mt-2', className)}>
      {status === 'checking' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="text-gray-600">Checking availability...</span>
        </>
      )}

      {status === 'available' && (
        <>
          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-green-600">{message}</span>
        </>
      )}

      {status === 'taken' && (
        <>
          <X className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-red-600">{message}</span>
        </>
      )}
    </div>
  );
}
