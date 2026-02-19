'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { FormData, defaultFormData, parseSites } from '../shared/form-data';
import { speedOptions, contentionOptions } from '../shared/options-config';

// Design V1: 3-Column Refined
// Premium polish on the classic layout - elevated shadows, gradient icons, refined typography
// Aesthetic: Luxury editorial, clean but memorable

export function DesignV1Refined() {
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const siteCount = parseSites(formData.sites).length;

  return (
    <div className="min-h-screen pb-12">
      {/* Premium Header with Mesh Gradient */}
      <div className="relative overflow-hidden mb-10">
        {/* Multi-layer gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-circleTel-navy via-[#1a365d] to-circleTel-navy" />
        <div className="absolute inset-0 bg-gradient-to-tr from-circleTel-orange/10 via-transparent to-violet-500/10" />

        {/* Animated mesh pattern */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mesh-v1" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 20h40M20 0v40" stroke="white" strokeWidth="0.5" fill="none" />
                <circle cx="20" cy="20" r="2" fill="white" fillOpacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mesh-v1)" />
          </svg>
        </div>

        {/* Floating orbs for depth */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-circleTel-orange/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

        <div className="relative px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-gradient-to-br from-circleTel-orange to-amber-600 rounded-2xl shadow-lg shadow-orange-500/30">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  B2B Feasibility Check
                </h1>
                <p className="text-white/60 text-sm font-medium mt-0.5">
                  Design V1: Refined Premium
                </p>
              </div>
            </div>
            <p className="text-white/70 max-w-xl text-base leading-relaxed">
              Check multi-site coverage and generate quotes instantly.
              Paste addresses or GPS coordinates below.
            </p>
          </motion.div>
        </div>
      </div>

      {/* 3-Column Form Grid */}
      <div className="px-8">
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

          {/* Client Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group"
          >
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-500 overflow-hidden border border-gray-100">
              {/* Card Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 tracking-tight">Client Details</h2>
                    <p className="text-xs text-gray-500">Business information</p>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-5">
                <div>
                  <Label htmlFor="v1-company" className="text-sm font-semibold text-gray-700">
                    Company Name <span className="text-circleTel-orange">*</span>
                  </Label>
                  <Input
                    id="v1-company"
                    placeholder="Acme Corporation Pty Ltd"
                    value={formData.companyName}
                    onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="mt-2 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-circleTel-orange focus:ring-circleTel-orange/20 transition-all"
                  />
                </div>

                <div>
                  <Label htmlFor="v1-contact" className="text-sm font-semibold text-gray-700">Contact Name</Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="v1-contact"
                      placeholder="John Smith"
                      value={formData.contactName}
                      onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                      className="pl-11 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-circleTel-orange"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="v1-email" className="text-sm font-semibold text-gray-700">Email</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="v1-email"
                      type="email"
                      placeholder="john@acme.co.za"
                      value={formData.contactEmail}
                      onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="pl-11 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-circleTel-orange"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="v1-phone" className="text-sm font-semibold text-gray-700">Phone</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="v1-phone"
                      placeholder="082 123 4567"
                      value={formData.contactPhone}
                      onChange={e => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="pl-11 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-circleTel-orange"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Requirements Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group"
          >
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-500 overflow-hidden border border-gray-100">
              {/* Card Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform duration-300">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 tracking-tight">Requirements</h2>
                    <p className="text-xs text-gray-500">Service specifications</p>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-6">
                {/* Speed Selection */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Speed Requirement</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {speedOptions.map(option => {
                      const isSelected = formData.speedRequirement === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setFormData(prev => ({ ...prev, speedRequirement: option.value }))}
                          className={cn(
                            "relative px-4 py-3 rounded-xl border-2 text-left transition-all duration-200",
                            isSelected
                              ? "border-circleTel-orange bg-gradient-to-br from-orange-50 to-amber-50 shadow-md shadow-orange-200/50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="w-5 h-5 bg-circleTel-orange rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          )}
                          <span className={cn(
                            "block text-sm font-bold",
                            isSelected ? "text-circleTel-orange" : "text-gray-700"
                          )}>
                            {option.label}
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contention Selection */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Contention Level</Label>
                  <div className="space-y-2">
                    {contentionOptions.map(option => {
                      const isSelected = formData.contention === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setFormData(prev => ({ ...prev, contention: option.value }))}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200",
                            isSelected
                              ? "border-circleTel-orange bg-gradient-to-r from-orange-50 to-amber-50 shadow-md shadow-orange-200/50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                              isSelected ? "border-circleTel-orange bg-circleTel-orange" : "border-gray-300"
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="text-left">
                              <span className={cn(
                                "block text-sm font-semibold",
                                isSelected ? "text-circleTel-orange" : "text-gray-700"
                              )}>
                                {option.label}
                              </span>
                              <span className="block text-xs text-gray-500">{option.description}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Budget & Failover */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="v1-budget" className="text-sm font-semibold text-gray-700">Max Budget</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">R</span>
                      <Input
                        id="v1-budget"
                        type="number"
                        placeholder="5,000"
                        value={formData.budget}
                        onChange={e => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                        className="pl-9 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-circleTel-orange"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 cursor-pointer transition-all w-full">
                      <Checkbox
                        checked={formData.needFailover}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needFailover: !!checked }))}
                        className="border-gray-300 data-[state=checked]:bg-circleTel-orange data-[state=checked]:border-circleTel-orange"
                      />
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Failover</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sites Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="group"
          >
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-500 overflow-hidden border border-gray-100 h-full flex flex-col">
              {/* Card Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-300">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 tracking-tight">Sites to Check</h2>
                      <p className="text-xs text-gray-500">One per line</p>
                    </div>
                  </div>
                  {siteCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-lg shadow-emerald-500/30"
                    >
                      <span className="text-xs font-bold text-white">{siteCount} site{siteCount !== 1 ? 's' : ''}</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 flex-1 flex flex-col">
                <Textarea
                  placeholder="123 Main Street, Sandton, Johannesburg&#10;-26.1076, 28.0567&#10;45 Long Street, Cape Town&#10;..."
                  value={formData.sites}
                  onChange={e => setFormData(prev => ({ ...prev, sites: e.target.value }))}
                  className="flex-1 min-h-[200px] bg-gray-50/50 border-gray-200 focus:bg-white focus:border-circleTel-orange resize-none font-mono text-sm leading-relaxed"
                />
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Addresses or GPS coordinates (e.g., -26.1076, 28.0567)
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex justify-center"
        >
          <button className="group relative px-10 py-4 bg-gradient-to-r from-circleTel-orange to-amber-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 hover:scale-[1.02] transition-all duration-300 flex items-center gap-3">
            <span>Check Feasibility</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shine" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
