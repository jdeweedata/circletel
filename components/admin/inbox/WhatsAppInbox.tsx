'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PiArrowLeftBold,
  PiArrowSquareOutBold,
  PiClockBold,
  PiMagnifyingGlassBold,
  PiPaperPlaneRightBold,
  PiPhoneBold,
  PiSpinnerBold,
  PiTicketBold,
  PiWhatsappLogoBold,
} from 'react-icons/pi';
import { toast } from 'sonner';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  shouldAutoShowClosedSupport,
  supportInboxEmptyCopy,
} from '@/lib/integrations/whatsapp/inbox-list';
import { cn } from '@/lib/utils';

export type InboxChannel = 'sales' | 'support';
type ListFilter = 'open' | 'closed' | 'window';
type ComposerTab = 'reply' | 'note' | 'template';

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

const AVATAR_COLORS = ['#1B2A4A', '#E87A1E', '#0F766E', '#9A3412', '#1E3A5F', '#C2410C'];

const SALES_QUICK_REPLIES = [
  'Thanks — I’ll check coverage for that address.',
  'I’ll send package options shortly.',
  'What suburb and street address should we check?',
  'A colleague will follow up with a quote.',
];

const SUPPORT_QUICK_REPLIES = [
  'We’re looking into this now.',
  'Please share your account number or order number.',
  'Sorry for the delay — I’ll update you as soon as I have an answer.',
  'A technician will follow up on this.',
];

const WINDOW_MS = 24 * 60 * 60 * 1000;
const WINDOW_CLOSING_MS = 4 * 60 * 60 * 1000;

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

function relativeTime(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return '';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  if (hours < 48) return 'Yesterday';
  return `${Math.floor(hours / 24)}d`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() || '').join('');
  return letters || '?';
}

function avatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function threadMatchesQuery(thread: InboxThreadSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [thread.title, thread.phone, thread.ticketNumber, thread.ticketId, thread.preview]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

function isClosedStatus(status: string): boolean {
  return status.trim().toLowerCase() === 'closed';
}

function windowRemainingMs(iso: string): number | null {
  const start = Date.parse(iso);
  if (!Number.isFinite(start)) return null;
  return start + WINDOW_MS - Date.now();
}

function formatRemaining(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0) return `${hours}h ${rest}m`;
  return `${rest}m`;
}

function isWindowClosing(iso: string): boolean {
  const remaining = windowRemainingMs(iso);
  return remaining != null && remaining > 0 && remaining <= WINDOW_CLOSING_MS;
}

function lastInboundAt(messages: InboxMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].direction === 'in') return messages[i].timestamp;
  }
  return null;
}

export function WhatsAppInbox({ channel }: { channel: InboxChannel }) {
  const [query, setQuery] = useState('');
  const [listFilter, setListFilter] = useState<ListFilter>('open');
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
  const [historyWarning, setHistoryWarning] = useState<string | undefined>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [composerTab, setComposerTab] = useState<ComposerTab>('reply');
  const threadEndRef = useRef<HTMLDivElement>(null);
  const didAutoShowClosed = useRef(false);

  const isSales = channel === 'sales';
  const quickReplies = isSales ? SALES_QUICK_REPLIES : SUPPORT_QUICK_REPLIES;

  const loadThreads = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const response = await fetch(`/api/admin/inbox/threads?channel=${channel}`, {
        headers: authHeaders(),
      });
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
  }, [channel]);

  const loadThread = useCallback(async (threadId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/inbox/threads/${encodeURIComponent(threadId)}`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Conversation not found');
      }
      setDetail(data.thread);
      setMessages(data.messages || []);
      setCanReply(Boolean(data.canReply));
      setCannotReplyReason(data.cannotReplyReason);
      setHistoryWarning(data.historyWarning);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load thread');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedId(null);
    setDetail(null);
    setMessages([]);
    setDraft('');
    setComposerTab('reply');
    setListFilter('open');
    didAutoShowClosed.current = false;
    void loadThreads();
  }, [channel, loadThreads]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const searched = useMemo(
    () => threads.filter((thread) => threadMatchesQuery(thread, query)),
    [threads, query]
  );

  const openCount = searched.filter((thread) => !isClosedStatus(thread.status)).length;
  const closedCount = searched.filter((thread) => isClosedStatus(thread.status)).length;
  const windowCount = searched.filter((thread) => isWindowClosing(thread.updatedAt)).length;

  useEffect(() => {
    if (isSales || listLoading || didAutoShowClosed.current) return;
    if (shouldAutoShowClosedSupport(openCount, closedCount, listFilter)) {
      didAutoShowClosed.current = true;
      setListFilter('closed');
    }
  }, [isSales, listLoading, openCount, closedCount, listFilter]);

  const filtered = useMemo(() => {
    return searched.filter((thread) => {
      if (listFilter === 'open') return !isClosedStatus(thread.status);
      if (listFilter === 'closed') return isClosedStatus(thread.status);
      return isWindowClosing(thread.updatedAt);
    });
  }, [searched, listFilter]);

  const selected =
    detail && detail.id === selectedId
      ? detail
      : filtered.find((thread) => thread.id === selectedId) ||
        searched.find((thread) => thread.id === selectedId) ||
        null;

  const replyWindowMs = useMemo(() => {
    const inbound = lastInboundAt(messages) || selected?.updatedAt;
    return inbound ? windowRemainingMs(inbound) : null;
  }, [messages, selected?.updatedAt]);

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
      await loadThreads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const selectThread = (threadId: string) => {
    setSelectedId(threadId);
    setDraft('');
    setComposerTab('reply');
    void loadThread(threadId);
  };

  return (
    <div className="-m-4 flex h-[calc(100vh-4.5rem)] min-h-[640px] flex-col overflow-hidden bg-[#F4F1EC] sm:-m-6 lg:-m-8">
      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_280px]">
        <aside
          className={cn(
            'flex min-h-0 flex-col border-r border-[#E8E2D9] bg-white',
            selectedId ? 'hidden xl:flex' : 'flex'
          )}
        >
          <div className="border-b border-[#E8E2D9] px-4 pb-3 pt-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C45A30]">
                  Team inbox
                </p>
                <h1 className="text-lg font-semibold text-[#1B2A4A]">
                  {isSales ? 'Sales' : 'Support'}
                </h1>
                <p className="text-xs text-[#6B7280]">
                  {openCount} open · {isSales ? '084 Cloud API' : 'Desk Instant Messaging'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadThreads()}>
                Refresh
              </Button>
            </div>

            <div className="mt-3 flex gap-1 rounded-lg bg-[#F4F1EC] p-1">
              <Link
                href="/admin/inbox/sales"
                className={cn(
                  'flex-1 rounded-md px-2 py-1.5 text-center text-xs font-semibold',
                  isSales ? 'bg-white text-[#1B2A4A] shadow-sm' : 'text-[#6B7280] hover:text-[#1B2A4A]'
                )}
              >
                Sales
              </Link>
              <Link
                href="/admin/inbox/support"
                className={cn(
                  'flex-1 rounded-md px-2 py-1.5 text-center text-xs font-semibold',
                  !isSales ? 'bg-white text-[#1B2A4A] shadow-sm' : 'text-[#6B7280] hover:text-[#1B2A4A]'
                )}
              >
                Support
              </Link>
            </div>

            <div className="relative mt-3">
              <PiMagnifyingGlassBold className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, number or ticket"
                className="h-9 bg-white pl-9"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'open', label: `Open (${openCount})` },
                  { id: 'closed', label: `Closed (${closedCount})` },
                  { id: 'window', label: `Window closing (${windowCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setListFilter(tab.id)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    listFilter === tab.id
                      ? 'bg-[#1B2A4A] text-white'
                      : 'bg-[#F4F1EC] text-[#4B5563] hover:bg-[#EDE7DC]'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {!isSales && !supportComposerEnabled && supportComposerReason && (
            <p className="mx-3 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Support composer is read-only. {supportComposerReason}
            </p>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {listLoading ? (
              <LoadingState message="Loading conversations…" />
            ) : listError ? (
              <ErrorState
                title="Could not load inbox"
                message={listError}
                onRetry={() => void loadThreads()}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<PiWhatsappLogoBold />}
                title="No conversations"
                description={
                  isSales
                    ? listFilter === 'window'
                      ? 'No threads are inside the last four hours of the estimated 24-hour window.'
                      : 'Inbound WhatsApp on Sales 084 will appear here.'
                    : supportInboxEmptyCopy({
                        listFilter,
                        openCount,
                        closedCount,
                      })
                }
              />
            ) : (
              filtered.map((thread) => {
                const remaining = windowRemainingMs(thread.updatedAt);
                const closing = isWindowClosing(thread.updatedAt);
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => selectThread(thread.id)}
                    className={cn(
                      'w-full border-b border-[#F3EEE6] px-4 py-3 text-left hover:bg-[#FDF8F3]',
                      selectedId === thread.id && 'bg-[#FDF2E9]'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ background: avatarColor(thread.title) }}
                      >
                        {initials(thread.title)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-[#111827]">{thread.title}</p>
                          <span className="flex-shrink-0 text-[11px] text-[#9CA3AF]">
                            {relativeTime(thread.updatedAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[#6B7280]">{thread.preview}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              isSales
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-orange-50 text-orange-800'
                            )}
                          >
                            {isSales ? 'Sales' : 'Support'}
                          </span>
                          {closing && remaining != null && remaining > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                              <PiClockBold className="h-3 w-3" />
                              {formatRemaining(remaining)}
                            </span>
                          )}
                          {thread.ticketNumber && (
                            <span className="text-[10px] text-[#9CA3AF]">#{thread.ticketNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section
          className={cn(
            'flex min-h-0 min-w-0 flex-col bg-[#F7F4EE]',
            selectedId ? 'flex' : 'hidden xl:flex'
          )}
        >
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={<PiWhatsappLogoBold />}
                title="Select a conversation"
                description={
                  isSales
                    ? 'Replies on Sales 084 go out on Cloud API. Desk stays the ticket of record.'
                    : 'Support replies use Desk Instant Messaging when the Connected token allows it.'
                }
              />
            </div>
          ) : detailLoading && !selected ? (
            <LoadingState message="Loading thread…" />
          ) : (
            <>
              <div className="border-b border-[#E8E2D9] bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-[#C45A30] xl:hidden"
                      onClick={() => setSelectedId(null)}
                    >
                      <PiArrowLeftBold className="h-3.5 w-3.5" />
                      All conversations
                    </button>
                    <h2 className="truncate font-semibold text-[#111827]">
                      {selected?.title || 'Conversation'}
                    </h2>
                    <p className="truncate text-sm text-[#6B7280]">
                      {selected?.phone || 'No phone'}
                      {selected?.ticketNumber ? ` · Ticket #${selected.ticketNumber}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
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
                {replyWindowMs != null && replyWindowMs > 0 && replyWindowMs <= WINDOW_MS && (
                  <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                    Reply window closes in {formatRemaining(replyWindowMs)}
                    <span className="ml-1 font-normal text-amber-800">
                      (estimated from last customer message)
                    </span>
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
                {historyWarning && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Desk history could not be loaded. You can still reply on WhatsApp.
                  </p>
                )}
                {messages.length === 0 ? (
                  <p className="py-2 text-sm italic text-slate-400">No visible messages yet.</p>
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
                            'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                            outbound
                              ? 'rounded-tr-none bg-[#DCF8C6] text-[#111827]'
                              : 'rounded-tl-none border border-[#E8E2D9] bg-white text-slate-800'
                          )}
                        >
                          {msg.author && (
                            <p className="mb-1 text-xs font-medium opacity-70">{msg.author}</p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          <p className="mt-1 text-right text-[11px] text-[#6B7280]">
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
                <div className="border-t border-[#E8E2D9] bg-white px-3 pb-3 pt-2">
                  <div className="mb-2 flex gap-1">
                    {(
                      [
                        { id: 'reply', label: 'Reply', disabled: false },
                        { id: 'note', label: 'Internal note', disabled: true },
                        { id: 'template', label: 'Send template', disabled: true },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        disabled={tab.disabled}
                        title={
                          tab.id === 'note'
                            ? 'Internal Desk notes are not in this inbox yet'
                            : tab.id === 'template'
                              ? 'WhatsApp templates come next'
                              : undefined
                        }
                        onClick={() => !tab.disabled && setComposerTab(tab.id)}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-xs font-semibold',
                          composerTab === tab.id && !tab.disabled
                            ? 'bg-[#FDF2E9] text-[#C45A30]'
                            : 'text-[#6B7280]',
                          tab.disabled && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={
                        isSales
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
                      {sending ? (
                        <PiSpinnerBold className="animate-spin" />
                      ) : (
                        <PiPaperPlaneRightBold />
                      )}
                      Send
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {quickReplies.map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        onClick={() => setDraft(reply)}
                        className="rounded-full border border-[#E8E2D9] bg-[#F9F7F2] px-2.5 py-1 text-[11px] font-medium text-[#374151] hover:border-[#E87A1E] hover:bg-[#FDF2E9]"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border-t border-[#E8E2D9] bg-amber-50 p-4 text-sm text-amber-900">
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
        </section>

        <aside className="hidden min-h-0 flex-col overflow-y-auto border-l border-[#E8E2D9] bg-white xl:flex">
          {selected ? (
            <div className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ background: avatarColor(selected.title) }}
                >
                  {initials(selected.title)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#111827]">{selected.title}</p>
                  <p className="text-xs text-[#6B7280]">
                    {isSales ? 'Sales 084 lead' : 'Support Instant Messaging'}
                  </p>
                </div>
              </div>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-[#6B7280]">
                    <PiPhoneBold className="h-4 w-4" />
                    Phone
                  </dt>
                  <dd className="text-right font-medium text-[#111827]">{selected.phone || '—'}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-[#6B7280]">
                    <PiTicketBold className="h-4 w-4" />
                    Ticket
                  </dt>
                  <dd className="text-right font-medium text-[#111827]">
                    {selected.ticketNumber || selected.ticketId || '—'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#6B7280]">Status</dt>
                  <dd>
                    <StatusBadge
                      status={(selected.status || 'open').replace(/^./, (c) => c.toUpperCase())}
                      variant={selected.status === 'closed' ? 'neutral' : 'success'}
                    />
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#6B7280]">Last activity</dt>
                  <dd className="text-right text-[#111827]">{formatTime(selected.updatedAt)}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#6B7280]">Channel</dt>
                  <dd className="text-right font-medium text-[#111827]">
                    {isSales ? 'Sales 084' : 'Support IM'}
                  </dd>
                </div>
              </dl>

              {selected.deskUrl && (
                <a
                  href={selected.deskUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-[#E8E2D9] px-3 py-2 text-sm font-semibold text-[#1B2A4A] hover:bg-[#FDF2E9]"
                >
                  Open in Zoho Desk
                  <PiArrowSquareOutBold className="h-4 w-4" />
                </a>
              )}

              <p className="mt-4 text-[11px] leading-5 text-[#9CA3AF]">
                Desk remains the ticket of record. Assignee, orders, and lifetime value will appear
                here when those fields are on the thread.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-[#9CA3AF]">
              Select a conversation to see contact and ticket details.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
