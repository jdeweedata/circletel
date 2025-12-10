'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber?: string;
  email?: string;
}

export function EmailVerificationModal({
  isOpen,
  onClose,
  orderNumber,
  email,
}: EmailVerificationModalProps) {
  const [isResending, setIsResending] = useState(false);
  const { resendVerification, user } = useCustomerAuth();

  const userEmail = email || user?.email || '';

  const handleResendEmail = async () => {
    if (!userEmail) {
      toast.error('No email address found');
      return;
    }

    setIsResending(true);
    try {
      const result = await resendVerification(userEmail);
      if (result.success) {
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        toast.error(result.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      toast.error('Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const maskEmail = (emailAddress: string) => {
    if (!emailAddress) return '';
    const [username, domain] = emailAddress.split('@');
    if (!domain) return emailAddress;
    const maskedUsername = username.length > 3
      ? username.slice(0, 3) + '***'
      : username.slice(0, 1) + '***';
    return `${maskedUsername}@${domain}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          <DialogTitle className="text-xl font-semibold text-gray-900">
            Order Created Successfully!
          </DialogTitle>

          <DialogDescription className="text-gray-600">
            {orderNumber && (
              <span className="block mt-2 font-medium text-gray-900">
                Order #{orderNumber}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Email Verification Notice */}
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900">
                Verify Your Email
              </h4>
              <p className="mt-1 text-sm text-blue-800">
                To track your order and access your dashboard, please verify your email address.
              </p>
              {userEmail && (
                <p className="mt-2 text-sm text-blue-700">
                  We&apos;ve sent a verification link to:{' '}
                  <span className="font-medium">{maskEmail(userEmail)}</span>
                </p>
              )}
              <p className="mt-2 text-xs text-blue-600">
                Don&apos;t forget to check your spam folder!
              </p>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900 mb-2">What happens next:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Click the verification link in your email</li>
            <li>Once verified, you&apos;ll have full dashboard access</li>
            <li>You can track your order status and manage your account</li>
          </ul>
        </div>

        <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={isResending}
            className="flex items-center gap-2"
          >
            {isResending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isResending ? 'Sending...' : 'Resend Email'}
          </Button>
          <Button
            onClick={onClose}
            className="bg-[#F5831F] hover:bg-[#E67510] text-white"
          >
            Got it, I&apos;ll check my email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
