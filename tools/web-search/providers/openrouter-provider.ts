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
 * OpenRouter API provider implementation
 */
export class OpenRouterProvider implements SearchProvider {
  name = 'openrouter';
  private apiKey: string | null = null;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  
  /**
   * Initialize the OpenRouter provider
   * Checks if API key is available
   */
  async initialize(): Promise<void> {
    this.apiKey = config.apis?.openrouter?.apiKey || process.env.OPENROUTER_API_KEY || null;
    
    if (!this.apiKey) {
      logger.warn('OpenRouter API key is not set. Web search functionality will be limited.');
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
   * Search using OpenRouter API
   * @param query The search query
   * @param options Search options
   * @returns Search result
   */
  async search(query: string, options: SearchOptions): Promise<SearchResult> {
    try {
      // Ensure we have an API key
      if (!this.apiKey) {
        await this.initialize();
        if (!this.apiKey) {
          throw new ProviderAuthError(this.name);
        }
      }
      
      // Format the search query with specific instructions for web search
      const formattedQuery = this.formatSearchQuery(query, options);
      
      // Configure timeout
      const timeout = options.timeout || 30000;
      
      // Configure model
      const model = options.model || 'openai/gpt-3.5-turbo';
      
      // Prepare request payload
      const payload = {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that can search the web and provide accurate, up-to-date information with sources.'
          },
          {
            role: 'user',
            content: formattedQuery
          }
        ],
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        stream: false,
      };
      
      logger.debug(`Sending request to OpenRouter API`, {
        provider: this.name,
        model,
        query: formattedQuery.substring(0, 100) + '...'
      });

      // Send request to OpenRouter API
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': config.apis?.openrouter?.referer || 'developer-tools',
          'X-Title': config.apis?.openrouter?.title || 'Developer Tools Web Search',
        },
        timeout: timeout
      });
      
      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error(`Invalid response from OpenRouter API: ${JSON.stringify(response.data)}`);
      }
      
      const responseContent = response.data.choices[0].message.content;
      
      // Extract sources from the response if available
      // OpenRouter doesn't return sources directly, so we'll try to parse them from the response
      const sources = this.extractSources(responseContent);
      
      // Clean up the content if needed
      const cleanedContent = this.cleanResponse(responseContent);
      
      // Return the search result
      return {
        content: cleanedContent,
        metadata: {
          model: response.data.model || model,
          tokenUsage: {
            promptTokens: response.data.usage?.prompt_tokens,
            completionTokens: response.data.usage?.completion_tokens,
            totalTokens: response.data.usage?.total_tokens
          },
          sources: sources,
          provider: this.name,
          query: query,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      logger.error(`OpenRouter search failed`, {
        provider: this.name,
        error: error instanceof Error ? error.message : String(error),
        query
      });
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 401 || status === 403) {
            throw new ProviderAuthError(this.name);
          } else if (status === 429) {
            throw new ProviderRateLimitError(this.name);
          } else if (status >= 500) {
            throw new Error(`OpenRouter server error: ${error.response.statusText}`);
          }
        } else if (error.code === 'ECONNABORTED') {
          throw new ProviderTimeoutError(this.name, options.timeout || 30000);
        }
      }
      
      // Rethrow the original error if not handled
      throw error;
    }
  }
  
  /**
   * Format the search query to optimize for web search results
   * @param query Original query
   * @param options Search options
   * @returns Formatted query
   */
  private formatSearchQuery(query: string, options: SearchOptions): string {
    // If detailed mode is enabled, ask for more comprehensive results
    if (options.detailed) {
      return `Web search query: "${query}". Please provide a detailed answer with all relevant information, and include sources with URLs at the end of your response.`;
    }
    
    // Default format for standard searches
    return `Web search query: "${query}". Please provide a concise answer with the most important information, and include sources with URLs at the end of your response.`;
  }
  
  /**
   * Extract sources from the response content
   * @param content Response content
   * @returns Array of sources
   */
  private extractSources(content: string): { title?: string; url?: string; snippet?: string }[] {
    const sources: { title?: string; url?: string; snippet?: string }[] = [];
    
    // Look for sections that might contain sources
    const sourcesSection = content.match(/sources?:?.*?(?:\n\n|$)/is);
    if (sourcesSection) {
      // Try to extract URLs
      const urls = sourcesSection[0].match(/https?:\/\/[^\s\)]+/g);
      
      if (urls) {
        urls.forEach(url => {
          // Try to find a title near this URL
          const titleMatch = sourcesSection[0].match(new RegExp(`([^\\n.]+)\\s*(?:[-–—]\\s*)?${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:[-–—]\\s*)?([^\\n.]+)`, 'i'));
          
          sources.push({
            url: url,
            title: titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : undefined,
          });
        });
      }
    }
    
    return sources;
  }
  
  /**
   * Clean up the response to remove artifacts or formatting issues
   * @param text Raw text from the API
   * @returns Cleaned text
   */
  private cleanResponse(text: string): string {
    // Remove "Sources:" section and everything after it
    const sourcesSectionIndex = text.search(/\b(?:sources?|references?)(?:\s*:|\s*\n)/i);
    
    if (sourcesSectionIndex !== -1) {
      return text.substring(0, sourcesSectionIndex).trim();
    }
    
    return text.trim();
  }
} 