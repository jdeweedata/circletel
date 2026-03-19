'use client';

import { PiPlusBold } from 'react-icons/pi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function QuotesListHeader() {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Business Quotes
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Manage and track business quote requests.
        </p>
      </div>

      <Button
        onClick={() => router.push('/admin/quotes/new')}
        className="bg-primary hover:bg-primary/90 text-white shadow-sm flex-shrink-0"
      >
        <PiPlusBold className="w-4 h-4 mr-2" />
        New Quote
      </Button>
    </div>
  );
}
