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
  }
}

export class PerplexityService {
  private apiKey: string;
  private rateLimiter: RateLimiter;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.perplexityApiKey || '';
    
    // Create a rate limiter for Perplexity API
    // Default values: 20 requests per minute (1 every 3 seconds)
    this.rateLimiter = new RateLimiter('perplexity-api', {
      maxTokens: 20,
      refillRate: 0.33,  // 1 token per 3 seconds
      waitForTokens: true,
      maxWaitTime: 60000 // 1 minute max wait time
    });
    
    logger.debug("Perplexity service initialized with rate limiter", {
      service: 'perplexity',
      maxTokens: 20,
      refillRate: 0.33
    });
  }
  
  /**
   * Performs a web search using Perplexity AI
   * @param query The search query
   * @param options Additional options for the search
   * @returns The search results
   */
  async search(query: string, options: { maxTokens?: number, timeout?: number } = {}): Promise<SearchResult> {
    // Handle test environment
    if (config.env === 'test' && !this.apiKey) {
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

    try {
      // Acquire a token before making the API request
      logger.debug("Acquiring rate limit token for Perplexity API", { query });
      await this.rateLimiter.acquireToken();
      
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
export const perplexityService = new PerplexityService(config.perplexityApiKey); 