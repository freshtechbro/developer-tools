import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '@developer-tools/shared/config';
import { logger } from '@developer-tools/shared/logger';
/**
 * Search cache service
 * Provides caching for search results both in memory and on disk
 */
export class SearchCacheService {
    // In-memory cache
    memoryCache = new Map();
    // Base directory for file cache
    cacheDir;
    // Default cache options
    defaultOptions = {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        useFileCache: true,
        useMemoryCache: true
    };
    constructor(options) {
        // Merge provided options with defaults
        this.defaultOptions = {
            ...this.defaultOptions,
            ...options
        };
        // Set cache directory
        this.cacheDir = path.join(config.storage?.cachePath || './cache', 'web-search');
        // Ensure cache directory exists
        this.ensureCacheDir().catch(error => {
            logger.error('Failed to create cache directory', { error });
        });
    }
    /**
     * Generate a cache key for a search query and options
     * @param query Search query
     * @param options Options that affect the result
     * @returns Cache key
     */
    generateCacheKey(query, options = {}) {
        // Create a string with the query and relevant options
        const keyData = JSON.stringify({
            query: query.toLowerCase().trim(),
            provider: options.provider,
            model: options.model,
            detailed: options.detailed,
            maxTokens: options.maxTokens
        });
        // Hash the key data to create a cache key
        return createHash('md5').update(keyData).digest('hex');
    }
    /**
     * Get a cached search result
     * @param key Cache key
     * @param options Cache options
     * @returns Cached result or null if not found or expired
     */
    async get(key, options) {
        const opts = { ...this.defaultOptions, ...options };
        const now = Date.now();
        // Try memory cache first
        if (opts.useMemoryCache && this.memoryCache.has(key)) {
            const cached = this.memoryCache.get(key);
            // Check if expired
            if (now - cached.timestamp <= opts.maxAge) {
                logger.debug('Cache hit (memory)', { key });
                return cached.data;
            }
            else {
                // Remove expired item
                this.memoryCache.delete(key);
            }
        }
        // Try file cache if memory cache failed
        if (opts.useFileCache) {
            try {
                const cacheFilePath = this.getCacheFilePath(key);
                const fileStats = await fs.stat(cacheFilePath);
                // Check if file exists and is not expired
                if (fileStats.isFile() && now - fileStats.mtime.getTime() <= opts.maxAge) {
                    const fileContent = await fs.readFile(cacheFilePath, 'utf-8');
                    const cached = JSON.parse(fileContent);
                    // Store in memory cache as well
                    if (opts.useMemoryCache) {
                        this.memoryCache.set(key, cached);
                    }
                    logger.debug('Cache hit (file)', { key });
                    return cached.data;
                }
            }
            catch (error) {
                // File doesn't exist or other error, ignore
            }
        }
        logger.debug('Cache miss', { key });
        return null;
    }
    /**
     * Store a search result in the cache
     * @param key Cache key
     * @param data Search result to cache
     * @param options Cache options
     */
    async set(key, data, options) {
        const opts = { ...this.defaultOptions, ...options };
        const cachedItem = {
            timestamp: Date.now(),
            data
        };
        // Store in memory cache
        if (opts.useMemoryCache) {
            this.memoryCache.set(key, cachedItem);
        }
        // Store in file cache
        if (opts.useFileCache) {
            try {
                await this.ensureCacheDir();
                const cacheFilePath = this.getCacheFilePath(key);
                await fs.writeFile(cacheFilePath, JSON.stringify(cachedItem, null, 2), 'utf-8');
                logger.debug('Saved to cache', { key });
            }
            catch (error) {
                logger.error('Failed to write to cache file', { key, error });
            }
        }
    }
    /**
     * Clear the cache
     * @param options Cache options to determine which caches to clear
     */
    async clear(options) {
        const opts = { ...this.defaultOptions, ...options };
        // Clear memory cache
        if (opts.useMemoryCache) {
            this.memoryCache.clear();
        }
        // Clear file cache
        if (opts.useFileCache) {
            try {
                const files = await fs.readdir(this.cacheDir);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        await fs.unlink(path.join(this.cacheDir, file));
                    }
                }
                logger.info('Cache cleared');
            }
            catch (error) {
                // Directory might not exist yet, or other error
                logger.error('Failed to clear cache', { error });
            }
        }
    }
    /**
     * Get the file path for a cache key
     * @param key Cache key
     * @returns File path
     */
    getCacheFilePath(key) {
        return path.join(this.cacheDir, `${key}.json`);
    }
    /**
     * Ensure the cache directory exists
     */
    async ensureCacheDir() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        }
        catch (error) {
            logger.error('Failed to create cache directory', { error });
            throw error;
        }
    }
}
// Create and export a default instance
export const searchCacheService = new SearchCacheService();
