import { renderHook, act } from '@testing-library/react';
import { useScrollManager } from '@/hooks/use-scroll-manager';

describe('useScrollManager', () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    Object.defineProperty(mockElement, 'scrollHeight', { value: 1000, writable: true });
    Object.defineProperty(mockElement, 'scrollTop', { value: 0, writable: true });
    Object.defineProperty(mockElement, 'clientHeight', { value: 500, writable: true });
    
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with auto-scroll enabled', () => {
    const { result } = renderHook(() => useScrollManager());
    
    expect(result.current.scrollState.autoScrollEnabled).toBe(true);
    expect(result.current.scrollState.isUserScrolling).toBe(false);
  });

  it('should scroll to bottom when auto-scroll is enabled', () => {
    const { result } = renderHook(() => useScrollManager());
    const scrollIntoViewMock = jest.fn();
    
    result.current.messagesEndRef.current = {
      scrollIntoView: scrollIntoViewMock,
    } as any;

    act(() => {
      result.current.scrollToBottom();
    });

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest',
    });
  });

  it('should detect user scrolling', () => {
    const { result } = renderHook(() => useScrollManager());
    
    result.current.messagesContainerRef.current = mockElement;
    
    // Simulate user scrolling up
    Object.defineProperty(mockElement, 'scrollTop', { value: 300 });
    
    act(() => {
      result.current.handleScroll();
      jest.advanceTimersByTime(100);
    });

    expect(result.current.scrollState.isUserScrolling).toBe(true);
    expect(result.current.scrollState.autoScrollEnabled).toBe(false);
  });

  it('should re-enable auto-scroll when user scrolls to bottom', () => {
    const { result } = renderHook(() => useScrollManager());
    
    result.current.messagesContainerRef.current = mockElement;
    
    // First disable auto-scroll
    act(() => {
      result.current.dispatch({ type: 'SET_USER_SCROLLING', payload: true });
    });
    
    expect(result.current.scrollState.isUserScrolling).toBe(true);
    
    // Scroll to bottom
    Object.defineProperty(mockElement, 'scrollTop', { value: 450 });
    
    act(() => {
      result.current.handleScroll();
      jest.advanceTimersByTime(200);
    });

    expect(result.current.scrollState.isUserScrolling).toBe(false);
    expect(result.current.scrollState.autoScrollEnabled).toBe(true);
  });

  it('should reset scroll state', () => {
    const { result } = renderHook(() => useScrollManager());
    
    // First disable auto-scroll
    act(() => {
      result.current.dispatch({ type: 'DISABLE_AUTO_SCROLL' });
    });
    
    expect(result.current.scrollState.autoScrollEnabled).toBe(false);
    
    // Reset
    act(() => {
      result.current.resetScroll();
    });
    
    expect(result.current.scrollState.autoScrollEnabled).toBe(true);
    expect(result.current.scrollState.isUserScrolling).toBe(false);
  });

  it('should cleanup timeouts on unmount', () => {
    const { result, unmount } = renderHook(() => useScrollManager());
    
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    // Set some timeouts
    result.current.messagesContainerRef.current = mockElement;
    
    act(() => {
      result.current.handleScroll();
    });
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});