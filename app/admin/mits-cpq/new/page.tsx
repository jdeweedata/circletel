'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MITSCPQWizard } from '@/components/mits-cpq/MITSCPQWizard';
import { Loader2 } from 'lucide-react';

export default function NewMITSQuotePage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/mits-cpq/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to create session');
        }

        if (result.session?.id) {
          setSessionId(result.session.id);
        } else {
          throw new Error('No session ID returned');
        }
      } catch (err) {
        console.error('Error creating session:', err);
        setError(err instanceof Error ? err.message : 'Failed to create session');
      } finally {
        setIsLoading(false);
      }
    };

    createSession();
  }, []);

  const handleComplete = (quoteRef: string) => {
    router.push(`/admin/mits-cpq/quotes/${quoteRef}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange mx-auto" />
          <p className="text-slate-600">Creating new quote...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange mx-auto" />
          <p className="text-slate-600">Loading wizard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <MITSCPQWizard
        sessionId={sessionId}
        isAdmin={true}
        onComplete={handleComplete}
      />
    </div>
  );
}
