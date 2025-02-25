import { logger } from './logger.js';

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: Array<string | RegExp>;
}

export const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'RATE_LIMIT',
    /^5\d{2}$/,  // 5XX errors
    'socket hang up',
  ],
};

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const retryOptions = { ...defaultRetryOptions, ...options };
  let lastError: Error | null = null;
  let delay = retryOptions.initialDelay;

  for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === retryOptions.maxAttempts) {
        throw new RetryError(
          `Operation failed after ${attempt} attempts`,
          attempt,
          lastError
        );
      }

      const shouldRetry = retryOptions.retryableErrors?.some(pattern => {
        if (pattern instanceof RegExp) {
          return pattern.test(lastError?.message || '');
        }
        return lastError?.message?.includes(pattern);
      });

      if (!shouldRetry) {
        throw lastError;
      }

      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: lastError.message,
        attempt,
        nextDelay: delay,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * retryOptions.backoffFactor, retryOptions.maxDelay);
    }
  }

  throw new RetryError(
    'Retry operation failed unexpectedly',
    retryOptions.maxAttempts,
    lastError!
  );
} 