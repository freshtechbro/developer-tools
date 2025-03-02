import { z } from 'zod';
/**
 * Common search options supported by all providers
 */
export declare const SearchOptionsSchema: any;
export type SearchOptions = z.infer<typeof SearchOptionsSchema>;
/**
 * Source information structure
 */
export interface Source {
    title?: string;
    url?: string;
    snippet?: string;
    relevance?: number;
    publishDate?: string;
}
/**
 * Search result structure
 */
export interface SearchResult {
    content: string;
    metadata?: {
        model?: string;
        tokenUsage?: {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
        };
        sources?: Source[];
        provider?: string;
        query?: string;
        timestamp?: string;
    };
}
/**
 * Search provider interface
 * All search providers must implement this interface
 */
export interface SearchProvider {
    /**
     * Name of the provider
     */
    name: string;
    /**
     * Initialize the provider (check API keys, setup clients, etc.)
     */
    initialize(): Promise<void>;
    /**
     * Execute a search query
     * @param query The search query
     * @param options Search options
     * @returns Search result
     */
    search(query: string, options: SearchOptions): Promise<SearchResult>;
    /**
     * Check if the provider is available (has valid API keys, etc.)
     */
    isAvailable(): Promise<boolean>;
}
/**
 * Error types specific to search providers
 */
export declare class SearchProviderError extends Error {
    provider: string;
    constructor(message: string, provider: string);
}
export declare class ProviderAuthError extends SearchProviderError {
    constructor(provider: string);
}
export declare class ProviderRateLimitError extends SearchProviderError {
    constructor(provider: string);
}
export declare class ProviderTimeoutError extends SearchProviderError {
    constructor(provider: string, timeoutMs: number);
}
