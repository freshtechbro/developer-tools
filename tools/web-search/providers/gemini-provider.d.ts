import { SearchProvider, SearchOptions, SearchResult } from './provider-interface.js';
/**
 * Google Gemini API provider implementation
 */
export declare class GeminiProvider implements SearchProvider {
    name: string;
    private apiKey;
    private client;
    /**
     * Initialize the Google Gemini provider
     * Checks if API key is available and sets up the client
     */
    initialize(): Promise<void>;
    /**
     * Check if the provider is available
     * @returns True if API key is available and client initialized
     */
    isAvailable(): Promise<boolean>;
    /**
     * Search using Google Gemini API
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
