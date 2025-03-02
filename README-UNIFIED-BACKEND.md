# Unified Backend for Developer Tools

## Overview

The Unified Backend serves as a bridge between web interfaces and the MCP (Master Control Program) server in the Developer Tools ecosystem. It forwards HTTP API requests and WebSocket messages, allowing web clients to interact with the tools managed by the MCP server.

## Features

- **HTTP API Forwarding**: Forwards tool execution requests from web clients to the MCP server
- **WebSocket Bidirectional Communication**: Maintains connections to both web clients and the MCP server, forwarding messages between them
- **Environment Configuration**: Configurable via environment variables for flexible deployment
- **Error Handling**: Robust error handling for connection issues and request failures
- **Health Monitoring**: Includes health check endpoints for monitoring system status

## Architecture

The Unified Backend sits between the web interface and the MCP server:

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|  Web Interface | <-> | Unified Backend| <-> |   MCP Server   |
|                |     |                |     |                |
+----------------+     +----------------+     +----------------+
```

- **Web Interface**: A React application that communicates with the Unified Backend
- **Unified Backend**: An Express.js server that forwards requests and manages WebSocket connections
- **MCP Server**: The core component that manages the tool registry and executes tools

## Setup and Configuration

### Environment Variables

Create a `.env` file with the following variables:

```
# MCP Server Configuration
MCP_SERVER_URL=http://localhost:3001
MCP_WS_URL=ws://localhost:3001

# Unified Backend Configuration
UNIFIED_PORT=3003
UNIFIED_FALLBACK_PORT=3004
```

### Installation

```bash
# Install dependencies
npm install

# Start the unified backend
node unified-backend.js
```

## API Endpoints

### HTTP API

- `POST /api/command`: Executes a tool or processes a chat command
- `GET /health`: Health check endpoint
- `GET /*`: Serves the React application (catch-all route)

### WebSocket

The WebSocket server is available at the root path (`/`). It accepts and forwards the following message types:

- Tool execution requests
- Chat commands
- Tool execution results
- Status updates

## Documentation

For more detailed information, refer to the following documentation:

- [Unified Backend Integration](./docs/unified-backend-integration.md): Comprehensive guide to the integration between the Unified Backend and the MCP Server
- [API Reference](./docs/api-reference.md): Detailed API documentation
- [Developer Tools Overview](./docs/overview.md): Overview of the entire Developer Tools ecosystem

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 