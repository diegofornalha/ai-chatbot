'use client';

import { useState, useCallback } from 'react';
import useChatStore from '@/lib/stores/chatStore';
import { generateUUID } from '@/lib/utils';
import type { Message } from '@/lib/stores/chatStore';

interface UseChatMessagesProps {
  activeSessionId: string | null;
}

export function useChatMessages({ activeSessionId }: UseChatMessagesProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    isStreaming,
    streamingContent,
    addMessage,
    appendStreamingContent,
    setStreaming,
    setStreamingContent,
    setProcessing,
    updateMetrics,
  } = useChatStore();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !activeSessionId) return;

    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    addMessage(activeSessionId, userMessage);
    setProcessing(true);
    setIsProcessing(true);

    try {
      // Simulate API call - replace with actual implementation
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          message: content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Handle streaming response
      setStreaming(true);
      setStreamingContent('');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullContent += chunk;
          appendStreamingContent(chunk);
        }
      }

      // Create assistant message
      const assistantMessage: Message = {
        id: generateUUID(),
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
        tokens: { input: 100, output: 150 }, // Mock data
        cost: 0.0025, // Mock data
      };

      addMessage(activeSessionId, assistantMessage);
      updateMetrics(activeSessionId, { input: 100, output: 150 }, 0.0025);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error handling
    } finally {
      setStreaming(false);
      setStreamingContent('');
      setProcessing(false);
      setIsProcessing(false);
    }
  }, [
    activeSessionId,
    addMessage,
    appendStreamingContent,
    setStreaming,
    setStreamingContent,
    setProcessing,
    updateMetrics,
  ]);

  return {
    isProcessing,
    isStreaming,
    streamingContent,
    sendMessage,
  };
}