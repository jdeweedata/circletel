'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface AIAssistantWidgetProps {
  className?: string;
}

export function AIAssistantWidget({ className }: AIAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if AI is available on mount
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const response = await fetch('/api/admin/integrations/ai-assistant', {
          credentials: 'include',
        });
        const data = await response.json();
        setIsAvailable(data.status === 'available');
        if (data.status !== 'available') {
          setError(data.message);
        }
      } catch {
        setIsAvailable(false);
        setError('Failed to connect to AI service');
      }
    };

    checkAvailability();
  }, []);

  // Add initial greeting when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0 && isAvailable) {
      setMessages([
        {
          role: 'model',
          text: "Hello! I'm your CircleTel Integration Assistant. I can help you:\n\n- Check integration health status\n- Diagnose connection issues\n- Suggest troubleshooting steps\n- Explain configuration options\n\nWhat would you like to know?"
        }
      ]);
    }
  }, [isOpen, messages.length, isAvailable]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setInput('');
    setError(null);

    // Add user message
    const userMessage: ChatMessage = { role: 'user', text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add placeholder for assistant response
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    try {
      const response = await fetch('/api/admin/integrations/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: trimmedInput,
          history: messages.filter(m => m.text), // Don't include empty messages
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                // Update the last message with streaming text
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage?.role === 'model') {
                    lastMessage.text = fullText;
                  }
                  return newMessages;
                });
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (parseError) {
              // Ignore parse errors for incomplete chunks
              if (parseError instanceof Error && parseError.message !== 'Unexpected end of JSON input') {
                console.error('Parse error:', parseError);
              }
            }
          }
        }
      }

      // Ensure we have some response
      if (!fullText) {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage?.role === 'model' && !lastMessage.text) {
            lastMessage.text = "I apologize, but I couldn't generate a response. Please try again.";
          }
          return newMessages;
        });
      }

    } catch (err) {
      console.error('AI Assistant error:', err);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage?.role === 'model') {
          lastMessage.text = `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`;
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleClearChat = () => {
    setMessages([{
      role: 'model',
      text: "Chat cleared. How can I help you with your integrations?"
    }]);
  };

  // Don't render if not available
  if (isAvailable === false) {
    return null;
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-50 flex flex-col items-end', className)}>
      {/* Chat Panel */}
      {isOpen && (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 sm:w-96 mb-4 flex flex-col h-[500px] overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-circleTel-orange to-orange-500 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <h3 className="font-semibold text-sm">Integration Assistant</h3>
                <p className="text-xs text-white/80">Powered by Gemini AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Clear chat"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Chat Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                      msg.role === 'user'
                        ? 'bg-circleTel-orange text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                    )}
                  >
                    {msg.text || (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about integrations..."
              disabled={isLoading}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:border-transparent disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-circleTel-orange hover:bg-circleTel-orange/90 h-9 w-9"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Quick Actions */}
          <div className="px-3 pb-3 bg-gray-50 flex flex-wrap gap-1">
            {['Check health status', 'Zoho CRM issue', 'How to fix?'].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => {
                  setInput(quick);
                  inputRef.current?.focus();
                }}
                disabled={isLoading}
                className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                {quick}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105',
          isOpen
            ? 'bg-gray-700 hover:bg-gray-800'
            : 'bg-circleTel-orange hover:bg-circleTel-orange/90'
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
        {/* Notification Dot */}
        {!isOpen && isAvailable && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-white" />
            </span>
          </span>
        )}
      </Button>
    </div>
  );
}

export default AIAssistantWidget;
