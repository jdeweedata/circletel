'use client';

import { useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { BUILTIN_RULES } from '@/lib/products/rules';
import type { RuleGroup } from '@/lib/products/rules';

const GROUP_STYLE: Record<RuleGroup, string> = {
  Pricing: 'bg-emerald-50 text-emerald-700',
  Eligibility: 'bg-blue-50 text-blue-700',
  Publishing: 'bg-purple-50 text-purple-700',
  Governance: 'bg-slate-100 text-slate-700',
  Approval: 'bg-amber-50 text-amber-700',
};

/**
 * Rules Studio — lists the built-in product rules and shows the selected rule's
 * detail. Live simulation against a product + threshold editing are wired in
 * Phase 6; this is the read-only shell.
 */
export function RulesStudio({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedId, setSelectedId] = useState<string>(BUILTIN_RULES[0]?.id ?? '');
  const selected = BUILTIN_RULES.find((r) => r.id === selectedId) ?? BUILTIN_RULES[0];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        className="relative flex h-[600px] max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
        role="dialog"
        aria-label="Rules Studio"
      >
        {/* rule list */}
        <div className="w-64 shrink-0 overflow-y-auto border-r border-ui-border bg-slate-50">
          <div className="border-b border-ui-border px-4 py-3">
            <h2 className="text-sm font-bold text-ui-text-primary">Product Rules</h2>
            <p className="text-xs text-ui-text-muted">{BUILTIN_RULES.length} rules</p>
          </div>
          <ul>
            {BUILTIN_RULES.map((rule) => (
              <li key={rule.id}>
                <button
                  onClick={() => setSelectedId(rule.id)}
                  className={cn(
                    'w-full border-l-2 px-4 py-3 text-left transition-colors',
                    selectedId === rule.id
                      ? 'border-circleTel-orange bg-white'
                      : 'border-transparent hover:bg-white/60'
                  )}
                >
                  <span className="block text-sm font-medium text-ui-text-primary">{rule.name}</span>
                  <span className="text-xs text-ui-text-muted">{rule.appliesTo}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* rule detail */}
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-ui-border px-5 py-3">
            <h3 className="text-sm font-semibold text-ui-text-primary">Rule detail</h3>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-ui-text-muted hover:bg-slate-100"
              aria-label="Close"
            >
              <PiXBold className="h-5 w-5" />
            </button>
          </header>

          {selected && (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    GROUP_STYLE[selected.group]
                  )}
                >
                  {selected.group}
                </span>
                <span className="text-xs text-ui-text-muted">priority {selected.priority}</span>
                <code className="text-xs text-ui-text-muted">{selected.id}</code>
              </div>
              <h4 className="text-lg font-semibold text-ui-text-primary">{selected.name}</h4>
              <p className="mt-2 text-sm text-ui-text-secondary">{selected.description}</p>

              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between border-t border-ui-border pt-2">
                  <dt className="text-ui-text-muted">Applies to</dt>
                  <dd className="text-right font-medium text-ui-text-primary">{selected.appliesTo}</dd>
                </div>
              </dl>

              <p className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-ui-text-muted">
                Live simulation against a selected product and threshold editing arrive in Phase 6.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
