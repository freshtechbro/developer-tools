import { OpenAI } from 'openai';
import { ProviderAuthError, ProviderRateLimitError, ProviderTimeoutError } from './provider-interface.js';
import { config } from '@developer-tools/shared/config';
import { logger } from '@developer-tools/shared/logger';
/**
 * OpenAI API provider implementation
 */
export class OpenAIProvider {
    name = 'openai';
    apiKey = null;
    client = null;
    /**
     * Initialize the OpenAI provider
     * Checks if API key is available and sets up the client
     */
    async initialize() {
        this.apiKey = config.apis?.openai?.apiKey || process.env.OPENAI_API_KEY || null;
        if (!this.apiKey) {
            logger.warn('OpenAI API key is not set. Web search functionality will be limited.');
            return;
        }
        try {
            this.client = new OpenAI({
                apiKey: this.apiKey,
                timeout: 30000, // Default timeout
                maxRetries: 2
            });
        }
        catch (error) {
            logger.error('Failed to initialize OpenAI API client', { error });
            throw new Error('Failed to initialize OpenAI API client');
        }
    }
    /**
     * Check if the provider is available
     * @returns True if API key is available and client initialized
     */
    async isAvailable() {
        if (!this.client) {
            await this.initialize();
        }
        return !!this.client && !!this.apiKey;
    }
    /**
     * Search using OpenAI API
     * @param query The search query
     * @param options Search options
     * @returns Search result
     */
    async search(query, options) {
        if (!this.client) {
            await this.initialize();
            if (!this.client) {
                throw new ProviderAuthError(this.name);
            }
        }
        try {
            logger.debug(`Performing OpenAI search: "${query}"`, { options });
            // Select model based on options or default
            const model = options.model || 'gpt-4o';
            // Create timeout for request
            const abortController = new AbortController();
            const timeoutId = setTimeout(() => abortController.abort(), options.timeout);
            try {
                const response = await this.client.chat.completions.create({
                    model,
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant that provides accurate information about the world. When web searching, you provide clear, accurate information with sources.' },
                        { role: 'user', content: this.formatSearchQuery(query, options) }
                    ],
                    temperature: options.temperature,
                    max_tokens: options.maxTokens,
                }, {
                    signal: abortController.signal
                });
                clearTimeout(timeoutId);
                // Extract the content from the response
                const content = response.choices[0]?.message?.content || 'No results found.';
                // Parse out the sources if present
                let sources = [];
                try {
                    if (content.includes('SOURCES:')) {
                        const sourceSection = content.split('SOURCES:')[1].trim();
                        // Simple regex to extract URLs from the source section
                        const urlMatches = sourceSection.match(/https?:\/\/[^\s)]+/g) || [];
                        // Try to extract titles for each URL
                        sources = urlMatches.map((url, index) => {
                            const surroundingText = sourceSection.substring(Math.max(0, sourceSection.indexOf(url) - 100), Math.min(sourceSection.length, sourceSection.indexOf(url) + 100));
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
                }
                catch (error) {
                    logger.warn('Failed to extract sources from OpenAI response', { error });
                }
                // Return the result
                return {
                    content: this.cleanResponse(content),
                    metadata: {
                        model,
                        sources,
                        provider: this.name,
                        query,
                        timestamp: new Date().toISOString(),
                        tokenUsage: {
                            promptTokens: response.usage?.prompt_tokens,
                            completionTokens: response.usage?.completion_tokens,
                            totalTokens: response.usage?.total_tokens
                        }
                    }
                };
            }
            catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    throw new ProviderTimeoutError(this.name, options.timeout);
                }
                throw error;
            }
        }
        catch (error) {
            // Handle specific error types
            if (error instanceof ProviderTimeoutError ||
                error instanceof ProviderAuthError ||
                error instanceof ProviderRateLimitError) {
                throw error;
            }
            // Handle OpenAI specific errors
            if (error.status === 401) {
                logger.error('OpenAI API authentication failed', { error });
                throw new ProviderAuthError(this.name);
            }
            if (error.status === 429) {
                logger.error('OpenAI API rate limit exceeded', { error });
                throw new ProviderRateLimitError(this.name);
            }
            logger.error('Unexpected error during OpenAI search', { error });
            throw new Error(`OpenAI search failed: ${error.message}`);
        }
    }
    /**
     * Format the search query based on options
     * @param query The search query
     * @param options Search options
     * @returns Formatted query
     */
    formatSearchQuery(query, options) {
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
    cleanResponse(text) {
        // Remove "SOURCES:" section for separate processing
        if (text.includes('SOURCES:')) {
            return text.split('SOURCES:')[0].trim();
        }
        return text;
    }
}
