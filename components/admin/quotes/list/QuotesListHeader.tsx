'use client';

import { PiPlusBold } from 'react-icons/pi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/backend';

export function QuotesListHeader() {
  const router = useRouter();

  return (
    <PageHeader
      title="Business Quotes"
      subtitle="Manage and track business quote requests."
      actions={
        <Button
          onClick={() => router.push('/admin/quotes/new')}
          className="bg-circleTel-orange hover:bg-orange-600"
        >
          <PiPlusBold className="mr-2 h-4 w-4" />
          New Quote
        </Button>
      }
    />
  );
}
