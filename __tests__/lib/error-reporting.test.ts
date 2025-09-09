import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withRetry,
  withTimeout,
  withCircuitBreaker,
  logError,
  initializeErrorReporting,
  generateErrorId,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  setErrorContext,
  clearErrorContext,
  getErrorContext,
  enhanceError,
  createAsyncErrorHandler,
  ErrorRecovery,
} from '@/lib/error-reporting';

describe('Error Reporting Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearErrorContext();
  });

  describe('withRetry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failed');
        }
        return 'success';
      });

      const result = await withRetry(operation, 3, 10, 1);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const operation = vi.fn(async () => {
        throw new Error('Always fails');
      });

      await expect(withRetry(operation, 2, 10, 1)).rejects.toThrow('Always fails');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('withTimeout', () => {
    it('should complete operation within timeout', async () => {
      const operation = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'success';
      });

      const result = await withTimeout(operation, 100);
      expect(result).toBe('success');
    });

    it('should timeout slow operations', async () => {
      const operation = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'success';
      });

      await expect(withTimeout(operation, 50)).rejects.toThrow('Operation timed out after 50ms');
    });
  });

  describe('withCircuitBreaker', () => {
    it('should open circuit after failure threshold', async () => {
      const operation = vi.fn(async () => {
        throw new Error('Always fails');
      });

      const protectedOperation = withCircuitBreaker(operation, {
        key: 'test',
        failureThreshold: 2,
        resetTimeout: 100,
      });

      // First two calls should fail normally
      await expect(protectedOperation()).rejects.toThrow('Always fails');
      await expect(protectedOperation()).rejects.toThrow('Always fails');

      // Third call should fail with circuit open
      await expect(protectedOperation()).rejects.toThrow('Circuit breaker is open for key: test');
      
      // Operation should not be called on third attempt
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should reset circuit after timeout', async () => {
      const operation = vi.fn(async () => {
        throw new Error('Always fails');
      });

      const protectedOperation = withCircuitBreaker(operation, {
        key: 'test-reset',
        failureThreshold: 1,
        resetTimeout: 50,
      });

      // Open the circuit
      await expect(protectedOperation()).rejects.toThrow('Always fails');
      await expect(protectedOperation()).rejects.toThrow('Circuit breaker is open');

      // Wait for reset
      await new Promise(resolve => setTimeout(resolve, 60));

      // Should attempt operation again
      await expect(protectedOperation()).rejects.toThrow('Always fails');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Classes', () => {
    it('should create NetworkError with properties', () => {
      const error = new NetworkError('Network failed', 500, 'https://api.example.com');
      expect(error.message).toBe('Network failed');
      expect(error.name).toBe('NetworkError');
      expect(error.statusCode).toBe(500);
      expect(error.url).toBe('https://api.example.com');
    });

    it('should create ValidationError with properties', () => {
      const error = new ValidationError('Invalid email', 'email', 'notanemail');
      expect(error.message).toBe('Invalid email');
      expect(error.name).toBe('ValidationError');
      expect(error.field).toBe('email');
      expect(error.value).toBe('notanemail');
    });

    it('should create AuthenticationError with properties', () => {
      const error = new AuthenticationError('Invalid token', 'TOKEN_EXPIRED');
      expect(error.message).toBe('Invalid token');
      expect(error.name).toBe('AuthenticationError');
      expect(error.code).toBe('TOKEN_EXPIRED');
    });

    it('should create AuthorizationError with properties', () => {
      const error = new AuthorizationError('Access denied', 'users', 'delete');
      expect(error.message).toBe('Access denied');
      expect(error.name).toBe('AuthorizationError');
      expect(error.resource).toBe('users');
      expect(error.action).toBe('delete');
    });
  });

  describe('Error Context', () => {
    it('should set and get error context', () => {
      setErrorContext({ userId: 'user123', sessionId: 'session456' });
      const context = getErrorContext();
      expect(context.userId).toBe('user123');
      expect(context.sessionId).toBe('session456');
    });

    it('should clear error context', () => {
      setErrorContext({ userId: 'user123' });
      clearErrorContext();
      const context = getErrorContext();
      expect(context.userId).toBeUndefined();
    });

    it('should merge context updates', () => {
      setErrorContext({ userId: 'user123' });
      setErrorContext({ sessionId: 'session456' });
      const context = getErrorContext();
      expect(context.userId).toBe('user123');
      expect(context.sessionId).toBe('session456');
    });
  });

  describe('Error Enhancement', () => {
    it('should enhance error with context and timestamp', () => {
      setErrorContext({ userId: 'user123' });
      const originalError = new Error('Test error');
      const enhanced = enhanceError(originalError, { extra: 'data' });

      expect(enhanced.message).toBe('Test error');
      expect(enhanced).toHaveProperty('originalError', originalError);
      expect(enhanced).toHaveProperty('context');
      expect(enhanced).toHaveProperty('timestamp');
      expect(enhanced).toHaveProperty('extra', 'data');
    });
  });

  describe('Async Error Handler', () => {
    it('should handle errors without throwing', () => {
      const onError = vi.fn();
      const handler = createAsyncErrorHandler(onError);
      const error = new Error('Test error');

      expect(() => handler(error)).not.toThrow();
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Test error',
      }));
    });

    it('should handle errors in error handler', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onError = vi.fn(() => {
        throw new Error('Handler error');
      });
      const handler = createAsyncErrorHandler(onError);
      const error = new Error('Original error');

      expect(() => handler(error)).not.toThrow();
      expect(consoleError).toHaveBeenCalledWith('Error in error handler:', expect.any(Error));
      expect(consoleError).toHaveBeenCalledWith('Original error:', error);

      consoleError.mockRestore();
    });
  });

  describe('generateErrorId', () => {
    it('should generate unique error IDs', () => {
      const id1 = generateErrorId();
      const id2 = generateErrorId();
      
      expect(id1).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('ErrorRecovery backward compatibility', () => {
    it('should expose withRetry through ErrorRecovery object', () => {
      expect(ErrorRecovery.withRetry).toBe(withRetry);
    });

    it('should expose withTimeout through ErrorRecovery object', () => {
      expect(ErrorRecovery.withTimeout).toBe(withTimeout);
    });

    it('should expose withCircuitBreaker through ErrorRecovery object', () => {
      expect(ErrorRecovery.withCircuitBreaker).toBe(withCircuitBreaker);
    });
  });

  describe('logError', () => {
    it('should return error ID', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      
      const errorId = await logError(error);
      
      expect(errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });

    it('should include context in error report', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      setErrorContext({ userId: 'user123' });
      const error = new Error('Test error');
      
      await logError(error, {
        context: { operation: 'test' },
        metadata: { extra: 'data' },
      });
      
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringMatching(/^\[err_/),
        'Error:',
        error
      );
      
      consoleError.mockRestore();
    });
  });
});