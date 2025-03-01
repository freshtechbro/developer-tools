// This is a stub implementation of the command interceptor tool
// It will be used by the transport servers for testing

import { v4 as uuidv4 } from 'uuid';

// Define the command interceptor tool
export const commandInterceptorTool = {
  name: 'command-interceptor',
  description: 'Intercept and process commands from chat messages',
  
  /**
   * Execute command interception
   * @param {Object} params - The command parameters
   * @param {string} params.message - The message to check for commands
   * @param {Object} [params.sessionContext] - Session context info
   * @returns {Promise<Object|null>} The command results or null if no command found
   */
  async execute(params) {
    console.log('Executing command interception with params:', params);
    
    if (!params.message) {
      console.log('No message provided');
      return null;
    }
    
    // Check if the message contains a command pattern
    const commandRegex = /^dt-(\w+)(?:\s+(.+))?$/i;
    const match = params.message.match(commandRegex);
    
    if (!match) {
      console.log('No command found in message');
      return null;
    }
    
    // Extract command and query
    const [, command, query] = match;
    console.log(`Found command: ${command}, query: ${query}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For testing purposes, we'll execute the web search for web commands
    if (command.toLowerCase() === 'web') {
      return {
        commandType: 'web-search',
        searchResults: `These are the search results for: "${query}"\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse consectetur eros vel lorem semper, in gravida lorem facilisis.`,
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
    }
    
    // For other commands, return a generic response
    return {
      commandType: command,
      message: `Command "${command}" processed with query "${query}"`,
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    };
  }
}; 