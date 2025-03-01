import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3002;

// Enhanced debugging
const activeConnections = new Map();
const connectionAttempts = [];
const requestLog = [];
const MAX_LOG_SIZE = 100;

// Configure Express
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json());

// Log all requests for debugging
app.use((req, res, next) => {
  const requestInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    ip: req.ip,
    query: req.query
  };
  
  requestLog.unshift(requestInfo);
  if (requestLog.length > MAX_LOG_SIZE) {
    requestLog.pop();
  }
  
  console.log(`[${requestInfo.timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connections: activeConnections.size,
    uptime: process.uptime()
  });
});

// Debug endpoint to view connection info
app.get('/debug/connections', (req, res) => {
  const connectionInfo = [];
  activeConnections.forEach((info, id) => {
    connectionInfo.push({
      id,
      startTime: info.startTime,
      lastMessageTime: info.lastMessageTime,
      messageCount: info.messageCount,
      ip: info.ip,
      userAgent: info.userAgent
    });
  });
  
  res.json({
    activeConnections: connectionInfo,
    connectionAttempts: connectionAttempts.slice(0, 50),
    requestLog: requestLog.slice(0, 50)
  });
});

// SSE Connection endpoint - uses the MCP protocol path
app.get('/mcp-sse', (req, res) => {
  // Log connection attempt
  const connectionId = req.query.clientId || uuidv4();
  const attemptInfo = {
    timestamp: new Date().toISOString(),
    id: connectionId,
    headers: req.headers,
    query: req.query,
    ip: req.ip
  };
  connectionAttempts.unshift(attemptInfo);
  if (connectionAttempts.length > MAX_LOG_SIZE) {
    connectionAttempts.pop();
  }
  
  console.log(`[${attemptInfo.timestamp}] New SSE connection attempt: ${connectionId}`);
  
  // Set headers for SSE connection
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering if present
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders(); // Flush the headers immediately
  
  // Store connection info
  const connectionInfo = {
    id: connectionId,
    res: res,
    startTime: new Date().toISOString(),
    lastMessageTime: new Date().toISOString(),
    messageCount: 0,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  };
  
  activeConnections.set(connectionId, connectionInfo);
  
  // Send initial connection message
  const initialMessage = {
    jsonrpc: '2.0',
    method: 'connection',
    params: {
      sessionId: connectionId,
      status: 'connected'
    }
  };
  
  sendSSEMessage(res, initialMessage);
  connectionInfo.messageCount++;
  
  // Setup keep-alive
  const keepAliveInterval = setInterval(() => {
    const keepAliveMsg = {
      jsonrpc: '2.0',
      method: 'keepalive',
      params: { 
        timestamp: new Date().toISOString() 
      }
    };
    sendSSEMessage(res, keepAliveMsg);
    connectionInfo.messageCount++;
    connectionInfo.lastMessageTime = new Date().toISOString();
  }, 15000); // Keep-alive every 15 seconds
  
  // Handle client disconnect
  req.on('close', () => {
    console.log(`SSE connection closed: ${connectionId}`);
    clearInterval(keepAliveInterval);
    activeConnections.delete(connectionId);
  });
  
  // Handle connection error
  req.on('error', (error) => {
    console.error(`SSE connection error: ${connectionId}`, error);
    clearInterval(keepAliveInterval);
    activeConnections.delete(connectionId);
  });
});

// Function to send SSE message in proper format
function sendSSEMessage(res, data) {
  const messageString = JSON.stringify(data);
  res.write(`data: ${messageString}\n\n`);
}

// Handle POST requests to the SSE endpoint (for testing and sending messages)
app.post('/mcp-sse', (req, res) => {
  const message = req.body;
  console.log('Received message to broadcast:', message);
  
  // Validate message format
  if (!message || !message.jsonrpc || !message.method) {
    return res.status(400).json({ 
      jsonrpc: '2.0',
      id: message?.id || null,
      error: {
        code: -32600,
        message: 'Invalid Request: Missing required JSON-RPC fields'
      }
    });
  }
  
  // Generate response
  const response = {
    jsonrpc: '2.0',
    id: message.id || null,
    result: {
      success: true,
      timestamp: new Date().toISOString()
    }
  };
  
  // Special handling for specific method types
  if (message.method === 'initialize') {
    response.result.sessionId = uuidv4();
    response.result.capabilities = {
      webSearch: true,
      codeAnalysis: true,
      sse: true
    };
  } else if (message.method === 'health-check') {
    response.result.status = 'healthy';
    response.result.connections = activeConnections.size;
  } else if (message.method === 'web-search') {
    response.result.query = message.params?.query || 'default query';
    response.result.results = [
      { title: 'Sample result 1', url: 'https://example.com/1' },
      { title: 'Sample result 2', url: 'https://example.com/2' }
    ];
  }
  
  // Broadcast the message to all active SSE connections
  activeConnections.forEach((info, id) => {
    // Don't send initialization responses as broadcasts
    if (message.method !== 'initialize') {
      sendSSEMessage(info.res, message);
      info.messageCount++;
      info.lastMessageTime = new Date().toISOString();
    }
  });
  
  // Return response to the POST request
  res.json(response);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Enhanced SSE transport server running at http://localhost:${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/mcp-sse`);
  console.log(`Debug information: http://localhost:${PORT}/debug/connections`);
}); 