import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';
import WebSocket from 'ws';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MCP server configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001';
const MCP_WS_URL = process.env.MCP_WS_URL || 'ws://localhost:3001';

const app = express();
const PORT = process.env.UNIFIED_PORT || 3003;
const FALLBACK_PORT = process.env.UNIFIED_FALLBACK_PORT || 3004; // Fallback port if 3003 is in use

// Create server instance separately to handle port conflicts
const server = http.createServer(app);

// WebSocket client connection to MCP server
let mcpWebSocket = null;
let webSocketClients = new Map(); // Client ID -> WebSocket
let clientIdCounter = 0;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'unified-test-interface/dist')));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Forward requests to MCP server
async function forwardToMcpServer(path, data) {
  try {
    console.log(`Forwarding request to ${MCP_SERVER_URL}${path}`);
    const response = await axios.post(`${MCP_SERVER_URL}${path}`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error forwarding request to MCP server:', error);
    throw error;
  }
}

// Main API endpoint
app.post('/api/command', async (req, res) => {
  try {
    const { command, query, ...options } = req.body;
    console.log('Received command request:', { command, query, options });
    
    if (command === 'web-search') {
      // Forward web search to MCP server
      const result = await forwardToMcpServer('/api/tools/web-search/execute', {
        query,
        ...options
      });
      res.json(result);
    } else if (command === 'command-interceptor') {
      // Forward chat command to MCP server
      const result = await forwardToMcpServer('/api/chat', {
        message: query
      });
      res.json(result);
    } else if (command === 'repo-analysis') {
      // Forward repo analysis to MCP server
      const result = await forwardToMcpServer('/api/tools/repo-analysis/execute', {
        repoPath: query,
        ...options
      });
      res.json(result);
    } else if (command === 'browser-automation') {
      // Forward browser automation to MCP server
      const result = await forwardToMcpServer('/api/tools/browser-automation/execute', {
        url: options.url,
        action: options.action,
        instruction: options.instruction,
        ...options
      });
      res.json(result);
    } else if (command === 'doc-generation') {
      // Forward doc generation to MCP server
      const result = await forwardToMcpServer('/api/tools/doc-generation/execute', {
        repoPath: query,
        ...options
      });
      res.json(result);
    } else {
      // Forward any other command to the generic tool execution endpoint
      try {
        const result = await forwardToMcpServer(`/api/tools/${command}/execute`, {
          query,
          ...options
        });
        res.json(result);
      } catch (error) {
        // If the tool doesn't exist, return an error
        res.status(400).json({
          success: false,
          error: 'Unknown command',
          message: `Command '${command}' is not supported`
        });
      }
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Create WebSocket server for the web interface
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections from the web interface
wss.on('connection', (ws) => {
  const clientId = `client-${++clientIdCounter}`;
  webSocketClients.set(clientId, ws);
  
  console.log(`WebSocket client connected: ${clientId}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    clientId,
    message: 'Connected to unified backend WebSocket server'
  }));
  
  // Handle messages from the client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleWebSocketMessage(clientId, data);
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log(`WebSocket client disconnected: ${clientId}`);
    webSocketClients.delete(clientId);
  });
});

// Handle messages from web clients and forward to MCP WebSocket
function handleWebSocketMessage(clientId, data) {
  console.log(`Received WebSocket message from ${clientId}:`, data);
  
  // Make sure we have a connection to the MCP WebSocket server
  ensureMcpWebSocketConnection();
  
  // Forward the message to the MCP WebSocket server
  if (mcpWebSocket && mcpWebSocket.readyState === WebSocket.OPEN) {
    mcpWebSocket.send(JSON.stringify({
      ...data,
      _clientId: clientId // Add client ID for tracking
    }));
  } else {
    // If not connected, send an error to the client
    if (webSocketClients.has(clientId)) {
      webSocketClients.get(clientId).send(JSON.stringify({
        type: 'error',
        error: 'Not connected to MCP WebSocket server'
      }));
    }
  }
}

// Ensure connection to MCP WebSocket server
function ensureMcpWebSocketConnection() {
  if (!mcpWebSocket || mcpWebSocket.readyState !== WebSocket.OPEN) {
    connectToMcpWebSocket();
  }
}

// Connect to MCP WebSocket server
function connectToMcpWebSocket() {
  console.log(`Connecting to MCP WebSocket server at ${MCP_WS_URL}`);
  
  mcpWebSocket = new WebSocket(MCP_WS_URL);
  
  mcpWebSocket.on('open', () => {
    console.log('Connected to MCP WebSocket server');
    
    // Register as a web client
    mcpWebSocket.send(JSON.stringify({
      type: 'register',
      clientType: 'web'
    }));
  });
  
  mcpWebSocket.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message from MCP WebSocket server:', data);
      
      // Check if the message has a client ID
      if (data._clientId && webSocketClients.has(data._clientId)) {
        // Forward to the specific client
        const clientWs = webSocketClients.get(data._clientId);
        
        // Remove the internal client ID before forwarding
        const { _clientId, ...clientData } = data;
        
        clientWs.send(JSON.stringify(clientData));
      } else {
        // Broadcast to all clients
        broadcastToWebClients(data);
      }
    } catch (error) {
      console.error('Error handling message from MCP WebSocket server:', error);
    }
  });
  
  mcpWebSocket.on('close', () => {
    console.log('Disconnected from MCP WebSocket server');
    
    // Attempt to reconnect after a delay
    setTimeout(connectToMcpWebSocket, 5000);
  });
  
  mcpWebSocket.on('error', (error) => {
    console.error('MCP WebSocket error:', error);
  });
}

// Broadcast a message to all web clients
function broadcastToWebClients(data) {
  webSocketClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  const mcpHealth = mcpWebSocket && mcpWebSocket.readyState === WebSocket.OPEN
    ? 'connected'
    : 'disconnected';
  
  res.json({
    status: 'healthy',
    mcpServer: mcpHealth,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

// Catch-all route to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'unified-test-interface/dist/index.html'));
});

// Connect to MCP WebSocket server on startup
connectToMcpWebSocket();

// Start the server
server.listen(PORT, () => {
  console.log(`Unified backend server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}`);
  console.log(`Forwarding requests to MCP server at ${MCP_SERVER_URL}`);
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} is in use, trying fallback port ${FALLBACK_PORT}`);
    
    // Try fallback port
    server.listen(FALLBACK_PORT, () => {
      console.log(`Unified backend server running on fallback port ${FALLBACK_PORT}`);
      console.log(`WebSocket server available at ws://localhost:${FALLBACK_PORT}`);
      console.log(`Forwarding requests to MCP server at ${MCP_SERVER_URL}`);
    });
  } else {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  if (mcpWebSocket) {
    mcpWebSocket.close();
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  if (mcpWebSocket) {
    mcpWebSocket.close();
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});