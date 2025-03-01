import { GoogleGenerativeAI } from '@google/generative-ai';
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
 * Google Gemini API provider implementation
 */
export class GeminiProvider implements SearchProvider {
  name = 'gemini';
  private apiKey: string | null = null;
  private client: GoogleGenerativeAI | null = null;
  
  /**
   * Initialize the Google Gemini provider
   * Checks if API key is available and sets up the client
   */
  async initialize(): Promise<void> {
    this.apiKey = config.apis?.gemini?.apiKey || process.env.GEMINI_API_KEY || null;
    
    if (!this.apiKey) {
      logger.warn('Gemini API key is not set. Web search functionality will be limited.');
      return;
    }
    
    try {
      this.client = new GoogleGenerativeAI(this.apiKey);
    } catch (error) {
      logger.error('Failed to initialize Gemini API client', { error });
      throw new Error('Failed to initialize Gemini API client');
    }
  }
  
  /**
   * Check if the provider is available
   * @returns True if API key is available and client initialized
   */
  async isAvailable(): Promise<boolean> {
    if (!this.client) {
      await this.initialize();
    }
    return !!this.client && !!this.apiKey;
  }
  
  /**
   * Search using Google Gemini API
   * @param query The search query
   * @param options Search options
   * @returns Search result
   */
  async search(query: string, options: SearchOptions): Promise<SearchResult> {
    if (!this.client) {
      await this.initialize();
      if (!this.client) {
        throw new ProviderAuthError(this.name);
      }
    }
    
    try {
      logger.debug(`Performing Gemini search: "${query}"`, { options });
      
      // Select model based on options or default
      const model = options.model || 'gemini-pro';
      const generativeModel = this.client.getGenerativeModel({ model });
      
      // Create a timeout controller for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout);
      
      const formattedQuery = this.formatSearchQuery(query, options);
      
      // Execute the search with timeout
      try {
        const result = await generativeModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: formattedQuery }] }],
          generationConfig: {
            temperature: options.temperature,
            maxOutputTokens: options.maxTokens
          }
        }, { signal: controller.signal });
        
        clearTimeout(timeoutId);
        
        // Extract data from response
        const response = result.response;
        const content = response.text();
        
        // Extract sources if present
        let sources: any[] = [];
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
          logger.warn('Failed to extract sources from Gemini response', { error });
        }
        
        // Format the return data
        return {
          content: this.cleanResponse(content),
          metadata: {
            model,
            sources,
            provider: this.name,
            query,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new ProviderTimeoutError(this.name, options.timeout);
        }
        throw error;
      }
      
    } catch (error) {
      // Handle specific error types
      if (error instanceof ProviderTimeoutError || 
          error instanceof ProviderAuthError || 
          error instanceof ProviderRateLimitError) {
        throw error;
      }
      
      // Check for specific error messages from Gemini API
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('authentication') || errorMessage.includes('API key')) {
        logger.error('Gemini API authentication failed', { error });
        throw new ProviderAuthError(this.name);
      }
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        logger.error('Gemini API rate limit exceeded', { error });
        throw new ProviderRateLimitError(this.name);
      }
      
      logger.error('Unexpected error during Gemini search', { error });
      throw new Error(`Gemini search failed: ${error.message}`);
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