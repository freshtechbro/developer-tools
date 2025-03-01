import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { webSearchTool } from './stubs/web-search.js';
import { commandInterceptorTool } from './stubs/command-interceptor.js';
import { logger } from './stubs/logger.js';

const app = express();
const PORT = 3001;

// Configure middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json());

// Store active sessions
const sessions = new Map();

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    transport: 'HTTP',
    sessions: sessions.size,
    uptime: process.uptime()
  });
});

// Debug endpoint to view active sessions
app.get('/debug/sessions', (req, res) => {
  const sessionData = [];
  sessions.forEach((data, id) => {
    sessionData.push({
      id,
      created: data.created,
      lastSeen: data.lastSeen,
      requestCount: data.requestCount
    });
  });
  
  res.json({
    sessions: sessionData
  });
});

// Main MCP endpoint for JSON-RPC
app.post('/mcp', async (req, res) => {
  try {
    const message = req.body;
    console.log('Received HTTP request:', message);
    
    // Validate JSON-RPC message
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
    
    // Track the session
    const sessionId = req.headers['x-session-id'] || message.params?.sessionId || uuidv4();
    
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        created: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        requestCount: 0,
        userAgent: req.headers['user-agent']
      });
    }
    
    const session = sessions.get(sessionId);
    session.lastSeen = new Date().toISOString();
    session.requestCount++;
    
    // Process different method types
    let response = {
      jsonrpc: '2.0',
      id: message.id,
      result: null
    };
    
    if (message.method === 'initialize') {
      response.result = {
        name: 'mcp-transport-http',
        version: '1.0.0',
        sessionId: sessionId,
        capabilities: {
          protocol: {
            version: '0.1.0',
            name: 'jsonrpc'
          },
          tools: ['web-search', 'command-interceptor', 'repo-analysis', 'health-check']
        }
      };
    } else if (message.method === 'health-check') {
      response.result = {
        status: 'healthy',
        transport: 'HTTP',
        sessions: sessions.size
      };
    } else if (message.method === 'web-search') {
      try {
        // Log request details for debugging
        logger.info(`HTTP Transport: Processing web search request`, { 
          query: message.params?.query,
          provider: message.params?.provider,
          sessionId
        });
        
        // Start processing time measurement
        const startTime = Date.now();
        
        // Add session context to the request
        const requestWithSession = {
          ...message.params,
          sessionContext: {
            sessionId,
            transport: 'http',
            userAgent: session.userAgent
          }
        };
        
        // Execute the web search tool with enhanced parameters
        const result = await webSearchTool.execute(requestWithSession);
        
        // Calculate processing time
        const processingTime = Date.now() - startTime;
        
        // Log success with processing time
        logger.info(`HTTP Transport: Web search completed`, { 
          sessionId, 
          processingTime: `${processingTime}ms`,
          provider: result.metadata?.provider || 'unknown',
          cached: result.metadata?.cached || false
        });
        
        // Return the full result
        response.result = result;
      } catch (error) {
        // Enhanced error handling with specific error codes
        logger.error(`HTTP Transport: Web search failed`, { 
          error: error.message, 
          stack: error.stack,
          sessionId
        });
        
        return res.status(400).json({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: error.code || -32000,
            message: `Web search failed: ${error.message}`,
            data: {
              sessionId,
              errorType: error.name,
              provider: error.provider
            }
          }
        });
      }
    } else if (message.method === 'command-interceptor') {
      try {
        logger.info(`HTTP Transport: Processing command interceptor request`, {
          message: message.params?.message,
          sessionId
        });
        
        // Start processing time measurement
        const startTime = Date.now();
        
        // Add session context to the request
        const requestWithSession = {
          ...message.params,
          sessionContext: {
            sessionId,
            transport: 'http',
            userAgent: session.userAgent
          }
        };
        
        // Execute command interceptor with enhanced context
        const result = await commandInterceptorTool.execute(requestWithSession);
        
        // Calculate processing time
        const processingTime = Date.now() - startTime;
        
        // Log success with processing time
        logger.info(`HTTP Transport: Command interceptor completed`, { 
          sessionId, 
          processingTime: `${processingTime}ms`,
          commandFound: result !== null
        });
        
        response.result = result;
      } catch (error) {
        logger.error(`HTTP Transport: Command interception failed`, { 
          error: error.message, 
          stack: error.stack,
          sessionId
        });
        
        return res.status(400).json({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: error.code || -32000,
            message: `Command interception failed: ${error.message}`,
            data: {
              sessionId,
              errorType: error.name
            }
          }
        });
      }
    } else if (message.method === 'repo-analysis') {
      response.result = {
        repository: message.params?.repository || 'unknown',
        analysis: 'This is a sample repository analysis',
        codeInsights: {
          architecture: 'Sample architecture insights',
          dependencies: 'Sample dependency insights',
          patterns: 'Sample code patterns'
        },
        documentationInsights: {
          coverage: 'Sample documentation coverage',
          quality: 'Sample documentation quality'
        }
      };
    } else {
      // Unknown method
      return res.status(400).json({
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32601,
          message: `Method not found: ${message.method}`
        }
      });
    }
    
    // Set the session ID header in the response
    res.setHeader('X-Session-ID', sessionId);
    
    // Send the response
    res.json(response);
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32000,
        message: 'Internal server error',
        data: { error: error.message, stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined }
      }
    });
  }
});

// Session cleanup - remove inactive sessions every 5 minutes
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
  
  sessions.forEach((session, id) => {
    const lastSeen = new Date(session.lastSeen);
    if (now - lastSeen > inactiveThreshold) {
      console.log(`Removing inactive session: ${id}`);
      sessions.delete(id);
    }
  });
}, 5 * 60 * 1000);

// Start the server
app.listen(PORT, () => {
  console.log(`HTTP transport server running at http://localhost:${PORT}`);
  console.log(`Transport endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Debug information: http://localhost:${PORT}/debug/sessions`);
}); 