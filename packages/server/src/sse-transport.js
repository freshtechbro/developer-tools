import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { webSearchTool } from './stubs/web-search.js';
import { commandInterceptorTool } from './stubs/command-interceptor.js';
import { logger } from './stubs/logger.js';

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
app.post('/mcp-sse', async (req, res) => {
  const message = req.body;
  console.log('Received message to broadcast:', message);
  
  // Get client ID from request for targeted messaging
  const clientId = message.params?.clientId || req.query.clientId || 'all';
  
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
  
  // Record request in log
  requestLog.unshift({
    timestamp: new Date().toISOString(),
    clientId,
    method: message.method,
    id: message.id,
    query: message.params?.query
  });
  
  if (requestLog.length > MAX_LOG_SIZE) {
    requestLog.pop();
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
    response.result.sessionId = clientId !== 'all' ? clientId : uuidv4();
    response.result.capabilities = {
      webSearch: true,
      commandInterceptor: true,
      codeAnalysis: true,
      sse: true
    };
  } else if (message.method === 'health-check') {
    response.result.status = 'healthy';
    response.result.connections = activeConnections.size;
  } else if (message.method === 'web-search') {
    // Handle web search request
    try {
      // Log request details for debugging
      logger.info(`SSE Transport: Processing web search request`, { 
        query: message.params?.query, 
        provider: message.params?.provider,
        clientId
      });
      
      // Start processing time measurement
      const startTime = Date.now();
      
      // Find the client connection if specific
      let clientConnection = null;
      if (clientId !== 'all' && activeConnections.has(clientId)) {
        clientConnection = activeConnections.get(clientId);
        
        // Send a processing message to indicate the request is being handled
        const processingMsg = {
          jsonrpc: '2.0',
          id: message.id,
          method: 'web-search-status',
          params: {
            status: 'processing',
            timestamp: new Date().toISOString(),
            query: message.params?.query
          }
        };
        
        sendSSEMessage(clientConnection.res, processingMsg);
        clientConnection.messageCount++;
        clientConnection.lastMessageTime = new Date().toISOString();
      }
      
      // Add client context to the request
      const requestWithContext = {
        ...message.params,
        sessionContext: {
          clientId,
          transport: 'sse',
          userAgent: clientConnection?.userAgent || req.headers['user-agent']
        }
      };
      
      // Execute web search with enhanced parameters
      const result = await webSearchTool.execute(requestWithContext);
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Log success with processing time
      logger.info(`SSE Transport: Web search completed`, { 
        clientId, 
        processingTime: `${processingTime}ms`,
        provider: result.metadata?.provider || 'unknown',
        cached: result.metadata?.cached || false
      });
      
      // Create response message
      const responseMessage = {
        jsonrpc: '2.0',
        id: message.id,
        result: result
      };
      
      // Send to specific client or broadcast to all
      if (clientId !== 'all' && activeConnections.has(clientId)) {
        const connection = activeConnections.get(clientId);
        sendSSEMessage(connection.res, responseMessage);
        connection.messageCount++;
        connection.lastMessageTime = new Date().toISOString();
        
        // Also send a completion notification
        const completionMsg = {
          jsonrpc: '2.0',
          method: 'web-search-status',
          params: {
            status: 'completed',
            timestamp: new Date().toISOString(),
            processingTime,
            provider: result.metadata?.provider,
            cached: result.metadata?.cached
          }
        };
        
        sendSSEMessage(connection.res, completionMsg);
        connection.messageCount++;
      } else {
        // Broadcast to all
        activeConnections.forEach(info => {
          sendSSEMessage(info.res, responseMessage);
          info.messageCount++;
          info.lastMessageTime = new Date().toISOString();
        });
      }
      
      // Set response for the HTTP POST request
      response.result.status = 'completed';
      response.result.message = 'Web search completed successfully';
      response.result.processingTime = processingTime;
      
    } catch (error) {
      logger.error(`SSE Transport: Web search failed`, { 
        error: error.message, 
        stack: error.stack,
        clientId,
        query: message.params?.query
      });
      
      const errorMessage = {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: error.code || -32000,
          message: `Web search failed: ${error instanceof Error ? error.message : String(error)}`,
          data: {
            clientId,
            errorType: error.name,
            provider: error.provider
          }
        }
      };
      
      // Send error to the specific client
      if (clientId !== 'all' && activeConnections.has(clientId)) {
        const connection = activeConnections.get(clientId);
        sendSSEMessage(connection.res, errorMessage);
      } else {
        // Send to all clients if no specific client
        activeConnections.forEach(info => {
          sendSSEMessage(info.res, errorMessage);
        });
      }
      
      // Set error response for the HTTP POST request
      return res.status(400).json(errorMessage);
    }
      
    // Set a temporary response for the HTTP POST request (this will be hit only if no error)
    response.result.status = 'processing';
    response.result.message = 'Web search request is being processed';
    
  } else if (message.method === 'command-interceptor') {
    // Handle command interceptor request
    try {
      // Log request details
      logger.info(`SSE Transport: Processing command interceptor request`, { 
        message: message.params?.message,
        clientId
      });
      
      // Start processing time measurement
      const startTime = Date.now();
      
      // Find the client connection if specific
      let clientConnection = null;
      if (clientId !== 'all' && activeConnections.has(clientId)) {
        clientConnection = activeConnections.get(clientId);
        
        // Send a processing message to indicate the request is being handled
        const processingMsg = {
          jsonrpc: '2.0',
          id: message.id,
          method: 'command-status',
          params: {
            status: 'processing',
            timestamp: new Date().toISOString(),
            message: message.params?.message
          }
        };
        
        sendSSEMessage(clientConnection.res, processingMsg);
        clientConnection.messageCount++;
        clientConnection.lastMessageTime = new Date().toISOString();
      }
      
      // Add client context to the request
      const requestWithContext = {
        ...message.params,
        sessionContext: {
          clientId,
          transport: 'sse',
          userAgent: clientConnection?.userAgent || req.headers['user-agent']
        }
      };
      
      // Execute command interceptor with enhanced context
      const result = await commandInterceptorTool.execute(requestWithContext);
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Log success with processing time
      logger.info(`SSE Transport: Command interceptor completed`, { 
        clientId, 
        processingTime: `${processingTime}ms`,
        commandFound: result !== null
      });
      
      // Create response message
      const responseMessage = {
        jsonrpc: '2.0',
        id: message.id,
        result: result
      };
      
      // Send to specific client or broadcast to all
      if (clientId !== 'all' && activeConnections.has(clientId)) {
        const connection = activeConnections.get(clientId);
        sendSSEMessage(connection.res, responseMessage);
        connection.messageCount++;
        connection.lastMessageTime = new Date().toISOString();
        
        // Also send a completion notification
        const completionMsg = {
          jsonrpc: '2.0',
          method: 'command-status',
          params: {
            status: 'completed',
            timestamp: new Date().toISOString(),
            processingTime,
            commandFound: result !== null
          }
        };
        
        sendSSEMessage(connection.res, completionMsg);
        connection.messageCount++;
      } else {
        // Broadcast to all
        activeConnections.forEach(info => {
          sendSSEMessage(info.res, responseMessage);
          info.messageCount++;
          info.lastMessageTime = new Date().toISOString();
        });
      }
      
      // Set response for the HTTP POST request
      response.result.status = 'completed';
      response.result.message = 'Command interceptor completed successfully';
      response.result.processingTime = processingTime;
      
    } catch (error) {
      logger.error(`SSE Transport: Command interceptor failed`, { 
        error: error.message, 
        stack: error.stack,
        clientId,
        message: message.params?.message
      });
      
      const errorMessage = {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: error.code || -32000,
          message: `Command interception failed: ${error instanceof Error ? error.message : String(error)}`,
          data: {
            clientId,
            errorType: error.name
          }
        }
      };
      
      // Send error to the specific client
      if (clientId !== 'all' && activeConnections.has(clientId)) {
        const connection = activeConnections.get(clientId);
        sendSSEMessage(connection.res, errorMessage);
      } else {
        // Send to all clients if no specific client
        activeConnections.forEach(info => {
          sendSSEMessage(info.res, errorMessage);
        });
      }
      
      // Set error response for the HTTP POST request
      return res.status(400).json(errorMessage);
    }
      
    // Set a temporary response for the HTTP POST request
    response.result.status = 'processing';
    response.result.message = 'Command interception request is being processed';
  }
  
  // Return response to the POST request
  res.json(response);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Enhanced SSE transport server running at http://localhost:${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/mcp-sse`);
  console.log(`Debug information: http://localhost:${PORT}/debug/connections`);
}); 