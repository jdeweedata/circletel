/**
 * Boundary tests for the shared client-telemetry thresholds.
 *
 * These helpers were extracted specifically so the device page and the client table
 * can't disagree about what counts as a bad score or a slow round-trip — so the
 * boundaries themselves are what's worth pinning.
 */

import {
  LATENCY_FAIR_MS,
  LATENCY_POOR_MS,
  SCORE_FAIR,
  SCORE_POOR,
  formatLatency,
  latencyTone,
  scoreTone,
} from '@/components/admin/network/detail/telemetry-format';

describe('scoreTone', () => {
  it('turns red strictly below the poor threshold', () => {
    expect(scoreTone(SCORE_POOR - 1)).toBe('text-red-600'); // 59
    expect(scoreTone(SCORE_POOR)).not.toBe('text-red-600'); // 60
  });

  it('is amber between the poor and fair thresholds', () => {
    expect(scoreTone(SCORE_POOR)).toBe('text-amber-600'); // 60
    expect(scoreTone(SCORE_FAIR - 1)).toBe('text-amber-600'); // 79
  });

  it('is green from the fair threshold up', () => {
    expect(scoreTone(SCORE_FAIR)).toBe('text-emerald-600'); // 80
    expect(scoreTone(100)).toBe('text-emerald-600');
  });

  it('is muted when the score is unknown', () => {
    expect(scoreTone(null)).toBe('text-slate-400');
    expect(scoreTone(undefined)).toBe('text-slate-400');
    expect(scoreTone(NaN)).toBe('text-slate-400');
  });

  it('treats a genuine 0 as a real (bad) score, not missing data', () => {
    expect(scoreTone(0)).toBe('text-red-600');
  });
});

describe('latencyTone', () => {
  it('is red strictly above the poor threshold', () => {
    expect(latencyTone(LATENCY_POOR_MS + 1)).toBe('text-red-600'); // 151
    expect(latencyTone(LATENCY_POOR_MS)).not.toBe('text-red-600'); // 150
  });

  it('is amber between the fair and poor thresholds', () => {
    expect(latencyTone(LATENCY_FAIR_MS + 1)).toBe('text-amber-600'); // 61
    expect(latencyTone(LATENCY_POOR_MS)).toBe('text-amber-600'); // 150
  });

  it('is neutral at or below the fair threshold', () => {
    expect(latencyTone(LATENCY_FAIR_MS)).toBe('text-slate-700'); // 60
    expect(latencyTone(0)).toBe('text-slate-700');
  });

  it('is muted when latency is unknown', () => {
    expect(latencyTone(null)).toBe('text-slate-400');
    expect(latencyTone(undefined)).toBe('text-slate-400');
  });
});

describe('formatLatency', () => {
  it('shows milliseconds below a second, rounded', () => {
    expect(formatLatency(1)).toBe('1 ms');
    expect(formatLatency(108.4)).toBe('108 ms');
    expect(formatLatency(999)).toBe('999 ms');
  });

  it('switches to seconds at exactly 1000ms', () => {
    expect(formatLatency(1000)).toBe('1.0 s');
    expect(formatLatency(2450)).toBe('2.5 s');
  });

  it('shows a dash when latency is unknown', () => {
    expect(formatLatency(null)).toBe('—');
    expect(formatLatency(undefined)).toBe('—');
    expect(formatLatency(NaN)).toBe('—');
  });
});
