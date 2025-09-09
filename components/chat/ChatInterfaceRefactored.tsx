'use client';

import React from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { SessionTabs } from '../session/SessionTabs';
import { useScrollManager } from '@/hooks/use-scroll-manager';
import { useChatSession } from '@/hooks/use-chat-session';
import { useChatMessages } from '@/hooks/use-chat-messages';
import useChatStore from '@/lib/stores/chatStore';

interface ChatInterfaceProps {
  sessionData?: {
    id: string;
    messages: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
  };
  readOnly?: boolean;
}

export function ChatInterfaceRefactored({
  sessionData,
  readOnly = false,
}: ChatInterfaceProps) {
  const {
    activeSession,
    activeMessages,
    metrics,
    handleNewSession,
    handleClearSession,
    handleExportSession,
  } = useChatSession({ sessionData, readOnly });

  const { 
    isProcessing, 
    isStreaming, 
    streamingContent, 
    sendMessage 
  } = useChatMessages({ 
    activeSessionId: activeSession?.id || null 
  });

  const {
    messagesContainerRef,
    scrollState,
    scrollToBottom,
    handleScroll,
  } = useScrollManager();

  const { sessions, setActiveSession, deleteSession } = useChatStore();

  // Session management handlers
  const handleSessionSelect = (sessionId: string) => {
    setActiveSession(sessionId);
    scrollToBottom('auto');
  };

  const handleSessionClose = (sessionId: string) => {
    deleteSession(sessionId);
    if (activeSession?.id === sessionId) {
      handleNewSession();
    }
  };

  // Message send handler
  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
    scrollToBottom();
  };

  const sessionList = Array.from(sessions.values());

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Session Tabs */}
      <SessionTabs
        sessions={sessionList}
        activeSessionId={activeSession?.id || null}
        onSessionSelect={handleSessionSelect}
        onSessionClose={handleSessionClose}
        onNewSession={handleNewSession}
      />

      {/* Header */}
      <ChatHeader
        activeSession={activeSession}
        metrics={metrics}
        onNewSession={handleNewSession}
        onClearSession={handleClearSession}
        onExportSession={handleExportSession}
      />

      {/* Messages */}
      <MessageList
        ref={messagesContainerRef}
        messages={activeMessages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        isProcessing={isProcessing}
        isUserScrolling={scrollState.isUserScrolling}
        onScrollToBottom={() => scrollToBottom()}
      />

      {/* Input */}
      {!readOnly && (
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isProcessing || isStreaming}
          placeholder="Digite sua mensagem..."
        />
      )}
    </div>
  );
}