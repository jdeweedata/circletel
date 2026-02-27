'use client';

/**
 * useCPQSession Hook
 *
 * Manages CPQ session state, CRUD operations, and synchronization with the API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  CPQSession,
  CPQStepData,
  UpdateSessionRequest,
  CreateSessionRequest,
  UserType,
} from '../types';

interface UseCPQSessionOptions {
  sessionId?: string;
  autoLoad?: boolean;
  onError?: (error: string) => void;
  onSessionLoaded?: (session: CPQSession) => void;
}

interface UseCPQSessionReturn {
  session: CPQSession | null;
  stepData: CPQStepData;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  createSession: (userType: UserType, initialData?: Partial<CPQStepData['needs_assessment']>) => Promise<CPQSession | null>;
  loadSession: (id: string) => Promise<CPQSession | null>;
  updateSession: (updates: UpdateSessionRequest) => Promise<boolean>;
  updateStepData: <K extends keyof CPQStepData>(step: K, data: Partial<NonNullable<CPQStepData[K]>>) => Promise<boolean>;
  setCurrentStep: (step: number) => Promise<boolean>;
  cancelSession: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

const DEFAULT_STEP_DATA: CPQStepData = {
  needs_assessment: {},
  location_coverage: { sites: [], all_sites_checked: false },
  package_selection: { selected_packages: [], ai_recommendations_shown: false },
  configuration: { per_site_config: [] },
  pricing_discounts: {
    discounts: [],
    total_discount_percent: 0,
    total_discount_amount: 0,
    subtotal: 0,
    total: 0,
  },
  customer_details: { company_name: '', primary_contact: {} },
  review_summary: { summary_generated: false },
};

export function useCPQSession(options: UseCPQSessionOptions = {}): UseCPQSessionReturn {
  const { sessionId, autoLoad = true, onError, onSessionLoaded } = options;

  const [session, setSession] = useState<CPQSession | null>(null);
  const [stepData, setStepData] = useState<CPQStepData>(DEFAULT_STEP_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've loaded the session
  const hasLoadedRef = useRef(false);

  // Create a new session
  const createSession = useCallback(
    async (
      userType: UserType,
      initialData?: Partial<CPQStepData['needs_assessment']>
    ): Promise<CPQSession | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const body: CreateSessionRequest = {
          user_type: userType,
          initial_data: initialData,
        };

        const response = await fetch('/api/cpq/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errMsg = data.error || 'Failed to create session';
          setError(errMsg);
          onError?.(errMsg);
          return null;
        }

        setSession(data.session);
        setStepData(data.session.step_data || DEFAULT_STEP_DATA);
        onSessionLoaded?.(data.session);
        return data.session;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to create session';
        setError(errMsg);
        onError?.(errMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [onError, onSessionLoaded]
  );

  // Load an existing session
  const loadSession = useCallback(
    async (id: string): Promise<CPQSession | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/cpq/sessions/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          const errMsg = data.error || 'Failed to load session';
          setError(errMsg);
          onError?.(errMsg);
          return null;
        }

        setSession(data.session);
        setStepData(data.session.step_data || DEFAULT_STEP_DATA);
        onSessionLoaded?.(data.session);
        return data.session;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to load session';
        setError(errMsg);
        onError?.(errMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [onError, onSessionLoaded]
  );

  // Update session with arbitrary fields
  const updateSession = useCallback(
    async (updates: UpdateSessionRequest): Promise<boolean> => {
      if (!session) {
        setError('No session loaded');
        return false;
      }

      setIsSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/cpq/sessions/${session.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errMsg = data.error || 'Failed to update session';
          setError(errMsg);
          onError?.(errMsg);
          return false;
        }

        setSession(data.session);
        setStepData(data.session.step_data || stepData);
        return true;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to update session';
        setError(errMsg);
        onError?.(errMsg);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [session, stepData, onError]
  );

  // Update a specific step's data
  const updateStepData = useCallback(
    async <K extends keyof CPQStepData>(
      step: K,
      data: Partial<NonNullable<CPQStepData[K]>>
    ): Promise<boolean> => {
      // Optimistically update local state
      setStepData((prev) => ({
        ...prev,
        [step]: {
          ...(prev[step] || {}),
          ...data,
        },
      }));

      // Build update request
      const updates: UpdateSessionRequest = {
        [step]: data,
      };

      return updateSession(updates);
    },
    [updateSession]
  );

  // Set the current step
  const setCurrentStep = useCallback(
    async (step: number): Promise<boolean> => {
      return updateSession({ current_step: step });
    },
    [updateSession]
  );

  // Cancel the session
  const cancelSession = useCallback(async (): Promise<boolean> => {
    if (!session) {
      setError('No session loaded');
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/cpq/sessions/${session.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errMsg = data.error || 'Failed to cancel session';
        setError(errMsg);
        onError?.(errMsg);
        return false;
      }

      setSession(null);
      setStepData(DEFAULT_STEP_DATA);
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to cancel session';
      setError(errMsg);
      onError?.(errMsg);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [session, onError]);

  // Refresh session from server
  const refreshSession = useCallback(async (): Promise<void> => {
    if (session) {
      await loadSession(session.id);
    }
  }, [session, loadSession]);

  // Auto-load session if sessionId provided
  useEffect(() => {
    if (sessionId && autoLoad && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadSession(sessionId);
    }
  }, [sessionId, autoLoad, loadSession]);

  return {
    session,
    stepData,
    isLoading,
    isSaving,
    error,
    createSession,
    loadSession,
    updateSession,
    updateStepData,
    setCurrentStep,
    cancelSession,
    refreshSession,
  };
}
