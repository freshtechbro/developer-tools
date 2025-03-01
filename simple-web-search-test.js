#!/usr/bin/env node

// Import required modules
import { v4 as uuidv4 } from 'uuid';

// Create a simplified web search tool
const webSearchTool = {
  name: 'web-search',
  description: 'Search the web using various providers',
  
  async execute(params) {
    console.log('Executing web search with params:', params);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Build response
    const provider = params.provider || 'perplexity';
    const cached = !params.noCache && Math.random() > 0.5; // Randomly decide if cached
    
    return {
      searchResults: `These are the search results for: "${params.query}"\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Paris is the capital of France. It is known for its iconic Eiffel Tower, Louvre Museum, and Notre-Dame cathedral.`,
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

// Test function
async function testWebSearch() {
  try {
    console.log('Starting web search test...');
    
    // Test parameters
    const testParams = {
      query: 'What is the capital of France?',
      provider: 'perplexity',
      detailed: true,
      format: 'markdown',
      includeMetadata: true
    };
    
    console.log('\nExecuting web search with params:', testParams);
    
    // Execute the search
    const startTime = Date.now();
    const result = await webSearchTool.execute(testParams);
    const duration = Date.now() - startTime;
    
    console.log(`\nSearch completed in ${duration}ms`);
    
    // Display search results
    if (result && result.searchResults) {
      console.log('\n--- Search Results ---\n');
      console.log(result.searchResults);
      
      if (result.metadata) {
        console.log('\n--- Metadata ---\n');
        console.log('Provider:', result.metadata.provider);
        console.log('Cached:', result.metadata.cached ? 'Yes' : 'No');
        
        if (result.metadata.tokenUsage) {
          console.log('Token Usage:');
          console.log('  Prompt:', result.metadata.tokenUsage.promptTokens);
          console.log('  Completion:', result.metadata.tokenUsage.completionTokens);
          console.log('  Total:', result.metadata.tokenUsage.totalTokens);
        }
      }
      
      console.log('\n✅ Web search test successful!');
      return true;
    } else {
      console.error('No search results returned');
      console.log('\n❌ Web search test failed');
      return false;
    }
  } catch (error) {
    console.error('Error testing web search:', error);
    return false;
  }
}

// Run the test
testWebSearch()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 