import { SearchResult } from '../providers/provider-interface.js';
/**
 * Cache options interface
 */
interface CacheOptions {
    /**
     * Maximum age of cached items in milliseconds
     * Default: 24 hours
     */
    maxAge?: number;
    /**
     * Whether to use file-based caching
     * Default: true
     */
    useFileCache?: boolean;
    /**
     * Whether to use memory-based caching
     * Default: true
     */
    useMemoryCache?: boolean;
}
/**
 * Search cache service
 * Provides caching for search results both in memory and on disk
 */
export declare class SearchCacheService {
    private memoryCache;
    private cacheDir;
    private defaultOptions;
    constructor(options?: Partial<CacheOptions>);
    /**
     * Generate a cache key for a search query and options
     * @param query Search query
     * @param options Options that affect the result
     * @returns Cache key
     */
    generateCacheKey(query: string, options?: Record<string, any>): string;
    /**
     * Get a cached search result
     * @param key Cache key
     * @param options Cache options
     * @returns Cached result or null if not found or expired
     */
    get(key: string, options?: Partial<CacheOptions>): Promise<SearchResult | null>;
    /**
     * Store a search result in the cache
     * @param key Cache key
     * @param data Search result to cache
     * @param options Cache options
     */
    set(key: string, data: SearchResult, options?: Partial<CacheOptions>): Promise<void>;
    /**
     * Clear the cache
     * @param options Cache options to determine which caches to clear
     */
    clear(options?: Partial<CacheOptions>): Promise<void>;
    /**
     * Get the file path for a cache key
     * @param key Cache key
     * @returns File path
     */
    private getCacheFilePath;
    /**
     * Ensure the cache directory exists
     */
    private ensureCacheDir;
}
export declare const searchCacheService: SearchCacheService;
export {};
