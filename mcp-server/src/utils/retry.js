import { logger } from './logger.js';
export const defaultRetryOptions = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'RATE_LIMIT',
        /^5\d{2}$/, // 5XX errors
        'socket hang up',
    ],
};
export class RetryError extends Error {
    attempts;
    lastError;
    constructor(message, attempts, lastError) {
        super(message);
        this.attempts = attempts;
        this.lastError = lastError;
        this.name = 'RetryError';
    }
}
export async function withRetry(operation, options = {}) {
    const retryOptions = { ...defaultRetryOptions, ...options };
    let lastError = null;
    let delay = retryOptions.initialDelay;
    for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (attempt === retryOptions.maxAttempts) {
                throw new RetryError(`Operation failed after ${attempt} attempts`, attempt, lastError);
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
    throw new RetryError('Retry operation failed unexpectedly', retryOptions.maxAttempts, lastError);
}
