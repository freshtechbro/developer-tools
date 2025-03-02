import { z } from 'zod';
/**
 * Common search options supported by all providers
 */
export const SearchOptionsSchema = z.object({
    maxTokens: z.number().optional().default(150),
    model: z.string().optional(),
    temperature: z.number().min(0).max(1).optional().default(0.7),
    timeout: z.number().optional().default(30000),
    detailed: z.boolean().optional().default(false),
});
/**
 * Error types specific to search providers
 */
export class SearchProviderError extends Error {
    provider;
    constructor(message, provider) {
        super(message);
        this.provider = provider;
        this.name = 'SearchProviderError';
    }
}
export class ProviderAuthError extends SearchProviderError {
    constructor(provider) {
        super(`Authentication failed for provider: ${provider}`, provider);
        this.name = 'ProviderAuthError';
    }
}
export class ProviderRateLimitError extends SearchProviderError {
    constructor(provider) {
        super(`Rate limit exceeded for provider: ${provider}`, provider);
        this.name = 'ProviderRateLimitError';
    }
}
export class ProviderTimeoutError extends SearchProviderError {
    constructor(provider, timeoutMs) {
        super(`Request timed out after ${timeoutMs}ms for provider: ${provider}`, provider);
        this.name = 'ProviderTimeoutError';
    }
}
