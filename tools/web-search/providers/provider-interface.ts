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
export class SearchProviderError extends Error {
  constructor(message: string, public provider: string) {
    super(message);
    this.name = 'SearchProviderError';
  }
}

export class ProviderAuthError extends SearchProviderError {
  constructor(provider: string) {
    super(`Authentication failed for provider: ${provider}`, provider);
    this.name = 'ProviderAuthError';
  }
}

export class ProviderRateLimitError extends SearchProviderError {
  constructor(provider: string) {
    super(`Rate limit exceeded for provider: ${provider}`, provider);
    this.name = 'ProviderRateLimitError';
  }
}

export class ProviderTimeoutError extends SearchProviderError {
  constructor(provider: string, timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms for provider: ${provider}`, provider);
    this.name = 'ProviderTimeoutError';
  }
} 