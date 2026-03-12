'use client';

/**
 * MITS CPQ React Hooks
 *
 * Client-side data fetching hooks for MITS catalogue data.
 * All hooks follow the {data, loading, error, refetch} pattern.
 */

import { useState, useEffect, useCallback } from 'react';
import type { MITSTier, MITSM365Pricing, MITSModule } from './types';
import { isModuleAvailableForTier } from './pricing-calculator';

// ============================================================================
// TYPES
// ============================================================================

interface UseMITSTiersResult {
  tiers: MITSTier[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseMITSM365PricingResult {
  m365Pricing: MITSM365Pricing[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseMITSModulesResult {
  modules: MITSModule[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  /** Returns only modules available for the given tier code */
  getAvailableModules: (tierCode: string) => MITSModule[];
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Fetches active MITS tiers and M365 pricing from /api/mits-cpq/tiers.
 * Returns tiers sorted by sort_order ascending.
 */
export function useMITSTiers(): UseMITSTiersResult {
  const [tiers, setTiers] = useState<MITSTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/mits-cpq/tiers');
        if (!res.ok) {
          throw new Error(`Failed to load tiers: ${res.status} ${res.statusText}`);
        }
        const json = await res.json() as { tiers?: MITSTier[]; error?: string };
        if (json.error) {
          throw new Error(json.error);
        }
        if (!cancelled) {
          setTiers(Array.isArray(json.tiers) ? json.tiers : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setTiers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchCount]);

  return { tiers, loading, error, refetch };
}

/**
 * Fetches active M365 pricing from /api/mits-cpq/tiers (same endpoint, separate field).
 * Returns pricing records sorted by csp_cost ascending.
 */
export function useMITSM365Pricing(): UseMITSM365PricingResult {
  const [m365Pricing, setM365Pricing] = useState<MITSM365Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/mits-cpq/tiers');
        if (!res.ok) {
          throw new Error(`Failed to load M365 pricing: ${res.status} ${res.statusText}`);
        }
        const json = await res.json() as { m365Pricing?: MITSM365Pricing[]; error?: string };
        if (json.error) {
          throw new Error(json.error);
        }
        if (!cancelled) {
          setM365Pricing(Array.isArray(json.m365Pricing) ? json.m365Pricing : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setM365Pricing([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchCount]);

  return { m365Pricing, loading, error, refetch };
}

/**
 * Fetches active MITS modules from /api/mits-cpq/modules.
 * Provides getAvailableModules(tierCode) to filter by tier eligibility.
 */
export function useMITSModules(): UseMITSModulesResult {
  const [modules, setModules] = useState<MITSModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/mits-cpq/modules');
        if (!res.ok) {
          throw new Error(`Failed to load modules: ${res.status} ${res.statusText}`);
        }
        const json = await res.json() as { modules?: MITSModule[]; error?: string };
        if (json.error) {
          throw new Error(json.error);
        }
        if (!cancelled) {
          setModules(Array.isArray(json.modules) ? json.modules : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setModules([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchCount]);

  /**
   * Returns modules whose available_from_tier is at or below the given tier.
   * Sorted by sort_order ascending.
   */
  const getAvailableModules = useCallback(
    (tierCode: string): MITSModule[] => {
      return modules
        .filter((m) => m.is_active && isModuleAvailableForTier(m.available_from_tier, tierCode))
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    [modules]
  );

  return { modules, loading, error, refetch, getAvailableModules };
}
