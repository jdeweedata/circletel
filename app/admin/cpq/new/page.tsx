'use client';
import { PiSpinnerBold } from 'react-icons/pi';

/**
 * Create New CPQ Session
 *
 * Creates a new session and redirects to the wizard
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewCPQSessionPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createSession = async () => {
      if (isCreating) return;

      setIsCreating(true);
      setError(null);

      try {
        const response = await fetch('/api/cpq/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_type: 'admin',
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          setError(result.error || 'Failed to create session');
          toast.error(result.error || 'Failed to create session');
          return;
        }

        // Redirect to the wizard
        router.replace(`/admin/cpq/${result.session.id}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create session';
        setError(message);
        toast.error(message);
      }
    };

    createSession();
  }, [router, isCreating]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => router.push('/admin/cpq')}
              className="text-circleTel-orange underline"
            >
              Go back to dashboard
            </button>
          </>
        ) : (
          <>
            <PiSpinnerBold className="h-8 w-8 animate-spin mx-auto text-circleTel-orange" />
            <p className="mt-4 text-gray-500">Creating new quote session...</p>
          </>
        )}
      </div>
    </div>
  );
}
