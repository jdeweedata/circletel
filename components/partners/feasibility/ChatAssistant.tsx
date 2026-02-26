'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { ChatMessage, ExtractedFeasibilityData } from '@/lib/partners/feasibility-types';

interface ChatAssistantProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, extract?: boolean) => Promise<void>;
  onExtractData: () => Promise<ExtractedFeasibilityData | null>;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatAssistant({
  messages,
  onSendMessage,
  onExtractData,
  isLoading,
  disabled = false,
}: ChatAssistantProps) {
  const [input, setInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    await onSendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      await onExtractData();
    } finally {
      setIsExtracting(false);
    }
  };

  // Check if we have enough conversation to extract data
  const canExtract =
    messages.length >= 2 &&
    messages.some((m) => m.role === 'user') &&
    messages.some((m) => m.role === 'assistant');

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-circleTel-orange" />
          AI Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-circleTel-orange/60" />
              <p className="text-sm">
                Tell me about your client&apos;s connectivity needs.
              </p>
              <p className="text-xs mt-1 text-gray-400">
                Include location, speed requirements, and any special needs.
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-circleTel-orange text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-circleTel-orange text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Extract Button */}
        {canExtract && (
          <div className="px-4 py-2 border-t bg-gray-50">
            <Button
              onClick={handleExtract}
              disabled={isExtracting || disabled}
              variant="outline"
              className="w-full text-sm"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Extract & Fill Form
                </>
              )}
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your client's needs..."
              className="min-h-[80px] resize-none"
              disabled={isLoading || disabled}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || disabled}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
