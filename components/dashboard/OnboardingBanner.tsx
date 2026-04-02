'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PiCheckCircleFill, PiCircleBold, PiArrowRightBold, PiCaretDownBold, PiCaretUpBold, PiSpinnerBold, PiXBold } from 'react-icons/pi';
import type { OnboardingStatusResponse, OnboardingStep } from '@/app/api/customers/onboarding-status/route';

interface OnboardingBannerProps {
  accessToken: string;
}

export function OnboardingBanner({ accessToken }: OnboardingBannerProps) {
  const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed this session
    const wasDismissed = sessionStorage.getItem('onboarding_banner_dismissed') === 'true';
    if (wasDismissed) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    async function fetchStatus() {
      try {
        const res = await fetch('/api/customers/onboarding-status', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return;
        const data: OnboardingStatusResponse = await res.json();
        setStatus(data);
        // Auto-collapse if already complete
        if (data.isComplete) setCollapsed(true);
      } catch {
        // Silently fail — banner is non-critical
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [accessToken]);

  function handleDismiss() {
    sessionStorage.setItem('onboarding_banner_dismissed', 'true');
    setDismissed(true);
  }

  // Don't render while loading or if complete+dismissed, or dismissed
  if (loading || dismissed) return null;
  if (!status) return null;
  if (status.isComplete) return null;

  const progressPercent = Math.round((status.completedCount / status.totalCount) * 100);

  return (
    <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden mb-6">
      {/* Header row */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-circleTel-navy">Complete Your Setup</span>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              {status.completedCount}/{status.totalCount}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label={collapsed ? 'Expand setup checklist' : 'Collapse setup checklist'}
          >
            {collapsed ? <PiCaretDownBold className="w-4 h-4" /> : <PiCaretUpBold className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Dismiss setup checklist for this session"
          >
            <PiXBold className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-circleTel-orange to-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{progressPercent}%</span>
        </div>
      </div>

      {/* Step list */}
      {!collapsed && (
        <div className="px-6 py-4 space-y-2">
          {status.steps.map((step: OnboardingStep) => (
            <div
              key={step.id}
              className={`flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl transition-colors ${
                step.completed ? 'bg-green-50/60' : 'bg-gray-50 hover:bg-orange-50/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {step.completed ? (
                  <PiCheckCircleFill className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <PiCircleBold className="w-5 h-5 text-gray-300 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${step.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                    {step.label}
                  </p>
                  {!step.completed && (
                    <p className="text-xs text-gray-400 truncate">{step.description}</p>
                  )}
                </div>
              </div>
              {!step.completed && step.actionLabel && step.actionHref && (
                <Link
                  href={step.actionHref}
                  className="flex items-center gap-1 text-xs font-semibold text-circleTel-orange hover:text-orange-700 flex-shrink-0 whitespace-nowrap"
                >
                  {step.actionLabel}
                  <PiArrowRightBold className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {collapsed && (
        <div className="px-6 py-3">
          <p className="text-xs text-gray-500">
            {status.steps.filter((s) => !s.completed).map((s) => s.label).join(' · ')}
          </p>
        </div>
      )}
    </div>
  );
}
