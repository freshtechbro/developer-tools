# Unified Backend Integration with MCP Server

This document describes the integration between the unified backend and the MCP server.

## Overview

The unified backend serves as a central communication hub between the web interface and the MCP server. It forwards HTTP API requests and WebSocket messages, enabling real-time communication between the web interface and the tools managed by the MCP server.

## Architecture

```
┌─────────────┐      HTTP/WS      ┌─────────────┐      HTTP/WS      ┌─────────────┐
│             │    ---------->    │             │    ---------->    │             │
│     Web     │                   │   Unified   │                   │     MCP     │
│  Interface  │    <----------    │   Backend   │    <----------    │    Server   │
│             │      HTTP/WS      │             │      HTTP/WS      │             │
└─────────────┘                   └─────────────┘                   └─────────────┘
```

## Components

### 1. Web Interface

The web interface is a React application that provides a user-friendly UI for interacting with the Developer Tools. It communicates with the unified backend using:

- HTTP API calls for executing tools
- WebSocket connection for real-time updates

### 2. Unified Backend

The unified backend is an Express.js server that:

- Forwards HTTP API requests from the web interface to the MCP server
- Maintains WebSocket connections with both the web interface and the MCP server
- Handles message routing and client tracking
- Implements error handling and reconnection logic

### 3. MCP Server

The MCP server is the core component that:

- Manages the tool registry
- Executes tools
- Processes chat commands
- Communicates with clients via HTTP API and WebSocket

## Communication Protocols

### HTTP API Communication

1. Web Interface -> Unified Backend:
   - The web interface sends HTTP POST requests to `/api/command`
   - Each request includes a command name, query, and options

2. Unified Backend -> MCP Server:
   - The unified backend forwards requests to the appropriate MCP server endpoints:
     - `/api/tools/{toolName}/execute` for tool execution
     - `/api/chat` for chat commands

### WebSocket Communication

1. Web Interface <-> Unified Backend:
   - The web interface establishes a WebSocket connection to the unified backend
   - Messages include command execution requests and chat messages

2. Unified Backend <-> MCP Server:
   - The unified backend maintains a WebSocket connection to the MCP server
   - It forwards messages between the web interface and the MCP server
   - It tracks clients using unique IDs to route messages correctly

## Message Formats

### HTTP API Messages

```json
// Tool execution request
{
  "command": "web-search",
  "query": "How to use TypeScript generics?",
  "options": {
    "format": "markdown"
  }
}

// Chat command request
{
  "command": "command-interceptor",
  "query": "!dt web-search How to use TypeScript generics?"
}
```

### WebSocket Messages

```json
// Client registration
{
  "type": "register",
  "clientType": "web"
}

// Tool execution request
{
  "type": "execute_tool",
  "tool": "web-search",
  "args": {
    "query": "How to use TypeScript generics?"
  }
}

// Chat message
{
  "type": "chat",
  "message": "!dt web-search How to use TypeScript generics?"
}
```

## Error Handling

The unified backend implements several error handling strategies:

1. **Connection Errors**:
   - Automatic reconnection to the MCP server WebSocket with exponential backoff
   - Error messages sent to web clients when the MCP server is unavailable

2. **Request Errors**:
   - HTTP error status codes and error messages for failed requests
   - Timeouts for long-running operations

3. **WebSocket Errors**:
   - Client tracking to ensure message delivery to the correct client
   - Ping/pong mechanism to detect dead connections

## Configuration

The unified backend can be configured using environment variables:

- `MCP_SERVER_URL`: The URL of the MCP server HTTP API (default: http://localhost:3001)
- `MCP_WS_URL`: The URL of the MCP server WebSocket (default: ws://localhost:3001)
- `UNIFIED_PORT`: The port for the unified backend (default: 3003)
- `UNIFIED_FALLBACK_PORT`: Fallback port if the primary port is in use (default: 3004)

## Starting the Unified Backend

```bash
# Install dependencies
npm install

# Start the unified backend
npm run start:unified-backend

# Start the entire system (unified backend + web interface)
npm run dev:unified
```

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Ensure the MCP server is running
   - Check the MCP server URL and port in the environment variables

2. **WebSocket Connection Failed**:
   - Verify the WebSocket URL is correct
   - Check if any firewall is blocking WebSocket connections

3. **Message Routing Errors**:
   - Ensure client IDs are being correctly tracked
   - Verify message formats match the expected structure

### Debugging

The unified backend includes verbose logging for debugging:

- HTTP request logging for all API calls
- WebSocket message logging for all connections
- Connection state changes
- Error messages with stack traces

## Future Improvements

1. **Authentication**:
   - Add authentication between the unified backend and MCP server
   - Implement user authentication for web interface clients

2. **Load Balancing**:
   - Support multiple MCP server instances
   - Implement load balancing for tool execution

3. **Monitoring**:
   - Add metrics collection for performance monitoring
   - Implement health checks for all components 