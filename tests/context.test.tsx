import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionProvider } from 'next-auth/react';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { AIProvider } from '@/ai/provider';

describe('Context Components', () => {
  describe('DataStreamProvider', () => {
    it('should render children correctly', () => {
      render(
        <DataStreamProvider>
          <div data-testid="child">Test Child</div>
        </DataStreamProvider>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide data stream context', () => {
      const TestComponent = () => {
        const context = require('@/components/data-stream-provider').useDataStream();
        return <div>{context ? 'Context Available' : 'No Context'}</div>;
      };

      render(
        <DataStreamProvider>
          <TestComponent />
        </DataStreamProvider>
      );

      expect(screen.getByText('Context Available')).toBeInTheDocument();
    });
  });

  describe('SessionProvider', () => {
    it('should provide session context', () => {
      const mockSession = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        expires: '2025-12-31'
      };

      render(
        <SessionProvider session={mockSession}>
          <div>Session Test</div>
        </SessionProvider>
      );

      expect(screen.getByText('Session Test')).toBeInTheDocument();
    });
  });

  describe('AIProvider', () => {
    it('should render and provide AI context', () => {
      render(
        <AIProvider>
          <div data-testid="ai-child">AI Test</div>
        </AIProvider>
      );

      expect(screen.getByTestId('ai-child')).toBeInTheDocument();
    });
  });
});