'use client';

import { useEffect, useState } from 'react';
import { PiXBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import {
  BUILTIN_RULES,
  rulesEngine,
  DEFAULT_RULE_CONFIG,
  type RuleConfig,
  type RuleGroup,
} from '@/lib/products/rules';
import type { UnifiedProduct } from '@/lib/types/unified-product';
import { RuleLevelBadge } from '@/components/admin/products/shared';

const GROUP_STYLE: Record<RuleGroup, string> = {
  Pricing: 'bg-emerald-50 text-emerald-700',
  Eligibility: 'bg-blue-50 text-blue-700',
  Publishing: 'bg-purple-50 text-purple-700',
  Governance: 'bg-slate-100 text-slate-700',
  Approval: 'bg-amber-50 text-amber-700',
};

interface RulesStudioProps {
  open: boolean;
  onClose: () => void;
  config: Partial<RuleConfig>;
  onConfigChange: (config: Partial<RuleConfig>) => void;
  /** Product to simulate the selected rule against (e.g. the selected card). */
  simulationProduct: UnifiedProduct | null;
}

const THRESHOLDS: Array<{ key: keyof RuleConfig; label: string }> = [
  { key: 'marginFloorPct', label: 'Margin floor %' },
  { key: 'bundleMarginFloorPct', label: 'Bundle floor %' },
  { key: 'mtnDefaultMarkupFloorPct', label: 'MTN markup floor %' },
];

/**
 * Rules Studio — browse rules, edit thresholds, and live-simulate the selected
 * rule against a product. Threshold edits propagate to the console so card
 * badges and the detail sidebar re-evaluate in real time.
 */
export function RulesStudio({
  open,
  onClose,
  config,
  onConfigChange,
  simulationProduct,
}: RulesStudioProps) {
  const [selectedId, setSelectedId] = useState<string>(BUILTIN_RULES[0]?.id ?? '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string>('');

  // Clear saved confirmation after 2 seconds.
  useEffect(() => {
    if (saveStatus === 'saved') {
      const t = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

  const selected = BUILTIN_RULES.find((r) => r.id === selectedId) ?? BUILTIN_RULES[0];

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveError('');
    try {
      const res = await fetch('/api/admin/products/rules-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        setSaveStatus('saved');
      } else {
        const json = await res.json().catch(() => ({}));
        setSaveError(json.error || `Error: HTTP ${res.status}`);
        setSaveStatus('error');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
      setSaveStatus('error');
    }
  };

  if (!open) return null;

  const effective = { ...DEFAULT_RULE_CONFIG, ...config };
  const simulation =
    selected && simulationProduct
      ? rulesEngine.simulateRule(selected.id, simulationProduct, config)
      : null;

  const setThreshold = (key: keyof RuleConfig, raw: string) => {
    const n = parseInt(raw, 10);
    onConfigChange({ ...config, [key]: Number.isFinite(n) ? n : DEFAULT_RULE_CONFIG[key] });
  };

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

              {/* live simulation */}
              <section className="mt-5 rounded-lg border border-ui-border p-3">
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-text-muted">
                  Simulation
                </h5>
                {simulationProduct ? (
                  <div className="space-y-1">
                    <p className="text-xs text-ui-text-muted">
                      Against <span className="font-medium text-ui-text-secondary">{simulationProduct.name}</span>
                    </p>
                    {simulation ? (
                      <div className="flex items-center gap-2">
                        <RuleLevelBadge level={simulation.level} />
                        <span className="text-sm text-ui-text-secondary">{simulation.message}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-ui-text-muted">This rule does not apply to that product.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-ui-text-muted">
                    Select a product card to simulate this rule against it.
                  </p>
                )}
              </section>

              {/* thresholds */}
              <section className="mt-4 rounded-lg border border-ui-border p-3">
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-text-muted">
                  Thresholds
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  {THRESHOLDS.map((t) => (
                    <label key={t.key} className="text-xs text-ui-text-muted">
                      {t.label}
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={effective[t.key]}
                        onChange={(e) => setThreshold(t.key, e.target.value)}
                        className="mt-1 w-full rounded-md border border-ui-border px-2 py-1 text-sm text-ui-text-primary focus:outline-none focus:ring-2 focus:ring-circleTel-orange/30"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-ui-text-muted">
                  Edits re-evaluate card badges and the detail panel live.
                </p>
              </section>

              {/* save error */}
              {saveError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{saveError}</p>
                </div>
              )}
            </div>
          )}

          {/* footer */}
          <footer className="flex items-center justify-between border-t border-ui-border bg-slate-50 px-5 py-3">
            <div className="text-xs text-ui-text-muted">
              {saveStatus === 'saved' && (
                <span className="text-emerald-600">Saved ✓</span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="rounded-lg bg-circleTel-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-circleTel-orange/90 disabled:opacity-50"
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save as default'}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
