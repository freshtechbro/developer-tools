#!/usr/bin/env node

import fetch from 'node-fetch';

// Configuration
const HTTP_ENDPOINT = 'http://localhost:3001/mcp';
const SSE_ENDPOINT = 'http://localhost:3002/mcp-sse';

// Test data
const testQuery = 'What is the capital of France?';
const testCommand = 'dt-web "What is quantum computing?"';

/**
 * Test HTTP transport with web search
 */
async function testHttpWebSearch() {
  console.log('\n=== Testing HTTP transport with web search ===');
  
  try {
    console.log('Sending web search request...');
    
    const response = await fetch(HTTP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-web-search',
        method: 'web-search',
        params: {
          query: testQuery,
          provider: 'perplexity',
          detailed: true
        }
      })
    });
    
    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));
    
    if (data.result && data.result.searchResults) {
      console.log('\n✅ HTTP web search test successful!');
      return true;
    } else {
      console.log('\n❌ HTTP web search test failed');
      return false;
    }
  } catch (error) {
    console.error('\n❌ HTTP web search test error:', error.message);
    return false;
  }
}

/**
 * Test HTTP transport with command interceptor
 */
async function testHttpCommandInterceptor() {
  console.log('\n=== Testing HTTP transport with command interceptor ===');
  
  try {
    console.log('Sending command interceptor request...');
    
    const response = await fetch(HTTP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-command',
        method: 'command-interceptor',
        params: {
          message: testCommand
        }
      })
    });
    
    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));
    
    if (data.result) {
      console.log('\n✅ HTTP command interceptor test successful!');
      return true;
    } else {
      console.log('\n❌ HTTP command interceptor test failed');
      return false;
    }
  } catch (error) {
    console.error('\n❌ HTTP command interceptor test error:', error.message);
    return false;
  }
}

/**
 * Test all transport functionality
 */
async function runTests() {
  console.log('==================================================');
  console.log('Starting transport integration tests');
  console.log('==================================================');
  
  // Run HTTP tests
  const httpWebSearchResult = await testHttpWebSearch();
  const httpCommandResult = await testHttpCommandInterceptor();
  
  // Summary
  console.log('\n==================================================');
  console.log('Test Summary:');
  console.log('==================================================');
  console.log(`HTTP Web Search: ${httpWebSearchResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`HTTP Command Interceptor: ${httpCommandResult ? '✅ PASS' : '❌ FAIL'}`);
  
  // Overall result
  const allTests = [httpWebSearchResult, httpCommandResult];
  const passCount = allTests.filter(Boolean).length;
  const totalTests = allTests.length;
  const successRate = (passCount / totalTests) * 100;
  
  console.log(`\nOverall Success Rate: ${successRate.toFixed(0)}% (${passCount}/${totalTests})`);
  
  if (passCount === totalTests) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

// Start the test suite
runTests().catch(error => {
  console.error('Unhandled error during tests:', error);
  process.exit(1);
}); 