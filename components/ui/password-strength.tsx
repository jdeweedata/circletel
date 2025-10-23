/**
 * Password Strength Indicator Component
 * Provides visual feedback on password strength
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface PasswordCheck {
  label: string;
  passed: boolean;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const [strength, setStrength] = useState<{
    score: number;
    level: 'weak' | 'fair' | 'good' | 'strong';
    checks: PasswordCheck[];
  }>({
    score: 0,
    level: 'weak',
    checks: [],
  });

  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, level: 'weak', checks: [] });
      return;
    }

    const checks: PasswordCheck[] = [
      {
        label: 'At least 8 characters',
        passed: password.length >= 8,
      },
      {
        label: 'Contains uppercase letter',
        passed: /[A-Z]/.test(password),
      },
      {
        label: 'Contains lowercase letter',
        passed: /[a-z]/.test(password),
      },
      {
        label: 'Contains number',
        passed: /[0-9]/.test(password),
      },
      {
        label: 'Contains special character',
        passed: /[^a-zA-Z0-9]/.test(password),
      },
    ];

    const score = checks.filter((c) => c.passed).length;
    let level: 'weak' | 'fair' | 'good' | 'strong';

    if (score <= 2) level = 'weak';
    else if (score === 3) level = 'fair';
    else if (score === 4) level = 'good';
    else level = 'strong';

    setStrength({ score, level, checks });
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Password strength</span>
          <span
            className={cn('font-medium', {
              'text-red-600': strength.level === 'weak',
              'text-orange-600': strength.level === 'fair',
              'text-yellow-600': strength.level === 'good',
              'text-green-600': strength.level === 'strong',
            })}
          >
            {strength.level.charAt(0).toUpperCase() + strength.level.slice(1)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((segment) => (
            <div
              key={segment}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-300',
                {
                  'bg-red-500': segment <= strength.score && strength.level === 'weak',
                  'bg-orange-500': segment <= strength.score && strength.level === 'fair',
                  'bg-yellow-500': segment <= strength.score && strength.level === 'good',
                  'bg-green-500': segment <= strength.score && strength.level === 'strong',
                  'bg-gray-200': segment > strength.score,
                }
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1.5">
        {strength.checks.map((check, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-2 text-xs transition-colors duration-200',
              {
                'text-green-600': check.passed,
                'text-gray-500': !check.passed,
              }
            )}
          >
            {check.passed ? (
              <Check className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
