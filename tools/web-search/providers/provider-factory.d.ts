import { SearchProvider } from './provider-interface.js';
/**
 * Get a search provider by name
 * @param name Provider name (perplexity, gemini, openai)
 * @returns Provider instance
 */
export declare function getProvider(name?: string): SearchProvider;
/**
 * Returns all available providers
 */
export declare function getAvailableProviders(): Promise<SearchProvider[]>;
/**
 * Get fallback providers in order of preference
 * @param currentProvider The current provider that failed
 * @returns Array of fallback providers
 */
export declare function getFallbackProviders(currentProvider: string): Promise<SearchProvider[]>;
