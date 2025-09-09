'use client';

import React, { forwardRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ArrowDown, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/stores/chatStore';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  isProcessing: boolean;
  isUserScrolling: boolean;
  onScrollToBottom: () => void;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ 
    messages, 
    isStreaming, 
    streamingContent, 
    isProcessing,
    isUserScrolling,
    onScrollToBottom 
  }, ref) => {
    return (
      <div
        ref={ref}
        className="flex-1 overflow-y-auto px-6 py-8"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            <div className="flex h-[50vh] items-center justify-center">
              <div className="text-center">
                <Bot className="mx-auto mb-4 size-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  Como posso ajudar você hoje?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Digite uma mensagem para começar a conversa
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  tokens={message.tokens}
                  cost={message.cost}
                />
              ))}

              {isProcessing && !isStreaming && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="size-2 bg-primary rounded-full animate-pulse" />
                      <div className="size-2 bg-primary rounded-full animate-pulse delay-75" />
                      <div className="size-2 bg-primary rounded-full animate-pulse delay-150" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Processando resposta...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isStreaming && streamingContent && (
                <ChatMessage
                  content={streamingContent}
                />
              )}

              <div className="h-px" id="messages-end" />
            </>
          )}
        </div>

        {/* Scroll to bottom button */}
        {isUserScrolling && (
          <Button
            onClick={onScrollToBottom}
            className={cn(
              "fixed bottom-24 right-6 rounded-full shadow-lg",
              "transition-all duration-200 ease-out",
              "hover:scale-110 active:scale-95"
            )}
            size="icon"
          >
            <ArrowDown className="size-4" />
          </Button>
        )}
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';