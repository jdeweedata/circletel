'use client';

import { useState, useEffect, useRef } from 'react';
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
  Navigation,
  Crosshair
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { FormData, defaultFormData, parseSites, isGPSCoordinate, parseCoordinates } from '../shared/form-data';
import { speedOptions, contentionOptions } from '../shared/options-config';

// Design V3: Split-Screen Map View
// Live visual feedback as you add addresses
// Aesthetic: Cartographic, data-driven, technical but accessible

// Mock map markers for demonstration
interface MapMarker {
  id: string;
  label: string;
  type: 'address' | 'gps';
}

export function DesignV3MapView() {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  const sites = parseSites(formData.sites);

  // Update markers when sites change
  useEffect(() => {
    const newMarkers = sites.map((site, index) => ({
      id: `marker-${index}`,
      label: site,
      type: isGPSCoordinate(site) ? 'gps' as const : 'address' as const
    }));
    setMarkers(newMarkers);
  }, [formData.sites]);

  return (
    <div className="h-[calc(100vh-140px)] flex">
      {/* Left Panel: Form */}
      <div className="w-[420px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Form Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-circleTel-navy rounded-xl">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Feasibility Check</h2>
              <p className="text-xs text-gray-500">Sites appear on map as you type</p>
            </div>
          </div>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Client Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Client</span>
              </div>

              <Input
                placeholder="Company Name *"
                value={formData.companyName}
                onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 rounded-lg"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Contact"
                    value={formData.contactName}
                    onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    className="h-11 pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 rounded-lg text-sm"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Phone"
                    value={formData.contactPhone}
                    onChange={e => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="h-11 pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="h-11 pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Requirements Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Requirements</span>
              </div>

              {/* Speed Pills */}
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Speed</Label>
                <div className="flex flex-wrap gap-2">
                  {speedOptions.map(option => {
                    const isSelected = formData.speedRequirement === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormData(prev => ({ ...prev, speedRequirement: option.value }))}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all",
                          isSelected
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {option.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contention Pills */}
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Contention</Label>
                <div className="flex flex-wrap gap-2">
                  {contentionOptions.map(option => {
                    const isSelected = formData.contention === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFormData(prev => ({ ...prev, contention: option.value }))}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all",
                          isSelected
                            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {option.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget & Failover */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">R</span>
                  <Input
                    type="number"
                    placeholder="Budget"
                    value={formData.budget}
                    onChange={e => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    className="h-11 pl-8 bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500 rounded-lg text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-violet-300 cursor-pointer transition-all bg-white">
                  <Checkbox
                    checked={formData.needFailover}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needFailover: !!checked }))}
                    className="border-gray-300 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                  />
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Failover</span>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Sites Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Sites</span>
                </div>
                {sites.length > 0 && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    {sites.length}
                  </span>
                )}
              </div>

              <Textarea
                placeholder="123 Main Street, Sandton&#10;-26.1076, 28.0567&#10;45 Long Street, Cape Town"
                value={formData.sites}
                onChange={e => setFormData(prev => ({ ...prev, sites: e.target.value }))}
                className="min-h-[180px] bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-500 rounded-lg font-mono text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA */}
        <div className="p-4 border-t border-gray-200 bg-gradient-to-t from-white to-gray-50/80">
          <button className="w-full h-14 bg-gradient-to-r from-circleTel-orange to-amber-500 text-white font-bold text-base rounded-xl shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
            <span>Check Feasibility</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Panel: Map */}
      <div className="flex-1 relative bg-gray-100">
        {/* Map Placeholder with South Africa styling */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="map-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M0 60V0h60" stroke="#94a3b8" strokeWidth="0.5" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#map-grid)" />
            </svg>
          </div>

          {/* South Africa silhouette hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <svg viewBox="0 0 200 160" className="w-[500px] h-[400px]">
              <path
                d="M40,120 Q50,80 80,60 Q100,40 140,50 Q170,60 180,90 Q175,120 150,140 Q110,150 70,140 Q45,130 40,120 Z"
                fill="#1e3a5f"
              />
            </svg>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50">
              +
            </button>
            <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50">
              −
            </button>
            <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50">
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {/* Marker Legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl p-4 shadow-xl">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Map Legend</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
                <span className="text-gray-700">Address</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
                <span className="text-gray-700">GPS Coordinate</span>
              </div>
            </div>
          </div>

          {/* Dynamic Markers */}
          {markers.length > 0 && (
            <div className="absolute inset-0">
              {markers.map((marker, index) => {
                // Distribute markers randomly for visual effect (in real impl, use geocoded positions)
                const left = 20 + (index * 15 % 60);
                const top = 20 + (index * 20 % 50);

                return (
                  <motion.div
                    key={marker.id}
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', bounce: 0.4, delay: index * 0.1 }}
                    className="absolute"
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    <div className="relative">
                      {/* Marker Pin */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shadow-xl text-white font-bold text-xs",
                        marker.type === 'gps'
                          ? "bg-blue-500 shadow-blue-500/50"
                          : "bg-emerald-500 shadow-emerald-500/50"
                      )}>
                        {index + 1}
                      </div>
                      {/* Pin Point */}
                      <div className={cn(
                        "absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0",
                        "border-l-[8px] border-r-[8px] border-t-[10px]",
                        "border-l-transparent border-r-transparent",
                        marker.type === 'gps'
                          ? "border-t-blue-500"
                          : "border-t-emerald-500"
                      )} />
                      {/* Pulse */}
                      <div className={cn(
                        "absolute inset-0 rounded-full animate-ping opacity-30",
                        marker.type === 'gps' ? "bg-blue-500" : "bg-emerald-500"
                      )} />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {marker.label.length > 30 ? marker.label.slice(0, 30) + '...' : marker.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {markers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200/50 flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Enter sites to see them on the map</p>
                <p className="text-gray-400 text-sm mt-1">Addresses & GPS coordinates supported</p>
              </div>
            </div>
          )}

          {/* Sites counter overlay */}
          {markers.length > 0 && (
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-xl px-4 py-2 shadow-xl">
              <span className="text-2xl font-bold text-gray-900">{markers.length}</span>
              <span className="text-sm text-gray-500 ml-1">site{markers.length !== 1 ? 's' : ''} plotted</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
