import type { ErrorInfo } from 'react';

export interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  level: 'critical' | 'error' | 'warning' | 'info';
  timestamp: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  buildId?: string;
  digest?: string;
  context?: Record<string, any>;
}

export interface ErrorReportingConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  environment: 'development' | 'production' | 'staging';
  enableConsoleLogging: boolean;
  enableRemoteReporting: boolean;
  maxRetries: number;
  retryDelay: number;
}

// Default configuration
const defaultConfig: ErrorReportingConfig = {
  enabled: true,
  endpoint: '/api/errors',
  environment: (process.env.NODE_ENV as any) || 'development',
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableRemoteReporting: process.env.NODE_ENV === 'production',
  maxRetries: 3,
  retryDelay: 1000,
};

let config: ErrorReportingConfig = { ...defaultConfig };

// Initialize error reporting
export function initializeErrorReporting(customConfig?: Partial<ErrorReportingConfig>) {
  config = { ...defaultConfig, ...customConfig };
  
  // Setup global error handlers
  if (typeof window !== 'undefined' && config.enabled) {
    setupGlobalErrorHandlers();
  }
}

// Generate unique error ID
export function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get session information
function getSessionInfo(): { userId?: string; sessionId?: string; buildId?: string } {
  try {
    // Get user ID from session storage or auth context
    const userId = sessionStorage.getItem('userId') || undefined;
    
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    
    // Get build ID if available
    const buildId = process.env.NEXT_PUBLIC_BUILD_ID;
    
    return { userId, sessionId, buildId };
  } catch {
    return {};
  }
}

// Enhanced error logging with context
export async function logError(
  error: Error | string,
  errorInfo?: ErrorInfo,
  context?: Record<string, any>
): Promise<string> {
  if (!config.enabled) return '';

  const errorId = generateErrorId();
  const isErrorObject = error instanceof Error;
  const sessionInfo = getSessionInfo();

  const errorReport: ErrorReport = {
    errorId,
    message: isErrorObject ? error.message : error,
    stack: isErrorObject ? error.stack : undefined,
    componentStack: errorInfo?.componentStack || undefined,
    level: 'error',
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    context,
    ...sessionInfo,
  };

  // Console logging
  if (config.enableConsoleLogging) {
    console.group(`🚨 Error Report [${errorReport.errorId}]`);
    console.error('Message:', errorReport.message);
    if (errorReport.stack) console.error('Stack:', errorReport.stack);
    if (errorReport.componentStack) console.error('Component Stack:', errorReport.componentStack);
    if (errorReport.context) console.error('Context:', errorReport.context);
    console.groupEnd();
  }

  // Remote reporting
  if (config.enableRemoteReporting) {
    await reportErrorRemotely(errorReport);
  }

  return errorId;
}

// Report error to remote service with retry logic
async function reportErrorRemotely(errorReport: ErrorReport, attempt = 1): Promise<void> {
  if (!config.endpoint) return;

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
      body: JSON.stringify(errorReport),
    });

    if (!response.ok) {
      throw new Error(`Error reporting failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Failed to report error (attempt ${attempt}):`, error);
    
    if (attempt < config.maxRetries) {
      setTimeout(() => {
        reportErrorRemotely(errorReport, attempt + 1);
      }, config.retryDelay * attempt);
    }
  }
}

// Setup global error handlers
function setupGlobalErrorHandlers() {
  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, undefined, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'unhandled_error',
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      event.reason instanceof Error ? event.reason : String(event.reason),
      undefined,
      {
        type: 'unhandled_rejection',
      }
    );
  });

  // Handle React errors (if not caught by error boundaries)
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Check if this is a React error
    const message = args[0];
    if (typeof message === 'string' && message.includes('React')) {
      logError(message, undefined, {
        type: 'react_console_error',
        args: args.slice(1),
      });
    }
    originalConsoleError.apply(console, args);
  };
}

// Specific error types
export class NetworkError extends Error {
  constructor(message: string, public status?: number, public endpoint?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Error recovery utilities
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  initialDelay = 1000,
  backoffMultiplier = 2
): Promise<T> {
  let lastError: Error = new Error('No attempts made');
  let currentDelay = initialDelay;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        break;
      }
      
      // Log retry attempt
      await logError(lastError, undefined, {
        type: 'retry_attempt',
        attempt,
        maxAttempts,
        nextDelay: currentDelay,
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= backoffMultiplier;
    }
  }
  
  throw lastError;
}

export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([operation(), timeoutPromise]);
}

export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  failureThreshold = 5,
  resetTimeout = 60000
): Promise<T> {
  // Simple circuit breaker implementation
  const key = operation.toString();
  const state = getCircuitBreakerState(key);
  
  if (state.isOpen && Date.now() - state.lastFailureTime < resetTimeout) {
    throw new Error('Circuit breaker is open');
  }
  
  try {
    const result = await operation();
    recordCircuitBreakerSuccess(key);
    return result;
  } catch (error) {
    recordCircuitBreakerFailure(key);
    if (getCircuitBreakerFailureCount(key) >= failureThreshold) {
      openCircuitBreaker(key);
    }
    throw error;
  }
}

// Simple circuit breaker state management
const circuitBreakerStates = new Map<string, {
  failures: number;
  isOpen: boolean;
  lastFailureTime: number;
}>();

function getCircuitBreakerState(key: string) {
  if (!circuitBreakerStates.has(key)) {
    circuitBreakerStates.set(key, {
      failures: 0,
      isOpen: false,
      lastFailureTime: 0,
    });
  }
  const state = circuitBreakerStates.get(key);
  if (!state) {
    throw new Error('Circuit breaker state not found');
  }
  return state;
}

function recordCircuitBreakerSuccess(key: string) {
  const state = getCircuitBreakerState(key);
  state.failures = 0;
  state.isOpen = false;
}

function recordCircuitBreakerFailure(key: string) {
  const state = getCircuitBreakerState(key);
  state.failures++;
  state.lastFailureTime = Date.now();
}

function openCircuitBreaker(key: string) {
  const state = getCircuitBreakerState(key);
  state.isOpen = true;
}

function getCircuitBreakerFailureCount(key: string) {
  return getCircuitBreakerState(key).failures;
}

// Performance monitoring
export function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  return operation()
    .then((result) => {
      const duration = performance.now() - start;
      
      // Log performance metrics
      if (config.enableConsoleLogging) {
        console.log(`⏱️ Performance [${name}]: ${duration.toFixed(2)}ms`);
      }
      
      // Report slow operations
      if (duration > 5000) { // 5 seconds threshold
        logError(`Slow operation detected: ${name}`, undefined, {
          type: 'performance_warning',
          duration,
          operation: name,
        });
      }
      
      return result;
    })
    .catch((error) => {
      const duration = performance.now() - start;
      logError(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        {
          type: 'operation_failure',
          duration,
          operation: name,
        }
      );
      throw error;
    });
}

export { config as errorReportingConfig };