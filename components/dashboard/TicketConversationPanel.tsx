'use client';

import { useState, useRef, useEffect } from 'react';

interface ZohoDeskComment {
  id: string;
  content: string;
  contentType: 'plainText' | 'html';
  isPublic: boolean;
  createdTime: string;
  authorName: string;
  authorEmail?: string;
}

interface ZohoDeskTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description?: string;
  status: 'Open' | 'On Hold' | 'Escalated' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category?: string;
  createdTime: string;
  modifiedTime: string;
  customerEmail: string;
  customerName: string;
  commentCount?: number;
  comments?: ZohoDeskComment[];
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Open':      { bg: '#dcfce7', color: '#16a34a' },
  'On Hold':   { bg: '#fef9c3', color: '#ca8a04' },
  'Escalated': { bg: '#fee2e2', color: '#dc2626' },
  'Closed':    { bg: '#f1f5f9', color: '#64748b' },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS['Closed'];
  return (
    <span className="text-[10px] font-medium rounded px-1.5 py-0.5" style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}

interface TicketConversationPanelProps {
  tickets: ZohoDeskTicket[];
  customerName: string;
  customerEmail: string;
  accessToken: string;
}

export function TicketConversationPanel({
  tickets,
  customerName,
  customerEmail,
  accessToken,
}: TicketConversationPanelProps) {
  const [selected, setSelected] = useState<ZohoDeskTicket | null>(tickets[0] ?? null);
  const [comments, setComments] = useState<ZohoDeskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load comments when ticket changes
  useEffect(() => {
    if (!selected) return;
    if (selected.comments) {
      setComments(selected.comments);
      return;
    }
    setCommentsLoading(true);
    fetch(`/api/support/tickets/${selected.id}/comments`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setComments(result.data);
        } else {
          setComments([]);
        }
      })
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [selected?.id, accessToken]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${selected.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: replyText }),
      });
      const result = await res.json();
      if (result.success) {
        const newComment: ZohoDeskComment = {
          id: result.data?.id ?? String(Date.now()),
          content: replyText,
          contentType: 'plainText',
          isPublic: true,
          createdTime: new Date().toISOString(),
          authorName: customerName,
          authorEmail: customerEmail,
        };
        setComments((prev) => [...prev, newComment]);
        setReplyText('');
      }
    } catch {
      // silently ignore send errors
    } finally {
      setSending(false);
    }
  };

  const isCustomerMessage = (comment: ZohoDeskComment): boolean => {
    return comment.authorEmail === customerEmail || comment.authorName === customerName;
  };

  return (
    <div className="flex gap-0 bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0', minHeight: '500px' }}>
      {/* Left panel */}
      <div className="w-60 shrink-0 border-r flex flex-col" style={{ borderColor: '#e2e8f0' }}>
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: '#e2e8f0' }}
        >
          <span className="text-sm font-bold text-slate-800">My Requests</span>
          <a
            href="/dashboard/tickets/new"
            className="text-xs font-bold px-2 py-1 rounded-lg text-white"
            style={{ background: '#F5831F' }}
          >
            + New
          </a>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tickets.length === 0 ? (
            <p className="text-xs text-slate-500 p-4">No tickets yet.</p>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full text-left px-4 py-3 border-b last:border-0 transition-colors"
                style={{
                  borderColor: '#f1f5f9',
                  background: selected?.id === t.id ? '#fff7ed' : 'transparent',
                  borderLeft: selected?.id === t.id ? '3px solid #F5831F' : '3px solid transparent',
                }}
              >
                <p className="text-xs font-semibold text-slate-800 truncate">{t.subject}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{formatRelativeDate(t.createdTime)}</p>
                <div className="mt-1">
                  <StatusPill status={t.status} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a conversation
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div
              className="px-5 py-3 border-b"
              style={{ borderColor: '#e2e8f0' }}
            >
              <p className="text-sm font-bold text-slate-800 truncate">{selected.ticketNumber} — {selected.subject}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {selected.category && <>{selected.category} · </>}
                Opened {formatRelativeDate(selected.createdTime)} · <StatusPill status={selected.status} />
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Original description */}
              {selected.description && (
                <div className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                    style={{ background: '#64748b' }}
                  >
                    CT
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 mb-1">CircleTel Support</p>
                    <div
                      className="text-xs text-slate-700 rounded px-3 py-2 max-w-sm"
                      style={{ background: '#f1f5f9', borderRadius: '4px 12px 12px 12px' }}
                    >
                      {selected.description}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">{formatTime(selected.createdTime)}</p>
                  </div>
                </div>
              )}

              {/* Comments */}
              {commentsLoading ? (
                <p className="text-xs text-slate-400">Loading messages…</p>
              ) : (
                comments.map((c) => {
                  const isCustomer = isCustomerMessage(c);
                  return (
                    <div
                      key={c.id}
                      className={`flex gap-3 ${isCustomer ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                        style={{ background: isCustomer ? '#F5831F' : '#64748b' }}
                      >
                        {isCustomer
                          ? customerName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                          : 'CT'}
                      </div>
                      <div className={isCustomer ? 'items-end flex flex-col' : ''}>
                        <p className="text-[10px] text-slate-500 mb-1">
                          {isCustomer ? 'You' : c.authorName}
                        </p>
                        <div
                          className="text-xs text-slate-700 px-3 py-2 max-w-sm"
                          style={{
                            background: isCustomer ? '#fff7ed' : '#f1f5f9',
                            borderRadius: isCustomer ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                          }}
                        >
                          {c.contentType === 'html' ? (
                            <span dangerouslySetInnerHTML={{ __html: c.content }} />
                          ) : (
                            c.content
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">{formatTime(c.createdTime)}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply input */}
            {selected.status !== 'Closed' && (
              <div
                className="px-5 py-3 border-t flex gap-2"
                style={{ borderColor: '#e2e8f0' }}
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Reply to this ticket…"
                  className="flex-1 text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#F5831F] min-w-0"
                  style={{ borderColor: '#e2e8f0' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!replyText.trim() || sending}
                  className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50 transition-opacity"
                  style={{ background: '#F5831F' }}
                >
                  {sending ? '…' : 'Send'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
