'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';

interface ManualSyncFormProps {
  onSync: (entityType: string, entityId: string) => Promise<void>;
  isRetrying?: boolean;
}

/**
 * ManualSyncForm - Form to trigger manual Zoho sync for a specific entity
 */
export function ManualSyncForm({
  onSync,
  isRetrying = false,
}: ManualSyncFormProps) {
  const [entityType, setEntityType] = useState<string>('invoice');
  const [entityId, setEntityId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId.trim()) {
      alert('Please enter an Entity ID');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSync(entityType, entityId.trim());
      setEntityId(''); // Clear on success
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Entity Type
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg text-sm bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
          >
            <option value="customer">Customer</option>
            <option value="subscription">Subscription</option>
            <option value="invoice">Invoice</option>
            <option value="payment">Payment</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Entity ID (UUID)
          </label>
          <input
            type="text"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="e.g., 9af1d593-ce38-4b34-8d2b-446a7f7f57ad"
            className="w-full border px-3 py-2 rounded-lg text-sm bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange font-mono"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || isRetrying || !entityId.trim()}
          className="bg-circleTel-orange hover:bg-circleTel-orange/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Trigger Sync
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
