// This is a stub implementation of the web search tool
// It will be used by the transport servers for testing

import { v4 as uuidv4 } from 'uuid';

// Define the web search tool
export const webSearchTool = {
  name: 'web-search',
  description: 'Search the web using various providers',
  
  /**
   * Execute a web search
   * @param {Object} params - The search parameters
   * @param {string} params.query - The search query
   * @param {string} [params.provider] - The provider to use (perplexity, gemini, openai)
   * @param {boolean} [params.detailed] - Whether to return detailed results
   * @param {string} [params.format] - The output format (text, markdown, json, html)
   * @param {boolean} [params.noCache] - Whether to bypass the cache
   * @param {Object} [params.sessionContext] - Session context info
   * @returns {Promise<Object>} The search results
   */
  async execute(params) {
    console.log('Executing web search with params:', params);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Build response
    const provider = params.provider || 'perplexity';
    const cached = !params.noCache && Math.random() > 0.5; // Randomly decide if cached
    
    return {
      searchResults: `These are the search results for: "${params.query}"\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse consectetur eros vel lorem semper, in gravida lorem facilisis. Aenean vel eros vel augue convallis cursus.`,
      metadata: {
        provider,
        cached,
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
        tokenUsage: {
          promptTokens: 45,
          completionTokens: 125,
          totalTokens: 170
        }
      }
    };
  }
}; 