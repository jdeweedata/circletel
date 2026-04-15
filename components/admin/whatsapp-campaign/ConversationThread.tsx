'use client';

import { cn } from '@/lib/utils';
import type { CampaignConversation } from '@/lib/integrations/zoho/desk-campaign-service';

interface ConversationThreadProps {
  conversations: CampaignConversation[];
}

export function ConversationThread({ conversations }: ConversationThreadProps) {
  if (!conversations || conversations.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic py-2">No conversation messages.</p>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto p-3 bg-slate-50 rounded-lg">
      {conversations.map((msg) => {
        const isOutbound = msg.direction === 'out';
        const time = new Date(msg.timestamp).toLocaleString('en-ZA', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
        return (
          <div
            key={msg.id}
            className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                isOutbound
                  ? 'bg-[#F5831F] text-white rounded-tr-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
              )}
            >
              <p className="font-medium text-xs mb-1 opacity-70">{msg.author}</p>
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <p className="text-xs mt-1 opacity-60 text-right">{time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
