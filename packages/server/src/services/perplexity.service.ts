import axios from 'axios';
import { config } from '@developer-tools/shared/config';
import { logger } from '@developer-tools/shared/logger';
import { RateLimiter } from '@developer-tools/shared/rate-limiter';

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_MODEL = "codellama-34b-instruct";

export interface SearchResult {
  content: string;
  metadata?: {
    model: string;
    tokenUsage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    }
    sources?: Array<{
      title?: string;
      url?: string;
      snippet?: string;
    }>
  }
}

export interface PerplexityServiceOptions {
  apiKey?: string;
  rateLimitConfig?: {
    maxTokens: number;
    refillRate: number;
  }
}

export class PerplexityService {
  private apiKey: string;
  private rateLimiter: RateLimiter | null = null;
  private rateLimitConfig: {
    maxTokens: number;
    refillRate: number;
  };
  
  constructor(options?: PerplexityServiceOptions) {
    this.apiKey = options?.apiKey || config.perplexityApiKey || '';
    
    // Set rate limit configuration
    this.rateLimitConfig = options?.rateLimitConfig || {
      maxTokens: config.rateLimits?.perplexity?.maxTokens || 20,
      refillRate: config.rateLimits?.perplexity?.refillRate || 0.33
    };
    
    logger.debug("Perplexity service initialized", {
      service: 'perplexity',
      hasApiKey: !!this.apiKey,
      rateLimitConfig: this.rateLimitConfig
    });
  }
  
  /**
   * Initialize the service (create rate limiter)
   */
  async initialize(): Promise<void> {
    try {
      // Create a rate limiter for Perplexity API
      this.rateLimiter = new RateLimiter('perplexity', {
        maxTokens: this.rateLimitConfig.maxTokens,
        refillRate: this.rateLimitConfig.refillRate,
        waitForTokens: true,
        maxWaitTime: 60000 // 1 minute max wait time
      });
      
      logger.debug("Perplexity service rate limiter initialized", {
        service: 'perplexity',
        maxTokens: this.rateLimitConfig.maxTokens,
        refillRate: this.rateLimitConfig.refillRate
      });
    } catch (error) {
      logger.error("Failed to initialize PerplexityService", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Failed to initialize PerplexityService: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Calculate token cost based on query complexity
   * @param query The search query
   * @returns The token cost (1-3)
   */
  private calculateTokenCost(query: string): number {
    const length = query.length;
    if (length < 50) return 1;
    if (length < 200) return 2;
    return 3;
  }
  
  /**
   * Performs a web search using Perplexity AI
   * @param query The search query
   * @param options Additional options for the search
   * @returns The search results
   */
  async search(query: string, options: { maxTokens?: number, timeout?: number } = {}): Promise<SearchResult> {
    // Handle test environment
    if (config.isTest && !this.apiKey) {
      logger.warn("Perplexity API key not set in test environment, returning mock response", { service: 'perplexity' });
      return { 
        content: "Mock search results for testing",
        metadata: {
          model: PERPLEXITY_MODEL
        }
      };
    }

    // Check for API key in non-test environment
    if (!this.apiKey) {
      const error = new Error("Perplexity API key not set");
      logger.error("API key missing", { service: 'perplexity' });
      throw error;
    }
    
    // Initialize rate limiter if not already initialized
    if (!this.rateLimiter) {
      await this.initialize();
    }

    try {
      // Acquire a token before making the API request
      const tokenCost = this.calculateTokenCost(query);
      logger.debug("Acquiring rate limit token for Perplexity API", { query, tokenCost });
      
      if (!this.rateLimiter) {
        throw new Error("Rate limiter not initialized");
      }
      
      await this.rateLimiter.acquireToken(tokenCost);
      
      logger.info("Performing web search", { query });

      const response = await axios.post(PERPLEXITY_API_URL, {
        model: PERPLEXITY_MODEL,
        messages: [{ role: "user", content: query }],
        max_tokens: options.maxTokens || 150
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: options.timeout || 10000 // 10 second timeout by default
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        logger.warn("Unexpected API response format", { 
          responseData: response.data,
          query 
        });
        throw new Error("Invalid response format from Perplexity API");
      }

      // Extract additional metadata if available
      const metadata: SearchResult['metadata'] = {
        model: response.data.model || PERPLEXITY_MODEL
      };
      
      if (response.data.usage) {
        metadata.tokenUsage = {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens
        };
      }
      
      // Extract sources if available
      if (response.data.choices[0].message.tool_calls) {
        try {
          const toolCalls = response.data.choices[0].message.tool_calls;
          for (const toolCall of toolCalls) {
            if (toolCall.function.name === 'search') {
              const searchResults = JSON.parse(toolCall.function.arguments);
              if (searchResults.search_results) {
                metadata.sources = searchResults.search_results.map((result: any) => ({
                  title: result.title,
                  url: result.url,
                  snippet: result.snippet
                }));
              }
            }
          }
        } catch (parseError) {
          logger.warn("Failed to parse search sources from API response", {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            query
          });
        }
      }

      return {
        content: response.data.choices[0].message.content,
        metadata
      };

    } catch (error) {
      logger.error("Web search failed", {
        error: error instanceof Error ? error.message : String(error),
        query,
        stack: error instanceof Error ? error.stack : undefined
      });

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorMessage = error.response?.data?.error || error.message;
        
        logger.error("Axios error details", {
          status,
          data: error.response?.data,
          config: error.config
        });

        if (status === 401 || status === 403) {
          throw new Error("Invalid or expired API key");
        } else if (status === 429) {
          throw new Error("Rate limit exceeded");
        }
        
        throw new Error(`Web search failed: ${errorMessage}`);
      }

      throw new Error(`Web search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export a singleton instance
export const perplexityService = new PerplexityService(); 