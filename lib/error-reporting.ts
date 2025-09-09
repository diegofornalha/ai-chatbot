// Refactored from static classes to plain functions
// This eliminates the static-only class lint errors

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

export function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  options: {
    failureThreshold?: number;
    resetTimeout?: number;
  } = {}
): () => Promise<T> {
  const { failureThreshold = 5, resetTimeout = 60000 } = options;
  
  let failures = 0;
  let lastFailureTime = 0;
  let circuitOpen = false;
  
  return async () => {
    // Check if circuit should be reset
    if (circuitOpen && Date.now() - lastFailureTime > resetTimeout) {
      circuitOpen = false;
      failures = 0;
    }
    
    if (circuitOpen) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await operation();
      failures = 0; // Reset on success
      return result;
    } catch (error) {
      failures++;
      lastFailureTime = Date.now();
      
      if (failures >= failureThreshold) {
        circuitOpen = true;
      }
      
      throw error;
    }
  };
}

// Error Context Manager
interface ErrorContext {
  userId?: string;
  sessionId?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

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
