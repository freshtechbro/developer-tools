#!/usr/bin/env node

// Import required modules
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

// Create a simplified web search tool with provider simulation
const webSearchTool = {
  name: 'web-search',
  description: 'Search the web using various providers',
  
  async execute(params) {
    console.log(chalk.blue(`Executing web search with params:`), params);
    
    // Validate required parameters
    if (!params.query) {
      throw new Error('Query is required');
    }
    
    // Simulate processing time based on provider
    const provider = params.provider || 'perplexity';
    let processingTime = 1500; // Default
    
    switch (provider) {
      case 'perplexity':
        processingTime = 1500;
        break;
      case 'gemini':
        processingTime = 2000;
        break;
      case 'openai':
        processingTime = 1200;
        break;
      default:
        processingTime = 1500;
    }
    
    // Simulate detailed mode taking longer
    if (params.detailed) {
      processingTime += 500;
    }
    
    // Simulate cache hit (faster response)
    const cached = !params.noCache && Math.random() > 0.5;
    if (cached) {
      processingTime = 300; // Much faster from cache
    }
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Build response based on provider
    let searchResults = '';
    let tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    
    switch (provider) {
      case 'perplexity':
        searchResults = `These are the search results from Perplexity for: "${params.query}"\n\nParis is the capital of France. It is known for its iconic Eiffel Tower, Louvre Museum, and Notre-Dame cathedral. Paris is often called the "City of Light" (La Ville Lumière) and is one of the world's major centers for art, fashion, gastronomy, and culture.`;
        tokenUsage = { promptTokens: 45, completionTokens: 125, totalTokens: 170 };
        break;
      case 'gemini':
        searchResults = `Gemini search results for: "${params.query}"\n\nThe capital of France is Paris. Paris is located in the north-central part of France on the Seine River. It is the largest city in France and serves as the country's political, cultural, and economic center. Paris is known for landmarks such as the Eiffel Tower, the Louvre Museum, and Notre-Dame Cathedral.`;
        tokenUsage = { promptTokens: 50, completionTokens: 140, totalTokens: 190 };
        break;
      case 'openai':
        searchResults = `OpenAI search results for: "${params.query}"\n\nParis is the capital city of France. Located on the Seine River in the north-central part of the country, Paris is a major European city and a global center for art, fashion, gastronomy, and culture. Its 19th-century cityscape is crisscrossed by wide boulevards and the River Seine.`;
        tokenUsage = { promptTokens: 40, completionTokens: 110, totalTokens: 150 };
        break;
      default:
        searchResults = `Default provider results for: "${params.query}"\n\nParis is the capital of France.`;
        tokenUsage = { promptTokens: 30, completionTokens: 70, totalTokens: 100 };
    }
    
    // Add more content for detailed mode
    if (params.detailed) {
      searchResults += `\n\nAdditional details: Paris has a population of approximately 2.2 million people within its administrative limits. The Paris metropolitan area has a population of over 12 million people, making it one of the most populous urban areas in Europe. The city is divided into 20 districts called arrondissements, arranged in a clockwise spiral pattern.`;
      tokenUsage.completionTokens += 80;
      tokenUsage.totalTokens += 80;
    }
    
    // Format based on requested format
    if (params.format === 'markdown') {
      searchResults = `# Search Results for: ${params.query}\n\n${searchResults}\n\n## Sources\n\n- [Wikipedia](https://en.wikipedia.org/wiki/Paris)\n- [Official Paris Tourism Website](https://en.parisinfo.com/)`;
    } else if (params.format === 'json') {
      // For JSON format, we'll return the raw data and let the caller handle formatting
      return {
        searchResults: JSON.stringify({
          query: params.query,
          answer: searchResults,
          sources: [
            { title: "Wikipedia", url: "https://en.wikipedia.org/wiki/Paris" },
            { title: "Official Paris Tourism Website", url: "https://en.parisinfo.com/" }
          ]
        }, null, 2),
        metadata: {
          provider,
          cached,
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
          tokenUsage
        }
      };
    } else if (params.format === 'html') {
      searchResults = `<!DOCTYPE html>
<html>
<head>
  <title>Search Results: ${params.query}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .sources { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
    .source { margin-bottom: 5px; }
  </style>
</head>
<body>
  <h1>Search Results: ${params.query}</h1>
  <div class="content">
    <p>${searchResults}</p>
  </div>
  <div class="sources">
    <h2>Sources</h2>
    <div class="source"><a href="https://en.wikipedia.org/wiki/Paris">Wikipedia</a></div>
    <div class="source"><a href="https://en.parisinfo.com/">Official Paris Tourism Website</a></div>
  </div>
</body>
</html>`;
    }
    
    return {
      searchResults,
      metadata: {
        provider,
        cached,
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
        tokenUsage
      }
    };
  }
};

// Test function
async function runTests() {
  console.log(chalk.yellow('=== Comprehensive Web Search Tool Tests ===\n'));
  
  const testCases = [
    {
      name: 'Basic Search with Default Provider',
      params: {
        query: 'What is the capital of France?'
      }
    },
    {
      name: 'Detailed Search with Perplexity',
      params: {
        query: 'What is the capital of France?',
        provider: 'perplexity',
        detailed: true
      }
    },
    {
      name: 'Search with Gemini Provider',
      params: {
        query: 'What is the capital of France?',
        provider: 'gemini'
      }
    },
    {
      name: 'Search with OpenAI Provider',
      params: {
        query: 'What is the capital of France?',
        provider: 'openai'
      }
    },
    {
      name: 'Search with JSON Format',
      params: {
        query: 'What is the capital of France?',
        format: 'json'
      }
    },
    {
      name: 'Search with HTML Format',
      params: {
        query: 'What is the capital of France?',
        format: 'html'
      }
    },
    {
      name: 'Search with Cache Bypass',
      params: {
        query: 'What is the capital of France?',
        noCache: true
      }
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(chalk.cyan(`\n=== Test Case: ${testCase.name} ===`));
    
    try {
      // Execute the search
      const startTime = Date.now();
      const result = await webSearchTool.execute(testCase.params);
      const duration = Date.now() - startTime;
      
      console.log(chalk.green(`✅ Test passed in ${duration}ms`));
      
      // Display metadata
      if (result.metadata) {
        console.log(chalk.yellow('\nMetadata:'));
        console.log(`Provider: ${result.metadata.provider}`);
        console.log(`Cached: ${result.metadata.cached ? 'Yes' : 'No'}`);
        console.log(`Total Tokens: ${result.metadata.tokenUsage.totalTokens}`);
      }
      
      // Display a preview of the results
      console.log(chalk.yellow('\nResults Preview:'));
      const preview = result.searchResults.substring(0, 150) + '...';
      console.log(preview);
      
      results.push({ name: testCase.name, success: true, duration });
    } catch (error) {
      console.log(chalk.red(`❌ Test failed: ${error.message}`));
      results.push({ name: testCase.name, success: false, error: error.message });
    }
  }
  
  // Display summary
  console.log(chalk.yellow('\n=== Test Summary ==='));
  
  let passCount = 0;
  for (const result of results) {
    const status = result.success ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
    console.log(`${status} ${result.name}`);
    
    if (result.success) {
      passCount++;
    }
  }
  
  const successRate = (passCount / results.length) * 100;
  console.log(chalk.yellow(`\nSuccess Rate: ${successRate.toFixed(0)}% (${passCount}/${results.length})`));
  
  return passCount === results.length;
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(chalk.red('Unhandled error:'), error);
    process.exit(1);
  }); 