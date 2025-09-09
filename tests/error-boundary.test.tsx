import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '@/components/error-boundary';
import { ComponentWithErrorBoundary } from '@/components/error-fallbacks';

describe('Error Boundaries', () => {
  describe('ErrorBoundary', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should catch errors and display fallback', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should have retry functionality', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Click retry
      fireEvent.click(retryButton);

      // Rerender with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('No error')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('ComponentWithErrorBoundary', () => {
    it('should wrap component with error boundary', () => {
      const TestComponent = () => <div>Test Component</div>;
      const WrappedComponent = ComponentWithErrorBoundary(TestComponent);

      render(<WrappedComponent />);

      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('should handle errors in wrapped component', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const ErrorComponent = () => {
        throw new Error('Component error');
      };
      const WrappedComponent = ComponentWithErrorBoundary(ErrorComponent);

      render(<WrappedComponent />);

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
});