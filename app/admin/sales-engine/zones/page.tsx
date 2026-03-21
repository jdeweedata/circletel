'use client';

import { PiArrowsClockwiseBold, PiMapPinBold, PiPlusBold, PiTargetBold, PiXBold } from 'react-icons/pi';
import React, { useState, useEffect, useCallback } from 'react';
import { StatCard } from '@/components/admin/shared/StatCard';
import type { SalesZone, CreateZoneInput, ZoneType, ZonePriority } from '@/lib/sales-engine/types';

const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  office_park: 'Office Park',
  commercial_strip: 'Commercial Strip',
  clinic_cluster: 'Clinic Cluster',
  residential_estate: 'Residential Estate',
  mixed: 'Mixed',
};

export default function ZonesPage() {
  const [zones, setZones] = useState<SalesZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState<SalesZone | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/sales-engine/zones?${params}`);
      const json = await res.json();
      setZones(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  async function handleSaveZone(formData: CreateZoneInput) {
    try {
      setSaving(true);
      const url = '/api/admin/sales-engine/zones';
      const method = editingZone ? 'PUT' : 'POST';
      const body = editingZone ? { ...formData, id: editingZone.id } : formData;

      // For updates, use the [id] route
      const finalUrl = editingZone ? `${url}/${editingZone.id}` : url;
      const finalMethod = editingZone ? 'PUT' : 'POST';

      const res = await fetch(finalUrl, {
        method: finalMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setEditingZone(null);
        fetchZones();
      }
    } catch (error) {
      console.error('Failed to save zone:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleEnrichAll() {
    try {
      setEnriching(true);
      await fetch('/api/admin/sales-engine/zones?enrich=true');
      fetchZones();
    } catch (error) {
      console.error('Failed to enrich zones:', error);
    } finally {
      setEnriching(false);
    }
  }

  async function handleDeleteZone(id: string) {
    if (!confirm('Park this zone? It will be marked as inactive.')) return;
    try {
      await fetch(`/api/admin/sales-engine/zones/${id}`, { method: 'DELETE' });
      fetchZones();
    } catch (error) {
      console.error('Failed to delete zone:', error);
    }
  }

  const activeZones = zones.filter((z) => z.status === 'active');
  const avgScore = activeZones.length > 0
    ? activeZones.reduce((sum, z) => sum + Number(z.zone_score), 0) / activeZones.length
    : 0;
  const avgPenetration = activeZones.length > 0
    ? activeZones.reduce((sum, z) => sum + Number(z.penetration_rate), 0) / activeZones.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Zones</h1>
          <p className="text-gray-500 mt-1">Territory intelligence map — manage and score your sales zones</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEnrichAll}
            disabled={enriching}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <PiArrowsClockwiseBold className={`h-4 w-4 ${enriching ? 'animate-spin' : ''}`} />
            {enriching ? 'Enriching...' : 'Enrich Coverage'}
          </button>
          <button
            onClick={() => { setEditingZone(null); setShowCreateModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-circleTel-orange text-white rounded-lg text-sm font-medium hover:bg-circleTel-orange/90"
          >
            <PiPlusBold className="h-4 w-4" />
            Add Zone
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Zones" value={zones.length} />
        <StatCard label="Active Zones" value={activeZones.length} />
        <StatCard label="Avg Zone Score" value={avgScore.toFixed(1)} />
        <StatCard label="Avg Penetration" value={`${avgPenetration.toFixed(1)}%`} />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'active', 'parked', 'saturated'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              statusFilter === status
                ? 'bg-circleTel-orange text-white border-circleTel-orange'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Zones Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange" />
          </div>
        ) : zones.length === 0 ? (
          <div className="text-center py-12">
            <PiTargetBold className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No zones found. Create your first sales zone to start.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Zone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Coverage</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Infrastructure</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Penetration</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customers</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Addresses</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{zone.name}</p>
                    {zone.suburb && <p className="text-xs text-gray-400">{zone.suburb}, {zone.province}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {ZONE_TYPE_LABELS[zone.zone_type]}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      Number(zone.zone_score) >= 70 ? 'bg-green-100 text-green-700' :
                      Number(zone.zone_score) >= 40 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {Number(zone.zone_score).toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {zone.coverage_confidence ? (
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        zone.coverage_confidence === 'high' ? 'bg-green-100 text-green-700' :
                        zone.coverage_confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                        zone.coverage_confidence === 'low' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {zone.coverage_confidence}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600">
                    {zone.base_station_count > 0 || zone.dfa_connected_count > 0 ? (
                      <span>{zone.base_station_count} BS / {zone.dfa_connected_count + zone.dfa_near_net_count} DFA</span>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                    {Number(zone.penetration_rate).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                    {zone.active_customers}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                    {zone.serviceable_addresses}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      zone.priority === 'high' ? 'bg-red-100 text-red-700' :
                      zone.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {zone.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      zone.status === 'active' ? 'bg-green-100 text-green-700' :
                      zone.status === 'parked' ? 'bg-gray-100 text-gray-500' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {zone.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingZone(zone); setShowCreateModal(true); }}
                        className="text-sm text-gray-500 hover:text-circleTel-orange"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteZone(zone.id)}
                        className="text-sm text-gray-400 hover:text-red-500"
                      >
                        Park
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <ZoneFormModal
          zone={editingZone}
          onClose={() => { setShowCreateModal(false); setEditingZone(null); }}
          onSave={handleSaveZone}
          saving={saving}
        />
      )}
    </div>
  );
}

// Zone Create/Edit Modal
function ZoneFormModal({
  zone,
  onClose,
  onSave,
  saving,
}: {
  zone: SalesZone | null;
  onClose: () => void;
  onSave: (data: CreateZoneInput) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<CreateZoneInput>({
    name: zone?.name ?? '',
    zone_type: zone?.zone_type ?? 'commercial_strip',
    description: zone?.description ?? '',
    center_lat: zone?.center_lat ?? -25.7479,
    center_lng: zone?.center_lng ?? 28.2293,
    sme_density_score: zone?.sme_density_score ?? 50,
    penetration_rate: zone ? Number(zone.penetration_rate) : 0,
    competitor_weakness_score: zone?.competitor_weakness_score ?? 50,
    serviceable_addresses: zone?.serviceable_addresses ?? 0,
    active_customers: zone?.active_customers ?? 0,
    priority: zone?.priority ?? 'medium',
    province: zone?.province ?? 'Gauteng',
    suburb: zone?.suburb ?? '',
    notes: zone?.notes ?? '',
  });

  function handleChange(field: keyof CreateZoneInput, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{zone ? 'Edit Zone' : 'Create New Zone'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <PiXBold className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
                placeholder="e.g., Midrand Business Parks"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone Type</label>
              <select
                value={form.zone_type}
                onChange={(e) => handleChange('zone_type', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
              >
                {Object.entries(ZONE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              <input
                type="text"
                value={form.province ?? ''}
                onChange={(e) => handleChange('province', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
              <input
                type="text"
                value={form.suburb ?? ''}
                onChange={(e) => handleChange('suburb', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Center Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={form.center_lat}
                onChange={(e) => handleChange('center_lat', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Center Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={form.center_lng}
                onChange={(e) => handleChange('center_lng', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
              />
            </div>
          </div>

          {/* Scoring Inputs */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Zone Scoring Inputs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SME Density Score (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.sme_density_score ?? 0}
                  onChange={(e) => handleChange('sme_density_score', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
                />
                <p className="text-xs text-gray-400 mt-1">Weight: 40%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Competitor Weakness Score (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.competitor_weakness_score ?? 0}
                  onChange={(e) => handleChange('competitor_weakness_score', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
                />
                <p className="text-xs text-gray-400 mt-1">Weight: 20%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serviceable Addresses
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.serviceable_addresses ?? 0}
                  onChange={(e) => handleChange('serviceable_addresses', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Active Customers
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.active_customers ?? 0}
                  onChange={(e) => handleChange('active_customers', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
              placeholder="Additional notes about this zone..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name}
            className="px-4 py-2 text-sm font-medium text-white bg-circleTel-orange rounded-lg hover:bg-circleTel-orange/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : zone ? 'Update Zone' : 'Create Zone'}
          </button>
        </div>
      </div>
    </div>
  );
}
