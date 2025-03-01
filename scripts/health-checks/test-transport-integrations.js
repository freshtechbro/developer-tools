#!/usr/bin/env node

import fetch from 'node-fetch';
import EventSource from 'eventsource';
import chalk from 'chalk';

// Configuration
const HTTP_ENDPOINT = 'http://localhost:3001/mcp';
const SSE_ENDPOINT = 'http://localhost:3002/mcp-sse';
const TEST_QUERIES = {
  basic: 'What is the capital of France?',
  technical: 'Explain async/await in JavaScript',
  command: 'dt-web What is the capital of France?'
};

// Test options for different scenarios
const TEST_OPTIONS = {
  basicSearch: {},
  detailedSearch: { detailed: true, provider: 'gemini' },
  noCache: { noCache: true },
  jsonFormat: { format: 'json', includeMetadata: true }
};

/**
 * Test HTTP transport with web search using different options
 */
async function testHttpWebSearch() {
  console.log(chalk.blue('\n=== Testing HTTP transport with web search ==='));
  
  try {
    // First, send an initialization request
    console.log('Sending initialization request...');
    const initResponse = await fetch(HTTP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'init-1',
        method: 'initialize'
      })
    });
    
    const initData = await initResponse.json();
    console.log(chalk.green('Initialization successful:'), JSON.stringify(initData, null, 2));
    
    // Extract the session ID if provided
    const sessionId = initData.result?.sessionId || 'test-session';
    
    // Test 1: Basic search
    console.log(chalk.yellow('\nTest 1: Basic web search...'));
    const basicResult = await executeHttpWebSearch(
      sessionId,
      TEST_QUERIES.basic,
      TEST_OPTIONS.basicSearch
    );
    
    // Test 2: Detailed search with provider selection
    console.log(chalk.yellow('\nTest 2: Detailed search with provider selection...'));
    const detailedResult = await executeHttpWebSearch(
      sessionId,
      TEST_QUERIES.technical,
      TEST_OPTIONS.detailedSearch
    );
    
    // Test 3: Search with cache bypass
    console.log(chalk.yellow('\nTest 3: Search with cache bypass...'));
    const noCacheResult = await executeHttpWebSearch(
      sessionId,
      TEST_QUERIES.basic, // Same query as Test 1 to test caching
      TEST_OPTIONS.noCache
    );
    
    // Test 4: Search with JSON format and metadata
    console.log(chalk.yellow('\nTest 4: Search with JSON format and metadata...'));
    const jsonResult = await executeHttpWebSearch(
      sessionId,
      TEST_QUERIES.technical,
      TEST_OPTIONS.jsonFormat
    );
    
    // Return overall success
    return {
      basicSuccess: basicResult.success,
      detailedSuccess: detailedResult.success,
      noCacheSuccess: noCacheResult.success,
      jsonSuccess: jsonResult.success
    };
  } catch (error) {
    console.error(chalk.red('HTTP test failed:'), error.message);
    return {
      basicSuccess: false,
      detailedSuccess: false,
      noCacheSuccess: false,
      jsonSuccess: false
    };
  }
}

/**
 * Execute a single HTTP web search test
 */
async function executeHttpWebSearch(sessionId, query, options) {
  try {
    console.log(`Sending web search request: "${query}"`);
    if (Object.keys(options).length > 0) {
      console.log('With options:', options);
    }
    
    const searchResponse = await fetch(HTTP_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `search-${Date.now()}`,
        method: 'web-search',
        params: {
          query,
          ...options
        }
      })
    });
    
    const searchData = await searchResponse.json();
    
    if (searchData.error) {
      console.log(chalk.red('Web search failed:'), searchData.error);
      return { success: false, error: searchData.error };
    } else {
      console.log(chalk.green('Web search successful!'));
      
      // Log result metadata if available
      if (searchData.result?.metadata) {
        console.log('Provider:', searchData.result.metadata.provider || 'unknown');
        console.log('Cached:', searchData.result.metadata.cached ? 'Yes' : 'No');
        if (searchData.result.metadata.tokenUsage?.totalTokens) {
          console.log('Total tokens:', searchData.result.metadata.tokenUsage.totalTokens);
        }
      }
      
      console.log('First 100 characters of results:', searchData.result.searchResults.substring(0, 100) + '...');
      return { success: true, data: searchData };
    }
  } catch (error) {
    console.error(chalk.red('HTTP search request failed:'), error.message);
    return { success: false, error };
  }
}

/**
 * Test HTTP transport with command interceptor
 */
async function testHttpCommandInterceptor() {
  console.log(chalk.blue('\n=== Testing HTTP transport with command interceptor ==='));
  
  try {
    // Send command interceptor request
    console.log('Sending command interceptor request...');
    const commandResponse = await fetch(HTTP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'command-1',
        method: 'command-interceptor',
        params: {
          message: TEST_QUERIES.command
        }
      })
    });
    
    const commandData = await commandResponse.json();
    
    if (commandData.error) {
      console.log(chalk.red('Command interceptor failed:'), commandData.error);
      return false;
    } else {
      console.log(chalk.green('Command interceptor successful!'));
      
      // Log result metadata if available
      if (commandData.result?.metadata) {
        console.log('Provider:', commandData.result.metadata.provider || 'unknown');
        console.log('Cached:', commandData.result.metadata.cached ? 'Yes' : 'No');
      }
      
      console.log('First 100 characters of results:', commandData.result.searchResults.substring(0, 100) + '...');
      return true;
    }
  } catch (error) {
    console.error(chalk.red('HTTP command test failed:'), error.message);
    return false;
  }
}

/**
 * Test SSE transport with web search
 */
async function testSseWebSearch() {
  console.log(chalk.blue('\n=== Testing SSE transport with web search ==='));
  
  try {
    // Test 1: Basic search
    console.log(chalk.yellow('\nTest 1: Basic web search via SSE...'));
    const basicResult = await executeSseWebSearch(
      TEST_QUERIES.basic,
      TEST_OPTIONS.basicSearch
    );
    
    // Test 2: Detailed search with provider selection
    console.log(chalk.yellow('\nTest 2: Detailed search with provider selection via SSE...'));
    const detailedResult = await executeSseWebSearch(
      TEST_QUERIES.technical,
      TEST_OPTIONS.detailedSearch
    );
    
    // Return overall success
    return {
      basicSuccess: basicResult.success,
      detailedSuccess: detailedResult.success
    };
  } catch (error) {
    console.error(chalk.red('SSE test failed:'), error.message);
    return {
      basicSuccess: false,
      detailedSuccess: false
    };
  }
}

/**
 * Execute a single SSE web search test
 */
async function executeSseWebSearch(query, options) {
  return new Promise((resolve) => {
    let timeoutId;
    let messageReceived = false;
    const clientId = `test-client-${Date.now()}`;
    const requestId = `sse-search-${Date.now()}`;
    
    // Connect to SSE endpoint
    console.log(`Connecting to SSE endpoint with client ID: ${clientId}...`);
    const es = new EventSource(`${SSE_ENDPOINT}?clientId=${clientId}`);
    
    es.onopen = () => {
      console.log(chalk.green('SSE connection established'));
      
      // Send web search request
      console.log(`Sending web search request: "${query}"`);
      if (Object.keys(options).length > 0) {
        console.log('With options:', options);
      }
      
      fetch(SSE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          method: 'web-search',
          params: {
            query,
            clientId,
            ...options
          }
        })
      }).then(async (response) => {
        const data = await response.json();
        console.log('POST response:', JSON.stringify(data, null, 2));
      }).catch((error) => {
        console.error('Error sending SSE request:', error);
      });
    };
    
    const statusMessages = [];
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(chalk.cyan('Received SSE message:'), data.method || data.id);
        
        // Collect status messages
        if (data.method === 'web-search-status') {
          statusMessages.push(data);
          console.log(chalk.yellow('Status update:'), data.params.status);
        }
        
        // Check if this is the web search response
        if (data.id === requestId && data.result) {
          console.log(chalk.green('SSE web search successful!'));
          
          // Log result metadata if available
          if (data.result.metadata) {
            console.log('Provider:', data.result.metadata.provider || 'unknown');
            console.log('Cached:', data.result.metadata.cached ? 'Yes' : 'No');
            if (data.result.metadata.tokenUsage?.totalTokens) {
              console.log('Total tokens:', data.result.metadata.tokenUsage.totalTokens);
            }
          }
          
          console.log('First 100 characters of results:', data.result.searchResults.substring(0, 100) + '...');
          console.log('Status messages received:', statusMessages.length);
          
          messageReceived = true;
          clearTimeout(timeoutId);
          es.close();
          resolve({ success: true, data, statusMessages });
        }
        
        // Check for error
        if (data.id === requestId && data.error) {
          console.log(chalk.red('SSE web search failed:'), data.error);
          messageReceived = true;
          clearTimeout(timeoutId);
          es.close();
          resolve({ success: false, error: data.error, statusMessages });
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
    
    es.onerror = (error) => {
      console.error(chalk.red('SSE connection error:'), error);
      es.close();
      resolve({ success: false, error, statusMessages });
    };
    
    // Set timeout for SSE test
    timeoutId = setTimeout(() => {
      console.log(chalk.yellow('SSE test timed out after 30 seconds'));
      es.close();
      resolve({ 
        success: messageReceived, 
        timedOut: true,
        statusMessages 
      });
    }, 30000);
  });
}

/**
 * Test SSE transport with command interceptor
 */
async function testSseCommandInterceptor() {
  console.log(chalk.blue('\n=== Testing SSE transport with command interceptor ==='));
  
  return new Promise((resolve) => {
    let timeoutId;
    let messageReceived = false;
    const clientId = `test-client-${Date.now()}`;
    const requestId = `sse-command-${Date.now()}`;
    
    // Connect to SSE endpoint
    console.log(`Connecting to SSE endpoint with client ID: ${clientId}...`);
    const es = new EventSource(`${SSE_ENDPOINT}?clientId=${clientId}`);
    
    es.onopen = () => {
      console.log(chalk.green('SSE connection established'));
      
      // Send command interceptor request
      console.log(`Sending command interceptor request: "${TEST_QUERIES.command}"`);
      
      fetch(SSE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          method: 'command-interceptor',
          params: {
            message: TEST_QUERIES.command,
            clientId
          }
        })
      }).then(async (response) => {
        const data = await response.json();
        console.log('POST response:', JSON.stringify(data, null, 2));
      }).catch((error) => {
        console.error('Error sending SSE request:', error);
      });
    };
    
    const statusMessages = [];
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(chalk.cyan('Received SSE message:'), data.method || data.id);
        
        // Collect status messages
        if (data.method === 'command-status') {
          statusMessages.push(data);
          console.log(chalk.yellow('Status update:'), data.params.status);
        }
        
        // Check if this is the command interceptor response
        if (data.id === requestId && data.result) {
          console.log(chalk.green('SSE command interceptor successful!'));
          
          // Log result metadata if available
          if (data.result.metadata) {
            console.log('Provider:', data.result.metadata.provider || 'unknown');
            console.log('Cached:', data.result.metadata.cached ? 'Yes' : 'No');
          }
          
          console.log('First 100 characters of results:', data.result.searchResults.substring(0, 100) + '...');
          console.log('Status messages received:', statusMessages.length);
          
          messageReceived = true;
          clearTimeout(timeoutId);
          es.close();
          resolve({ success: true, data, statusMessages });
        }
        
        // Check for error
        if (data.id === requestId && data.error) {
          console.log(chalk.red('SSE command interceptor failed:'), data.error);
          messageReceived = true;
          clearTimeout(timeoutId);
          es.close();
          resolve({ success: false, error: data.error, statusMessages });
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
    
    es.onerror = (error) => {
      console.error(chalk.red('SSE connection error:'), error);
      es.close();
      resolve({ success: false, error, statusMessages });
    };
    
    // Set timeout for SSE test
    timeoutId = setTimeout(() => {
      console.log(chalk.yellow('SSE test timed out after 30 seconds'));
      es.close();
      resolve({ 
        success: messageReceived, 
        timedOut: true,
        statusMessages 
      });
    }, 30000);
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(chalk.yellow('=== Testing Transport Integrations with Enhanced Web Search Tool ==='));
  
  // Run HTTP tests
  const httpResults = await testHttpWebSearch();
  const httpCommandResult = await testHttpCommandInterceptor();
  
  // Run SSE tests
  const sseResults = await testSseWebSearch();
  const sseCommandResult = await testSseCommandInterceptor();
  
  // Display summary
  console.log(chalk.yellow('\n=== Test Summary ==='));
  
  // HTTP tests
  console.log(chalk.blue('\nHTTP Transport Tests:'));
  console.log('  Basic Web Search:', httpResults.basicSuccess ? chalk.green('✓ PASS') : chalk.red('✗ FAIL'));
  console.log('  Detailed Web Search:', httpResults.detailedSuccess ? chalk.green('✓ PASS') : chalk.red('✗ FAIL'));
  console.log('  No-Cache Web Search:', httpResults.noCacheSuccess ? chalk.green('✓ PASS') : chalk.red('✗ FAIL'));
  console.log('  JSON Format Web Search:', httpResults.jsonSuccess ? chalk.green('✓ PASS') : chalk.red('✗ FAIL'));
  console.log('  Command Interceptor:', httpCommandResult ? chalk.green('✓ PASS') : chalk.red('✗ FAIL'));
  
  // SSE tests
  console.log(chalk.blue('\nSSE Transport Tests:'));
  console.log('  Basic Web Search:', sseResults.basicSuccess ? chalk.green('✓ PASS') : chalk.red('✗ FAIL'));
  console.log('  Detailed Web Search:', sseResults.detailedSuccess ? chalk.green('✓ PASS') : chalk.red('✗ FAIL'));
  console.log('  Command Interceptor:', sseCommandResult.success ? chalk.green('✓ PASS') : chalk.red('✗ FAIL'));
  
  // Overall result
  const allHttpTests = [
    httpResults.basicSuccess,
    httpResults.detailedSuccess,
    httpResults.noCacheSuccess,
    httpResults.jsonSuccess,
    httpCommandResult
  ];
  
  const allSseTests = [
    sseResults.basicSuccess,
    sseResults.detailedSuccess,
    sseCommandResult.success
  ];
  
  const httpSuccessRate = allHttpTests.filter(Boolean).length / allHttpTests.length * 100;
  const sseSuccessRate = allSseTests.filter(Boolean).length / allSseTests.length * 100;
  
  console.log(chalk.blue('\nOverall Results:'));
  console.log(`  HTTP Tests: ${httpSuccessRate.toFixed(0)}% passed`);
  console.log(`  SSE Tests: ${sseSuccessRate.toFixed(0)}% passed`);
  
  // Exit with appropriate code
  const allPassed = allHttpTests.every(Boolean) && allSseTests.every(Boolean);
  process.exit(allPassed ? 0 : 1);
}

// Run tests when script is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runTests().catch(error => {
    console.error(chalk.red('Test execution failed:'), error);
    process.exit(1);
  });
}

export { 
  testHttpWebSearch,
  testHttpCommandInterceptor,
  testSseWebSearch,
  testSseCommandInterceptor
}; 