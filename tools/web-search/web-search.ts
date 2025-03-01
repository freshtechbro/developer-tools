import { z } from 'zod';
import { logger } from '@developer-tools/shared/logger';
import { config } from '@developer-tools/shared/config';
import type { Tool } from '@developer-tools/shared/types/tool';
import { fileStorageService } from '@developer-tools/server/services/file-storage.service';
import path from 'path';

import {
  SearchOptionsSchema,
  ProviderAuthError,
  ProviderRateLimitError,
  ProviderTimeoutError
} from './providers/provider-interface.js';
import { getProvider, getFallbackProviders } from './providers/provider-factory.js';
import { searchCacheService } from './services/cache-service.js';
import { formatterService } from './services/formatter-service.js';

// Define request schema with enhanced options
const WebSearchRequestSchema = z.object({
  query: z.string().min(1, "Search query cannot be empty"),
  saveToFile: z.boolean().optional().default(false),
  outputFormat: z.enum(['text', 'markdown', 'json', 'html']).optional().default('markdown'),
  maxTokens: z.number().optional().default(150),
  includeSources: z.boolean().optional().default(true),
  includeMetadata: z.boolean().optional().default(false),
  customFileName: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional().default(0.7),
  detailed: z.boolean().optional().default(false),
  noCache: z.boolean().optional().default(false),
  timeout: z.number().optional().default(30000),
  customCss: z.string().optional()
});

const WebSearchResponseSchema = z.object({
  searchResults: z.string(),
  savedToFile: z.string().optional(),
  metadata: z.object({
    model: z.string().optional(),
    tokenUsage: z.object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      totalTokens: z.number().optional()
    }).optional(),
    sources: z.array(z.object({
      title: z.string().optional(),
      url: z.string().optional(),
      snippet: z.string().optional()
    })).optional(),
    provider: z.string().optional(),
    query: z.string().optional(),
    timestamp: z.string().optional(),
    cached: z.boolean().optional()
  }).optional()
});

type WebSearchRequest = z.infer<typeof WebSearchRequestSchema>;
type WebSearchResponse = z.infer<typeof WebSearchResponseSchema>;

/**
 * Generate a filename for saving search results
 */
function generateFileName(query: string, customFileName?: string, format: string = 'markdown'): string {
  if (customFileName) {
    // Ensure the custom filename has the correct extension
    const extension = format === 'json' ? '.json' : format === 'markdown' ? '.md' : format === 'html' ? '.html' : '.txt';
    if (!customFileName.endsWith(extension)) {
      return customFileName + extension;
    }
    return customFileName;
  }
  
  // Generate a filename based on the query
  const sanitizedQuery = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 40);
  
  const timestamp = Date.now();
  const extension = format === 'json' ? '.json' : format === 'markdown' ? '.md' : format === 'html' ? '.html' : '.txt';
  
  return `web-search-${sanitizedQuery}-${timestamp}${extension}`;
}

/**
 * Enhanced web search tool
 */
export const webSearchTool: Tool = {
  name: 'web-search',
  version: '0.4.0',
  description: 'Performs a web search using AI providers and returns formatted results.',
  
  execute: async (request: unknown): Promise<unknown> => {
    // Validate and parse request
    const validatedRequest = WebSearchRequestSchema.parse(request);
    
    try {
      logger.info("Executing enhanced web search tool", { 
        query: validatedRequest.query,
        provider: validatedRequest.provider,
        outputFormat: validatedRequest.outputFormat
      });
      
      // Check cache first (if not disabled)
      let result;
      let fromCache = false;
      
      if (!validatedRequest.noCache) {
        // Generate cache key
        const cacheKey = searchCacheService.generateCacheKey(validatedRequest.query, {
          provider: validatedRequest.provider,
          model: validatedRequest.model,
          detailed: validatedRequest.detailed,
          maxTokens: validatedRequest.maxTokens
        });
        
        // Try to get from cache
        const cachedResult = await searchCacheService.get(cacheKey);
        
        if (cachedResult) {
          logger.info("Serving from cache", { query: validatedRequest.query });
          result = cachedResult;
          fromCache = true;
          
          // Add cached flag to metadata
          if (result.metadata) {
            result.metadata.cached = true;
          } else {
            result.metadata = { cached: true };
          }
        } else {
          // Not found in cache, need to search
          result = await executeSearch(validatedRequest);
          
          // Save to cache
          await searchCacheService.set(cacheKey, result);
        }
      } else {
        // Cache disabled, execute search directly
        result = await executeSearch(validatedRequest);
      }
      
      // Format the results based on the requested output format
      const formattedResults = formatterService.format(result, {
        format: validatedRequest.outputFormat,
        includeSources: validatedRequest.includeSources,
        includeMetadata: validatedRequest.includeMetadata,
        customCss: validatedRequest.customCss
      });
      
      // If saveToFile is true, save results to file
      let savedFilePath: string | undefined;
      if (validatedRequest.saveToFile) {
        try {
          const fileName = generateFileName(
            validatedRequest.query, 
            validatedRequest.customFileName, 
            validatedRequest.outputFormat
          );
          
          const savePath = path.join(config.storage.researchDir, fileName);
          
          logger.debug("Saving search results to file", { path: savePath });
          
          savedFilePath = await fileStorageService.saveToFile(savePath, formattedResults, {
            createDirectory: true
          });
          
          logger.info("Search results saved successfully", { path: savedFilePath });
        } catch (fsError) {
          logger.error("Failed to save search results to file", {
            error: fsError instanceof Error ? fsError.message : String(fsError),
            query: validatedRequest.query
          });
          // Continue execution even if file saving fails
        }
      }
      
      // Format the response
      return WebSearchResponseSchema.parse({
        searchResults: formattedResults,
        savedToFile: savedFilePath,
        metadata: {
          ...result.metadata,
          cached: fromCache
        }
      });
      
    } catch (error) {
      logger.error("Web search tool execution failed", {
        error: error instanceof Error ? error.message : String(error),
        query: validatedRequest.query,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors[0]?.message || 'Invalid data format'}`);
      }
      
      throw error; // Let the service's error propagate
    }
  },
  
  requestSchema: WebSearchRequestSchema,
  responseSchema: WebSearchResponseSchema
};

/**
 * Execute a search with fallback handling
 * @param request Search request
 * @returns Search result
 */
async function executeSearch(request: WebSearchRequest) {
  const {
    query,
    provider: providerName,
    model,
    maxTokens,
    temperature,
    detailed,
    timeout
  } = request;
  
  // Get the provider
  const provider = getProvider(providerName);
  
  try {
    // Initialize the provider
    await provider.initialize();
    
    // Execute the search
    return await provider.search(query, {
      model,
      maxTokens,
      temperature,
      detailed,
      timeout
    });
  } catch (error) {
    if (error instanceof ProviderAuthError || 
        error instanceof ProviderRateLimitError ||
        error instanceof ProviderTimeoutError) {
      
      // Try fallback providers if this one failed
      const fallbackProviders = await getFallbackProviders(provider.name);
      
      if (fallbackProviders.length > 0) {
        logger.warn(`Provider ${provider.name} failed, trying fallback provider ${fallbackProviders[0].name}`, { 
          error: error.message,
          query 
        });
        
        // Try each fallback provider in order
        for (const fallbackProvider of fallbackProviders) {
          try {
            // Initialize the fallback provider
            await fallbackProvider.initialize();
            
            // Execute the search with fallback
            return await fallbackProvider.search(query, {
              model,
              maxTokens,
              temperature,
              detailed,
              timeout
            });
          } catch (fallbackError) {
            // Log the error but continue to the next fallback
            logger.warn(`Fallback provider ${fallbackProvider.name} failed`, { 
              error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
              query
            });
          }
        }
      }
    }
    
    // Re-throw if all fallbacks failed or for other errors
    throw error;
  }
} 