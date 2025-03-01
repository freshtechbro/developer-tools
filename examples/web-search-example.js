#!/usr/bin/env node

/**
 * Example script demonstrating how to use the web search tool
 * 
 * Usage:
 *   node examples/web-search-example.js "Your search query"
 * 
 * Make sure to set the PERPLEXITY_API_KEY environment variable before running.
 */

import { webSearchTool } from '../tools/web-search/web-search.js';
import { perplexityService } from '../packages/server/src/services/perplexity.service.js';
import { config } from '../packages/shared/src/config/index.js';
import { logger } from '../packages/shared/src/logger.js';

// Check for API key
if (!config.perplexityApiKey) {
  console.error('Error: PERPLEXITY_API_KEY environment variable is not set.');
  console.error('Please set it before running this example:');
  console.error('  export PERPLEXITY_API_KEY=your_api_key_here');
  process.exit(1);
}

// Get the search query from command line arguments
const query = process.argv[2];

if (!query) {
  console.error('Error: No search query provided.');
  console.error('Usage: node examples/web-search-example.js "Your search query"');
  process.exit(1);
}

// Run the search
async function runSearch() {
  try {
    console.log(`🔍 Searching for: "${query}"...\n`);
    
    // Initialize the Perplexity service
    await perplexityService.initialize();
    
    // Execute the web search
    const result = await webSearchTool.execute({
      query,
      outputFormat: 'markdown',
      includeSources: true
    });
    
    // Display the results
    console.log('Search Results:');
    console.log('==============\n');
    console.log(result.searchResults);
    
    // Display metadata if available
    if (result.metadata) {
      console.log('\nMetadata:');
      console.log('========\n');
      
      if (result.metadata.model) {
        console.log(`Model: ${result.metadata.model}`);
      }
      
      if (result.metadata.tokenUsage?.totalTokens) {
        console.log(`Total Tokens: ${result.metadata.tokenUsage.totalTokens}`);
      }
      
      if (result.metadata.sources && result.metadata.sources.length > 0) {
        console.log(`Sources: ${result.metadata.sources.length}`);
      }
    }
    
    console.log('\n✅ Search completed successfully!');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the search
runSearch(); 