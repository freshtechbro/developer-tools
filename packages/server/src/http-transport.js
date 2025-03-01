import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';

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
app.post('/mcp', (req, res) => {
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
          tools: ['web-search', 'repo-analysis', 'health-check']
        }
      };
    } else if (message.method === 'health-check') {
      response.result = {
        status: 'healthy',
        transport: 'HTTP',
        sessions: sessions.size
      };
    } else if (message.method === 'web-search') {
      response.result = {
        query: message.params?.query || 'default query',
        results: [
          { title: 'Sample HTTP result 1', url: 'https://example.com/1' },
          { title: 'Sample HTTP result 2', url: 'https://example.com/2' }
        ]
      };
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
        data: { error: error.message }
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