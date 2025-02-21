import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { webSearchTool } from './capabilities/tools/web-search.js';
import { config, ServerConfigSchema } from './config/index.js';
import { logger } from './utils/logger.js';
import { z } from 'zod';

async function main() {
    try {
        console.log("Starting MCP server...");
        
        const server = new Server({
            name: "cursor-tools-mcp-server",
            version: "0.1.0",
            description: "MCP server mimicking cursor-tools functionalities."
        }, {
            capabilities: {
                resources: {}, // Resources will be defined here
                tools: {
                    'web-search': webSearchTool
                }
            }
        });

        const transport = new StdioServerTransport();
        
        console.log("Connecting to transport...");
        await server.connect(transport);
        console.log("✅ MCP Server started using stdio transport.");
        console.log("Available tools:");
        console.log("  - web-search: Perform web searches using Perplexity AI");

    } catch (error) {
        console.error("❌ Server failed to start:", error);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log("\nShutting down MCP server...");
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log("\nShutting down MCP server...");
    process.exit(0);
});

// Start the server
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
}); 