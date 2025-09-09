// Refactored from static classes to plain functions
// This eliminates the static-only class lint errors while maintaining all functionality

// Interfaces
export interface ErrorReport {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  context?: ErrorContext;
  metadata?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

export interface ErrorReportingConfig {
  enabled: boolean;
  logToConsole: boolean;
  endpoint?: string;
  sampleRate: number;
  maxRetries: number;
  retryDelay: number;
  enablePerformanceMonitoring: boolean;
  enableNetworkMonitoring: boolean;
}

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

// Configuration
const defaultConfig: ErrorReportingConfig = {
  enabled: true,
  logToConsole: true,
  sampleRate: 1.0,
  maxRetries: 3,
  retryDelay: 1000,
  enablePerformanceMonitoring: true,
  enableNetworkMonitoring: true,
};

let config = { ...defaultConfig };

export function initializeErrorReporting(customConfig?: Partial<ErrorReportingConfig>) {
  if (customConfig) {
    config = { ...config, ...customConfig };
  }
  
  // Set up global error handlers
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      logError(event.error || new Error(event.message), {
        context: { url: event.filename, line: event.lineno, column: event.colno }
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      logError(new Error(`Unhandled promise rejection: ${event.reason}`), {
        context: { reason: event.reason }
      });
    });
  }
}

// Error ID Generation
export function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Main error logging function
export async function logError(
  error: Error,
  options: {
    context?: ErrorContext;
    metadata?: Record<string, unknown>;
    sendToServer?: boolean;
  } = {}
): Promise<string> {
  const errorId = generateErrorId();
  
  // Sample rate check
  if (Math.random() > config.sampleRate) {
    return errorId;
  }
  
  const errorReport: ErrorReport = {
    id: errorId,
    timestamp: new Date(),
    message: error.message,
    stack: error.stack,
    context: { ...currentContext, ...options.context },
    metadata: options.metadata,
    userId: currentContext.userId,
    sessionId: currentContext.sessionId,
  };
  
  if (typeof window !== 'undefined') {
    errorReport.url = window.location.href;
    errorReport.userAgent = navigator.userAgent;
  }
  
  // Log to console if enabled
  if (config.logToConsole) {
    console.error(`[${errorId}] Error:`, error);
    if (options.context || options.metadata) {
      console.error('Context:', { context: options.context, metadata: options.metadata });
    }
  }
  
  // Send to server if enabled and requested
  if (config.enabled && config.endpoint && options.sendToServer !== false) {
    try {
      await sendErrorReport(errorReport);
    } catch (sendError) {
      console.error('Failed to send error report:', sendError);
    }
  }
  
  return errorId;
}

// Send error report to server
async function sendErrorReport(report: ErrorReport): Promise<void> {
  if (!config.endpoint) return;
  
  let attempts = 0;
  let lastError: Error | undefined;
  
  while (attempts < config.maxRetries) {
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempts++;
      
      if (attempts < config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempts));
      }
    }
  }
  
  throw lastError || new Error('Failed to send error report');
}

// Custom Error Classes
export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number, public url?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public resource?: string, public action?: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Error Recovery Functions (formerly ErrorRecovery class)
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  initialDelay = 1000,
  backoffMultiplier = 2
): Promise<T> {
  let lastError: Error | undefined;
  let delay = initialDelay;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }
  
  throw lastError || new Error('Operation failed');
}

export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

// Circuit Breaker with shared state
const circuitBreakerStates = new Map<string, {
  failures: number;
  lastFailureTime: number;
  circuitOpen: boolean;
}>();

export function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  options: {
    key?: string;
    failureThreshold?: number;
    resetTimeout?: number;
  } = {}
): () => Promise<T> {
  const { 
    key = 'default',
    failureThreshold = 5, 
    resetTimeout = 60000 
  } = options;
  
  // Get or create state for this circuit breaker
  if (!circuitBreakerStates.has(key)) {
    circuitBreakerStates.set(key, {
      failures: 0,
      lastFailureTime: 0,
      circuitOpen: false,
    });
  }
  
  return async () => {
    const state = circuitBreakerStates.get(key)!;
    
    // Check if circuit should be reset
    if (state.circuitOpen && Date.now() - state.lastFailureTime > resetTimeout) {
      state.circuitOpen = false;
      state.failures = 0;
    }
    
    if (state.circuitOpen) {
      throw new Error(`Circuit breaker is open for key: ${key}`);
    }
    
    try {
      const result = await operation();
      state.failures = 0; // Reset on success
      return result;
    } catch (error) {
      state.failures++;
      state.lastFailureTime = Date.now();
      
      if (state.failures >= failureThreshold) {
        state.circuitOpen = true;
      }
      
      throw error;
    }
  };
}

// Error Context Manager
let currentContext: ErrorContext = {};

export function setErrorContext(context: ErrorContext): void {
  currentContext = { ...currentContext, ...context };
}

export function clearErrorContext(): void {
  currentContext = {};
}

export function getErrorContext(): ErrorContext {
  return { ...currentContext };
}

export function withContext<T>(
  context: ErrorContext,
  operation: () => T
): T {
  const previousContext = { ...currentContext };
  setErrorContext(context);
  
  try {
    return operation();
  } finally {
    currentContext = previousContext;
  }
}

// Error Enhancement
export function enhanceError(
  error: Error,
  additionalInfo?: Record<string, unknown>
): Error {
  const enhanced = new Error(error.message);
  enhanced.name = error.name;
  enhanced.stack = error.stack;
  
  Object.assign(enhanced, {
    originalError: error,
    context: getErrorContext(),
    timestamp: new Date().toISOString(),
    ...additionalInfo
  });
  
  return enhanced;
}

// Async Error Handler
export function createAsyncErrorHandler(
  onError: (error: Error) => void
): (error: Error) => void {
  return (error: Error) => {
    // Ensure error handling doesn't throw
    try {
      onError(enhanceError(error));
    } catch (handlerError) {
      console.error('Error in error handler:', handlerError);
      console.error('Original error:', error);
    }
  };
}

// Performance Monitor (formerly a class)
let performanceEntries: PerformanceEntry[] = [];

export function startPerformanceMonitoring(): void {
  if (!config.enablePerformanceMonitoring) return;
  
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      performanceEntries.push(...list.getEntries());
    });
    
    observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
  }
}

export function getPerformanceMetrics(): PerformanceEntry[] {
  return [...performanceEntries];
}

export function clearPerformanceMetrics(): void {
  performanceEntries = [];
}

// Export configuration
export { config as errorReportingConfig };

// Backward compatibility exports for ErrorRecovery class methods
export const ErrorRecovery = {
  withRetry,
  withTimeout,
  withCircuitBreaker,
};