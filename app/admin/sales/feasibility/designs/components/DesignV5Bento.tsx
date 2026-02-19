'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Zap,
  MapPin,
  User,
  Mail,
  Phone,
  ArrowRight,
  Check,
  Shield,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { FormData, defaultFormData, parseSites, getCompletionStatus } from '../shared/form-data';
import { speedOptions, contentionOptions } from '../shared/options-config';

// Design V5: Bento Grid Progressive Disclosure
// Collapsible tiles with expand animations
// Aesthetic: Modern, spacious, tactile, Apple-inspired

type ExpandedTile = 'client' | 'requirements' | 'sites' | null;

export function DesignV5Bento() {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [expandedTile, setExpandedTile] = useState<ExpandedTile>('client');

  const siteCount = parseSites(formData.sites).length;
  const completionStatus = getCompletionStatus(formData);

  const toggleTile = (tile: ExpandedTile) => {
    setExpandedTile(expandedTile === tile ? null : tile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 pb-12">
      {/* Subtle Header */}
      <div className="px-8 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-circleTel-orange to-amber-500 rounded-2xl shadow-lg shadow-orange-300/40">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">B2B Feasibility</h1>
              <p className="text-sm text-gray-500">Click tiles to expand sections</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bento Grid */}
      <div className="px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Client Tile */}
          <motion.div
            layout
            className={cn(
              "relative rounded-3xl overflow-hidden cursor-pointer transition-shadow duration-500",
              expandedTile === 'client'
                ? "md:col-span-2 lg:col-span-2 bg-white shadow-2xl shadow-blue-200/50"
                : "bg-white shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-200/60"
            )}
            onClick={() => !expandedTile || expandedTile !== 'client' ? toggleTile('client') : null}
          >
            {/* Collapsed Header - Always visible */}
            <div
              className={cn(
                "p-6 flex items-center justify-between",
                expandedTile === 'client' && "border-b border-gray-100 cursor-pointer"
              )}
              onClick={expandedTile === 'client' ? () => toggleTile('client') : undefined}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-2xl transition-all duration-300",
                  completionStatus.client.complete
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-400/40"
                    : "bg-blue-100"
                )}>
                  {completionStatus.client.complete ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <Building2 className={cn("w-6 h-6", completionStatus.client.complete ? "text-white" : "text-blue-600")} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Client</h3>
                  <p className="text-sm text-gray-500">
                    {formData.companyName || 'Enter business details'}
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedTile === 'client' ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedTile === 'client' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                  className="overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-6 pt-2 space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Company Name *</Label>
                      <Input
                        placeholder="Acme Corporation"
                        value={formData.companyName}
                        onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        className="mt-2 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 rounded-xl text-base"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Contact Name</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="John Smith"
                            value={formData.contactName}
                            onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                            className="pl-11 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 rounded-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Phone</Label>
                        <div className="relative mt-2">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="082 123 4567"
                            value={formData.contactPhone}
                            onChange={e => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                            className="pl-11 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Email</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="john@acme.co.za"
                          value={formData.contactEmail}
                          onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                          className="pl-11 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Requirements Tile */}
          <motion.div
            layout
            className={cn(
              "relative rounded-3xl overflow-hidden cursor-pointer transition-shadow duration-500",
              expandedTile === 'requirements'
                ? "md:col-span-2 lg:col-span-2 bg-white shadow-2xl shadow-violet-200/50"
                : "bg-white shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-200/60"
            )}
            onClick={() => !expandedTile || expandedTile !== 'requirements' ? toggleTile('requirements') : null}
          >
            {/* Collapsed Header */}
            <div
              className={cn(
                "p-6 flex items-center justify-between",
                expandedTile === 'requirements' && "border-b border-gray-100 cursor-pointer"
              )}
              onClick={expandedTile === 'requirements' ? () => toggleTile('requirements') : undefined}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-2xl transition-all duration-300",
                  completionStatus.requirements.complete
                    ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-400/40"
                    : "bg-violet-100"
                )}>
                  {completionStatus.requirements.complete ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <Zap className="w-6 h-6 text-violet-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Requirements</h3>
                  <p className="text-sm text-gray-500">
                    {completionStatus.requirements.selected.length > 0
                      ? completionStatus.requirements.selected.slice(0, 3).join(' • ')
                      : 'Speed, contention, budget'}
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedTile === 'requirements' ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedTile === 'requirements' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                  className="overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-6 pt-2 space-y-6">
                    {/* Speed */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-3 block">Speed</Label>
                      <div className="flex flex-wrap gap-3">
                        {speedOptions.map(option => {
                          const isSelected = formData.speedRequirement === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => setFormData(prev => ({ ...prev, speedRequirement: option.value }))}
                              className={cn(
                                "px-5 py-3 rounded-2xl transition-all duration-200 font-medium",
                                isSelected
                                  ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-400/40 scale-105"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              )}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Contention */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-3 block">Contention</Label>
                      <div className="flex flex-wrap gap-3">
                        {contentionOptions.map(option => {
                          const isSelected = formData.contention === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => setFormData(prev => ({ ...prev, contention: option.value }))}
                              className={cn(
                                "px-5 py-3 rounded-2xl transition-all duration-200",
                                isSelected
                                  ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-400/40 scale-105"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              )}
                            >
                              <span className="font-medium">{option.label}</span>
                              <span className="block text-xs opacity-80 mt-0.5">{option.description}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Budget & Failover */}
                    <div className="flex items-end gap-4">
                      <div className="flex-1 max-w-[200px]">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Budget</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">R</span>
                          <Input
                            type="number"
                            placeholder="5,000"
                            value={formData.budget}
                            onChange={e => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                            className="pl-9 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500 rounded-xl"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-3 h-12 px-5 bg-gray-100 rounded-2xl cursor-pointer hover:bg-gray-200 transition-colors">
                        <Checkbox
                          checked={formData.needFailover}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needFailover: !!checked }))}
                          className="border-gray-300 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                        />
                        <Shield className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-700">Failover</span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Sites Tile */}
          <motion.div
            layout
            className={cn(
              "relative rounded-3xl overflow-hidden cursor-pointer transition-shadow duration-500",
              expandedTile === 'sites'
                ? "md:col-span-2 lg:col-span-3 bg-white shadow-2xl shadow-emerald-200/50"
                : "bg-white shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-200/60"
            )}
            onClick={() => !expandedTile || expandedTile !== 'sites' ? toggleTile('sites') : null}
          >
            {/* Collapsed Header */}
            <div
              className={cn(
                "p-6 flex items-center justify-between",
                expandedTile === 'sites' && "border-b border-gray-100 cursor-pointer"
              )}
              onClick={expandedTile === 'sites' ? () => toggleTile('sites') : undefined}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-2xl transition-all duration-300",
                  completionStatus.sites.complete
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-400/40"
                    : "bg-emerald-100"
                )}>
                  {completionStatus.sites.complete ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <MapPin className="w-6 h-6 text-emerald-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Sites</h3>
                  <p className="text-sm text-gray-500">
                    {siteCount > 0 ? `${siteCount} location${siteCount !== 1 ? 's' : ''} to check` : 'Add addresses or GPS coordinates'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {siteCount > 0 && (
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full">
                    {siteCount}
                  </span>
                )}
                <motion.div
                  animate={{ rotate: expandedTile === 'sites' ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedTile === 'sites' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                  className="overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-6 pt-2">
                    <Textarea
                      placeholder="123 Main Street, Sandton, Johannesburg&#10;-26.1076, 28.0567&#10;45 Long Street, Cape Town&#10;Suite 401, Rosebank Office Park..."
                      value={formData.sites}
                      onChange={e => setFormData(prev => ({ ...prev, sites: e.target.value }))}
                      className="min-h-[200px] bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-500 rounded-xl font-mono text-sm resize-none"
                    />
                    <p className="mt-3 text-sm text-gray-500">
                      Enter one site per line. Accepts physical addresses or GPS coordinates.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 max-w-5xl mx-auto flex justify-center"
        >
          <button className="group relative px-12 py-5 bg-gradient-to-r from-circleTel-orange to-amber-500 text-white font-bold text-lg rounded-3xl shadow-2xl shadow-orange-400/40 hover:shadow-orange-500/50 hover:scale-[1.02] transition-all flex items-center gap-3">
            <span>Check Feasibility</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
