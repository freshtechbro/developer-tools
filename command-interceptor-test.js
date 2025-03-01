#!/usr/bin/env node

// Import required modules
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

// Create a simplified command interceptor tool
const commandInterceptorTool = {
  name: 'command-interceptor',
  description: 'Intercept and process commands from chat messages',
  
  async execute(params) {
    console.log(chalk.blue(`Executing command interception with params:`), params);
    
    // Validate required parameters
    if (!params.message) {
      console.log(chalk.yellow('No message provided'));
      return null;
    }
    
    // Check if the message contains a command pattern
    const commandRegex = /^dt-(\w+)(?:\s+(.+))?$/i;
    const match = params.message.match(commandRegex);
    
    if (!match) {
      console.log(chalk.yellow('No command found in message'));
      return null;
    }
    
    // Extract command and query
    const [, command, query] = match;
    console.log(chalk.green(`Found command: ${command}, query: ${query || 'none'}`));
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For testing purposes, we'll execute different commands
    switch (command.toLowerCase()) {
      case 'web':
        return {
          commandType: 'web-search',
          searchResults: `Web search results for: "${query}"\n\nParis is the capital of France. It is known for its iconic Eiffel Tower, Louvre Museum, and Notre-Dame cathedral.`,
          metadata: {
            provider: 'perplexity',
            cached: false,
            timestamp: new Date().toISOString(),
            requestId: uuidv4(),
            tokenUsage: {
              promptTokens: 35,
              completionTokens: 105,
              totalTokens: 140
            }
          }
        };
      
      case 'repo':
        return {
          commandType: 'repo-analysis',
          repository: query || 'current',
          analysis: 'This is a sample repository analysis',
          codeInsights: {
            architecture: 'Sample architecture insights',
            dependencies: 'Sample dependency insights',
            patterns: 'Sample code patterns'
          }
        };
        
      case 'doc':
        return {
          commandType: 'doc-generation',
          output: query || 'docs.md',
          status: 'completed',
          sections: [
            'Project Overview',
            'Architecture',
            'API Documentation',
            'Usage Examples'
          ]
        };
        
      case 'browser':
        const browserArgs = query ? query.split(' ') : [];
        const action = browserArgs[0] || 'open';
        const url = browserArgs[1] || 'https://example.com';
        
        return {
          commandType: 'browser-automation',
          action,
          url,
          status: 'completed',
          timestamp: new Date().toISOString()
        };
        
      default:
        return {
          commandType: command,
          message: `Command "${command}" processed with query "${query || 'none'}"`,
          timestamp: new Date().toISOString(),
          requestId: uuidv4()
        };
    }
  }
};

// Test function
async function runTests() {
  console.log(chalk.yellow('=== Command Interceptor Tests ===\n'));
  
  const testCases = [
    {
      name: 'Web Search Command',
      message: 'dt-web What is the capital of France?'
    },
    {
      name: 'Repository Analysis Command',
      message: 'dt-repo developer-tools'
    },
    {
      name: 'Documentation Generation Command',
      message: 'dt-doc --output api-docs.md'
    },
    {
      name: 'Browser Automation Command',
      message: 'dt-browser open https://example.com'
    },
    {
      name: 'Unknown Command',
      message: 'dt-unknown test command'
    },
    {
      name: 'No Command',
      message: 'This is a regular message with no command'
    },
    {
      name: 'Empty Message',
      message: ''
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(chalk.cyan(`\n=== Test Case: ${testCase.name} ===`));
    console.log(`Message: "${testCase.message}"`);
    
    try {
      // Execute the command interception
      const startTime = Date.now();
      const result = await commandInterceptorTool.execute({ message: testCase.message });
      const duration = Date.now() - startTime;
      
      if (result === null) {
        console.log(chalk.yellow(`ℹ️ No command detected (expected for some test cases)`));
        results.push({ name: testCase.name, success: true, commandFound: false, duration });
      } else {
        console.log(chalk.green(`✅ Command detected and processed in ${duration}ms`));
        
        // Display command details
        console.log(chalk.yellow('\nCommand Details:'));
        console.log(`Type: ${result.commandType}`);
        
        // Display a preview of the results
        console.log(chalk.yellow('\nResults Preview:'));
        console.log(JSON.stringify(result, null, 2).substring(0, 200) + '...');
        
        results.push({ name: testCase.name, success: true, commandFound: true, duration });
      }
    } catch (error) {
      console.log(chalk.red(`❌ Test failed: ${error.message}`));
      results.push({ name: testCase.name, success: false, error: error.message });
    }
  }
  
  // Display summary
  console.log(chalk.yellow('\n=== Test Summary ==='));
  
  let passCount = 0;
  let commandFoundCount = 0;
  
  for (const result of results) {
    let status;
    if (result.success) {
      status = result.commandFound ? 
        chalk.green('✅ PASS (Command Found)') : 
        chalk.blue('✅ PASS (No Command)');
      passCount++;
      if (result.commandFound) {
        commandFoundCount++;
      }
    } else {
      status = chalk.red('❌ FAIL');
    }
    
    console.log(`${status} ${result.name}`);
  }
  
  const successRate = (passCount / results.length) * 100;
  console.log(chalk.yellow(`\nSuccess Rate: ${successRate.toFixed(0)}% (${passCount}/${results.length})`));
  console.log(chalk.yellow(`Commands Detected: ${commandFoundCount}/${results.length}`));
  
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