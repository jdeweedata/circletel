'use client';

import React, { useState, useEffect } from 'react';
import { ZoneHeatMap } from '@/components/admin/sales-engine/ZoneHeatMap';
import type { SalesZone } from '@/lib/sales-engine/types';

export default function SalesEngineMapPage() {
  const [zones, setZones] = useState<SalesZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<SalesZone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchZones() {
      try {
        const res = await fetch('/api/admin/sales-engine/zones?status=active');
        const json = await res.json();
        setZones(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        console.error('Failed to fetch zones:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchZones();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Territory Heat Map</h1>
        <p className="text-gray-500 mt-1">Geographic visualization of sales zones and penetration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg border border-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange" />
            </div>
          ) : (
            <ZoneHeatMap
              zones={zones}
              onZoneSelect={setSelectedZone}
              selectedZoneId={selectedZone?.id}
              height="600px"
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Zone Detail */}
          {selectedZone ? (
            <div className="bg-white border border-circleTel-orange/30 rounded-lg p-4 shadow-sm">
              <h3 className="font-bold text-gray-900">{selectedZone.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{selectedZone.zone_type.replace('_', ' ')} — {selectedZone.suburb || selectedZone.province}</p>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Zone Score</span>
                  <span className={`font-bold ${
                    Number(selectedZone.zone_score) >= 70 ? 'text-green-600' :
                    Number(selectedZone.zone_score) >= 40 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {Number(selectedZone.zone_score).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Penetration</span>
                  <span className="font-medium text-gray-900">{Number(selectedZone.penetration_rate).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Active Customers</span>
                  <span className="font-medium text-gray-900">{selectedZone.active_customers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Serviceable</span>
                  <span className="font-medium text-gray-900">{selectedZone.serviceable_addresses}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">SME Density</span>
                  <span className="font-medium text-gray-900">{selectedZone.sme_density_score}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Competitor Weakness</span>
                  <span className="font-medium text-gray-900">{selectedZone.competitor_weakness_score}/100</span>
                </div>
              </div>

              {selectedZone.notes && (
                <p className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">{selectedZone.notes}</p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Click a zone on the map to see details</p>
            </div>
          )}

          {/* Zone List */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">
                All Zones ({zones.length})
              </h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    selectedZone?.id === zone.id ? 'bg-circleTel-orange/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{zone.name}</p>
                      <p className="text-xs text-gray-400">{zone.active_customers} customers</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      Number(zone.zone_score) >= 70 ? 'bg-green-100 text-green-700' :
                      Number(zone.zone_score) >= 40 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {Number(zone.zone_score).toFixed(0)}
                    </span>
                  </div>
                </button>
              ))}
              {zones.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">No active zones</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
