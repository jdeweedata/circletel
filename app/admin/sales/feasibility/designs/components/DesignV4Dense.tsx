'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Terminal,
  Zap,
  Keyboard,
  Send,
  Shield,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { FormData, defaultFormData, parseSites } from '../shared/form-data';
import { speedOptions, contentionOptions } from '../shared/options-config';

// Design V4: Dense Power-User View
// Maximum efficiency, minimum chrome. Terminal-inspired.
// Aesthetic: Bloomberg, industrial, utilitarian, monospace accents

export function DesignV4Dense() {
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const siteCount = parseSites(formData.sites).length;

  // Keyboard shortcut handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      // Would trigger submit
      console.log('Submit triggered via Ctrl+Enter');
    }
  }, []);

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-200"
      onKeyDown={handleKeyDown}
    >
      {/* Header Bar */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-500/20 rounded">
              <Terminal className="w-4 h-4 text-amber-500" />
            </div>
            <span className="font-mono text-sm text-slate-400 uppercase tracking-widest">
              B2B_FEASIBILITY
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-xs text-emerald-500">READY</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" />
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400">Tab</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400">⌘↵</kbd>
              submit
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-0"
        >
          {/* CLIENT SECTION */}
          <section className="pb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[11px] text-slate-500 uppercase tracking-[0.2em]">01_CLIENT</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 block">
                  company <span className="text-amber-500">*</span>
                </label>
                <Input
                  placeholder="ACME Corp"
                  value={formData.companyName}
                  onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="h-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600 rounded font-mono text-sm focus:border-amber-500 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 block">contact</label>
                <Input
                  placeholder="J. Smith"
                  value={formData.contactName}
                  onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  className="h-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600 rounded font-mono text-sm focus:border-amber-500 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 block">phone</label>
                <Input
                  placeholder="082 123 4567"
                  value={formData.contactPhone}
                  onChange={e => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="h-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600 rounded font-mono text-sm focus:border-amber-500 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 block">email</label>
              <Input
                type="email"
                placeholder="john@acme.co.za"
                value={formData.contactEmail}
                onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="h-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600 rounded font-mono text-sm focus:border-amber-500 focus:ring-amber-500/20 max-w-md"
              />
            </div>
          </section>

          {/* REQUIREMENTS SECTION */}
          <section className="py-6 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[11px] text-slate-500 uppercase tracking-[0.2em]">02_REQUIREMENTS</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <div className="flex flex-wrap items-end gap-6">
              {/* Speed */}
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wide mb-2 block">speed</label>
                <div className="flex gap-1">
                  {speedOptions.map(option => {
                    const isSelected = formData.speedRequirement === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormData(prev => ({ ...prev, speedRequirement: option.value }))}
                        className={cn(
                          "px-3 py-1.5 font-mono text-xs rounded transition-all",
                          isSelected
                            ? "bg-amber-500 text-slate-900 font-bold"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                        )}
                      >
                        {option.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contention */}
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wide mb-2 block">contention</label>
                <div className="flex gap-1">
                  {contentionOptions.map(option => {
                    const isSelected = formData.contention === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormData(prev => ({ ...prev, contention: option.value }))}
                        className={cn(
                          "px-3 py-1.5 font-mono text-xs rounded transition-all",
                          isSelected
                            ? "bg-violet-500 text-white font-bold"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                        )}
                      >
                        {option.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="font-mono text-[10px] text-slate-500 uppercase tracking-wide mb-2 block">budget</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500">R</span>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={formData.budget}
                    onChange={e => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    className="h-8 w-28 pl-6 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600 rounded font-mono text-sm focus:border-amber-500 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Failover */}
              <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 transition-colors">
                <Checkbox
                  checked={formData.needFailover}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needFailover: !!checked }))}
                  className="border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 w-3.5 h-3.5"
                />
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono text-xs text-slate-400">FAILOVER</span>
              </label>
            </div>
          </section>

          {/* SITES SECTION */}
          <section className="py-6 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[11px] text-slate-500 uppercase tracking-[0.2em]">03_SITES</span>
              <div className="flex-1 h-px bg-slate-800" />
              {siteCount > 0 && (
                <span className="font-mono text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                  {siteCount} SITE{siteCount !== 1 ? 'S' : ''}
                </span>
              )}
            </div>

            <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden">
              {/* Line numbers gutter */}
              <div className="flex">
                <div className="flex-shrink-0 w-10 bg-slate-800/50 py-3 text-center">
                  <div className="space-y-[7px]">
                    {Array.from({ length: Math.max(8, siteCount + 2) }).map((_, i) => (
                      <div key={i} className="font-mono text-[10px] text-slate-600 h-[18px] leading-[18px]">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
                <Textarea
                  placeholder="123 Main Street, Sandton&#10;-26.1076, 28.0567&#10;45 Long Street, Cape Town&#10;..."
                  value={formData.sites}
                  onChange={e => setFormData(prev => ({ ...prev, sites: e.target.value }))}
                  className="flex-1 min-h-[200px] bg-transparent border-0 text-slate-200 placeholder:text-slate-600 font-mono text-sm leading-[18px] py-3 px-3 resize-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div className="mt-2 flex items-center gap-4 text-[10px] font-mono text-slate-600">
              <span>// Accepts: physical addresses, GPS coordinates (-lat, lng)</span>
            </div>
          </section>

          {/* ACTION BAR */}
          <section className="pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between">
              {/* Summary */}
              <div className="flex items-center gap-4 font-mono text-xs text-slate-500">
                <span className={formData.companyName ? 'text-emerald-400' : ''}>
                  CLIENT:{formData.companyName ? '✓' : '○'}
                </span>
                <span className="text-slate-700">|</span>
                <span className="text-amber-400">
                  {speedOptions.find(s => s.value === formData.speedRequirement)?.shortLabel}
                </span>
                <span className="text-violet-400">
                  {contentionOptions.find(c => c.value === formData.contention)?.shortLabel}
                </span>
                {formData.budget && <span className="text-slate-400">R{formData.budget}</span>}
                {formData.needFailover && <span className="text-emerald-400">+FAILOVER</span>}
                <span className="text-slate-700">|</span>
                <span className={siteCount > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                  SITES:{siteCount}
                </span>
              </div>

              {/* Submit */}
              <button
                className="group flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-mono font-bold text-sm rounded transition-all"
              >
                <span>EXECUTE</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                <kbd className="ml-2 px-1.5 py-0.5 bg-amber-600/50 rounded text-[10px] text-slate-900/70">⌘↵</kbd>
              </button>
            </div>
          </section>
        </motion.div>
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-2 flex items-center justify-between font-mono text-[10px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CONNECTED
            </span>
            <span>CircleTel Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Coverage API: v2.1</span>
            <span>SA Region</span>
          </div>
        </div>
      </div>
    </div>
  );
}
