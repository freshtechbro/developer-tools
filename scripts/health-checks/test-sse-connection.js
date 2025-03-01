import { EventSource } from 'eventsource';
import fetch from 'node-fetch';

// Configuration
const sseUrl = process.argv[2] || 'http://localhost:3002/mcp-sse';
const clientId = process.argv[3] || `test-client-${Date.now()}`;

console.log(`Connecting to SSE endpoint: ${sseUrl}`);
console.log(`Using client ID: ${clientId}`);

// Add client ID to URL as query parameter
const fullUrl = new URL(sseUrl);
fullUrl.searchParams.append('clientId', clientId);

// Initialize event source
const eventSource = new EventSource(fullUrl.toString());

// Track connection state
let isConnected = false;
let lastMessageTime = null;
let messageCount = 0;

// Setup connection timeout
const connectionTimeout = setTimeout(() => {
  if (!isConnected) {
    console.error('Connection timeout - could not establish SSE connection within 10 seconds');
    cleanupAndExit(1);
  }
}, 10000);

// Handle events
eventSource.onopen = (event) => {
  console.log('Connection opened!');
  console.log('Event details:', event);
  isConnected = true;
  clearTimeout(connectionTimeout);
  
  // After successful connection, send a test message
  sendTestMessage();
};

eventSource.onmessage = (event) => {
  const timestamp = new Date().toISOString();
  lastMessageTime = timestamp;
  messageCount++;
  
  try {
    const data = JSON.parse(event.data);
    console.log(`[${timestamp}] Message received:`, JSON.stringify(data, null, 2));
    
    // Look for session ID in connection message
    if (data.method === 'connection' && data.params?.sessionId) {
      console.log(`✅ Server assigned session ID: ${data.params.sessionId}`);
    }
  } catch (error) {
    console.log(`[${timestamp}] Raw message received:`, event.data);
  }
};

eventSource.onerror = (error) => {
  console.error('Connection error:', error);
  // Don't exit on first error - let it try to reconnect
  if (error.status === 404) {
    console.error('❌ 404 Not Found: The SSE endpoint does not exist or is not accessible');
    cleanupAndExit(1);
  }
};

// Listen for specific event types
eventSource.addEventListener('error', (event) => {
  console.log('Named error event:', event);
});

// Monitor connection state periodically
const stateMonitor = setInterval(() => {
  const states = ['CONNECTING', 'OPEN', 'CLOSED'];
  const stateText = states[eventSource.readyState] || 'UNKNOWN';
  
  console.log(`Connection state: ${stateText} (${eventSource.readyState})`);
  
  if (eventSource.readyState === 2) { // CLOSED
    console.error('Connection closed unexpectedly');
    cleanupAndExit(1);
  }
  
  // Calculate time since last message
  if (lastMessageTime) {
    const elapsed = (new Date() - new Date(lastMessageTime)) / 1000;
    console.log(`Time since last message: ${elapsed.toFixed(1)}s, Total messages: ${messageCount}`);
    
    // Warn if no messages for too long
    if (elapsed > 30) {
      console.warn('⚠️ No messages received for over 30 seconds');
    }
  }
}, 5000);

// Send a test message to the server via HTTP
async function sendTestMessage() {
  try {
    const message = {
      jsonrpc: '2.0',
      id: `test-${Date.now()}`,
      method: 'health-check',
      params: { clientId }
    };
    
    console.log('Sending test message via HTTP POST:', message);
    
    const response = await fetch(sseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    const responseData = await response.json();
    console.log('Response received:', responseData);
  } catch (error) {
    console.error('Error sending test message:', error.message);
  }
}

// Handle graceful shutdown
function cleanupAndExit(code = 0) {
  console.log('Cleaning up before exit...');
  clearInterval(stateMonitor);
  if (eventSource) {
    eventSource.close();
  }
  setTimeout(() => process.exit(code), 500);
}

// Listen for Ctrl+C
process.on('SIGINT', () => {
  console.log('Received SIGINT - shutting down');
  cleanupAndExit();
});

// Auto-exit after 2 minutes to prevent hanging
setTimeout(() => {
  console.log('Test duration completed');
  cleanupAndExit();
}, 2 * 60 * 1000); 