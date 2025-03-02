import { SearchResult } from '../providers/provider-interface.js';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '@developer-tools/shared/config';
import { logger } from '@developer-tools/shared/logger';

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
  
  /**
   * Tags for categorizing cached items
   * Useful for selective cache invalidation
   */
  tags?: string[];
  
  /**
   * Priority of the cached item (1-10)
   * Higher priority items will be kept longer during cleanup
   * Default: 5
   */
  priority?: number;
}

/**
 * Cached item structure
 */
interface CachedItem<T> {
  /**
   * Timestamp when the item was cached
   */
  timestamp: number;
  
  /**
   * The cached data
   */
  data: T;
  
  /**
   * Optional tags for the cached item
   */
  tags?: string[];
  
  /**
   * Priority of the cached item (1-10)
   * Higher priority items will be kept longer during cleanup
   */
  priority?: number;
  
  /**
   * Number of times this item has been accessed
   */
  accessCount: number;
  
  /**
   * Timestamp of last access
   */
  lastAccessed: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  /**
   * Total number of items in the cache
   */
  totalItems: number;
  
  /**
   * Number of items in memory cache
   */
  memoryItems: number;
  
  /**
   * Number of items in file cache
   */
  fileItems: number;
  
  /**
   * Number of cache hits
   */
  hits: number;
  
  /**
   * Number of cache misses
   */
  misses: number;
  
  /**
   * Number of expired items removed
   */
  expired: number;
  
  /**
   * Timestamp of last cleanup
   */
  lastCleanup: number | null;
  
  /**
   * Cache hit rate (0-1)
   */
  hitRate: number;
}

/**
 * Search cache service
 * Provides caching for search results both in memory and on disk
 */
export class SearchCacheService {
  // In-memory cache
  private memoryCache = new Map<string, CachedItem<SearchResult>>();
  
  // Base directory for file cache
  private cacheDir: string;
  
  // Default cache options
  private defaultOptions: Required<CacheOptions> = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    useFileCache: true,
    useMemoryCache: true,
    tags: [],
    priority: 5
  };
  
  // Cache statistics
  private stats: CacheStats = {
    totalItems: 0,
    memoryItems: 0,
    fileItems: 0,
    hits: 0,
    misses: 0,
    expired: 0,
    lastCleanup: null,
    hitRate: 0
  };
  
  // Maximum memory cache size (number of items)
  private maxMemoryCacheSize = 1000;
  
  // Cleanup interval
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(options?: Partial<CacheOptions>) {
    // Merge provided options with defaults
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options
    };
    
    // Set cache directory
    this.cacheDir = path.join(
      config.storage?.cachePath || './cache',
      'web-search'
    );
    
    // Ensure cache directory exists
    this.ensureCacheDir().catch(error => {
      logger.error('Failed to create cache directory', { error });
    });
    
    // Schedule regular cleanup
    this.startPeriodicCleanup();
    
    // Update cache stats on startup
    this.updateCacheStats().catch(error => {
      logger.error('Failed to update cache stats', { error });
    });
  }
  
  /**
   * Generate a cache key for a search query and options
   * @param query Search query
   * @param options Options that affect the result
   * @returns Cache key
   */
  generateCacheKey(query: string, options: Record<string, any> = {}): string {
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
  async get(key: string, options?: Partial<CacheOptions>): Promise<SearchResult | null> {
    const opts = { ...this.defaultOptions, ...options };
    const now = Date.now();
    
    // Try memory cache first
    if (opts.useMemoryCache && this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key)!;
      
      // Check if expired
      if (now - cached.timestamp <= opts.maxAge) {
        // Update access statistics
        cached.accessCount++;
        cached.lastAccessed = now;
        
        // Update cache stats
        this.stats.hits++;
        this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
        
        logger.debug('Cache hit (memory)', { key });
        return cached.data;
      } else {
        // Remove expired item
        this.memoryCache.delete(key);
        this.stats.expired++;
        this.stats.memoryItems--;
        this.stats.totalItems--;
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
          const cached = JSON.parse(fileContent) as CachedItem<SearchResult>;
          
          // Update access statistics
          cached.accessCount++;
          cached.lastAccessed = now;
          
          // Store in memory cache as well
          if (opts.useMemoryCache) {
            this.memoryCache.set(key, cached);
            this.stats.memoryItems++;
            
            // Check if we need to clean up memory cache
            if (this.memoryCache.size > this.maxMemoryCacheSize) {
              this.cleanupMemoryCache();
            }
          }
          
          // Update file with new access stats
          await fs.writeFile(
            cacheFilePath,
            JSON.stringify(cached, null, 2),
            'utf-8'
          );
          
          // Update cache stats
          this.stats.hits++;
          this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
          
          logger.debug('Cache hit (file)', { key });
          return cached.data;
        } else {
          // File exists but is expired
          try {
            await fs.unlink(cacheFilePath);
            this.stats.expired++;
            this.stats.fileItems--;
            this.stats.totalItems--;
          } catch (error) {
            // Ignore deletion errors
          }
        }
      } catch (error) {
        // File doesn't exist or other error, ignore
      }
    }
    
    // Update cache stats
    this.stats.misses++;
    this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
    
    logger.debug('Cache miss', { key });
    return null;
  }
  
  /**
   * Store a search result in the cache
   * @param key Cache key
   * @param data Search result to cache
   * @param options Cache options
   */
  async set(key: string, data: SearchResult, options?: Partial<CacheOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    const now = Date.now();
    
    const cachedItem: CachedItem<SearchResult> = {
      timestamp: now,
      data,
      tags: opts.tags,
      priority: opts.priority,
      accessCount: 0,
      lastAccessed: now
    };
    
    // Store in memory cache
    if (opts.useMemoryCache) {
      // Check if key already exists
      const isNewItem = !this.memoryCache.has(key);
      
      this.memoryCache.set(key, cachedItem);
      
      if (isNewItem) {
        this.stats.memoryItems++;
        this.stats.totalItems++;
      }
      
      // Check if we need to clean up memory cache
      if (this.memoryCache.size > this.maxMemoryCacheSize) {
        this.cleanupMemoryCache();
      }
    }
    
    // Store in file cache
    if (opts.useFileCache) {
      try {
        await this.ensureCacheDir();
        
        const cacheFilePath = this.getCacheFilePath(key);
        const isNewItem = !await this.fileExists(cacheFilePath);
        
        await fs.writeFile(
          cacheFilePath,
          JSON.stringify(cachedItem, null, 2),
          'utf-8'
        );
        
        if (isNewItem) {
          this.stats.fileItems++;
          if (!opts.useMemoryCache) {
            this.stats.totalItems++;
          }
        }
        
        logger.debug('Saved to cache', { key });
      } catch (error) {
        logger.error('Failed to write to cache file', { key, error });
      }
    }
  }
  
  /**
   * Clear the cache
   * @param options Cache options to determine which caches to clear
   */
  async clear(options?: Partial<CacheOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Clear memory cache
    if (opts.useMemoryCache) {
      this.memoryCache.clear();
      this.stats.memoryItems = 0;
    }
    
    // Clear file cache
    if (opts.useFileCache) {
      try {
        await this.ensureCacheDir();
        
        const files = await fs.readdir(this.cacheDir);
        for (const file of files) {
          try {
            await fs.unlink(path.join(this.cacheDir, file));
          } catch (error) {
            logger.error('Failed to delete cache file', { file, error });
          }
        }
        
        this.stats.fileItems = 0;
      } catch (error) {
        logger.error('Failed to clear file cache', { error });
      }
    }
    
    // Update stats
    this.stats.totalItems = this.stats.memoryItems + this.stats.fileItems;
    
    logger.info('Cache cleared', { 
      memoryCleared: opts.useMemoryCache, 
      fileCleared: opts.useFileCache 
    });
  }
  
  /**
   * Clear cache items with specific tags
   * @param tags Tags to match
   * @param matchAll If true, requires all tags to match (AND). If false, matches any tag (OR).
   * @param options Cache options
   */
  async clearByTags(tags: string[], matchAll: boolean = false, options?: Partial<CacheOptions>): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    
    if (!tags || tags.length === 0) {
      return;
    }
    
    // Clear from memory cache
    if (opts.useMemoryCache) {
      const keysToDelete: string[] = [];
      
      this.memoryCache.forEach((value, key) => {
        if (value.tags && value.tags.length > 0) {
          const matches = matchAll
            ? tags.every(tag => value.tags!.includes(tag))
            : tags.some(tag => value.tags!.includes(tag));
            
          if (matches) {
            keysToDelete.push(key);
          }
        }
      });
      
      keysToDelete.forEach(key => this.memoryCache.delete(key));
      this.stats.memoryItems -= keysToDelete.length;
    }
    
    // Clear from file cache
    if (opts.useFileCache) {
      try {
        await this.ensureCacheDir();
        
        const files = await fs.readdir(this.cacheDir);
        let deletedCount = 0;
        
        for (const file of files) {
          try {
            const filePath = path.join(this.cacheDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const cachedItem = JSON.parse(content) as CachedItem<any>;
            
            if (cachedItem.tags && cachedItem.tags.length > 0) {
              const matches = matchAll
                ? tags.every(tag => cachedItem.tags!.includes(tag))
                : tags.some(tag => cachedItem.tags!.includes(tag));
                
              if (matches) {
                await fs.unlink(filePath);
                deletedCount++;
              }
            }
          } catch (error) {
            // Skip files that can't be read or aren't valid cache files
          }
        }
        
        this.stats.fileItems -= deletedCount;
      } catch (error) {
        logger.error('Failed to clear tagged cache files', { tags, error });
      }
    }
    
    // Update stats
    this.stats.totalItems = this.stats.memoryItems + this.stats.fileItems;
    
    logger.info('Cleared cache by tags', { tags, matchAll });
  }
  
  /**
   * Force refresh a specific cache item
   * @param key Cache key to refresh
   * @returns True if the item was removed, false if not found
   */
  async refresh(key: string): Promise<boolean> {
    let found = false;
    
    // Remove from memory cache
    if (this.memoryCache.has(key)) {
      this.memoryCache.delete(key);
      this.stats.memoryItems--;
      found = true;
    }
    
    // Remove from file cache
    try {
      const cacheFilePath = this.getCacheFilePath(key);
      if (await this.fileExists(cacheFilePath)) {
        await fs.unlink(cacheFilePath);
        this.stats.fileItems--;
        found = true;
      }
    } catch (error) {
      logger.error('Failed to remove cache file during refresh', { key, error });
    }
    
    if (found) {
      this.stats.totalItems--;
      logger.info('Refreshed cache item', { key });
    }
    
    return found;
  }
  
  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Start periodic cache cleanup
   * @param intervalMs Cleanup interval in milliseconds (default: 1 hour)
   */
  startPeriodicCleanup(intervalMs: number = 60 * 60 * 1000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanup().catch(error => {
        logger.error('Cache cleanup failed', { error });
      });
    }, intervalMs);
    
    logger.debug('Periodic cache cleanup scheduled', { intervalMs });
  }
  
  /**
   * Stop periodic cache cleanup
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.debug('Periodic cache cleanup stopped');
    }
  }
  
  /**
   * Clean up expired cache items
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    let expiredMemory = 0;
    let expiredFile = 0;
    
    // Clean up memory cache
    for (const [key, value] of this.memoryCache.entries()) {
      if (now - value.timestamp > this.defaultOptions.maxAge) {
        this.memoryCache.delete(key);
        expiredMemory++;
      }
    }
    
    // Clean up file cache
    try {
      await this.ensureCacheDir();
      
      const files = await fs.readdir(this.cacheDir);
      
      for (const file of files) {
        try {
          const filePath = path.join(this.cacheDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > this.defaultOptions.maxAge) {
            await fs.unlink(filePath);
            expiredFile++;
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }
    } catch (error) {
      logger.error('Failed to clean up file cache', { error });
    }
    
    // Update stats
    this.stats.expired += (expiredMemory + expiredFile);
    this.stats.memoryItems -= expiredMemory;
    this.stats.fileItems -= expiredFile;
    this.stats.totalItems = this.stats.memoryItems + this.stats.fileItems;
    this.stats.lastCleanup = now;
    
    logger.info('Cache cleanup completed', { 
      expiredMemory, 
      expiredFile, 
      remainingMemory: this.stats.memoryItems,
      remainingFile: this.stats.fileItems
    });
  }
  
  /**
   * Clean up memory cache when it exceeds the maximum size
   * Removes least recently used and lowest priority items first
   */
  private cleanupMemoryCache(): void {
    if (this.memoryCache.size <= this.maxMemoryCacheSize) {
      return;
    }
    
    logger.debug('Cleaning up memory cache', { 
      size: this.memoryCache.size, 
      maxSize: this.maxMemoryCacheSize 
    });
    
    // Convert to array for sorting
    const items: [string, CachedItem<SearchResult>][] = 
      Array.from(this.memoryCache.entries());
      
    // Sort by last access time (oldest first) and priority (lowest first)
    items.sort((a, b) => {
      // First sort by priority (higher priority is kept)
      const priorityDiff = (a[1].priority || 5) - (b[1].priority || 5);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by last access time (older is removed)
      return a[1].lastAccessed - b[1].lastAccessed;
    });
    
    // Remove oldest items until we're under the limit
    const itemsToRemove = items.slice(0, items.length - this.maxMemoryCacheSize);
    
    for (const [key] of itemsToRemove) {
      this.memoryCache.delete(key);
    }
    
    this.stats.memoryItems = this.memoryCache.size;
    this.stats.totalItems = this.stats.memoryItems + this.stats.fileItems;
    
    logger.debug('Memory cache cleaned up', { 
      removedCount: itemsToRemove.length, 
      newSize: this.memoryCache.size 
    });
  }
  
  /**
   * Get path to the cache file for a key
   * @param key Cache key
   * @returns File path
   */
  private getCacheFilePath(key: string): string {
    return path.join(this.cacheDir, `${key}.json`);
  }
  
  /**
   * Ensure the cache directory exists
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create cache directory: ${error}`);
    }
  }
  
  /**
   * Check if a file exists
   * @param filePath Path to check
   * @returns True if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Update cache statistics by scanning the file cache
   */
  private async updateCacheStats(): Promise<void> {
    try {
      await this.ensureCacheDir();
      
      const files = await fs.readdir(this.cacheDir);
      this.stats.fileItems = files.length;
      this.stats.memoryItems = this.memoryCache.size;
      this.stats.totalItems = this.stats.fileItems + this.stats.memoryItems;
      
      logger.debug('Cache stats updated', { 
        fileItems: this.stats.fileItems,
        memoryItems: this.stats.memoryItems,
        totalItems: this.stats.totalItems
      });
    } catch (error) {
      logger.error('Failed to update cache stats', { error });
    }
  }
}

// Export a singleton instance
export const searchCacheService = new SearchCacheService(); 