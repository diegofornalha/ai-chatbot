import { renderHook, act } from '@testing-library/react';
import { useMessages } from '@/hooks/use-messages';

describe('useMessages Hook', () => {
  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useMessages());
    
    expect(result.current.messages.size).toBe(0);
  });

  it('should create a new session', () => {
    const { result } = renderHook(() => useMessages());
    
    let sessionId: string;
    act(() => {
      sessionId = result.current.createSession();
    });

    expect(result.current.sessions.has(sessionId!)).toBe(true);
    expect(result.current.activeSessionId).toBe(sessionId!);
  });

  it('should add message to session', () => {
    const { result } = renderHook(() => useMessages());
    
    act(() => {
      const sessionId = result.current.createSession();
      result.current.addMessage(sessionId, {
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
      });
    });

    const session = result.current.getActiveSession();
    expect(session?.messages).toHaveLength(1);
    expect(session?.messages[0].content).toBe('Test message');
  });

  it('should delete session', () => {
    const { result } = renderHook(() => useMessages());
    
    let sessionId: string;
    act(() => {
      sessionId = result.current.createSession();
      result.current.addMessage(sessionId, {
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
      });
    });

    expect(result.current.sessions.has(sessionId!)).toBe(true);

    act(() => {
      result.current.deleteSession(sessionId!);
    });

    expect(result.current.sessions.has(sessionId!)).toBe(false);
  });

  it('should update session metrics', () => {
    const { result } = renderHook(() => useMessages());
    
    act(() => {
      const sessionId = result.current.createSession();
      result.current.updateMetrics(sessionId, 
        { input: 100, output: 50 }, 
        0.05
      );
    });

    const session = result.current.getActiveSession();
    expect(session?.metrics?.tokens.input).toBe(100);
    expect(session?.metrics?.tokens.output).toBe(50);
    expect(session?.metrics?.cost).toBe(0.05);
  });

  it('should handle streaming content', () => {
    const { result } = renderHook(() => useMessages());
    
    act(() => {
      result.current.setStreamingContent('Streaming...');
    });

    expect(result.current.streamingContent).toBe('Streaming...');

    act(() => {
      result.current.appendStreamingContent(' More content');
    });

    expect(result.current.streamingContent).toBe('Streaming... More content');
  });

  it('should load external session', () => {
    const { result } = renderHook(() => useMessages());
    
    const externalSession = {
      id: 'external-1',
      title: 'External Session',
      messages: [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'External message',
          timestamp: new Date(),
        }
      ],
      createdAt: new Date(),
    };

    act(() => {
      result.current.loadExternalSession(externalSession);
    });

    expect(result.current.sessions.has('external-1')).toBe(true);
    expect(result.current.activeSessionId).toBe('external-1');
    
    const session = result.current.getActiveSession();
    expect(session?.messages).toHaveLength(1);
    expect(session?.messages[0].content).toBe('External message');
  });

  it('should clear all sessions', () => {
    const { result } = renderHook(() => useMessages());
    
    act(() => {
      result.current.createSession();
      result.current.createSession();
      result.current.createSession();
    });

    expect(result.current.sessions.size).toBe(3);

    act(() => {
      result.current.clearAllSessions();
    });

    expect(result.current.sessions.size).toBe(0);
    expect(result.current.activeSessionId).toBeNull();
  });
});