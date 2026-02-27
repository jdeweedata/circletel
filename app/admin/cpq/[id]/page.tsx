'use client';

/**
 * CPQ Wizard Session Page
 *
 * Loads and displays the CPQ wizard for a specific session
 */

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { CPQWizard } from '@/components/cpq/CPQWizard';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CPQSessionPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const handleComplete = (quoteId: string) => {
    toast.success('Quote created successfully!');
    // Redirect to the new quote
    router.push(`/admin/quotes/${quoteId}`);
  };

  const handleCancel = () => {
    router.push('/admin/cpq');
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <CPQWizard
        sessionId={id}
        userType="admin"
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
