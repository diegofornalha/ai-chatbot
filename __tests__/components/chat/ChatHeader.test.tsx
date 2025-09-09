import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import type { Session } from '@/lib/stores/chatStore';

describe('ChatHeader', () => {
  const mockSession: Session = {
    id: 'test-session-123',
    title: 'Test Conversation',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultProps = {
    activeSession: null,
    metrics: {
      totalTokens: 0,
      totalCost: 0,
      messageCount: 0,
    },
    onNewSession: jest.fn(),
    onClearSession: jest.fn(),
    onExportSession: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with no active session', () => {
    render(<ChatHeader {...defaultProps} />);
    
    expect(screen.getByText('Nova Conversa')).toBeInTheDocument();
    expect(screen.queryByText(/ID:/)).not.toBeInTheDocument();
  });

  it('should render with active session', () => {
    render(<ChatHeader {...defaultProps} activeSession={mockSession} />);
    
    expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    expect(screen.getByText(/ID: test-sess/)).toBeInTheDocument();
  });

  it('should display metrics correctly', () => {
    const props = {
      ...defaultProps,
      metrics: {
        totalTokens: 1500,
        totalCost: 0.0025,
        messageCount: 10,
      },
    };
    
    render(<ChatHeader {...props} />);
    
    expect(screen.getByText('1,500 tokens')).toBeInTheDocument();
    expect(screen.getByText('$0.0025')).toBeInTheDocument();
  });

  it('should call onNewSession when refresh button is clicked', () => {
    render(<ChatHeader {...defaultProps} />);
    
    const refreshButton = screen.getByTitle('Nova sessão');
    fireEvent.click(refreshButton);
    
    expect(defaultProps.onNewSession).toHaveBeenCalledTimes(1);
  });

  it('should call onClearSession when trash button is clicked', () => {
    render(<ChatHeader {...defaultProps} activeSession={mockSession} />);
    
    const clearButton = screen.getByTitle('Limpar sessão');
    fireEvent.click(clearButton);
    
    expect(defaultProps.onClearSession).toHaveBeenCalledTimes(1);
  });

  it('should call onExportSession when export button is clicked', () => {
    render(<ChatHeader {...defaultProps} activeSession={mockSession} />);
    
    const exportButton = screen.getByTitle('Exportar sessão');
    fireEvent.click(exportButton);
    
    expect(defaultProps.onExportSession).toHaveBeenCalledTimes(1);
  });

  it('should disable export button when no active session', () => {
    render(<ChatHeader {...defaultProps} />);
    
    const exportButton = screen.getByTitle('Exportar sessão');
    expect(exportButton).toBeDisabled();
  });

  it('should not show clear button when no active session', () => {
    render(<ChatHeader {...defaultProps} />);
    
    expect(screen.queryByTitle('Limpar sessão')).not.toBeInTheDocument();
  });
});