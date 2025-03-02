import { SearchProvider, SearchOptions, SearchResult } from './provider-interface.js';
/**
 * Perplexity API provider implementation
 */
export declare class PerplexityProvider implements SearchProvider {
    name: string;
    private apiKey;
    private readonly apiUrl;
    /**
     * Initialize the Perplexity provider
     * Checks if API key is available
     */
    initialize(): Promise<void>;
    /**
     * Check if the provider is available
     * @returns True if API key is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Search using Perplexity API
     * @param query The search query
     * @param options Search options
     * @returns Search result
     */
    search(query: string, options: SearchOptions): Promise<SearchResult>;
    /**
     * Format the search query based on options
     * @param query The search query
     * @param options Search options
     * @returns Formatted query
     */
    private formatSearchQuery;
    /**
     * Clean the response text by removing common patterns
     * @param text Response text to clean
     * @returns Cleaned text
     */
    private cleanResponse;
}
