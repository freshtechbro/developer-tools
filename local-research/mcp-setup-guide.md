# Beginner-Friendly MCP Server Setup Guide

This guide will walk you through setting up a basic Model Context Protocol (MCP) server with initial functionality. We'll focus on getting the core server running and implementing basic features.

## Prerequisites

Before starting, ensure you have:
- Node.js (v14 or later) installed
- npm (Node Package Manager) installed
- A code editor (like VS Code)
- Basic familiarity with JavaScript/Node.js

## Phase 1: Initial Project Setup

### Step 1: Create Project Directory and Initialize

1. Open your terminal and create a new directory for your project:
```bash
mkdir beginner-mcp-server
cd beginner-mcp-server
```

2. Initialize a new Node.js project:
```bash
npm init -y
```

3. Install the required dependencies:
```bash
npm install @modelcontextprotocol/sdk node-fetch
```

### Step 2: Create Basic Server Structure

1. Create a new file called `server.js` in your project root:
```javascript
// server.js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
    // Create server instance
    const server = new Server({
        name: "beginner-mcp-server",
        version: "0.1.0",
        description: "A beginner-friendly MCP server implementation"
    }, {
        capabilities: {
            resources: {},
            tools: {}
        }
    });

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    console.log("Starting MCP server...");
    await server.connect(transport);
    console.log("MCP server is running!");
}

main().catch(error => {
    console.error("Server error:", error);
    process.exit(1);
});
```

2. Update `package.json` to enable ES modules:
```json
{
  "type": "module",
  // ... other existing fields ...
}
```

### Step 3: Test Basic Server

1. Run the server:
```bash
node server.js
```

You should see:
```
Starting MCP server...
MCP server is running!
```

## Phase 2: Implementing Basic Resources and Tools

### Step 1: Create Directory Structure

1. Create directories for capabilities:
```bash
mkdir -p capabilities/resources
mkdir -p capabilities/tools
```

### Step 2: Implement Greeting Resource

1. Create `capabilities/resources/greeting.js`:
```javascript
// capabilities/resources/greeting.js

export const greetingResource = {
    name: 'greeting',
    version: '0.1.0',
    description: 'A simple greeting resource',

    // List available greetings
    list: async () => {
        return {
            resources: [
                {
                    uri: "greeting://hello",
                    name: "Hello Greeting"
                },
                {
                    uri: "greeting://hi",
                    name: "Hi Greeting"
                }
            ]
        };
    },

    // Read a specific greeting
    read: async (request) => {
        const { uri } = request;
        
        let greeting;
        switch (uri) {
            case "greeting://hello":
                greeting = "Hello, World!";
                break;
            case "greeting://hi":
                greeting = "Hi there!";
                break;
            default:
                throw new Error(`Unknown greeting URI: ${uri}`);
        }

        return {
            resource: {
                uri,
                message: greeting
            }
        };
    },

    // Define schemas
    listResponseSchema: {
        type: 'object',
        properties: {
            resources: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        uri: { type: 'string' },
                        name: { type: 'string' }
                    },
                    required: ['uri', 'name']
                }
            }
        },
        required: ['resources']
    },

    readRequestSchema: {
        type: 'object',
        properties: {
            uri: { type: 'string' }
        },
        required: ['uri']
    },

    readResponseSchema: {
        type: 'object',
        properties: {
            resource: {
                type: 'object',
                properties: {
                    uri: { type: 'string' },
                    message: { type: 'string' }
                },
                required: ['uri', 'message']
            }
        },
        required: ['resource']
    }
};
```

### Step 3: Implement Reverse String Tool

1. Create `capabilities/tools/reverse-string.js`:
```javascript
// capabilities/tools/reverse-string.js

export const reverseStringTool = {
    name: 'reverse-string',
    version: '0.1.0',
    description: 'A tool that reverses input strings',

    execute: async (request) => {
        const { text } = request;
        if (!text) {
            throw new Error("Text parameter is required");
        }

        return {
            reversed: text.split('').reverse().join('')
        };
    },

    requestSchema: {
        type: 'object',
        properties: {
            text: { type: 'string' }
        },
        required: ['text']
    },

    responseSchema: {
        type: 'object',
        properties: {
            reversed: { type: 'string' }
        },
        required: ['reversed']
    }
};
```

### Step 4: Update Server to Include New Capabilities

1. Update `server.js` to include the new resource and tool:
```javascript
// server.js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { greetingResource } from './capabilities/resources/greeting.js';
import { reverseStringTool } from './capabilities/tools/reverse-string.js';

async function main() {
    const server = new Server({
        name: "beginner-mcp-server",
        version: "0.1.0",
        description: "A beginner-friendly MCP server implementation"
    }, {
        capabilities: {
            resources: {
                'greeting': greetingResource
            },
            tools: {
                'reverse-string': reverseStringTool
            }
        }
    });

    const transport = new StdioServerTransport();
    
    console.log("Starting MCP server...");
    await server.connect(transport);
    console.log("MCP server is running!");
}

main().catch(error => {
    console.error("Server error:", error);
    process.exit(1);
});
```

### Step 5: Create Test Client

1. Create `test-client.js` to test the server:
```javascript
// test-client.js
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    const transport = new StdioClientTransport();
    const client = new Client();
    
    try {
        await client.connect(transport);
        console.log("Connected to MCP server");

        // Test greeting resource - list
        console.log("\nTesting greeting resource (list):");
        const greetingList = await client.listResources({
            resourceName: 'greeting',
            version: '0.1.0'
        });
        console.log("Available greetings:", greetingList.resource_list.resources);

        // Test greeting resource - read
        console.log("\nTesting greeting resource (read):");
        const greeting = await client.readResource({
            resourceUri: "greeting://hello"
        });
        console.log("Greeting message:", greeting.resource_response.resource.message);

        // Test reverse-string tool
        console.log("\nTesting reverse-string tool:");
        const reversed = await client.executeTool({
            toolName: 'reverse-string',
            version: '0.1.0',
            arguments: {
                text: "Hello, World!"
            }
        });
        console.log("Reversed text:", reversed.tool_response.reversed);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.close();
    }
}

main();
```

### Step 6: Test Everything

1. In one terminal, start the server:
```bash
node server.js
```

2. In another terminal, run the test client:
```bash
node test-client.js
```

You should see output like:
```
Connected to MCP server

Testing greeting resource (list):
Available greetings: [
  { uri: 'greeting://hello', name: 'Hello Greeting' },
  { uri: 'greeting://hi', name: 'Hi Greeting' }
]

Testing greeting resource (read):
Greeting message: Hello, World!

Testing reverse-string tool:
Reversed text: !dlroW ,olleH
```

## Next Steps

Now that you have a basic MCP server running with a resource and a tool, you can:

1. Add error handling and logging to make the server more robust
2. Implement more complex resources and tools
3. Add configuration options
4. Explore the other phases in the implementation plan

Remember to:
- Keep your code modular and well-documented
- Test thoroughly as you add new features
- Follow the MCP protocol specifications
- Consider security implications as you expand functionality