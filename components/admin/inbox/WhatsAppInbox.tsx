'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PiArrowSquareOutBold,
  PiMagnifyingGlassBold,
  PiPaperPlaneRightBold,
  PiSpinnerBold,
  PiWhatsappLogoBold,
} from 'react-icons/pi';
import { toast } from 'sonner';
import {
  AdminPage,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type InboxChannel = 'sales' | 'support';
type ChannelFilter = 'all' | InboxChannel;

interface InboxThreadSummary {
  id: string;
  channel: InboxChannel;
  title: string;
  phone: string | null;
  ticketId: string | null;
  ticketNumber: string | null;
  deskUrl: string | null;
  preview: string;
  updatedAt: string;
  status: string;
}

interface InboxMessage {
  id: string;
  direction: 'in' | 'out';
  text: string;
  timestamp: string;
  author?: string;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
    'Content-Type': 'application/json',
  };
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function threadMatchesQuery(thread: InboxThreadSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [thread.title, thread.phone, thread.ticketNumber, thread.ticketId, thread.preview]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function WhatsAppInbox() {
  const [channel, setChannel] = useState<ChannelFilter>('all');
  const [query, setQuery] = useState('');
  const [threads, setThreads] = useState<InboxThreadSummary[]>([]);
  const [supportComposerEnabled, setSupportComposerEnabled] = useState(false);
  const [supportComposerReason, setSupportComposerReason] = useState<string | undefined>();
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [detail, setDetail] = useState<InboxThreadSummary | null>(null);
  const [canReply, setCanReply] = useState(false);
  const [cannotReplyReason, setCannotReplyReason] = useState<string | undefined>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async (nextChannel: ChannelFilter) => {
    setListLoading(true);
    setListError(null);
    try {
      const response = await fetch(
        `/api/admin/inbox/threads?channel=${nextChannel}`,
        { headers: authHeaders() }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load conversations');
      }
      setThreads(data.threads || []);
      setSupportComposerEnabled(Boolean(data.supportComposerEnabled));
      setSupportComposerReason(data.supportComposerReason);
    } catch (error) {
      setListError(error instanceof Error ? error.message : String(error));
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadThread = useCallback(async (threadId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(
        `/api/admin/inbox/threads/${encodeURIComponent(threadId)}`,
        { headers: authHeaders() }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Conversation not found');
      }
      setDetail(data.thread);
      setMessages(data.messages || []);
      setCanReply(Boolean(data.canReply));
      setCannotReplyReason(data.cannotReplyReason);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load thread');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads(channel);
  }, [channel, loadThreads]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const filtered = useMemo(
    () => threads.filter((thread) => threadMatchesQuery(thread, query)),
    [threads, query]
  );

  const selected = detail && detail.id === selectedId ? detail : filtered.find((t) => t.id === selectedId) || null;

  const sendReply = async () => {
    if (!selectedId || !draft.trim() || sending) return;
    setSending(true);
    try {
      const response = await fetch(
        `/api/admin/inbox/threads/${encodeURIComponent(selectedId)}/reply`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ text: draft.trim() }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Send failed');
      }
      setDraft('');
      toast.success('Reply sent');
      await loadThread(selectedId);
      await loadThreads(channel);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Support"
        title="WhatsApp Inbox"
        subtitle="Support Instant Messaging and Sales 084 in one place. Desk remains the ticket of record."
        actions={
          <Button variant="outline" onClick={() => void loadThreads(channel)}>
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'support', 'sales'] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={channel === value ? 'cta' : 'outline'}
            onClick={() => setChannel(value)}
          >
            {value === 'all' ? 'All' : value === 'support' ? 'Support IM' : 'Sales 084'}
          </Button>
        ))}
        <div className="relative ml-auto w-full sm:w-72">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone, ticket"
            className="pl-9"
          />
        </div>
      </div>

      {!supportComposerEnabled && supportComposerReason && channel !== 'sales' && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Support composer is read-only. {supportComposerReason}
        </p>
      )}

      {listLoading ? (
        <LoadingState message="Loading WhatsApp conversations…" />
      ) : listError ? (
        <ErrorState
          title="Could not load inbox"
          message={listError}
          onRetry={() => void loadThreads(channel)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4 min-h-[70vh]">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-900">
              Open conversations ({filtered.length})
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={<PiWhatsappLogoBold />}
                  title="No conversations"
                  description="Inbound WhatsApp on Support IM or Sales 084 will appear here."
                />
              ) : (
                filtered.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(thread.id);
                      setDraft('');
                      void loadThread(thread.id);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50',
                      selectedId === thread.id && 'bg-orange-50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-gray-900 truncate">{thread.title}</p>
                      <StatusBadge
                        status={thread.channel === 'sales' ? 'Sales 084' : 'Support IM'}
                        variant={thread.channel === 'sales' ? 'info' : 'success'}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {thread.phone || 'No phone'} · #{thread.ticketNumber || thread.ticketId || '—'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{thread.preview}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-[70vh]">
            {!selectedId ? (
              <EmptyState
                icon={<PiWhatsappLogoBold />}
                title="Select a conversation"
                description="Replies to Sales 084 go out on Cloud API. Support replies use Desk IM when the token allows it."
              />
            ) : detailLoading && !selected ? (
              <LoadingState message="Loading thread…" />
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">{selected?.title || 'Conversation'}</h2>
                    <p className="text-sm text-gray-500">
                      {selected?.phone || 'No phone'}
                      {selected?.ticketNumber ? ` · Ticket #${selected.ticketNumber}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={(selected?.status || 'open').replace(/^./, (c) => c.toUpperCase())}
                      variant={selected?.status === 'closed' ? 'neutral' : 'success'}
                    />
                    {selected?.deskUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selected.deskUrl} target="_blank" rel="noreferrer">
                          <PiArrowSquareOutBold />
                          Desk
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-2">No visible messages yet.</p>
                  ) : (
                    messages.map((msg) => {
                      const outbound = msg.direction === 'out';
                      return (
                        <div
                          key={msg.id}
                          className={cn('flex', outbound ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                              outbound
                                ? 'bg-[#F5831F] text-white rounded-tr-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                            )}
                          >
                            {msg.author && (
                              <p className="font-medium text-xs mb-1 opacity-70">{msg.author}</p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            <p className="text-xs mt-1 opacity-60 text-right">
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={threadEndRef} />
                </div>

                {canReply ? (
                  <div className="p-3 border-t border-gray-100 flex gap-2">
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={
                        selected?.channel === 'sales'
                          ? 'Reply on Sales 084…'
                          : 'Reply via Desk Instant Messaging…'
                      }
                      className="min-h-[72px]"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault();
                          void sendReply();
                        }
                      }}
                    />
                    <Button
                      variant="cta"
                      className="self-end"
                      disabled={!draft.trim() || sending}
                      onClick={() => void sendReply()}
                    >
                      {sending ? <PiSpinnerBold className="animate-spin" /> : <PiPaperPlaneRightBold />}
                      Send
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 border-t border-gray-100 bg-amber-50 text-sm text-amber-900">
                    {cannotReplyReason ||
                      'Reply in Zoho Desk Instant Messaging so the Connected Support number delivers it.'}
                    {selected?.deskUrl && (
                      <a
                        href={selected.deskUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 font-semibold underline"
                      >
                        Open in Desk
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </AdminPage>
  );
}
