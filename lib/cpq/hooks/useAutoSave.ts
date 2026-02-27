'use client';

/**
 * useAutoSave Hook
 *
 * Provides debounced auto-save functionality for CPQ sessions
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { CPQStepData, UpdateSessionRequest } from '../types';

interface UseAutoSaveOptions {
  sessionId: string | undefined;
  enabled?: boolean;
  debounceMs?: number;
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: string) => void;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  save: (data: Partial<UpdateSessionRequest>) => void;
  saveNow: (data: Partial<UpdateSessionRequest>) => Promise<boolean>;
  cancel: () => void;
}

export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const {
    sessionId,
    enabled = true,
    debounceMs = 1000,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Store pending data to save
  const pendingDataRef = useRef<Partial<UpdateSessionRequest> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Perform the actual save
  const performSave = useCallback(
    async (data: Partial<UpdateSessionRequest>): Promise<boolean> => {
      if (!sessionId) {
        return false;
      }

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsSaving(true);
      setError(null);
      onSaveStart?.();

      try {
        const response = await fetch(`/api/cpq/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: abortControllerRef.current.signal,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          const errMsg = result.error || 'Failed to save';
          setError(errMsg);
          onSaveError?.(errMsg);
          return false;
        }

        setLastSaved(new Date());
        setError(null);
        onSaveSuccess?.();
        return true;
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return false;
        }

        const errMsg = err instanceof Error ? err.message : 'Failed to save';
        setError(errMsg);
        onSaveError?.(errMsg);
        return false;
      } finally {
        setIsSaving(false);
        abortControllerRef.current = null;
      }
    },
    [sessionId, onSaveStart, onSaveSuccess, onSaveError]
  );

  // Debounced save function
  const save = useCallback(
    (data: Partial<UpdateSessionRequest>) => {
      if (!enabled || !sessionId) {
        return;
      }

      // Merge with pending data
      pendingDataRef.current = {
        ...pendingDataRef.current,
        ...data,
      };

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        if (pendingDataRef.current) {
          const dataToSave = { ...pendingDataRef.current };
          pendingDataRef.current = null;
          await performSave(dataToSave);
        }
      }, debounceMs);
    },
    [enabled, sessionId, debounceMs, performSave]
  );

  // Immediate save (bypasses debounce)
  const saveNow = useCallback(
    async (data: Partial<UpdateSessionRequest>): Promise<boolean> => {
      if (!enabled || !sessionId) {
        return false;
      }

      // Clear pending debounced save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Merge with any pending data
      const mergedData = {
        ...pendingDataRef.current,
        ...data,
      };
      pendingDataRef.current = null;

      return performSave(mergedData);
    },
    [enabled, sessionId, performSave]
  );

  // Cancel pending save
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    pendingDataRef.current = null;
    setIsSaving(false);
  }, []);

  return {
    isSaving,
    lastSaved,
    error,
    save,
    saveNow,
    cancel,
  };
}

/**
 * Hook for auto-saving step data with optimistic updates
 */
interface UseStepAutoSaveOptions {
  sessionId: string | undefined;
  stepKey: keyof CPQStepData;
  enabled?: boolean;
  debounceMs?: number;
  onSaveError?: (error: string) => void;
}

interface UseStepAutoSaveReturn<T> {
  isSaving: boolean;
  lastSaved: Date | null;
  updateAndSave: (partialData: Partial<T>) => void;
}

export function useStepAutoSave<T extends CPQStepData[keyof CPQStepData]>(
  options: UseStepAutoSaveOptions
): UseStepAutoSaveReturn<T> {
  const { sessionId, stepKey, enabled = true, debounceMs = 1000, onSaveError } = options;

  const { isSaving, lastSaved, save } = useAutoSave({
    sessionId,
    enabled,
    debounceMs,
    onSaveError,
  });

  const updateAndSave = useCallback(
    (partialData: Partial<T>) => {
      save({ [stepKey]: partialData });
    },
    [save, stepKey]
  );

  return {
    isSaving,
    lastSaved,
    updateAndSave,
  };
}
