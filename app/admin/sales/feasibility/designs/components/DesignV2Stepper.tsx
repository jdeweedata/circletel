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
  ArrowLeft,
  Check,
  Shield,
  FileSearch,
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FormData, defaultFormData, parseSites, getCompletionStatus } from '../shared/form-data';
import { speedOptions, contentionOptions } from '../shared/options-config';

// Design V2: Vertical Stepper/Wizard
// Guided step-by-step flow with progress bar
// Aesthetic: Soft, approachable, focused - one thing at a time

const steps = [
  { id: 1, label: 'Client', icon: Building2, description: 'Business details' },
  { id: 2, label: 'Requirements', icon: Zap, description: 'Service specs' },
  { id: 3, label: 'Sites', icon: MapPin, description: 'Locations' },
  { id: 4, label: 'Review', icon: FileSearch, description: 'Confirm & submit' },
];

export function DesignV2Stepper() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const siteCount = parseSites(formData.sites).length;
  const completionStatus = getCompletionStatus(formData);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return Boolean(formData.companyName);
      case 2: return Boolean(formData.speedRequirement && formData.contention);
      case 3: return siteCount > 0;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-12">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-3xl mx-auto px-8 py-6">
          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isUpcoming = currentStep < step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => !isUpcoming && setCurrentStep(step.id)}
                    disabled={isUpcoming}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-300",
                      isActive && "bg-circleTel-orange/10",
                      isCompleted && "cursor-pointer hover:bg-emerald-50",
                      isUpcoming && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                      isActive && "bg-gradient-to-br from-circleTel-orange to-amber-500 shadow-lg shadow-orange-300/50 scale-110",
                      isCompleted && "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-300/50",
                      isUpcoming && "bg-gray-100"
                    )}>
                      {isCompleted ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className={cn(
                          "w-6 h-6",
                          isActive ? "text-white" : "text-gray-400"
                        )} />
                      )}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className={cn(
                        "text-sm font-semibold",
                        isActive && "text-circleTel-orange",
                        isCompleted && "text-emerald-600",
                        isUpcoming && "text-gray-400"
                      )}>
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </button>

                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-2 hidden sm:block">
                      <div className={cn(
                        "h-1 rounded-full transition-all duration-500",
                        isCompleted ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gray-200"
                      )} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-2xl mx-auto px-8 pt-10">
        <AnimatePresence mode="wait">
          {/* Step 1: Client Details */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-xl shadow-blue-500/30 mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Client Details</h2>
                <p className="text-gray-500 mt-2">Tell us about your business client</p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-6">
                <div>
                  <Label htmlFor="v2-company" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Company Name <span className="text-circleTel-orange">*</span>
                  </Label>
                  <Input
                    id="v2-company"
                    placeholder="Enter company name"
                    value={formData.companyName}
                    onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="h-14 text-lg bg-gray-50 border-gray-200 focus:bg-white focus:border-circleTel-orange rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="v2-contact" className="text-sm font-semibold text-gray-700 mb-2 block">Contact Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="v2-contact"
                        placeholder="John Smith"
                        value={formData.contactName}
                        onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        className="h-14 pl-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-circleTel-orange rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="v2-phone" className="text-sm font-semibold text-gray-700 mb-2 block">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="v2-phone"
                        placeholder="082 123 4567"
                        value={formData.contactPhone}
                        onChange={e => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                        className="h-14 pl-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-circleTel-orange rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="v2-email" className="text-sm font-semibold text-gray-700 mb-2 block">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="v2-email"
                      type="email"
                      placeholder="john@company.co.za"
                      value={formData.contactEmail}
                      onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="h-14 pl-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-circleTel-orange rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Requirements */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl shadow-xl shadow-violet-500/30 mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Service Requirements</h2>
                <p className="text-gray-500 mt-2">What does the client need?</p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-8">
                {/* Speed Selection */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-4 block">Speed Requirement</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {speedOptions.map(option => {
                      const isSelected = formData.speedRequirement === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setFormData(prev => ({ ...prev, speedRequirement: option.value }))}
                          className={cn(
                            "relative p-5 rounded-2xl border-2 text-left transition-all duration-200",
                            isSelected
                              ? "border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 shadow-lg"
                              : "border-gray-200 hover:border-violet-300 bg-white hover:bg-gray-50"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <span className={cn(
                            "block text-lg font-bold",
                            isSelected ? "text-violet-600" : "text-gray-700"
                          )}>
                            {option.label}
                          </span>
                          <span className="block text-sm text-gray-500 mt-1">{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contention Selection */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-4 block">Contention Level</Label>
                  <div className="space-y-3">
                    {contentionOptions.map(option => {
                      const isSelected = formData.contention === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setFormData(prev => ({ ...prev, contention: option.value }))}
                          className={cn(
                            "w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4",
                            isSelected
                              ? "border-violet-500 bg-gradient-to-r from-violet-50 to-purple-50 shadow-lg"
                              : "border-gray-200 hover:border-violet-300 bg-white hover:bg-gray-50"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                            isSelected ? "border-violet-500 bg-violet-500" : "border-gray-300"
                          )}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1">
                            <span className={cn(
                              "block text-base font-semibold",
                              isSelected ? "text-violet-600" : "text-gray-700"
                            )}>
                              {option.label}
                            </span>
                            <span className="block text-sm text-gray-500">{option.fullDescription}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Budget & Failover */}
                <div className="flex gap-6 items-end">
                  <div className="flex-1">
                    <Label htmlFor="v2-budget" className="text-sm font-semibold text-gray-700 mb-2 block">Monthly Budget</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">R</span>
                      <Input
                        id="v2-budget"
                        type="number"
                        placeholder="5,000"
                        value={formData.budget}
                        onChange={e => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                        className="h-14 pl-10 text-lg bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500 rounded-xl"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 h-14 px-6 rounded-xl border-2 border-gray-200 hover:border-violet-300 cursor-pointer transition-all bg-white">
                    <Checkbox
                      checked={formData.needFailover}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needFailover: !!checked }))}
                      className="border-gray-300 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                    />
                    <Shield className="w-5 h-5 text-gray-500" />
                    <span className="text-base font-medium text-gray-700">Failover Required</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Sites */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-xl shadow-emerald-500/30 mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Sites to Check</h2>
                <p className="text-gray-500 mt-2">Enter addresses or GPS coordinates, one per line</p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-sm font-semibold text-gray-700">Locations</Label>
                  {siteCount > 0 && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                      {siteCount} site{siteCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <Textarea
                  placeholder="123 Main Street, Sandton, Johannesburg&#10;-26.1076, 28.0567&#10;45 Long Street, Cape Town&#10;Suite 401, Rosebank Office Park, 191 Jan Smuts Ave"
                  value={formData.sites}
                  onChange={e => setFormData(prev => ({ ...prev, sites: e.target.value }))}
                  className="min-h-[280px] bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-500 rounded-xl font-mono text-sm leading-relaxed resize-none"
                />
                <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    Physical addresses
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    GPS coordinates (lat, lng)
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-gradient-to-br from-circleTel-orange to-amber-500 rounded-3xl shadow-xl shadow-orange-500/30 mb-4">
                  <FileSearch className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
                <p className="text-gray-500 mt-2">Confirm the details before checking feasibility</p>
              </div>

              <div className="space-y-4">
                {/* Client Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Client</h3>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-sm text-circleTel-orange font-medium hover:underline flex items-center gap-1"
                    >
                      Edit <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Company</span>
                      <p className="font-medium text-gray-900">{formData.companyName || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Contact</span>
                      <p className="font-medium text-gray-900">{formData.contactName || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email</span>
                      <p className="font-medium text-gray-900">{formData.contactEmail || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone</span>
                      <p className="font-medium text-gray-900">{formData.contactPhone || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Requirements Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-100 rounded-xl">
                        <Zap className="w-5 h-5 text-violet-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Requirements</h3>
                    </div>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-sm text-circleTel-orange font-medium hover:underline flex items-center gap-1"
                    >
                      Edit <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                      {speedOptions.find(s => s.value === formData.speedRequirement)?.label}
                    </span>
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {contentionOptions.find(c => c.value === formData.contention)?.label}
                    </span>
                    {formData.budget && (
                      <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                        R{formData.budget}/month
                      </span>
                    )}
                    {formData.needFailover && (
                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Failover
                      </span>
                    )}
                  </div>
                </div>

                {/* Sites Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Sites ({siteCount})</h3>
                    </div>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="text-sm text-circleTel-orange font-medium hover:underline flex items-center gap-1"
                    >
                      Edit <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {parseSites(formData.sites).map((site, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 font-mono truncate">{site}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-10 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 1}
            className={cn(
              "h-14 px-8 text-base rounded-xl",
              currentStep === 1 && "opacity-0 pointer-events-none"
            )}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="h-14 px-8 text-base rounded-xl bg-gradient-to-r from-circleTel-orange to-amber-500 hover:from-circleTel-orange hover:to-amber-400 shadow-lg shadow-orange-300/50"
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              className="h-14 px-10 text-base rounded-xl bg-gradient-to-r from-circleTel-orange to-amber-500 hover:from-circleTel-orange hover:to-amber-400 shadow-xl shadow-orange-300/50"
            >
              <span>Check Feasibility</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
