import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatInterface } from '@/components/chat/ChatInterface';
import useChatStore from '@/lib/stores/chatStore';

// Mock dependencies
jest.mock('@/lib/stores/chatStore');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock chat store
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      sessions: new Map(),
      messages: new Map(),
      activeSessionId: null,
      isStreaming: false,
      streamingContent: '',
      isProcessing: false,
      createSession: jest.fn(() => 'session-1'),
      deleteSession: jest.fn(),
      setActiveSession: jest.fn(),
      addMessage: jest.fn(),
      appendStreamingContent: jest.fn(),
      setStreaming: jest.fn(),
      setStreamingContent: jest.fn(),
      setProcessing: jest.fn(),
      getActiveSession: jest.fn(() => null),
      updateMetrics: jest.fn(),
      loadExternalSession: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render the chat interface', () => {
      render(<ChatInterface />);
      expect(screen.getByText('Claude Chat')).toBeInTheDocument();
    });

    it('should show welcome message when no messages', () => {
      render(<ChatInterface />);
      expect(screen.getByText(/Olá! Como posso ajudar você hoje?/i)).toBeInTheDocument();
    });

    it('should render in read-only mode', () => {
      render(<ChatInterface readOnly={true} />);
      expect(screen.getByText('Modo Somente Leitura')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Digite sua mensagem/i)).not.toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should create a new session', () => {
      const mockCreateSession = jest.fn(() => 'new-session');
      const mockSetActiveSession = jest.fn();
      
      (useChatStore as unknown as jest.Mock).mockReturnValue({
        ...useChatStore(),
        createSession: mockCreateSession,
        setActiveSession: mockSetActiveSession,
      });

      render(<ChatInterface />);
      
      // Simulate sending first message which creates session
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });

      waitFor(() => {
        expect(mockCreateSession).toHaveBeenCalled();
        expect(mockSetActiveSession).toHaveBeenCalledWith('new-session');
      });
    });

    it('should load external session data', () => {
      const mockLoadExternalSession = jest.fn();
      const sessionData = {
        id: 'external-1',
        messages: [
          { id: '1', role: 'user', content: 'Test', timestamp: new Date() }
        ]
      };
      
      (useChatStore as unknown as jest.Mock).mockReturnValue({
        ...useChatStore(),
        loadExternalSession: mockLoadExternalSession,
      });

      render(<ChatInterface sessionData={sessionData} />);
      
      waitFor(() => {
        expect(mockLoadExternalSession).toHaveBeenCalledWith(sessionData);
      });
    });
  });

  describe('Message Handling', () => {
    it('should send a message', async () => {
      const mockAddMessage = jest.fn();
      const mockSetStreaming = jest.fn();
      
      (useChatStore as unknown as jest.Mock).mockReturnValue({
        ...useChatStore(),
        activeSessionId: 'session-1',
        addMessage: mockAddMessage,
        setStreaming: mockSetStreaming,
      });

      render(<ChatInterface />);
      
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      fireEvent.change(input, { target: { value: 'Hello Claude' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });

      await waitFor(() => {
        expect(mockAddMessage).toHaveBeenCalledWith(
          'session-1',
          expect.objectContaining({
            role: 'user',
            content: 'Hello Claude',
          })
        );
        expect(mockSetStreaming).toHaveBeenCalledWith(true);
      });
    });

    it('should not send empty messages', () => {
      const mockAddMessage = jest.fn();
      
      (useChatStore as unknown as jest.Mock).mockReturnValue({
        ...useChatStore(),
        addMessage: mockAddMessage,
      });

      render(<ChatInterface />);
      
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });

      expect(mockAddMessage).not.toHaveBeenCalled();
    });

    it('should not send messages while streaming', () => {
      const mockAddMessage = jest.fn();
      
      (useChatStore as unknown as jest.Mock).mockReturnValue({
        ...useChatStore(),
        isStreaming: true,
        addMessage: mockAddMessage,
      });

      render(<ChatInterface />);
      
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });

      expect(mockAddMessage).not.toHaveBeenCalled();
    });
  });

  describe('Scroll Behavior', () => {
    it('should auto-scroll to bottom on new messages', () => {
      const scrollIntoViewMock = jest.fn();
      HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      const { rerender } = render(<ChatInterface />);
      
      // Simulate new message
      (useChatStore as unknown as jest.Mock).mockReturnValue({
        ...useChatStore(),
        messages: new Map([['session-1', [
          { id: '1', role: 'user', content: 'Test', timestamp: new Date() }
        ]]]),
        activeSessionId: 'session-1',
      });

      rerender(<ChatInterface />);

      waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export session data', () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      const session = {
        id: 'session-1',
        title: 'Test Session',
        messages: [
          { id: '1', role: 'user', content: 'Test', timestamp: new Date() }
        ],
      };
      
      (useChatStore as unknown as jest.Mock).mockReturnValue({
        ...useChatStore(),
        getActiveSession: jest.fn(() => session),
      });

      render(<ChatInterface />);
      
      const exportButton = screen.getByTitle('Exportar sessão');
      fireEvent.click(exportButton);

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('should not export when no active session', () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      
      render(<ChatInterface />);
      
      const exportButton = screen.getByTitle('Exportar sessão');
      fireEvent.click(exportButton);

      expect(createElementSpy).not.toHaveBeenCalledWith('a');
    });
  });
});