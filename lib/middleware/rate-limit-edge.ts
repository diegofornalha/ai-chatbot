/**
 * Edge Runtime compatible Rate Limiting Middleware for Next.js
 * In-memory only implementation without Redis dependencies
 */

import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/lib/config/app-config';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// In-memory store for Edge Runtime
const memoryRateLimitStore = new Map<string, RateLimitEntry>();

// Clean expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryRateLimitStore.entries()) {
      if (entry.resetTime < now) {
        memoryRateLimitStore.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

/**
 * Get unique client identifier
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Add user agent for more granularity
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create simple hash
  return `${ip}-${userAgent.substring(0, 50)}`;
}

/**
 * Memory-based rate limit check
 */
function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): RateLimitResult {
  const now = Date.now();
  const resetTime = now + windowMs;
  
  let entry = memoryRateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // New window
    entry = {
      count: 1,
      resetTime,
    };
    memoryRateLimitStore.set(key, entry);
  } else {
    // Increment counter
    entry.count++;
  }

  const remaining = Math.max(0, maxRequests - entry.count);
  const retryAfter = entry.count > maxRequests ? Math.ceil((entry.resetTime - now) / 1000) : undefined;

  return {
    success: entry.count <= maxRequests,
    limit: maxRequests,
    remaining,
    resetTime: entry.resetTime,
    retryAfter,
  };
}

/**
 * Rate limiting middleware for Edge Runtime
 */
export async function rateLimit(
  request: NextRequest,
  options?: {
    windowMs?: number;
    maxRequests?: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: NextRequest) => string;
  }
) {
  // Check if rate limiting is enabled
  if (!appConfig.isFeatureEnabled('enableRateLimiting')) {
    return NextResponse.next();
  }
  
  const config = appConfig.get('security').rateLimit;
  const windowMs = options?.windowMs || config.windowMs;
  const maxRequests = options?.maxRequests || config.maxRequests;
  
  // Generate unique key for the client
  const key = options?.keyGenerator 
    ? options.keyGenerator(request)
    : getClientIdentifier(request);
  
  // Check rate limit
  const result = checkRateLimit(key, windowMs, maxRequests);
  
  // If rate limit exceeded
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': result.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
          'X-RateLimit-Backend': 'memory',
        },
      }
    );
  }
  
  // Add informative headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
  response.headers.set('X-RateLimit-Backend', 'memory');
  
  return response;
}

/**
 * Factory para criar rate limiters específicos
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  return async (request: NextRequest) => {
    return rateLimit(request, options);
  };
}

/**
 * Rate limiters pré-configurados
 */
export const rateLimiters = {
  // API geral - 100 requests por 15 minutos
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    message: 'Too many API requests',
  }),
  
  // Auth - 5 tentativas por 15 minutos
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts',
  }),
  
  // Claude AI - 30 requests por 5 minutos
  ai: createRateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 30,
    message: 'Too many AI requests',
  }),
  
  // Upload - 10 uploads por hora
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many uploads',
  }),
  
  // Strict - 1 request por minuto (para operações muito sensíveis)
  strict: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 1,
    message: 'Please wait before trying again',
  }),
};

/**
 * Middleware para aplicar rate limiting baseado no path
 */
export async function applyRateLimit(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Aplicar rate limiting específico baseado no path
  if (path.startsWith('/api/auth')) {
    return rateLimiters.auth(request);
  }
  
  if (path.startsWith('/api/claude') || path.startsWith('/api/ai')) {
    return rateLimiters.ai(request);
  }
  
  if (path.startsWith('/api/upload') || path.includes('/artifacts/save')) {
    return rateLimiters.upload(request);
  }
  
  if (path.startsWith('/api/admin')) {
    return rateLimiters.strict(request);
  }
  
  // Rate limiting geral para outras APIs
  if (path.startsWith('/api')) {
    return rateLimiters.api(request);
  }
  
  // Sem rate limiting para rotas não-API
  return NextResponse.next();
}

// Export types and utilities
export type RateLimiter = typeof rateLimiters[keyof typeof rateLimiters];
export type RateLimitOptions = Parameters<typeof rateLimit>[1];
export type { RateLimitResult, RateLimitEntry };

// Export backend status
export const getRateLimitBackend = () => 'memory';

// Export rate limit statistics
export async function getRateLimitStats(key: string): Promise<{
  count: number;
  remaining: number;
  resetTime: number;
  backend: 'redis' | 'memory';
} | null> {
  const entry = memoryRateLimitStore.get(key);
  if (entry) {
    return {
      count: entry.count,
      remaining: Math.max(0, 100 - entry.count), // Default limit
      resetTime: entry.resetTime,
      backend: 'memory'
    };
  }
  
  return null;
}