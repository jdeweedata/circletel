import { useState } from 'react';
import { toast } from 'sonner';
import type { CreateCoverageLeadInput, CoverageLead } from '@/lib/types/customer-journey';

interface LeadCaptureResult {
  success: boolean;
  lead?: Partial<CoverageLead>;
  error?: string;
}

interface UseLeadCaptureReturn {
  captureLead: (data: CreateCoverageLeadInput) => Promise<LeadCaptureResult>;
  isSubmitting: boolean;
  error: string | null;
}

export function useLeadCapture(): UseLeadCaptureReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureLead = async (data: CreateCoverageLeadInput): Promise<LeadCaptureResult> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/coverage/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to capture lead');
      }

      if (result.success) {
        toast.success('Thanks! We\'ll notify you when service is available');
        return {
          success: true,
          lead: result.lead,
        };
      } else {
        throw new Error(result.error || 'Failed to capture lead');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    captureLead,
    isSubmitting,
    error,
  };
}
