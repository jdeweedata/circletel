'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
}

export default function ShareableQuotePage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveShareLink() {
      try {
        // Fetch quote by share token
        const response = await fetch(`/api/quotes/share/${resolvedParams.token}`);
        const data = await response.json();

        if (!data.success || !data.data) {
          setError(data.error || 'Quote not found or link has expired');
          setLoading(false);
          return;
        }

        const quoteId = data.data.quote_id;

        // Track the view
        await fetch(`/api/quotes/business/${quoteId}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'view',
            session_id: sessionStorage.getItem('quote_session_id') || crypto.randomUUID(),
            metadata: {
              via_share_link: true,
              share_token: resolvedParams.token
            }
          })
        });

        // Store session ID for tracking
        if (!sessionStorage.getItem('quote_session_id')) {
          sessionStorage.setItem('quote_session_id', crypto.randomUUID());
        }

        // Redirect to the quote preview page with shared=true query parameter
        router.push(`/quotes/business/${quoteId}/preview?shared=true`);

      } catch (err: any) {
        console.error('Error resolving share link:', err);
        setError('Failed to load quote. Please try again.');
        setLoading(false);
      }
    }

    resolveShareLink();
  }, [resolvedParams.token, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-circleTel-orange mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Quote...</h2>
          <p className="text-gray-600">Please wait while we retrieve your quote.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Quote Not Found</h2>
            <p className="text-red-700">{error}</p>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            This quote link may have expired or been revoked. Please contact CircleTel for assistance.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Email:</strong> quotes@circletel.co.za</p>
            <p><strong>Phone:</strong> +27 87 087 6305</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
