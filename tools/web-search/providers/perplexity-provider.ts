import axios from 'axios';
import { 
  SearchProvider, 
  SearchOptions, 
  SearchResult,
  ProviderAuthError,
  ProviderRateLimitError,
  ProviderTimeoutError
} from './provider-interface.js';
import { config } from '@developer-tools/shared/config';
import { logger } from '@developer-tools/shared/logger';

/**
 * Perplexity API provider implementation
 */
export class PerplexityProvider implements SearchProvider {
  name = 'perplexity';
  private apiKey: string | null = null;
  private readonly apiUrl = 'https://api.perplexity.ai/chat/completions';
  
  /**
   * Initialize the Perplexity provider
   * Checks if API key is available
   */
  async initialize(): Promise<void> {
    this.apiKey = config.apis?.perplexity?.apiKey || process.env.PERPLEXITY_API_KEY || null;
    
    if (!this.apiKey) {
      logger.warn('Perplexity API key is not set. Web search functionality will be limited.');
    }
  }
  
  /**
   * Check if the provider is available
   * @returns True if API key is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      await this.initialize();
    }
    return !!this.apiKey;
  }
  
  /**
   * Search using Perplexity API
   * @param query The search query
   * @param options Search options
   * @returns Search result
   */
  async search(query: string, options: SearchOptions): Promise<SearchResult> {
    if (!this.apiKey) {
      await this.initialize();
      if (!this.apiKey) {
        throw new ProviderAuthError(this.name);
      }
    }
    
    try {
      logger.debug(`Performing Perplexity search: "${query}"`, { options });
      
      // Select model based on options or default
      const model = options.model || 'pplx-7b-online';
      
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new ProviderTimeoutError(this.name, options.timeout)), options.timeout);
      });
      
      // Create API request promise
      const requestPromise = axios.post(this.apiUrl, {
        model,
        messages: [{ role: 'user', content: this.formatSearchQuery(query, options) }],
        temperature: options.temperature
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      // Race the request against the timeout
      const response = await Promise.race([requestPromise, timeoutPromise]);
      
      // Extract data from response
      const content = response.data.choices[0]?.message?.content || 'No results found.';
      let sources: any[] = [];
      
      // Try to extract sources from the response if they exist
      try {
        if (content.includes('SOURCES:')) {
          const sourceSection = content.split('SOURCES:')[1].trim();
          // Simple regex to extract URLs from the source section
          const urlMatches = sourceSection.match(/https?:\/\/[^\s)]+/g) || [];
          // Try to extract titles for each URL
          sources = urlMatches.map((url, index) => {
            const surroundingText = sourceSection.substring(
              Math.max(0, sourceSection.indexOf(url) - 100),
              Math.min(sourceSection.length, sourceSection.indexOf(url) + 100)
            );
            // Try to find a title-like text before the URL
            const titleMatch = surroundingText.match(/\d+\.\s+([^\n]+)/) || 
                              surroundingText.match(/\*\*([^\*]+)\*\*/) ||
                              surroundingText.match(/\[([^\]]+)\]/);
            return {
              url,
              title: titleMatch ? titleMatch[1].trim() : `Source ${index + 1}`
            };
          });
        }
      } catch (error) {
        logger.warn('Failed to extract sources from Perplexity response', { error });
      }
      
      // Format the return data
      return {
        content: this.cleanResponse(content),
        metadata: {
          model,
          sources,
          provider: this.name,
          query,
          timestamp: new Date().toISOString(),
          tokenUsage: {
            promptTokens: response.data.usage?.prompt_tokens,
            completionTokens: response.data.usage?.completion_tokens,
            totalTokens: response.data.usage?.total_tokens
          }
        }
      };
      
    } catch (error) {
      // Handle specific error types
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        
        if (statusCode === 401 || statusCode === 403) {
          logger.error('Perplexity API authentication failed', { statusCode });
          throw new ProviderAuthError(this.name);
        }
        
        if (statusCode === 429) {
          logger.error('Perplexity API rate limit exceeded', { statusCode });
          throw new ProviderRateLimitError(this.name);
        }
        
        logger.error('Perplexity API request failed', { 
          statusCode,
          message: error.message,
          data: error.response?.data
        });
        
        throw new Error(`Perplexity search failed: ${error.message}`);
      }
      
      if (error instanceof ProviderTimeoutError || 
          error instanceof ProviderAuthError || 
          error instanceof ProviderRateLimitError) {
        throw error;
      }
      
      logger.error('Unexpected error during Perplexity search', { error });
      throw new Error(`Perplexity search failed: ${error}`);
    }
  }
  
  /**
   * Format the search query based on options
   * @param query The search query
   * @param options Search options
   * @returns Formatted query
   */
  private formatSearchQuery(query: string, options: SearchOptions): string {
    if (options.detailed) {
      return `Please provide a detailed answer to the following question, with sources at the end. Include websites, articles, or papers that contain relevant information. 
      
Question: ${query}

Your answer should be comprehensive and include specific details. After your answer, include a "SOURCES:" section with numbered links to relevant websites.`;
    }
    
    return `Please provide a concise answer to the following question, with sources at the end. Include websites, articles, or papers that contain relevant information.
    
Question: ${query}

Keep your answer brief and to the point. After your answer, include a "SOURCES:" section with numbered links to relevant websites.`;
  }
  
  /**
   * Clean the response text by removing common patterns
   * @param text Response text to clean
   * @returns Cleaned text
   */
  private cleanResponse(text: string): string {
    // Remove "SOURCES:" section for separate processing
    if (text.includes('SOURCES:')) {
      return text.split('SOURCES:')[0].trim();
    }
    
    return text;
  }
} 