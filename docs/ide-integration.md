# IDE Integration Guide

This guide explains how to integrate the Developer Tools with various IDEs, including Cursor and Windsurf.

## Overview

The Developer Tools can be integrated with IDEs in several ways:

1. **Command Line Interface (CLI)**: Run tools directly from the IDE's integrated terminal
2. **Chat Commands**: Execute tools via chat commands in the IDE
3. **WebSocket Connection**: Real-time communication between the IDE and the Developer Tools

## Prerequisites

Before integrating with an IDE, ensure you have:

1. Installed the Developer Tools package
2. Started the MCP server (`developer-tools start`)
3. Configured any necessary API keys

## Cursor Integration

### Terminal Integration

1. Open Cursor's integrated terminal
2. Run Developer Tools commands directly:
   ```
   developer-tools web "How to use TypeScript generics?"
   ```

### Chat Integration

1. In Cursor's chat interface, use the `!dt` prefix to execute tools:
   ```
   !dt web-search "How to use TypeScript generics?"
   ```

2. The results will be displayed directly in the chat.

### Environment Detection

The Developer Tools CLI automatically detects when it's running in Cursor and adjusts its output accordingly. This provides a more seamless experience when using the tools within Cursor.

## Windsurf Integration

### Terminal Integration

1. Open Windsurf's integrated terminal
2. Run Developer Tools commands directly:
   ```
   developer-tools web "How to use TypeScript generics?"
   ```

### Chat Integration

1. In Windsurf's chat interface, use the `!dt` prefix to execute tools:
   ```
   !dt web-search "How to use TypeScript generics?"
   ```

2. The results will be displayed directly in the chat.

## VS Code Integration

### Terminal Integration

1. Open VS Code's integrated terminal
2. Run Developer Tools commands directly:
   ```
   developer-tools web "How to use TypeScript generics?"
   ```

## Advanced Integration

### WebSocket API

For real-time communication with the Developer Tools, you can use the WebSocket API:

1. Connect to the WebSocket server at `ws://localhost:3001` (or your configured port)
2. Send and receive JSON messages to execute tools and receive results

Example WebSocket client code:

```javascript
const socket = new WebSocket('ws://localhost:3001');

// Register as an IDE client
socket.onopen = () => {
  socket.send(JSON.stringify({
    type: 'register',
    clientType: 'ide'
  }));
};

// Handle messages
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// Execute a tool
function executeTool(tool, args) {
  socket.send(JSON.stringify({
    type: 'execute_tool',
    tool,
    args
  }));
}

// Send a chat command
function sendChatCommand(message) {
  socket.send(JSON.stringify({
    type: 'chat',
    message
  }));
}
```

### HTTP API

You can also use the HTTP API for tool execution:

```javascript
async function executeTool(tool, args) {
  const response = await fetch(`http://localhost:3001/api/tools/${tool}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });
  
  return await response.json();
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure the MCP server is running (`developer-tools start`)
2. **Command Not Found**: Make sure the Developer Tools are installed globally or in your project
3. **Tool Not Found**: Check that the tool you're trying to use is available (`developer-tools list`)

### Logs

Check the MCP server logs for more detailed error information. 