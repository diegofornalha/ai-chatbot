'use client';

import { useCallback, useEffect, useMemo } from 'react';
import useChatStore from '@/lib/stores/chatStore';
import { useRouter } from 'next/navigation';
import type { SessionData } from '@/types/chat';

interface UseChatSessionProps {
  sessionData?: SessionData;
  readOnly?: boolean;
}

export function useChatSession({ sessionData, readOnly }: UseChatSessionProps = {}) {
  const router = useRouter();
  const {
    sessions,
    activeSessionId,
    createSession,
    deleteSession,
    setActiveSession,
    getActiveSession,
    loadExternalSession,
    clearSession,
    exportSession,
  } = useChatStore();

  // Get active session
  const activeSession = useMemo(() => {
    return getActiveSession();
  }, [activeSessionId, sessions, getActiveSession]);

  // Get messages for active session from the session itself
  const activeMessages = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.messages || [];
  }, [activeSession]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalTokens = activeMessages.reduce(
      (acc, msg) => acc + (msg.tokens?.input || 0) + (msg.tokens?.output || 0),
      0
    );
    const totalCost = activeMessages.reduce((acc, msg) => acc + (msg.cost || 0), 0);
    return {
      totalTokens,
      totalCost,
      messageCount: activeMessages.length,
    };
  }, [activeMessages]);

  // Load external session if provided
  useEffect(() => {
    if (sessionData?.messages) {
      loadExternalSession(sessionData);
    }
  }, [sessionData, loadExternalSession]);

  // Session management
  const handleNewSession = useCallback(() => {
    const newSessionId = createSession();
    setActiveSession(newSessionId);
    router.push('/chat');
  }, [createSession, setActiveSession, router]);

  const handleClearSession = useCallback(() => {
    if (activeSessionId) {
      clearSession(activeSessionId);
    }
  }, [activeSessionId, clearSession]);

  const handleExportSession = useCallback(() => {
    if (!activeSessionId) return;
    
    const sessionToExport = exportSession(activeSessionId);
    if (!sessionToExport) return;

    const dataStr = JSON.stringify(sessionToExport, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `chat-session-${sessionToExport.id}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [activeSessionId, exportSession]);

  return {
    activeSession,
    activeMessages,
    metrics,
    readOnly,
    handleNewSession,
    handleClearSession,
    handleExportSession,
  };
}