# MCP Server Web Interface

This is a simple web interface for testing the Model Context Protocol (MCP) server. It allows you to connect to the server using either HTTP or SSE transport and execute various tools.

## Features

- Connect to the MCP server using HTTP or SSE transport
- Execute web search queries
- Execute repository analysis queries
- Execute browser automation actions
- Send custom JSON-RPC requests
- View real-time responses and logs

## Usage

1. Start the MCP server with HTTP or SSE transport enabled
2. Open the web interface in your browser (default: http://localhost:3003)
3. Configure the connection settings:
   - Transport Type: HTTP or SSE
   - Server URL: The base URL of the MCP server (default: http://localhost:3001)
   - Endpoint Path: The path to the MCP endpoint (default: /mcp for HTTP, /mcp-sse for SSE)
4. Click "Connect" to establish a connection to the server
5. Use the tabs to execute different tools:
   - Web Search: Execute web search queries
   - Repo Analysis: Execute repository analysis queries
   - Browser Automation: Execute browser automation actions
   - Custom Request: Send custom JSON-RPC requests
6. View the results and event log for detailed information

## Configuration

The web interface is served by the MCP server when the `WEB_INTERFACE_ENABLED` environment variable is set to `true`. You can configure the port using the `WEB_INTERFACE_PORT` environment variable (default: 3003).

## Files

- `index.html`: The main HTML file for the web interface
- `mcp-client.js`: A JavaScript client for the MCP server

## Development

To modify the web interface, edit the files in the `public` directory. The changes will be reflected when you refresh the page.

## Security Considerations

This web interface is intended for testing and development purposes only. It does not include authentication or authorization mechanisms. Do not expose it to the public internet without proper security measures in place. 