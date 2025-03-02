# Developer Tools Installation Guide

This guide will walk you through the process of installing and configuring the Developer Tools project, which includes the MCP (Model Context Protocol) server with multiple transport layers.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- API keys for the following services:
  - Perplexity API (required for web search)
  - Google Gemini API (required for repo analysis)
  - OpenAI API (optional, used as fallback for web search)

## Installation Options

### Option 1: Interactive Installation (Recommended)

The easiest way to install and configure the project is to use the interactive installation script:

```bash
# Run the interactive installer
npm run install:interactive

# Or directly with Node.js
node install.js
```

The interactive installer will:

1. Check your system for required dependencies
2. Guide you through configuring transport layers (HTTP, SSE)
3. Collect API keys for various services
4. Create or update the `.env` file
5. Install project dependencies
6. Set up Cursor IDE integration (optional)

### Option 2: Manual Installation

If you prefer to set up the project manually, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/developer-tools.git
   cd developer-tools
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   # API Keys
   PERPLEXITY_API_KEY=your_perplexity_api_key
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key

   # Transport Configuration
   HTTP_TRANSPORT_ENABLED=true
   HTTP_TRANSPORT_PORT=3001
   HTTP_TRANSPORT_PATH=/mcp

   SSE_TRANSPORT_ENABLED=true
   SSE_TRANSPORT_PORT=3002
   SSE_TRANSPORT_PATH=/mcp-sse

   WEB_INTERFACE_ENABLED=true
   WEB_INTERFACE_PORT=3003

   REST_API_ENABLED=true
   REST_API_PORT=3000
   ```

4. Build the project:
   ```bash
   npm run build
   ```

## Starting the Server

After installation, you can start the server using one of the following commands:

```bash
# Start all servers (HTTP, SSE, Web Interface)
npm start

# Start only the HTTP transport server
npm run start:http

# Start only the SSE transport server
npm run start:sse

# Start only the web interface
npm run start:web
```

## Transport Layers

The MCP server supports multiple transport layers:

### HTTP Transport

- **Default Port**: 3001
- **Default Path**: `/mcp`
- **Description**: Standard HTTP transport for request/response communication

### SSE Transport (Server-Sent Events)

- **Default Port**: 3002
- **Default Path**: `/mcp-sse`
- **Description**: Enables real-time updates from server to client

## Configuration

The configuration is loaded from the following sources (in order of precedence):

1. Environment variables (`.env` file)
2. Local configuration (`config/local.js`)
3. Default configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HTTP_TRANSPORT_ENABLED` | Enable HTTP transport | `true` |
| `HTTP_TRANSPORT_PORT` | HTTP transport port | `3001` |
| `HTTP_TRANSPORT_PATH` | HTTP transport path | `/mcp` |
| `SSE_TRANSPORT_ENABLED` | Enable SSE transport | `true` |
| `SSE_TRANSPORT_PORT` | SSE transport port | `3002` |
| `SSE_TRANSPORT_PATH` | SSE transport path | `/mcp-sse` |
| `WEB_INTERFACE_ENABLED` | Enable web interface | `true` |
| `WEB_INTERFACE_PORT` | Web interface port | `3003` |
| `REST_API_ENABLED` | Enable REST API | `true` |
| `REST_API_PORT` | REST API port | `3000` |

## Cursor IDE Integration

The project includes integration with the Cursor IDE through the `.cursorrules` file. This provides contextual information about the project structure and functionality when using Cursor.

To set up Cursor integration manually:

1. Create a `.cursorrules` file in the root directory
2. Add rules for MCP server integration and installation instructions

## Troubleshooting

If you encounter issues during installation or startup:

1. Check that all required API keys are correctly set in the `.env` file
2. Ensure that the specified ports are not already in use
3. Verify that Node.js and npm versions meet the minimum requirements
4. Check the logs for specific error messages

For more detailed information, refer to the [README.md](README.md) file. 