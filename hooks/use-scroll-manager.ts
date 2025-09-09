import { useRef, useCallback, useReducer, useEffect, useMemo } from 'react';
import { throttle } from '@/utils/throttle';

interface ScrollState {
  autoScrollEnabled: boolean;
  isUserScrolling: boolean;
}

type ScrollAction = 
  | { type: 'ENABLE_AUTO_SCROLL' }
  | { type: 'DISABLE_AUTO_SCROLL' }
  | { type: 'SET_USER_SCROLLING'; payload: boolean }
  | { type: 'TOGGLE_AUTO_SCROLL' };

const scrollReducer = (state: ScrollState, action: ScrollAction): ScrollState => {
  switch (action.type) {
    case 'ENABLE_AUTO_SCROLL':
      return { autoScrollEnabled: true, isUserScrolling: false };
    case 'DISABLE_AUTO_SCROLL':
      return { autoScrollEnabled: false, isUserScrolling: state.isUserScrolling };
    case 'SET_USER_SCROLLING':
      return { 
        isUserScrolling: action.payload, 
        autoScrollEnabled: !action.payload 
      };
    case 'TOGGLE_AUTO_SCROLL':
      return { 
        ...state, 
        autoScrollEnabled: !state.autoScrollEnabled 
      };
    default:
      return state;
  }
};

export function useScrollManager() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [scrollState, dispatch] = useReducer(scrollReducer, {
    autoScrollEnabled: true,
    isUserScrolling: false
  });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!scrollState.autoScrollEnabled || scrollState.isUserScrolling) return;
    
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior, 
        block: 'end',
        inline: 'nearest' 
      });
    });
  }, [scrollState.autoScrollEnabled, scrollState.isUserScrolling]);

  const handleScrollBase = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce scroll detection
    debounceTimeoutRef.current = setTimeout(() => {
      if (!messagesContainerRef.current) return;
      
      const container = messagesContainerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      
      const userIsScrolling = distanceFromBottom > 100;
      
      // Clear existing scroll timeout to prevent race condition
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      
      if (userIsScrolling) {
        dispatch({ type: 'SET_USER_SCROLLING', payload: true });
      } else {
        scrollTimeoutRef.current = setTimeout(() => {
          dispatch({ type: 'SET_USER_SCROLLING', payload: false });
        }, 100);
      }
    }, 50); // Debounce delay
  }, []);

  // Throttled version of handleScroll
  const handleScroll = useMemo(
    () => throttle(handleScrollBase, 100),
    [handleScrollBase]
  );

  const resetScroll = useCallback(() => {
    dispatch({ type: 'ENABLE_AUTO_SCROLL' });
  }, []);

  return {
    messagesEndRef,
    messagesContainerRef,
    scrollState,
    scrollToBottom,
    handleScroll,
    resetScroll,
    dispatch
  };
}