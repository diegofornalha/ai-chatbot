import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageList } from '@/components/chat/MessageList';
import type { Message } from '@/lib/stores/chatStore';

describe('MessageList', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date('2024-01-01T10:00:00'),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hi there!',
      timestamp: new Date('2024-01-01T10:00:30'),
      tokens: { input: 10, output: 15 },
      cost: 0.0005,
    },
  ];

  const defaultProps = {
    messages: [],
    isStreaming: false,
    streamingContent: '',
    isProcessing: false,
    isUserScrolling: false,
    onScrollToBottom: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show empty state when no messages', () => {
    render(<MessageList {...defaultProps} />);
    
    expect(screen.getByText('Como posso ajudar você hoje?')).toBeInTheDocument();
    expect(screen.getByText('Digite uma mensagem para começar a conversa')).toBeInTheDocument();
  });

  it('should render messages', () => {
    render(<MessageList {...defaultProps} messages={mockMessages} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should show processing indicator', () => {
    render(<MessageList {...defaultProps} messages={mockMessages} isProcessing={true} />);
    
    expect(screen.getByText('Processando resposta...')).toBeInTheDocument();
  });

  it('should show streaming content', () => {
    render(
      <MessageList
        {...defaultProps}
        messages={mockMessages}
        isStreaming={true}
        streamingContent="This is streaming..."
      />
    );
    
    expect(screen.getByText('This is streaming...')).toBeInTheDocument();
  });

  it('should show scroll to bottom button when user is scrolling', () => {
    render(<MessageList {...defaultProps} messages={mockMessages} isUserScrolling={true} />);
    
    const scrollButton = screen.getByRole('button');
    expect(scrollButton).toBeInTheDocument();
  });

  it('should call onScrollToBottom when scroll button is clicked', () => {
    render(<MessageList {...defaultProps} messages={mockMessages} isUserScrolling={true} />);
    
    const scrollButton = screen.getByRole('button');
    fireEvent.click(scrollButton);
    
    expect(defaultProps.onScrollToBottom).toHaveBeenCalledTimes(1);
  });

  it('should not show scroll button when auto-scrolling', () => {
    render(<MessageList {...defaultProps} messages={mockMessages} isUserScrolling={false} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should not show processing indicator when streaming', () => {
    render(
      <MessageList
        {...defaultProps}
        messages={mockMessages}
        isProcessing={true}
        isStreaming={true}
      />
    );
    
    expect(screen.queryByText('Processando resposta...')).not.toBeInTheDocument();
  });
});