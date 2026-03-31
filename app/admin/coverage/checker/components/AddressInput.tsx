'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PiMapPinBold, PiCrosshairBold, PiWifiHighBold } from 'react-icons/pi';

interface AddressInputProps {
  onCheck: (lat: number, lng: number, address: string) => void;
  isLoading: boolean;
}

const GPS_REGEX = /^(-?\d{1,3}\.?\d*)\s*,\s*(-?\d{1,3}\.?\d*)$/;

export default function AddressInput({ onCheck, isLoading }: AddressInputProps) {
  const [mode, setMode] = useState<'address' | 'gps'>('address');
  const [addressText, setAddressText] = useState('');
  const [gpsText, setGpsText] = useState('');
  const [gpsError, setGpsError] = useState('');
  const [resolved, setResolved] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Attach Google Places Autocomplete when in address mode
  useEffect(() => {
    if (mode !== 'address' || !inputRef.current) return;
    if (typeof google === 'undefined') return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'za' },
      fields: ['geometry', 'formatted_address'],
    });

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || addressText;
      setAddressText(address);
      setResolved({ lat, lng, address });
    });

    autocompleteRef.current = ac;
    return () => {
      google.maps.event.clearInstanceListeners(ac);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function handleGpsParse() {
    setGpsError('');
    const match = GPS_REGEX.exec(gpsText.trim());
    if (!match) {
      setGpsError('Enter coordinates as: -26.8093, 27.8259');
      return;
    }
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (lat < -35 || lat > -22 || lng < 16 || lng > 33) {
      setGpsError('Coordinates outside South Africa bounds');
      return;
    }
    setResolved({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  }

  function handleSubmit() {
    if (mode === 'gps') {
      handleGpsParse();
      if (!resolved) return;
      onCheck(resolved.lat, resolved.lng, resolved.address);
      return;
    }
    if (!resolved) return;
    onCheck(resolved.lat, resolved.lng, resolved.address);
  }

  function handleGpsSubmit() {
    setGpsError('');
    const match = GPS_REGEX.exec(gpsText.trim());
    if (!match) {
      setGpsError('Enter coordinates as: -26.8093, 27.8259');
      return;
    }
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (lat < -35 || lat > -22 || lng < 16 || lng > 33) {
      setGpsError('Coordinates outside South Africa bounds');
      return;
    }
    const address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    onCheck(lat, lng, address);
  }

  const canSubmitAddress = mode === 'address' && resolved !== null;
  const canSubmitGps = mode === 'gps' && gpsText.trim().length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
          <PiWifiHighBold className="text-orange-500 text-lg" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Enter Location</h2>
          <p className="text-xs text-slate-500">Check Tarana FWB coverage availability</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => { setMode('address'); setResolved(null); setAddressText(''); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === 'address'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <PiMapPinBold className="text-sm" />
          Address
        </button>
        <button
          type="button"
          onClick={() => { setMode('gps'); setResolved(null); setGpsText(''); setGpsError(''); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === 'gps'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <PiCrosshairBold className="text-sm" />
          GPS Coords
        </button>
      </div>

      {mode === 'address' ? (
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="e.g. 21 Pringle St, Sasolburg, 1947"
            value={addressText}
            onChange={e => { setAddressText(e.target.value); setResolved(null); }}
            className="flex-1 text-sm"
            onKeyDown={e => { if (e.key === 'Enter' && canSubmitAddress) handleSubmit(); }}
          />
          <Button
            onClick={handleSubmit}
            disabled={!canSubmitAddress || isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
          >
            {isLoading ? 'Checking…' : 'Check Coverage'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="-26.8093, 27.8259"
              value={gpsText}
              onChange={e => { setGpsText(e.target.value); setGpsError(''); }}
              className={`flex-1 text-sm font-mono ${gpsError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
              onKeyDown={e => { if (e.key === 'Enter' && canSubmitGps) handleGpsSubmit(); }}
            />
            <Button
              onClick={handleGpsSubmit}
              disabled={!canSubmitGps || isLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
            >
              {isLoading ? 'Checking…' : 'Check Coverage'}
            </Button>
          </div>
          {gpsError && <p className="text-xs text-red-500">{gpsError}</p>}
          <p className="text-xs text-slate-400">Paste coordinates in decimal degrees: lat, lng</p>
        </div>
      )}
    </div>
  );
}
